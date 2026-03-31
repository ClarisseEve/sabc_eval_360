import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminStructureService {
  constructor(private prisma: PrismaService) {}

  // ── Regions ──

  async getRegions() {
    return this.prisma.region.findMany({
      include: { _count: { select: { utilisateurs: true } } },
      orderBy: { nom_region: 'asc' },
    });
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
    return this.prisma.$queryRawUnsafe<any[]>(
      `SELECT sc.*, r.nom_region,
              (SELECT COUNT(*) FROM utilisateurs u WHERE u.id_service = sc.id_service) as nb_utilisateurs,
              (SELECT COUNT(*) FROM districts d WHERE d.id_service = sc.id_service) as nb_districts
       FROM services_commerciaux sc
       LEFT JOIN regions r ON sc.id_region = r.id_region
       ORDER BY r.nom_region, sc.nom_service`,
    );
  }

  async createService(data: { nom_service: string; id_region: string }) {
    return this.prisma.$executeRawUnsafe(
      `INSERT INTO services_commerciaux (nom_service, id_region, created_at, updated_at) VALUES (?, ?, NOW(), NOW())`,
      data.nom_service, data.id_region,
    );
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
    return this.prisma.$queryRawUnsafe<any[]>(
      `SELECT d.*, sc.nom_service, r.nom_region,
              (SELECT COUNT(*) FROM utilisateurs u WHERE u.id_district = d.id_district) as nb_utilisateurs,
              (SELECT COUNT(*) FROM secteurs s WHERE s.id_district = d.id_district) as nb_secteurs
       FROM districts d
       LEFT JOIN services_commerciaux sc ON d.id_service = sc.id_service
       LEFT JOIN regions r ON sc.id_region = r.id_region
       ORDER BY r.nom_region, sc.nom_service, d.nom_district`,
    );
  }

  async createDistrict(data: { nom_district: string; id_service: string }) {
    return this.prisma.$executeRawUnsafe(
      `INSERT INTO districts (nom_district, id_service, created_at, updated_at) VALUES (?, ?, NOW(), NOW())`,
      data.nom_district, data.id_service,
    );
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
    return this.prisma.$queryRawUnsafe<any[]>(
      `SELECT s.*, d.nom_district, sc.nom_service, r.nom_region,
              (SELECT COUNT(*) FROM utilisateurs u WHERE u.id_secteur = s.id_secteur) as nb_utilisateurs
       FROM secteurs s
       LEFT JOIN districts d ON s.id_district = d.id_district
       LEFT JOIN services_commerciaux sc ON d.id_service = sc.id_service
       LEFT JOIN regions r ON sc.id_region = r.id_region
       ORDER BY r.nom_region, sc.nom_service, d.nom_district, s.nom_secteur`,
    );
  }

  async createSecteur(data: { nom_secteur: string; id_district: string; id_service?: string }) {
    return this.prisma.$executeRawUnsafe(
      `INSERT INTO secteurs (nom_secteur, id_district, id_service, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())`,
      data.nom_secteur, data.id_district, data.id_service ?? null,
    );
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
    return this.prisma.branche.findMany({
      include: { _count: { select: { utilisateurs: true } } },
      orderBy: { nom_branche: 'asc' },
    });
  }

  // ── Overview ──

  async getOverview() {
    const [regions, totalUsers, activeUsers] = await Promise.all([
      this.prisma.region.findMany({
        include: { _count: { select: { utilisateurs: true } } },
        orderBy: { nom_region: 'asc' },
      }),
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
