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
        include: {
          _count: { select: { utilisateurs: true } },
        },
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
