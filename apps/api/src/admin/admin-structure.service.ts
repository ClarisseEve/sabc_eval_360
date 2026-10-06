import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DatabasePgService } from '../database/database-pg.service';

const REGION_CODES: Record<string, string> = {
  Littoral: 'LT',
  Centre: 'CE',
  Nord: 'NO',
  Ouest: 'OU',
};

@Injectable()
export class AdminStructureService {
  constructor(
    private prisma: PrismaService,
    private pg: DatabasePgService,
  ) {}

  private serializeRawRows<T extends Record<string, any>>(rows: T[]): T[] {
    return rows.map((row) =>
      Object.fromEntries(
        Object.entries(row).map(([key, value]) => [key, typeof value === 'bigint' ? Number(value) : value]),
      ) as T,
    );
  }

  private nextSequentialId(prefix: string, existingIds: string[], padding: number): string {
    const pattern = new RegExp(`^${prefix}(\\d+)$`);
    const existingNumbers = existingIds
      .map((id) => id.match(pattern)?.[1])
      .filter((value): value is string => value !== undefined)
      .map(Number);
    const legacyCount = existingIds.length - existingNumbers.length;
    const nextNumber = Math.max(0, ...existingNumbers) + legacyCount + 1;
    const id = `${prefix}${String(nextNumber).padStart(padding, '0')}`;

    if (id.length > 10) {
      throw new BadRequestException(`La séquence de codes ${prefix} a atteint sa limite`);
    }

    return id;
  }

  private getLegacyServiceCode(regionId: string, serviceIds: string[], serviceId: string): string {
    const prefix = `${regionId}SC`;
    const pattern = new RegExp(`^${prefix}(\\d+)$`);
    const existingNumbers = serviceIds
      .map((id) => id.match(pattern)?.[1])
      .filter((value): value is string => value !== undefined)
      .map(Number);
    const legacyIds = serviceIds.filter((id) => !pattern.test(id));
    const legacyIndex = legacyIds.indexOf(serviceId);

    if (legacyIndex < 0) {
      throw new NotFoundException('Service introuvable');
    }

    const sequence = Math.max(0, ...existingNumbers) + legacyIndex + 1;
    return `${prefix}${String(sequence).padStart(2, '0')}`;
  }

  // ── Regions ──

  async getRegions() {
    const [regions, usersByRegion] = await Promise.all([
      this.prisma.region.findMany({ orderBy: { nom_region: 'asc' } }),
      this.prisma.utilisateur.groupBy({
        by: ['id_region'],
        _count: { _all: true },
      }),
    ]);
    const userCountByRegion = new Map(
      usersByRegion
        .filter((entry) => entry.id_region)
        .map((entry) => [entry.id_region, entry._count._all]),
    );

    return regions.map((region) => ({
      ...region,
      _count: { utilisateurs: userCountByRegion.get(region.id_region) ?? 0 },
    }));
  }

  async createRegion(data: { id_region: string; nom_region: string; est_taniere?: boolean }) {
    const expectedId = REGION_CODES[data.nom_region];
    if (!expectedId) {
      throw new BadRequestException('Seules les régions Littoral, Centre, Nord et Ouest sont autorisées');
    }
    if (data.id_region !== expectedId) {
      throw new BadRequestException(`Le code de la région ${data.nom_region} doit être ${expectedId}`);
    }
    return this.prisma.region.create({ data: { ...data, id_region: expectedId } });
  }

  async updateRegion(id: string, data: { id_region?: string; nom_region?: string; est_taniere?: boolean }) {
    const region = await this.prisma.region.findUnique({ where: { id_region: id } });
    if (!region) throw new NotFoundException('Région introuvable');

    const nomRegion = data.nom_region ?? region.nom_region;
    const idRegion = data.id_region ?? REGION_CODES[nomRegion] ?? id;
    const expectedId = REGION_CODES[nomRegion];
    if (data.id_region && !expectedId) {
      throw new BadRequestException('Le code ne peut être modifié que pour l’une des quatre régions officielles');
    }
    if (expectedId && idRegion !== expectedId) {
      throw new BadRequestException(`Le code de la région ${nomRegion} doit être ${expectedId}`);
    }

    const estTaniere = data.est_taniere ?? region.est_taniere;
    if (idRegion === id) {
      return this.prisma.region.update({
        where: { id_region: id },
        data: { nom_region: nomRegion, est_taniere: estTaniere },
      });
    }

    const existingCode = await this.prisma.region.findUnique({ where: { id_region: idRegion } });
    if (existingCode) throw new BadRequestException(`Le code ${idRegion} est déjà utilisé`);
    const existingName = await this.prisma.region.findUnique({ where: { nom_region: nomRegion } });
    if (existingName && existingName.id_region !== id) {
      throw new BadRequestException(`La région ${nomRegion} existe déjà`);
    }

    const typeRegion = estTaniere ? 'taniere' : 'non-taniere';
    await this.pg.execute(
      `UPDATE utilisateurs_ref
         SET id_region = $1, region_nom = $2, type_region = $3, updated_at = NOW()
       WHERE id_region = $4`,
      [idRegion, nomRegion, typeRegion, id],
    );

    try {
      return await this.prisma.$transaction(async (transaction) => {
        await transaction.region.update({
          where: { id_region: id },
          data: { nom_region: `__rekey_${idRegion}` },
        });
        const updatedRegion = await transaction.region.create({
          data: { id_region: idRegion, nom_region: nomRegion, est_taniere: estTaniere },
        });
        await transaction.serviceCommercial.updateMany({
          where: { id_region: id },
          data: { id_region: idRegion },
        });
        await transaction.utilisateur.updateMany({
          where: { id_region: id },
          data: { id_region: idRegion, region_nom: nomRegion, type_region: typeRegion },
        });
        await transaction.region.delete({ where: { id_region: id } });
        return updatedRegion;
      });
    } catch (error) {
      await this.pg.execute(
        `UPDATE utilisateurs_ref
           SET id_region = $1, region_nom = $2, type_region = $3, updated_at = NOW()
         WHERE id_region = $4`,
        [id, region.nom_region, region.est_taniere ? 'taniere' : 'non-taniere', idRegion],
      );
      throw error;
    }
  }

