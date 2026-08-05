import { Injectable } from '@nestjs/common';
import { DatabasePgService } from '../database/database-pg.service';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from '../common/cache.service';
import { getDoualaDate } from '../periodes/douala-date';

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
  regions?: RegionStats[];
  performance_par_role?: RolePerformance[];
  evaluations_par_statut?: { name: string; value: number; color: string }[];
}

export interface RegionStats {
  id: string;
  nom: string;
  est_taniere: boolean;
  utilisateurs: number;
  evaluations: number;
  badgeColor: string;
  badgeText: string;
}

export interface RolePerformance {
  role: string;
  count: number;
  avgScore: number;
  completion: number;
}

const ROLE_TITLES: Record<string, string> = {
  admin: 'Tableau de Bord Administrateur',
  collaborateur: 'Tableau de Bord Collaborateur',
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
    private cache: CacheService,
  ) {}

  async getStats(matricule: string): Promise<DashboardStats> {
    return this.cache.getOrCompute(`dashboard:stats:${matricule}`, 60, () => this._getStats(matricule));
  }

  private async _getStats(matricule: string): Promise<DashboardStats> {
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
    return this.cache.getOrCompute(`dashboard:admin:${matricule}`, 30, () => this._getAdminStats(matricule));
  }

  private async _getAdminStats(matricule: string): Promise<AdminDashboardStats> {
    const today = new Date(`${getDoualaDate()}T00:00:00.000Z`);
    const [baseStats, userStats, evalStats, remplacements, regions, rolePerf] = await Promise.all([
      this._getStats(matricule),
      this.prisma.utilisateur.count().then(async (total: number) => ({
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
      this.prisma.replacement_temporaire.count({
        where: {
          est_actif: true,
          date_debut: { lte: today },
          OR: [{ date_fin: null }, { date_fin: { gte: today } }],
        },
      }),
      this._getRegionStats(),
      this._getRolePerformance(),
    ]);

    const totalEval = parseInt(evalStats?.total ?? '0');
    const enCours = parseInt(evalStats?.en_cours ?? '0');
    const validees = parseInt(evalStats?.validees ?? '0');

    return {
      ...baseStats,
      total_utilisateurs: userStats.total,
      utilisateurs_actifs: userStats.actifs,
      total_evaluations: totalEval,
      evaluations_en_cours: enCours,
      evaluations_validees: validees,
      taux_completion: totalEval > 0 ? Math.round((validees / totalEval) * 10000) / 100 : 0,
      remplacements_actifs: remplacements,
      regions,
      performance_par_role: rolePerf,
      evaluations_par_statut: [
        { name: 'Validees', value: validees, color: '#48BB78' },
        { name: 'En cours', value: enCours, color: '#D69E2E' },
        { name: 'En attente', value: parseInt(baseStats.evaluations_en_attente?.toString() ?? '0'), color: '#FF9800' },
      ].filter(d => d.value > 0),
    };
  }

  private async _getRegionStats(): Promise<RegionStats[]> {
    try {
      const regions = await this.prisma.region.findMany();

      const regionStats: RegionStats[] = [];
      for (const region of regions) {
        const users = await this.prisma.utilisateur.findMany({
          where: { id_region: region.id_region },
          select: { matricule: true },
        });
        const matricules = users.map((u: { matricule: string }) => u.matricule);

        let evalCount = 0;
        if (matricules.length > 0) {
          const placeholders = matricules.map((_: string, i: number) => `$${i + 1}`).join(',');
          const result = await this.pg.queryOne<{ count: string }>(
            `SELECT COUNT(*) as count FROM evaluations WHERE evaluateur_matricule IN (${placeholders})`,
            matricules,
          ).catch(() => null);
          evalCount = parseInt(result?.count ?? '0');
        }

        regionStats.push({
          id: region.id_region,
          nom: region.nom_region,
          est_taniere: region.est_taniere,
          utilisateurs: matricules.length,
          evaluations: evalCount,
          badgeColor: region.est_taniere ? '#E53E3E' : '#FF9800',
          badgeText: region.est_taniere ? 'Taniere' : 'Non-taniere',
        });
      }
      return regionStats;
    } catch {
      return [];
    }
  }

  private async _getRolePerformance(): Promise<RolePerformance[]> {
    try {
      const roles = await this.prisma.role.findMany();
      const rolePerf: RolePerformance[] = [];

      for (const role of roles) {
        const users = await this.prisma.utilisateur.findMany({
          where: { role_nom: role.nom_role },
          select: { matricule: true },
        });
        if (users.length === 0) continue;

        const matricules = users.map((u: { matricule: string }) => u.matricule);
        let avgScore = 0;
        let completion = 0;

        const placeholders = matricules.map((_: string, i: number) => `$${i + 1}`).join(',');
        const result = await this.pg.queryOne<{ avg_score: number; completion: number }>(
          `SELECT
             COALESCE(AVG(note_globale), 0) as avg_score,
             CASE WHEN COUNT(*) > 0
               THEN ROUND(COUNT(*) FILTER (WHERE statut = 'valide')::numeric / COUNT(*)::numeric * 100)
               ELSE 0 END as completion
           FROM evaluations
           WHERE evalue_matricule IN (${placeholders})`,
          matricules,
        ).catch(() => null);
        avgScore = result?.avg_score ?? 0;
        completion = Number(result?.completion ?? 0);

        rolePerf.push({
          role: role.nom_role,
          count: users.length,
          avgScore: Math.round(avgScore * 10) / 10,
          completion,
        });
      }

      return rolePerf.sort((a, b) => b.avgScore - a.avgScore);
    } catch {
      return [];
    }
  }

  getRoleTitle(role: string): string {
    return ROLE_TITLES[role.toLowerCase()] ?? ROLE_TITLES.collaborateur;
  }

  getValidRoles(): string[] {
    return Object.keys(ROLE_TITLES);
  }
}
