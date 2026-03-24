import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DatabasePgService } from '../database/database-pg.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminUsersService {
  constructor(
    private prisma: PrismaService,
    private pg: DatabasePgService,
  ) {}

  async getUsers(filters?: { statut?: string; id_role?: number; id_region?: number }) {
    const where: any = {};
    if (filters?.statut) where.statut = filters.statut;
    if (filters?.id_role) where.id_role = filters.id_role;
    if (filters?.id_region) where.id_region = filters.id_region;

    return this.prisma.utilisateur.findMany({
      where,
      include: { role: true, region: true },
      orderBy: [{ nom: 'asc' }, { prenom: 'asc' }],
    });
  }

  async getUserByMatricule(matricule: string) {
    const user = await this.prisma.utilisateur.findUnique({
      where: { matricule },
      include: { role: true, region: true, branche: true },
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
    mot_de_passe: string;
    id_role: number;
    id_region?: number;
    id_branche?: number;
    manager_matricule?: string;
    telephone?: string;
  }) {
    const existing = await this.prisma.utilisateur.findUnique({ where: { matricule: data.matricule } });
    if (existing) throw new BadRequestException('Ce matricule existe déjà');

    const emailExists = await this.prisma.utilisateur.findFirst({ where: { email: data.email } });
    if (emailExists) throw new BadRequestException('Cet email est déjà utilisé');

    const hashedPassword = await bcrypt.hash(data.mot_de_passe, 10);

    return this.prisma.utilisateur.create({
      data: {
        ...data,
        mot_de_passe: hashedPassword,
        statut: 'Actif',
      },
      include: { role: true, region: true },
    });
  }

  async updateUser(matricule: string, data: {
    nom?: string;
    prenom?: string;
    email?: string;
    id_role?: number;
    id_region?: number;
    id_branche?: number;
    manager_matricule?: string;
    telephone?: string;
    statut?: string;
  }) {
    const user = await this.prisma.utilisateur.findUnique({ where: { matricule } });
    if (!user) throw new NotFoundException('Utilisateur introuvable');

    return this.prisma.utilisateur.update({
      where: { matricule },
      data,
      include: { role: true, region: true },
    });
  }

  async getSubordonnes(matricule: string) {
    return this.prisma.utilisateur.findMany({
      where: { manager_matricule: matricule },
      include: { role: true },
      orderBy: [{ nom: 'asc' }, { prenom: 'asc' }],
    });
  }

  async getRemplacantsDisponibles(matricule: string) {
    const user = await this.prisma.utilisateur.findUnique({ where: { matricule } });
    if (!user) throw new NotFoundException('Utilisateur introuvable');

    return this.prisma.utilisateur.findMany({
      where: {
        statut: 'Actif',
        matricule: { not: matricule },
        id_region: user.id_region,
        est_remplacant: false,
      },
      include: { role: true },
      orderBy: [{ nom: 'asc' }, { prenom: 'asc' }],
    });
  }
}