  async deleteRegion(id: string) {
    const count = await this.prisma.utilisateur.count({ where: { id_region: id } });
    if (count > 0) {
      throw new BadRequestException(`Impossible de supprimer: ${count} utilisateur(s) rattaché(s) à cette région`);
    }
    return this.prisma.region.delete({ where: { id_region: id } });
  }

  // ── Services Commerciaux ──

  async getServices() {
    const rows = await this.prisma.$queryRawUnsafe<any[]>(
      `SELECT sc.*, r.nom_region,
              (SELECT COUNT(*) FROM utilisateurs u WHERE u.id_service = sc.id_service) as nb_utilisateurs,
              (SELECT COUNT(*) FROM districts d WHERE d.id_service = sc.id_service) as nb_districts
       FROM services_commerciaux sc
       LEFT JOIN regions r ON sc.id_region = r.id_region
       ORDER BY r.nom_region, sc.nom_service`,
    );
    return this.serializeRawRows(rows);
  }

  async createService(data: { nom_service: string; id_region: string }) {
    const region = await this.prisma.region.findUnique({ where: { id_region: data.id_region } });
    if (!region) throw new BadRequestException('Région introuvable');
    const services = await this.prisma.serviceCommercial.findMany({
      where: { id_region: data.id_region },
      select: { id_service: true },
    });
    const id_service = this.nextSequentialId(
      `${region.id_region}SC`,
      services.map((service) => service.id_service),
      2,
    );
    return this.prisma.serviceCommercial.create({
      data: {
        id_service,
        nom_service: data.nom_service,
        id_region: data.id_region,
      },
    });
  }

  async updateService(id: string, data: { nom_service?: string; id_region?: string }) {
    const service = await this.prisma.serviceCommercial.findUnique({ where: { id_service: id } });
    if (!service) throw new NotFoundException('Service introuvable');
    return this.prisma.serviceCommercial.update({ where: { id_service: id }, data });
  }

  async deleteService(id: string) {
    const users = await this.prisma.$queryRawUnsafe<{ count: bigint }[]>(
      `SELECT COUNT(*) as count
         FROM utilisateurs u
         LEFT JOIN districts d ON u.id_district = d.id_district
        WHERE u.id_service = ? OR d.id_service = ?`, id, id,
    );
    if (Number(users[0]?.count ?? 0) > 0) {
      throw new BadRequestException('Impossible de supprimer: des utilisateurs sont rattachés à ce service');
    }

    await this.prisma.$transaction(async (transaction) => {
      await transaction.$executeRawUnsafe(`DELETE FROM secteurs WHERE id_service = ?`, id);
      await transaction.$executeRawUnsafe(`DELETE FROM districts WHERE id_service = ?`, id);
      await transaction.$executeRawUnsafe(`DELETE FROM services_commerciaux WHERE id_service = ?`, id);
    });
    return { success: true };
  }

  // ── Districts ──

  async getDistricts() {
    const rows = await this.prisma.$queryRawUnsafe<any[]>(
      `SELECT d.*, sc.nom_service, r.nom_region,
              (SELECT COUNT(*) FROM utilisateurs u WHERE u.id_district = d.id_district) as nb_utilisateurs,
              (SELECT COUNT(*) FROM secteurs s WHERE s.id_district = d.id_district) as nb_secteurs
       FROM districts d
       LEFT JOIN services_commerciaux sc ON d.id_service = sc.id_service
       LEFT JOIN regions r ON sc.id_region = r.id_region
       ORDER BY r.nom_region, sc.nom_service, d.nom_district`,
    );
     return this.serializeRawRows(rows);
  }

