import { Injectable } from '@nestjs/common';
import { DatabasePgService } from '../database/database-pg.service';
import { PrismaService } from '../prisma/prisma.service';

export interface DashboardStats {
  evaluations_en_attente: number;
  evaluations_total: number;
  score_personnel: number | null;
  periode_active: {
    id: string;
    nom: string;
    fin: string;
  } | null;
}

export interface AdminDashboardStats extends DashboardStats {
  total_utilisateurs: number;
  utilisateurs_actifs: number;
  total_evaluations: number;
  evaluations_en_cours: number;
  evaluations_validees: number;
  taux_completion: number;
  remplacements_actifs: number;
}

const ROLE_TITLES: Record<string, string> = {
  admin: 'Tableau de Bord Administrateur',
  dr: 'Tableau de Bord Directeur Régional',
  cdtt: 'Tableau de Bord Chef Département',
  csc: 'Tableau de Bord Chef Service',
  cdv: 'Tableau de Bord Chef District',
  cds: 'Tableau de Bord Chef de Secteur',
  rtm: 'Tableau de Bord Marketing Régional',
  tmo: 'Tableau de Bord Marketing Opérationnel',
  srmo: 'Tableau de Bord Superviseur Marketing',
  ss: 'Tableau de Bord Superviseur Sponsoring',
  as: 'Tableau de Bord Assistant Superviseur',
};

@Injectable()
export class DashboardService {
  constructor(
    private pg: DatabasePgService,
    private prisma: PrismaService,
  ) {}

  async getStats(matricule: string): Promise<DashboardStats> {
    const [enAttente, total, score, periodeActive] = await Promise.all([
      this.pg.queryOne<{ count: string }>(
        `SELECT COUNT(*) as count FROM evaluations
         WHERE evaluateur_matricule = $1 AND statut IN ('brouillon', 'soumis')`,
        [matricule],
      ),
      this.pg.queryOne<{ count: string }>(
        'SELECT COUNT(*) as count FROM evaluations WHERE evaluateur_matricule = $1',
        [matricule],
      ),
      this.pg.queryOne<{ note_globale: number }>(
        `SELECT note_globale FROM evaluations
         WHERE evalue_matricule = $1 AND statut = 'valide' AND note_globale IS NOT NULL
         ORDER BY created_at DESC LIMIT 1`,
        [matricule],
      ),
      this.pg.queryOne<{ id_periode: string; nom_periode: string; date_fin: string }>(
        `SELECT id_periode, nom_periode, date_fin FROM periodes_evaluation
         WHERE statut = 'ouverte' LIMIT 1`,
      ),
    ]);

    return {
      evaluations_en_attente: parseInt(enAttente?.count ?? '0'),
      evaluations_total: parseInt(total?.count ?? '0'),
      score_personnel: score?.note_globale ? Math.round(score.note_globale * 10) / 10 : null,
      periode_active: periodeActive
        ? { id: periodeActive.id_periode, nom: periodeActive.nom_periode, fin: periodeActive.date_fin }
        : null,
    };
  }

  async getAdminStats(matricule: string): Promise<AdminDashboardStats> {
    const [baseStats, userStats, evalStats, remplacements] = await Promise.all([
      this.getStats(matricule),
      this.prisma.utilisateur.count().then(async (total) => ({
        total,
        actifs: await this.prisma.utilisateur.count({ where: { statut: 'Actif' } }),
      })),
      this.pg.queryOne<{
        total: string;
        en_cours: string;
        validees: string;
      }>(
        `SELECT
           COUNT(*) as total,
           COUNT(*) FILTER (WHERE statut IN ('brouillon', 'soumis')) as en_cours,
           COUNT(*) FILTER (WHERE statut = 'valide') as validees
         FROM evaluations`,
      ),
      this.prisma.$queryRawUnsafe<{ count: bigint }[]>(
        `SELECT COUNT(*) as count FROM replacement_temporaire WHERE est_actif = 1 AND (date_fin IS NULL OR date_fin >= CURDATE())`,
      ),
    ]);

    const totalEval = parseInt(evalStats?.total ?? '0');
    const validees = parseInt(evalStats?.validees ?? '0');

    return {
      ...baseStats,
      total_utilisateurs: userStats.total,
      utilisateurs_actifs: userStats.actifs,
      total_evaluations: totalEval,
      evaluations_en_cours: parseInt(evalStats?.en_cours ?? '0'),
      evaluations_validees: validees,
      taux_completion: totalEval > 0 ? Math.round((validees / totalEval) * 10000) / 100 : 0,
      remplacements_actifs: Number(remplacements?.[0]?.count ?? 0),
    };
  }

  getRoleTitle(role: string): string {
    return ROLE_TITLES[role.toLowerCase()] ?? ROLE_TITLES.admin;
  }

  getValidRoles(): string[] {
    return Object.keys(ROLE_TITLES);
  }
}
