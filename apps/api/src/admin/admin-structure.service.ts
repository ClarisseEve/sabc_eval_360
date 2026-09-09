import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminStructureService {
  constructor(private prisma: PrismaService) {}

  private serializeRawRows<T extends Record<string, any>>(rows: T[]): T[] {
    return rows.map((row) =>
      Object.fromEntries(
        Object.entries(row).map(([key, value]) => [key, typeof value === 'bigint' ? Number(value) : value]),
      ) as T,
    );
  }

  /**
   * Generates a short unique id (<= 10 chars) for the varchar(10) primary keys
   * used by the org-structure tables (no DB auto-increment / default exists).
   */
  private generateId(prefix: string): string {
    const suffix = Math.random().toString(36).slice(2, 2 + (10 - prefix.length)).toUpperCase();
    return `${prefix}${suffix}`.slice(0, 10);
  }

  // ── Regions ──

  async getRegions() {
    return this.prisma.region.findMany({ orderBy: { nom_region: 'asc' } });
  }

  async createRegion(data: { id_region: string; nom_region: string; est_taniere?: boolean }) {
    return this.prisma.region.create({ data });
  }

  async updateRegion(id: string, data: { nom_region?: string; est_taniere?: boolean }) {
    const region = await this.prisma.region.findUnique({ where: { id_region: id } });
    if (!region) throw new NotFoundException('Région introuvable');
    return this.prisma.region.update({ where: { id_region: id }, data });
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
    return this.prisma.serviceCommercial.create({
      data: {
        id_service: this.generateId('SVC'),
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
      `SELECT COUNT(*) as count FROM utilisateurs WHERE id_service = ?`, id,
    );
    if (Number(users[0]?.count ?? 0) > 0) {
      throw new BadRequestException('Impossible de supprimer: des utilisateurs sont rattachés à ce service');
    }
    const districts = await this.prisma.$queryRawUnsafe<{ count: bigint }[]>(
      `SELECT COUNT(*) as count FROM districts WHERE id_service = ?`, id,
    );
    if (Number(districts[0]?.count ?? 0) > 0) {
      throw new BadRequestException('Impossible de supprimer: des districts dépendent de ce service');
    }
    await this.prisma.$executeRawUnsafe(`DELETE FROM services_commerciaux WHERE id_service = ?`, id);
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
    return this.prisma.district.create({
      data: {
        id_district: this.generateId('DIS'),
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
    const secteurs = await this.prisma.$queryRawUnsafe<{ count: bigint }[]>(
      `SELECT COUNT(*) as count FROM secteurs WHERE id_district = ?`, id,
    );
    if (Number(secteurs[0]?.count ?? 0) > 0) {
      throw new BadRequestException('Impossible de supprimer: des secteurs dépendent de ce district');
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
    return this.prisma.secteur.create({
      data: {
        id_secteur: this.generateId('SEC'),
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
