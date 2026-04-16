import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DatabasePgService } from '../database/database-pg.service';
import { CacheService } from '../common/cache.service';
import { PrismaService } from '../prisma/prisma.service';

type ImprovementPlanFilters = {
  role?: string;
  id_region?: string;
  type?: string;
};

type AdminRegionAggregate = {
  id_region: string;
  nom_region: string;
  est_taniere: boolean;
  utilisateurs: number;
  evaluations: number;
  average_score: number;
  completion_rate: number;
  badgeColor: string;
  badgeText: string;
};

type ImprovementPlanSnapshot = {
  user: {
    matricule: string;
    nom: string | null;
    prenom: string | null;
    role: string | null;
    role_nom: string | null;
    region_nom: string | null;
  };
  axes: any[];
  recommandations: any[];
};

const EVALUATION_EFFECTIVE_TS_SQL = `COALESCE(date_validation, date_soumission, created_at, date_creation::timestamp)`;
const EVALUATION_EFFECTIVE_DATE_SQL = `COALESCE(date_validation::date, date_soumission::date, created_at::date, date_creation)`;
const USER_REF_TABLE = 'utilisateurs_ref';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);
  private readonly serviceUrl: string;
  private readonly serviceKey: string;
  private readonly enabled: boolean;

  constructor(
    private config: ConfigService,
    private pg: DatabasePgService,
    private cache: CacheService,
    private prisma: PrismaService,
  ) {
    this.serviceUrl = config.get('ANALYTICS_SERVICE_URL', 'http://analytics-service:8080');
    this.serviceKey = config.get('ANALYTICS_SERVICE_KEY', 'internal-service-key');
    this.enabled = config.get('ANALYTICS_MICROSERVICE_ENABLED', 'false') === 'true';
  }

  async getDashboard(filters: { start_date?: string; end_date?: string } = {}) {
    const key = `analytics:dashboard:${filters.start_date ?? ''}:${filters.end_date ?? ''}`;
    return this.cache.getOrCompute(key, 120, () => this._getDashboard(filters));
  }

  private async _getDashboard(filters: { start_date?: string; end_date?: string } = {}) {
    if (this.enabled) {
      try {
        const res = await fetch(`${this.serviceUrl}/api/v2/analytics`, {
          headers: { 'X-Service-Key': this.serviceKey },
        });
        if (res.ok) {
          const payload = await res.json();
          return payload.data;
        }
      } catch (e: any) {
        this.logger.warn(`Analytics microservice failed: ${e.message}`);
      }
    }
    return this.getDashboardFallback(filters);
  }

  async getEvaluationsStats(filters: { start_date?: string; end_date?: string } = {}) {
    const startDate = filters.start_date ?? this.sixMonthsAgo();
    const endDate = filters.end_date ?? new Date().toISOString().split('T')[0];

    return this.pg.query(
      `SELECT statut, COUNT(*) as count
       FROM evaluations
       WHERE ${EVALUATION_EFFECTIVE_DATE_SQL} BETWEEN $1 AND $2
       GROUP BY statut`,
      [startDate, endDate],
    );
  }

  async getPerformances(filters: { start_date?: string; end_date?: string } = {}) {
    const startDate = filters.start_date ?? this.sixMonthsAgo();
    const endDate = filters.end_date ?? new Date().toISOString().split('T')[0];

    return this.pg.query(
      `SELECT type_evaluation as channel,
              AVG(note_globale) as average_score,
              COUNT(*) as count
       FROM evaluations
       WHERE ${EVALUATION_EFFECTIVE_DATE_SQL} BETWEEN $1 AND $2 AND note_globale IS NOT NULL
       GROUP BY type_evaluation`,
      [startDate, endDate],
    );
  }

  async getRegionAnalytics(idRegion: string) {
    return this.pg.query(
      `SELECT
         COUNT(*) as total_evaluations,
         COUNT(*) FILTER (WHERE statut = 'valide') as validees,
         AVG(note_globale) FILTER (WHERE note_globale IS NOT NULL) as score_moyen
       FROM evaluations
       WHERE evalue_matricule IN (
         SELECT matricule FROM ${USER_REF_TABLE} WHERE id_region = $1
       )`,
      [idRegion],
    );
  }

  async getAdminOverview() {
    return this.cache.getOrCompute('analytics:admin:overview', 120, () => this._getAdminOverview());
  }

  private async _getAdminOverview() {
    const [dashboard, userStats, evaluationStatus, remplacements, regionsOverview, roleAnalytics] = await Promise.all([
      this.getDashboard(),
      (async () => ({
        total_users: String(await this.prisma.utilisateur.count()),
        active_users: String(await this.prisma.utilisateur.count({ where: { est_actif: true } })),
      }))(),
      this.pg.queryOne<any>(
        `SELECT
           COUNT(*)::text as total_evaluations,
           COUNT(*) FILTER (WHERE statut = 'valide')::text as validated_evaluations,
           COUNT(*) FILTER (WHERE statut = 'soumis')::text as submitted_evaluations,
           COUNT(*) FILTER (WHERE statut = 'brouillon')::text as draft_evaluations
         FROM evaluations`,
      ),
      this.pg.queryOne<any>(
        `SELECT COUNT(*)::text as active_replacements
         FROM remplacements_temporaires
         WHERE est_actif = true AND (date_fin IS NULL OR date_fin >= CURRENT_DATE)`,
      ),
      this.getAdminRegionsOverview(),
      this.getAdminRoleAnalytics(),
    ]);

    const totalEvaluations = Number(evaluationStatus?.total_evaluations ?? dashboard?.kpis?.total_evaluations ?? 0);
    const validatedEvaluations = Number(evaluationStatus?.validated_evaluations ?? 0);
    const submittedEvaluations = Number(evaluationStatus?.submitted_evaluations ?? 0);
    const draftEvaluations = Number(evaluationStatus?.draft_evaluations ?? 0);
    const completionRate = totalEvaluations > 0
      ? Math.round((validatedEvaluations / totalEvaluations) * 10000) / 100
      : 0;

    return {
      kpis: {
        total_evaluations: totalEvaluations,
        unique_users: Number(dashboard?.kpis?.unique_users ?? 0),
        average_score: Number(dashboard?.kpis?.average_score ?? 0),
        completion_rate: completionRate,
        validated_evaluations: validatedEvaluations,
        active_users: Number(userStats?.active_users ?? 0),
        total_users: Number(userStats?.total_users ?? 0),
        active_replacements: Number(remplacements?.active_replacements ?? 0),
      },
      status_distribution: [
        { name: 'Validées', value: validatedEvaluations, color: '#48BB78' },
        { name: 'Soumises', value: submittedEvaluations, color: '#3182CE' },
        { name: 'Brouillons', value: draftEvaluations, color: '#D69E2E' },
      ].filter((entry) => entry.value > 0),
      channel_distribution: Array.isArray(dashboard?.channel_distribution) ? dashboard.channel_distribution : [],
      performance_trend: Array.isArray(dashboard?.performance_trend) ? dashboard.performance_trend : [],
      regions: regionsOverview.inter_region,
      top_roles: roleAnalytics.roles.slice(0, 6),
      generated_at: new Date().toISOString(),
    };
  }

  async getAdminRoleAnalytics() {
    return this.cache.getOrCompute('analytics:admin:roles', 120, () => this._getAdminRoleAnalytics());
  }

  private async _getAdminRoleAnalytics() {
    const [roles, channels] = await Promise.all([
      this.getAdminRolePerformance(),
      this.getPerformances(),
    ]);

    const globalAverage = roles.length > 0
      ? Math.round((roles.reduce((sum, role) => sum + role.avgScore, 0) / roles.length) * 100) / 100
      : 0;

    return {
      global_average: globalAverage,
      roles: roles.map((role) => ({
        ...role,
        delta_vs_global: Math.round((role.avgScore - globalAverage) * 100) / 100,
      })),
      channels: Array.isArray(channels)
        ? channels.map((channel: any) => ({
            channel: String(channel?.channel ?? 'autre'),
            average_score: Number(channel?.average_score ?? 0),
            count: Number(channel?.count ?? 0),
          }))
        : [],
      generated_at: new Date().toISOString(),
    };
  }

  async getAdminRegionsOverview() {
    return this.cache.getOrCompute('analytics:admin:regions', 120, () => this._getAdminRegionsOverview());
  }

  private async _getAdminRegionsOverview() {
    const rows = await this.getAdminRegionAggregates();

    return {
      regions: rows,
      inter_region: rows.map((region) => ({
        id_region: region.id_region,
        region: region.nom_region,
        utilisateurs: region.utilisateurs,
        evaluations: region.evaluations,
        average_score: region.average_score,
        completion_rate: region.completion_rate,
      })),
      generated_at: new Date().toISOString(),
    };
  }

  async getAdminRegionDetail(idRegion: string) {
    return this.cache.getOrCompute(`analytics:admin:region:${idRegion}`, 120, () => this._getAdminRegionDetail(idRegion));
  }

  private async _getAdminRegionDetail(idRegion: string) {
    const [overview, statsRows, classement] = await Promise.all([
      this.getAdminRegionsOverview(),
      this.getRegionAnalytics(idRegion),
      this.getClassementRegional(idRegion),
    ]);

    const region = Array.isArray(overview.regions)
      ? overview.regions.find((entry: any) => String(entry.id_region) === String(idRegion)) ?? null
      : null;
    const stats = Array.isArray(statsRows) ? statsRows[0] ?? null : statsRows ?? null;

    return {
      region,
      stats: stats
        ? {
            total_evaluations: Number(stats.total_evaluations ?? 0),
            validees: Number(stats.validees ?? 0),
            score_moyen: stats.score_moyen != null ? Number(stats.score_moyen) : null,
          }
        : null,
      classement,
      generated_at: new Date().toISOString(),
    };
  }

  // Fallback when microservice is unavailable
  private async getDashboardFallback(filters: { start_date?: string; end_date?: string }) {
    const startDate = filters.start_date ?? this.sixMonthsAgo();
    const endDate = filters.end_date ?? new Date().toISOString().split('T')[0];

    const kpis = await this.pg.queryOne<any>(
      `SELECT
         COUNT(*) as total_evaluations,
         COUNT(DISTINCT evalue_matricule) as unique_users,
         AVG(note_globale) as average_score
       FROM evaluations
       WHERE ${EVALUATION_EFFECTIVE_DATE_SQL} BETWEEN $1 AND $2`,
      [startDate, endDate],
    );

    const channels = await this.pg.query(
      `SELECT type_evaluation as channel, COUNT(*) as total, AVG(note_globale) as average_score
       FROM evaluations
       WHERE ${EVALUATION_EFFECTIVE_DATE_SQL} BETWEEN $1 AND $2
       GROUP BY type_evaluation`,
      [startDate, endDate],
    );

    const trends = await this.pg.query(
      `SELECT TO_CHAR(${EVALUATION_EFFECTIVE_DATE_SQL}, 'YYYY-MM') as period,
              AVG(note_globale) as score, COUNT(*) as count
       FROM evaluations
       WHERE ${EVALUATION_EFFECTIVE_DATE_SQL} BETWEEN $1 AND $2
       GROUP BY TO_CHAR(${EVALUATION_EFFECTIVE_DATE_SQL}, 'YYYY-MM')
       ORDER BY period`,
      [startDate, endDate],
    );

    return {
      kpis: {
        total_evaluations: parseInt(kpis?.total_evaluations ?? '0'),
        unique_users: parseInt(kpis?.unique_users ?? '0'),
        average_score: parseFloat(kpis?.average_score ?? '0'),
      },
      channel_distribution: channels,
      performance_trend: trends,
    };
  }

  // ─── Axes d'amélioration pour un utilisateur ─────────────────────────────
  async getAxesAmelioration(matricule: string) {
    return this.cache.getOrCompute(`analytics:axes:${matricule}`, 300, () => this._getAxesAmelioration(matricule));
  }

  private async _getAxesAmelioration(matricule: string) {
    const evaluations = await this.pg.query<any>(
      `SELECT notations_json, type_evaluation, note_globale
       FROM evaluations
       WHERE evalue_matricule = $1 AND statut = 'valide' AND notations_json IS NOT NULL
       ORDER BY ${EVALUATION_EFFECTIVE_TS_SQL} DESC LIMIT 20`,
      [matricule],
    );

    if (!evaluations.length) return { axes: [], message: 'Aucune évaluation validée trouvée' };

    // Aggregate scores by criteria
    const criteriaScores: Record<string, { total: number; count: number; comments: string[] }> = {};

    for (const ev of evaluations) {
      const notes = typeof ev.notations_json === 'string' ? JSON.parse(ev.notations_json) : ev.notations_json ?? [];
      for (const note of notes) {
        const key = note.nom ?? note.critere ?? note.categorie ?? `critere_${Object.keys(criteriaScores).length}`;
        if (!criteriaScores[key]) criteriaScores[key] = { total: 0, count: 0, comments: [] };
        if (note.note != null) {
          criteriaScores[key].total += note.note;
          criteriaScores[key].count++;
        }
        if (note.commentaire && note.note < 3) {
          criteriaScores[key].comments.push(note.commentaire);
        }
      }
    }

    // Identify weak areas (moyenne < 3/5)
    const axes = Object.entries(criteriaScores)
      .map(([critere, data]) => ({
        critere,
        moyenne: data.count > 0 ? Math.round((data.total / data.count) * 100) / 100 : 0,
        nb_evaluations: data.count,
        commentaires: data.comments.slice(0, 3),
      }))
      .filter(a => a.moyenne < 3)
      .sort((a, b) => a.moyenne - b.moyenne);

    // Generate suggestions
    const suggestions = axes.map(axe => ({
      critere: axe.critere,
      score_actuel: axe.moyenne,
      priorite: axe.moyenne < 2 ? 'haute' : 'moyenne',
      suggestion: this.genererSuggestion(axe.critere, axe.moyenne),
      objectif_smart: this.genererObjectifSmart(axe.critere, axe.moyenne),
      commentaires_evaluateurs: axe.commentaires,
    }));

    // Strengths (score >= 4)
    const forces = Object.entries(criteriaScores)
      .map(([critere, data]) => ({
        critere,
        moyenne: data.count > 0 ? Math.round((data.total / data.count) * 100) / 100 : 0,
      }))
      .filter(a => a.moyenne >= 4)
      .sort((a, b) => b.moyenne - a.moyenne);

    return { axes_amelioration: suggestions, forces, total_criteres: Object.keys(criteriaScores).length };
  }

  async getImprovementPlans(filters: ImprovementPlanFilters = {}) {
    const key = `analytics:improvement-plans:${filters.role ?? 'all'}:${filters.id_region ?? 'all'}:${filters.type ?? 'all'}`;
    return this.cache.getOrCompute(key, 180, () => this._getImprovementPlans(filters));
  }

  private async _getImprovementPlans(filters: ImprovementPlanFilters = {}) {
    const users = await this.prisma.utilisateur.findMany({
      where: {
        est_actif: true,
        ...(filters.id_region ? { id_region: filters.id_region } : {}),
        ...(filters.role
          ? {
              OR: [
                { role: filters.role },
                { role_nom: filters.role },
              ],
            }
          : {}),
      },
      select: {
        matricule: true,
        nom: true,
        prenom: true,
        role: true,
        role_nom: true,
        region_nom: true,
      },
      orderBy: [{ nom: 'asc' }, { prenom: 'asc' }],
    });

    const snapshots = await this.mapWithConcurrency(users, 8, async (user) => this.buildImprovementPlanSnapshot(user));
    const allRows = this.buildImprovementRows(snapshots);
    const filteredRows = filters.type ? allRows.filter((row) => row.type === filters.type) : allRows;
    const groupedByType = new Map<string, { total: number; highPriority: number; users: Set<string> }>();

    allRows.forEach((row) => {
      const current = groupedByType.get(row.type) ?? { total: 0, highPriority: 0, users: new Set<string>() };
      current.total += 1;
      current.users.add(row.matricule);
      if (String(row.priorite).toLowerCase() === 'haute') {
        current.highPriority += 1;
      }
      groupedByType.set(row.type, current);
    });

    const byType = Array.from(groupedByType.entries())
      .map(([type, aggregate]) => ({
        type,
        total: aggregate.total,
        highPriority: aggregate.highPriority,
        users: aggregate.users.size,
      }))
      .sort((left, right) => right.total - left.total);

    const topAxes = this.buildImprovementTopAxes(snapshots);
    const highPriorityCount = allRows.filter((row) => String(row.priorite).toLowerCase() === 'haute').length;
    const usersWithRecommendations = new Set(allRows.map((row) => row.matricule)).size;

    return {
      filters: {
        role: filters.role ?? null,
        id_region: filters.id_region ?? null,
        type: filters.type ?? null,
      },
      totals: {
        users_filtered: users.length,
        users_analyzed: snapshots.length,
        recommendations_total: filteredRows.length,
        recommendations_total_all_types: allRows.length,
        high_priority: highPriorityCount,
        users_with_recommendations: usersWithRecommendations,
      },
      by_type: byType,
      top_axes: topAxes,
      rows: filteredRows,
      generated_at: new Date().toISOString(),
    };
  }

  // ─── Détection d'anomalies ───────────────────────────────────────────────
  async detecterAnomalies(matricule?: string, idRegion?: string) {
    const key = `analytics:anomalies:${matricule ?? 'all'}:${idRegion ?? 'all'}`;
    return this.cache.getOrCompute(key, 180, () => this._detecterAnomalies(matricule, idRegion));
  }

  private async _detecterAnomalies(matricule?: string, idRegion?: string) {
    const anomalies: Array<{
      type: string;
      description: string;
      severite: 'info' | 'warning' | 'critical';
      matricule?: string;
      details: Record<string, any>;
    }> = [];

    // All queries below use parameterized $1 placeholders — never string interpolation.
    const params = matricule ? [matricule] : [];

    // 1. Divergence auto-évaluation vs évaluations des autres (seuil: 1.5 pts)
    const divergences = await this.pg.query<any>(
      `SELECT
         e_auto.evalue_matricule as matricule,
         AVG(e_auto.note_globale) as score_auto,
         AVG(e_autres.note_globale) as score_autres,
         ABS(AVG(e_auto.note_globale) - AVG(e_autres.note_globale)) as divergence
       FROM evaluations e_auto
       JOIN evaluations e_autres ON e_auto.evalue_matricule = e_autres.evalue_matricule
         AND e_auto.id_periode = e_autres.id_periode
       WHERE e_auto.type_evaluation = 'auto' AND e_auto.statut = 'valide'
         AND e_autres.type_evaluation != 'auto' AND e_autres.statut = 'valide'
         AND e_auto.note_globale IS NOT NULL AND e_autres.note_globale IS NOT NULL
         ${matricule ? 'AND e_auto.evalue_matricule = $1' : ''}
       GROUP BY e_auto.evalue_matricule
       HAVING ABS(AVG(e_auto.note_globale) - AVG(e_autres.note_globale)) > 1.5`,
      params,
    );

    for (const d of divergences) {
      anomalies.push({
        type: 'divergence_auto_vs_autres',
        description: `Écart significatif entre l'auto-évaluation (${parseFloat(d.score_auto).toFixed(1)}) et les évaluations externes (${parseFloat(d.score_autres).toFixed(1)})`,
        severite: parseFloat(d.divergence) > 2.5 ? 'critical' : 'warning',
        matricule: d.matricule,
        details: {
          score_auto: parseFloat(d.score_auto),
          score_autres: parseFloat(d.score_autres),
          ecart: parseFloat(d.divergence),
        },
      });
    }

    // 2. Baisse de performance (progression < -1 pt sur 3 mois)
    const baisses = await this.pg.query<any>(
      `WITH recent AS (
         SELECT evalue_matricule, AVG(note_globale) as score_recent
         FROM evaluations
         WHERE statut = 'valide' AND note_globale IS NOT NULL
           AND ${EVALUATION_EFFECTIVE_TS_SQL} >= NOW() - INTERVAL '3 months'
           ${matricule ? 'AND evalue_matricule = $1' : ''}
         GROUP BY evalue_matricule
       ),
       ancien AS (
         SELECT evalue_matricule, AVG(note_globale) as score_ancien
         FROM evaluations
         WHERE statut = 'valide' AND note_globale IS NOT NULL
           AND ${EVALUATION_EFFECTIVE_TS_SQL} < NOW() - INTERVAL '3 months'
           AND ${EVALUATION_EFFECTIVE_TS_SQL} >= NOW() - INTERVAL '6 months'
           ${matricule ? 'AND evalue_matricule = $1' : ''}
         GROUP BY evalue_matricule
       )
       SELECT r.evalue_matricule as matricule,
              r.score_recent, a.score_ancien,
              r.score_recent - a.score_ancien as progression
       FROM recent r JOIN ancien a ON r.evalue_matricule = a.evalue_matricule
       WHERE r.score_recent - a.score_ancien < -1`,
      params,
    );

    for (const b of baisses) {
      anomalies.push({
        type: 'baisse_performance',
        description: `Baisse de performance de ${Math.abs(parseFloat(b.progression)).toFixed(1)} points sur 3 mois`,
        severite: parseFloat(b.progression) < -2 ? 'critical' : 'warning',
        matricule: b.matricule,
        details: {
          score_recent: parseFloat(b.score_recent),
          score_ancien: parseFloat(b.score_ancien),
          progression: parseFloat(b.progression),
        },
      });
    }

    // 3. Uniformité des évaluations (variance < 0.5 = manque de différenciation)
    const uniformites = await this.pg.query<any>(
      `SELECT evaluateur_matricule as matricule,
              COUNT(*) as nb_evaluations,
              VARIANCE(note_globale) as variance_notes,
              AVG(note_globale) as moyenne_notes
       FROM evaluations
       WHERE statut = 'valide' AND note_globale IS NOT NULL AND type_evaluation != 'auto'
         ${matricule ? 'AND evaluateur_matricule = $1' : ''}
       GROUP BY evaluateur_matricule
       HAVING COUNT(*) >= 3 AND VARIANCE(note_globale) < 0.5`,
      params,
    );

    for (const u of uniformites) {
      anomalies.push({
        type: 'uniformite_evaluations',
        description: `Évaluations trop uniformes (variance: ${parseFloat(u.variance_notes).toFixed(2)}) — manque de différenciation`,
        severite: 'warning',
        matricule: u.matricule,
        details: {
          nb_evaluations: parseInt(u.nb_evaluations),
          variance: parseFloat(u.variance_notes),
          moyenne: parseFloat(u.moyenne_notes),
        },
      });
    }

    // 4. Biais évaluateur (moyenne systématiquement haute/basse vs moyenne globale)
    const biaisResult = await this.pg.query<any>(
      `WITH global_avg AS (
         SELECT AVG(note_globale) as avg_global FROM evaluations
         WHERE statut = 'valide' AND note_globale IS NOT NULL AND type_evaluation != 'auto'
       )
       SELECT e.evaluateur_matricule as matricule,
              AVG(e.note_globale) as moyenne_evaluateur,
              g.avg_global,
              AVG(e.note_globale) - g.avg_global as ecart_vs_global,
              COUNT(*) as nb_evaluations
       FROM evaluations e, global_avg g
       WHERE e.statut = 'valide' AND e.note_globale IS NOT NULL AND e.type_evaluation != 'auto'
         ${matricule ? 'AND e.evaluateur_matricule = $1' : ''}
       GROUP BY e.evaluateur_matricule, g.avg_global
       HAVING COUNT(*) >= 3 AND ABS(AVG(e.note_globale) - g.avg_global) > 1`,
      params,
    );

    for (const b of biaisResult) {
      const direction = parseFloat(b.ecart_vs_global) > 0 ? 'haute' : 'basse';
      anomalies.push({
        type: 'biais_evaluateur',
        description: `Notation systématiquement ${direction} (${parseFloat(b.ecart_vs_global).toFixed(1)} pts vs moyenne globale)`,
        severite: Math.abs(parseFloat(b.ecart_vs_global)) > 1.5 ? 'critical' : 'warning',
        matricule: b.matricule,
        details: {
          moyenne_evaluateur: parseFloat(b.moyenne_evaluateur),
          moyenne_globale: parseFloat(b.avg_global),
          ecart: parseFloat(b.ecart_vs_global),
          direction,
          nb_evaluations: parseInt(b.nb_evaluations),
        },
      });
    }

    return {
      anomalies,
      total: anomalies.length,
      par_severite: {
        critical: anomalies.filter(a => a.severite === 'critical').length,
        warning: anomalies.filter(a => a.severite === 'warning').length,
        info: anomalies.filter(a => a.severite === 'info').length,
      },
    };
  }

  // ─── Recommandations personnalisées ─────────────────────────────────────
  async getRecommandations(matricule: string) {
    return this.cache.getOrCompute(`analytics:reco:${matricule}`, 300, () => this._getRecommandations(matricule));
  }

  private async _getRecommandations(matricule: string) {
    const [axes, scores, user] = await Promise.all([
      this.getAxesAmelioration(matricule),
      this.getScoresUtilisateur(matricule),
      this.prisma.utilisateur.findUnique({
        where: { matricule },
        select: {
          matricule: true,
          nom: true,
          prenom: true,
          role: true,
          role_nom: true,
          id_region: true,
          niveau_hierarchique: true,
        },
      }),
    ]);

    const recommandations: Array<{
      type: 'formation' | 'mentorat' | 'mobilite' | 'plan_developpement';
      priorite: 'haute' | 'moyenne' | 'basse';
      titre: string;
      description: string;
      details: Record<string, any>;
    }> = [];

    // 1. Formations basées sur critères faibles (< 3/5)
    if (axes.axes_amelioration) {
      for (const axe of axes.axes_amelioration) {
        recommandations.push({
          type: 'formation',
          priorite: axe.priorite as 'haute' | 'moyenne',
          titre: `Formation : ${axe.critere}`,
          description: `Score actuel de ${axe.score_actuel}/5. ${axe.suggestion}`,
          details: {
            critere: axe.critere,
            score_actuel: axe.score_actuel,
            objectif: axe.objectif_smart,
          },
        });
      }
    }

    // 2. Mentorat : matching experts/apprenants dans la même région
    if (scores.score_global !== null && scores.score_global < 3 && user) {
      const mentors = await this.pg.query<any>(
        `SELECT DISTINCT e.evalue_matricule as matricule, u.nom, u.prenom, u.role,
                AVG(e.note_globale) as score_moyen
         FROM evaluations e
         JOIN ${USER_REF_TABLE} u ON e.evalue_matricule = u.matricule
         WHERE e.statut = 'valide' AND e.note_globale IS NOT NULL
           AND u.id_region = $1 AND u.est_actif = true
           AND e.evalue_matricule != $2
         GROUP BY e.evalue_matricule, u.nom, u.prenom, u.role
         HAVING AVG(e.note_globale) >= 4
         ORDER BY AVG(e.note_globale) DESC LIMIT 3`,
        [user.id_region, matricule],
      );

      if (mentors.length) {
        recommandations.push({
          type: 'mentorat',
          priorite: 'haute',
          titre: 'Programme de mentorat recommandé',
          description: `Score global de ${scores.score_global.toFixed(1)}/5. Un accompagnement par un pair performant est conseillé.`,
          details: {
            score_actuel: scores.score_global,
            mentors_suggerees: mentors.map((m: any) => ({
              matricule: m.matricule,
              nom_complet: `${m.prenom} ${m.nom}`,
              role: m.role,
              score_moyen: parseFloat(m.score_moyen).toFixed(1),
            })),
          },
        });
      }
    }

    // 3. Mobilité : talents avec forte progression et score élevé
    if (scores.score_global !== null && scores.score_global >= 4 && scores.progression > 0.5) {
      recommandations.push({
        type: 'mobilite',
        priorite: 'moyenne',
        titre: 'Potentiel de mobilité identifié',
        description: `Score élevé (${scores.score_global.toFixed(1)}/5) avec progression positive (+${scores.progression.toFixed(1)}). Ce collaborateur pourrait bénéficier de responsabilités élargies.`,
        details: {
          score_global: scores.score_global,
          progression: scores.progression,
          suggestion: Number(user?.niveau_hierarchique ?? 0) > 1
            ? 'Considérer pour un poste de niveau supérieur'
            : 'Proposer des missions transversales ou inter-régions',
        },
      });
    }

    // 4. Plan de développement basé sur les faiblesses
    if (axes.axes_amelioration && axes.axes_amelioration.length > 0) {
      recommandations.push({
        type: 'plan_developpement',
        priorite: axes.axes_amelioration.some((a: any) => a.priorite === 'haute') ? 'haute' : 'moyenne',
        titre: 'Plan de développement personnalisé',
        description: `${axes.axes_amelioration.length} axe(s) d'amélioration identifié(s). Objectifs SMART générés.`,
        details: {
          nb_axes: axes.axes_amelioration.length,
          objectifs: axes.axes_amelioration.map((a: any) => ({
            critere: a.critere,
            objectif: a.objectif_smart,
            echeance: '3 mois',
          })),
          forces: axes.forces?.slice(0, 3) ?? [],
        },
      });
    }

    return {
      matricule,
      recommandations,
      total: recommandations.length,
      par_type: {
        formation: recommandations.filter(r => r.type === 'formation').length,
        mentorat: recommandations.filter(r => r.type === 'mentorat').length,
        mobilite: recommandations.filter(r => r.type === 'mobilite').length,
        plan_developpement: recommandations.filter(r => r.type === 'plan_developpement').length,
      },
    };
  }

  // ─── Scores détaillés utilisateur ────────────────────────────────────────
  async getScoresUtilisateur(matricule: string) {
    return this.cache.getOrCompute(`analytics:scores:${matricule}`, 120, () => this._getScoresUtilisateur(matricule));
  }

  private async _getScoresUtilisateur(matricule: string) {
    const recent = await this.pg.queryOne<any>(
      `SELECT AVG(note_globale) as score_recent
       FROM evaluations
       WHERE evalue_matricule = $1 AND statut = 'valide' AND note_globale IS NOT NULL
         AND ${EVALUATION_EFFECTIVE_TS_SQL} >= NOW() - INTERVAL '6 months'`,
      [matricule],
    );

    const ancien = await this.pg.queryOne<any>(
      `SELECT AVG(note_globale) as score_ancien
       FROM evaluations
       WHERE evalue_matricule = $1 AND statut = 'valide' AND note_globale IS NOT NULL
         AND ${EVALUATION_EFFECTIVE_TS_SQL} < NOW() - INTERVAL '6 months'
         AND ${EVALUATION_EFFECTIVE_TS_SQL} >= NOW() - INTERVAL '12 months'`,
      [matricule],
    );

    const parType = await this.pg.query<any>(
      `SELECT type_evaluation, AVG(note_globale) as moyenne, COUNT(*) as nb
       FROM evaluations
       WHERE evalue_matricule = $1 AND statut = 'valide' AND note_globale IS NOT NULL
       GROUP BY type_evaluation`,
      [matricule],
    );

    const scoreGlobal = recent?.score_recent ? parseFloat(recent.score_recent) : null;
    const scoreAncien = ancien?.score_ancien ? parseFloat(ancien.score_ancien) : null;

    // Calcul pondéré selon règles SABC : auto 20%, pairs 40%, manager 40%
    const autoScore = parType.find((p: any) => p.type_evaluation === 'auto');
    const pairsScore = parType.find((p: any) => p.type_evaluation === 'pairs');
    const managerScore = parType.find((p: any) => p.type_evaluation === 'descendante');

    let scorePondere: number | null = null;
    if (autoScore || pairsScore || managerScore) {
      let total = 0;
      let poids = 0;
      if (autoScore) { total += parseFloat(autoScore.moyenne) * 0.2; poids += 0.2; }
      if (pairsScore) { total += parseFloat(pairsScore.moyenne) * 0.4; poids += 0.4; }
      if (managerScore) { total += parseFloat(managerScore.moyenne) * 0.4; poids += 0.4; }
      scorePondere = poids > 0 ? Math.round((total / poids) * 100) / 100 : null;
    }

    return {
      score_global: scoreGlobal ? Math.round(scoreGlobal * 100) / 100 : null,
      score_pondere: scorePondere,
      progression: scoreGlobal && scoreAncien ? Math.round((scoreGlobal - scoreAncien) * 100) / 100 : 0,
      par_type: parType.map((p: any) => ({
        type: p.type_evaluation,
        moyenne: Math.round(parseFloat(p.moyenne) * 100) / 100,
        nb_evaluations: parseInt(p.nb),
      })),
    };
  }

  // ─── Classement régional (anonymisé) ────────────────────────────────────
  async getClassementRegional(idRegion: string) {
    return this.cache.getOrCompute(`analytics:classement:${idRegion}`, 300, () => this._getClassementRegional(idRegion));
  }

  private async _getClassementRegional(idRegion: string) {
    const classement = await this.pg.query<any>(
      `SELECT
         e.evalue_matricule,
         AVG(e.note_globale) as score_moyen,
         COUNT(*) as nb_evaluations
       FROM evaluations e
       JOIN ${USER_REF_TABLE} u ON e.evalue_matricule = u.matricule
       WHERE u.id_region = $1 AND e.statut = 'valide' AND e.note_globale IS NOT NULL
       GROUP BY e.evalue_matricule
       HAVING COUNT(*) >= 2
       ORDER BY AVG(e.note_globale) DESC`,
      [idRegion],
    );

    return {
      region: idRegion,
      total_evalues: classement.length,
      moyenne_region: classement.length > 0
        ? Math.round(classement.reduce((s: number, c: any) => s + parseFloat(c.score_moyen), 0) / classement.length * 100) / 100
        : null,
      distribution: {
        excellent: classement.filter((c: any) => parseFloat(c.score_moyen) >= 4).length,
        bon: classement.filter((c: any) => parseFloat(c.score_moyen) >= 3 && parseFloat(c.score_moyen) < 4).length,
        moyen: classement.filter((c: any) => parseFloat(c.score_moyen) >= 2 && parseFloat(c.score_moyen) < 3).length,
        faible: classement.filter((c: any) => parseFloat(c.score_moyen) < 2).length,
      },
    };
  }

  // ─── Private helpers ─────────────────────────────────────────────────────

  private genererSuggestion(critere: string, score: number): string {
    const critLower = critere.toLowerCase();
    if (critLower.includes('leadership') || critLower.includes('management'))
      return 'Formation en leadership et gestion d\'équipe recommandée. Participer à des ateliers de coaching.';
    if (critLower.includes('communication'))
      return 'Développer les compétences en communication orale et écrite. Exercices de prise de parole.';
    if (critLower.includes('technique') || critLower.includes('compétence'))
      return 'Programme de mise à niveau technique. Formations certifiantes dans le domaine concerné.';
    if (critLower.includes('autonomie'))
      return 'Confier progressivement des tâches avec moins de supervision. Suivi régulier des résultats.';
    if (critLower.includes('équipe') || critLower.includes('collaboration'))
      return 'Participer à des projets transversaux. Exercices de team-building.';
    if (critLower.includes('innovation'))
      return 'Encourager la proposition d\'idées nouvelles. Participer à des hackathons internes.';
    if (critLower.includes('résolution') || critLower.includes('problème'))
      return 'Formations en pensée analytique et résolution de problèmes complexes.';
    if (critLower.includes('performance') || critLower.includes('résultat'))
      return 'Définir des objectifs SMART clairs avec suivi hebdomadaire.';
    return score < 2
      ? 'Accompagnement prioritaire avec suivi rapproché et plan d\'action à 30 jours.'
      : 'Formation ciblée et mentorat recommandés pour progresser sur cet axe.';
  }

  private genererObjectifSmart(critere: string, score: number): string {
    const objectifScore = Math.min(score + 1, 5);
    return `Atteindre un score de ${objectifScore.toFixed(1)}/5 sur "${critere}" d'ici 3 mois, `
      + `mesuré par les évaluations du prochain cycle, `
      + `via un plan d'action incluant formation et suivi mensuel.`;
  }

  private sixMonthsAgo(): string {
    const d = new Date();
    d.setMonth(d.getMonth() - 6);
    return d.toISOString().split('T')[0];
  }

  private async buildImprovementPlanSnapshot(user: any): Promise<ImprovementPlanSnapshot> {
    const [axes, recommandations] = await Promise.all([
      this.getAxesAmelioration(String(user.matricule)),
      this.getRecommandations(String(user.matricule)),
    ]);

    return {
      user: {
        matricule: String(user.matricule),
        nom: user.nom ?? null,
        prenom: user.prenom ?? null,
        role: user.role ?? null,
        role_nom: user.role_nom ?? null,
        region_nom: user.region_nom ?? null,
      },
      axes: Array.isArray((axes as any)?.axes_amelioration) ? (axes as any).axes_amelioration : [],
      recommandations: Array.isArray((recommandations as any)?.recommandations) ? (recommandations as any).recommandations : [],
    };
  }

  private buildImprovementRows(snapshots: ImprovementPlanSnapshot[]) {
    return snapshots.flatMap((snapshot) =>
      snapshot.recommandations.map((recommendation) => ({
        matricule: snapshot.user.matricule,
        nomComplet: `${snapshot.user.prenom ?? ''} ${snapshot.user.nom ?? ''}`.trim() || snapshot.user.matricule,
        role: snapshot.user.role_nom || snapshot.user.role || 'Rôle non renseigné',
        region: snapshot.user.region_nom || 'Région non renseignée',
        type: String(recommendation?.type || 'recommandation'),
        priorite: String(recommendation?.priorite || 'moyenne'),
        titre: String(recommendation?.titre || 'Recommandation'),
        description: String(recommendation?.description || ''),
        axeDominant: snapshot.axes[0]?.critere || '—',
      })),
    );
  }

  private buildImprovementTopAxes(snapshots: ImprovementPlanSnapshot[]) {
    const grouped = new Map<string, { count: number; scoreTotal: number; priorite: string }>();

    snapshots.forEach((snapshot) => {
      snapshot.axes.slice(0, 3).forEach((axis: any) => {
        const critere = String(axis?.critere || 'Critère');
        const scoreActuel = Number(axis?.score_actuel ?? axis?.moyenne ?? 0);
        const priorite = String(axis?.priorite || 'moyenne');
        const current = grouped.get(critere) ?? { count: 0, scoreTotal: 0, priorite };
        current.count += 1;
        current.scoreTotal += scoreActuel;
        if (priorite.toLowerCase() === 'haute') {
          current.priorite = 'haute';
        }
        grouped.set(critere, current);
      });
    });

    return Array.from(grouped.entries())
      .map(([critere, aggregate]) => ({
        critere,
        count: aggregate.count,
        priorite: aggregate.priorite,
        scoreMoyen: aggregate.count > 0 ? Math.round((aggregate.scoreTotal / aggregate.count) * 100) / 100 : 0,
      }))
      .sort((left, right) => right.count - left.count || left.scoreMoyen - right.scoreMoyen)
      .slice(0, 10);
  }

  private async mapWithConcurrency<T, R>(
    items: T[],
    concurrency: number,
    mapper: (item: T, index: number) => Promise<R>,
  ): Promise<R[]> {
    if (items.length === 0) return [];

    const results = new Array<R>(items.length);
    let nextIndex = 0;

    const worker = async () => {
      while (nextIndex < items.length) {
        const currentIndex = nextIndex++;
        results[currentIndex] = await mapper(items[currentIndex], currentIndex);
      }
    };

    await Promise.all(
      Array.from({ length: Math.min(concurrency, items.length) }, () => worker()),
    );

    return results;
  }

  private async getAdminRegionAggregates(): Promise<AdminRegionAggregate[]> {
    const rows = await this.pg.query<any>(
      `SELECT
         COALESCE(NULLIF(TRIM(u.id_region), ''), 'unknown') as id_region,
         COALESCE(NULLIF(TRIM(u.region_nom), ''), COALESCE(NULLIF(TRIM(u.id_region), ''), 'Région non renseignée')) as nom_region,
         BOOL_OR(LOWER(COALESCE(u.type_region, '')) = 'taniere') as est_taniere,
         COUNT(DISTINCT u.matricule)::int as utilisateurs,
         COUNT(e.id_evaluation)::int as evaluations,
         COALESCE(ROUND(AVG(e.note_globale) FILTER (WHERE e.statut = 'valide' AND e.note_globale IS NOT NULL)::numeric, 2), 0)::float as average_score,
         CASE
           WHEN COUNT(e.id_evaluation) > 0
             THEN ROUND((COUNT(e.id_evaluation) FILTER (WHERE e.statut = 'valide'))::numeric / COUNT(e.id_evaluation)::numeric * 100, 0)::float
           ELSE 0
         END as completion_rate
       FROM ${USER_REF_TABLE} u
       LEFT JOIN evaluations e ON e.evalue_matricule = u.matricule
       WHERE COALESCE(u.est_actif, true) = true
       GROUP BY COALESCE(NULLIF(TRIM(u.id_region), ''), 'unknown'),
                COALESCE(NULLIF(TRIM(u.region_nom), ''), COALESCE(NULLIF(TRIM(u.id_region), ''), 'Région non renseignée'))
       ORDER BY nom_region ASC`,
    );

    return rows.map((row: any) => ({
      id_region: String(row.id_region),
      nom_region: String(row.nom_region),
      est_taniere: Boolean(row.est_taniere),
      utilisateurs: Number(row.utilisateurs ?? 0),
      evaluations: Number(row.evaluations ?? 0),
      average_score: Number(row.average_score ?? 0),
      completion_rate: Number(row.completion_rate ?? 0),
      badgeColor: row.est_taniere ? '#E53E3E' : '#FF9800',
      badgeText: row.est_taniere ? 'Taniere' : 'Non-taniere',
    }));
  }

  private async getAdminRolePerformance() {
    const rows = await this.pg.query<any>(
      `SELECT
         COALESCE(NULLIF(TRIM(u.role), ''), 'Rôle non renseigné') as role,
         COUNT(DISTINCT u.matricule)::int as count,
         COALESCE(ROUND(AVG(e.note_globale) FILTER (WHERE e.statut = 'valide' AND e.note_globale IS NOT NULL)::numeric, 2), 0)::float as avg_score,
         CASE
           WHEN COUNT(e.id_evaluation) > 0
             THEN ROUND((COUNT(e.id_evaluation) FILTER (WHERE e.statut = 'valide'))::numeric / COUNT(e.id_evaluation)::numeric * 100, 0)::float
           ELSE 0
         END as completion
       FROM ${USER_REF_TABLE} u
       LEFT JOIN evaluations e ON e.evalue_matricule = u.matricule
       WHERE COALESCE(u.est_actif, true) = true
       GROUP BY COALESCE(NULLIF(TRIM(u.role), ''), 'Rôle non renseigné')
       ORDER BY avg_score DESC NULLS LAST, count DESC`,
    );

    return rows.map((row: any) => ({
      role: String(row.role),
      count: Number(row.count ?? 0),
      avgScore: Number(row.avg_score ?? 0),
      completion: Number(row.completion ?? 0),
    }));
  }
}
