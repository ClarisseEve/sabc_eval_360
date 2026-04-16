import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DatabasePgService } from '../database/database-pg.service';
import * as bcrypt from 'bcryptjs';
import { EvaluationsService } from '../evaluations/evaluations.service';
import { HierarchyService } from '../hierarchy/hierarchy.service';

@Injectable()
export class AdminUsersService {
  constructor(
    private prisma: PrismaService,
    private pg: DatabasePgService,
    private evaluationsService: EvaluationsService,
    private hierarchyService: HierarchyService,
  ) {}

  async getUsers(filters?: {
    statut?: string; role?: string; id_region?: string; search?: string;
    page?: number; limit?: number;
  }) {
    const where: any = {};
    if (filters?.statut) where.statut = filters.statut;
    if (filters?.role) where.role = filters.role;
    if (filters?.id_region) where.id_region = filters.id_region;
    if (filters?.search?.trim()) {
      const search = filters.search.trim();
      where.OR = [
        { matricule: { contains: search } },
        { nom: { contains: search } },
        { prenom: { contains: search } },
        { email: { contains: search } },
        { role: { contains: search } },
        { role_nom: { contains: search } },
      ];
    }

    const page = Math.max(1, filters?.page ?? 1);
    const limit = Math.min(100, Math.max(1, filters?.limit ?? 50));
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.utilisateur.findMany({
        where,
        include: { region: true, branche: true },
        orderBy: [{ nom: 'asc' }, { prenom: 'asc' }],
        skip,
        take: limit,
      }),
      this.prisma.utilisateur.count({ where }),
    ]);

    return {
      data: data.map(({ password, remember_token, ...rest }) => rest),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getUserByMatricule(matricule: string) {
    const user = await this.prisma.utilisateur.findUnique({
      where: { matricule },
      include: { region: true, branche: true },
    });
    if (!user) throw new NotFoundException('Utilisateur introuvable');

    const evalStats = await this.pg.queryOne<{ total: string; validees: string; score_moyen: string }>(
      `SELECT
         COUNT(*) as total,
         COUNT(*) FILTER (WHERE statut = 'valide') as validees,
         AVG(note_globale) FILTER (WHERE statut = 'valide' AND note_globale IS NOT NULL) as score_moyen
       FROM evaluations WHERE evalue_matricule = $1`,
      [matricule],
    );

    const subordinates = await this.prisma.utilisateur.count({
      where: { manager_matricule: matricule },
    });

    return {
      ...user,
      password: undefined,
      stats: {
        evaluations_total: parseInt(evalStats?.total ?? '0'),
        evaluations_validees: parseInt(evalStats?.validees ?? '0'),
        score_moyen: evalStats?.score_moyen ? Math.round(parseFloat(evalStats.score_moyen) * 10) / 10 : null,
        subordonnes: subordinates,
      },
    };
  }

  async createUser(data: {
    matricule: string;
    nom: string;
    prenom: string;
    email: string;
    password: string;
    role: string;
    role_nom: string;
    id_region: string;
    id_branche: string;
    region_nom: string;
    type_region: string;
    manager_matricule?: string;
    telephone?: string;
  }) {
    const existing = await this.prisma.utilisateur.findUnique({ where: { matricule: data.matricule } });
    if (existing) throw new BadRequestException('Ce matricule existe déjà');

    const emailExists = await this.prisma.utilisateur.findFirst({ where: { email: data.email } });
    if (emailExists) throw new BadRequestException('Cet email est déjà utilisé');

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const created = await this.prisma.utilisateur.create({
      data: {
        ...data,
        password: hashedPassword,
        statut: 'Actif',
        est_actif: true,
      },
      include: { region: true, branche: true },
    });
    const { password: _pw, remember_token: _rt, ...safe } = created;
    return safe;
  }

  async updateUser(matricule: string, data: {
    nom?: string;
    prenom?: string;
    email?: string;
    role?: string;
    role_nom?: string;
    id_region?: string;
    id_branche?: string;
    region_nom?: string;
    type_region?: string;
    telephone?: string;
    statut?: string;
    est_actif?: boolean;
  }) {
    const user = await this.prisma.utilisateur.findUnique({ where: { matricule } });
    if (!user) throw new NotFoundException('Utilisateur introuvable');

    const updated = await this.prisma.utilisateur.update({
      where: { matricule },
      data,
      include: { region: true, branche: true },
    });
    const { password: _pw, remember_token: _rt, ...safe } = updated;
    return safe;
  }

  async getSubordonnes(matricule: string) {
    const rows = await this.prisma.utilisateur.findMany({
      where: { manager_matricule: matricule },
      orderBy: [{ nom: 'asc' }, { prenom: 'asc' }],
    });
    return rows.map(({ password, remember_token, ...rest }) => rest);
  }

  async getHistorique(matricule: string) {
    await this.ensureUserExists(matricule);
    return this.evaluationsService.getHistorique(matricule);
  }

  async getChaine(matricule: string) {
    await this.ensureUserExists(matricule);
    return this.hierarchyService.getChaineHierarchique(matricule);
  }

  async getRemplacantsDisponibles(matricule: string) {
    const user = await this.prisma.utilisateur.findUnique({ where: { matricule } });
    if (!user) throw new NotFoundException('Utilisateur introuvable');

    const rows = await this.prisma.utilisateur.findMany({
      where: {
        statut: 'Actif',
        matricule: { not: matricule },
        id_region: user.id_region,
        est_indisponible: false,
      },
      orderBy: [{ nom: 'asc' }, { prenom: 'asc' }],
    });
    return rows.map(({ password, remember_token, ...rest }) => rest);
  }

  private async ensureUserExists(matricule: string) {
    const user = await this.prisma.utilisateur.findUnique({ where: { matricule } });
    if (!user) throw new NotFoundException('Utilisateur introuvable');
    return user;
  }
}