  async createDistrict(data: { nom_district: string; id_service: string }) {
    const service = await this.prisma.serviceCommercial.findUnique({ where: { id_service: data.id_service } });
    if (!service) throw new BadRequestException('Service introuvable');
    const services = await this.prisma.serviceCommercial.findMany({
      where: { id_region: service.id_region },
      orderBy: [{ created_at: 'asc' }, { id_service: 'asc' }],
      select: { id_service: true },
    });
    const serviceCodePattern = new RegExp(`^${service.id_region}SC\\d+$`);
    const serviceCode = serviceCodePattern.test(service.id_service)
      ? service.id_service
      : this.getLegacyServiceCode(
          service.id_region,
          services.map((entry) => entry.id_service),
          service.id_service,
        );
    const districts = await this.prisma.district.findMany({
      where: { id_service: data.id_service },
      select: { id_district: true },
    });
    return this.prisma.district.create({
      data: {
        id_district: this.nextSequentialId(
          `${serviceCode}D`,
          districts.map((district) => district.id_district),
          0,
        ),
        nom_district: data.nom_district,
        id_service: data.id_service,
      },
    });
  }

  async updateDistrict(id: string, data: { nom_district?: string; id_service?: string }) {
    const district = await this.prisma.district.findUnique({ where: { id_district: id } });
    if (!district) throw new NotFoundException('District introuvable');
    return this.prisma.district.update({ where: { id_district: id }, data });
  }

  async deleteDistrict(id: string) {
    const users = await this.prisma.$queryRawUnsafe<{ count: bigint }[]>(
      `SELECT COUNT(*) as count FROM utilisateurs WHERE id_district = ?`, id,
    );
    if (Number(users[0]?.count ?? 0) > 0) {
      throw new BadRequestException('Impossible de supprimer: des utilisateurs sont rattachés à ce district');
    }
    await this.prisma.$executeRawUnsafe(`DELETE FROM districts WHERE id_district = ?`, id);
    return { success: true };
  }

  // ── Secteurs ──

  async getSecteurs() {
    const rows = await this.prisma.$queryRawUnsafe<any[]>(
      `SELECT s.*, d.nom_district, sc.nom_service, r.nom_region,
              (SELECT COUNT(*) FROM utilisateurs u WHERE u.id_secteur = s.id_secteur) as nb_utilisateurs
       FROM secteurs s
       LEFT JOIN districts d ON s.id_district = d.id_district
       LEFT JOIN services_commerciaux sc ON d.id_service = sc.id_service
       LEFT JOIN regions r ON sc.id_region = r.id_region
       ORDER BY r.nom_region, sc.nom_service, d.nom_district, s.nom_secteur`,
    );
     return this.serializeRawRows(rows);
  }

  async createSecteur(data: { nom_secteur: string; id_district: string; id_service?: string }) {
    const district = await this.prisma.district.findUnique({ where: { id_district: data.id_district } });
    if (!district) throw new BadRequestException('District introuvable');
    // secteurs.id_service is NOT NULL — derive it from the parent district when omitted
    const id_service = data.id_service ?? district.id_service;
    const service = await this.prisma.serviceCommercial.findUnique({ where: { id_service } });
    if (!service) throw new BadRequestException('Service introuvable');
    const services = await this.prisma.serviceCommercial.findMany({
      where: { id_region: service.id_region },
      select: { id_service: true },
    });
    const secteurs = await this.prisma.secteur.findMany({
      where: { id_service: { in: services.map((entry) => entry.id_service) } },
      select: { id_secteur: true },
    });
    return this.prisma.secteur.create({
      data: {
        id_secteur: this.nextSequentialId(
          `${service.id_region}ST`,
          secteurs.map((secteur) => secteur.id_secteur),
          2,
        ),
        nom_secteur: data.nom_secteur,
        id_district: data.id_district,
        id_service,
      },
    });
  }

  async updateSecteur(
    id: string,
    data: { nom_secteur?: string; id_district?: string; id_service?: string },
  ) {
    const secteur = await this.prisma.secteur.findUnique({ where: { id_secteur: id } });
    if (!secteur) throw new NotFoundException('Secteur introuvable');
    return this.prisma.secteur.update({ where: { id_secteur: id }, data });
  }

  async deleteSecteur(id: string) {
    const users = await this.prisma.$queryRawUnsafe<{ count: bigint }[]>(
      `SELECT COUNT(*) as count FROM utilisateurs WHERE id_secteur = ?`, id,
    );
    if (Number(users[0]?.count ?? 0) > 0) {
      throw new BadRequestException('Impossible de supprimer: des utilisateurs sont rattachés à ce secteur');
    }
    await this.prisma.$executeRawUnsafe(`DELETE FROM secteurs WHERE id_secteur = ?`, id);
    return { success: true };
  }

  // ── Branches ──

  async getBranches() {
    return this.prisma.branche.findMany({ orderBy: { nom_branche: 'asc' } });
  }

  // ── Overview ──

  async getOverview() {
    const [regions, totalUsers, activeUsers] = await Promise.all([
      this.prisma.region.findMany({ orderBy: { nom_region: 'asc' } }),
      this.prisma.utilisateur.count(),
      this.prisma.utilisateur.count({ where: { statut: 'Actif' } }),
    ]);

    return {
      regions,
      total_utilisateurs: totalUsers,
      utilisateurs_actifs: activeUsers,
      total_regions: regions.length,
    };
  }
}
