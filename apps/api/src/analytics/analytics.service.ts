import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import ExcelJS from 'exceljs';
import { DatabasePgService } from '../database/database-pg.service';
import { CacheService } from '../common/cache.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { getDoualaDate } from '../periodes/douala-date';
import {
  EVALUATED_VISIBILITY_SQL,
  ruleVisibilityDetailSql,
  ruleVisibilitySql,
} from '../evaluations/evaluation-visibility';

type AnalyticsVisibilityAudience = 'evaluated' | 'admin';

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

type RecommendationUser = {
  matricule: string;
  nom: string | null;
  prenom: string | null;
  role: string | null;
  role_nom: string | null;
  id_region: string | null;
  niveau_hierarchique: number | null;
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

// Les limites arrivent en chaîne depuis la query string: sans coercition, un
// `?limit=abc` produisait `LIMIT NaN` et une 500 opaque.
function clampLimit(value: unknown, fallback = 100, max = 500): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.min(Math.floor(parsed), max);
}

// Plafond du nombre d'utilisateurs analysés en une passe pour les plans
// d'amélioration: borne la mémoire et le nombre de requêtes.
const IMPROVEMENT_PLAN_MAX_USERS = 500;

const EVALUATION_EFFECTIVE_TS_SQL = `COALESCE(date_validation, date_soumission, created_at, date_creation::timestamp)`;
const EVALUATION_EFFECTIVE_DATE_SQL = `COALESCE(date_validation::date, date_soumission::date, created_at::date, date_creation)`;
const EVALUATION_EFFECTIVE_TS_E_SQL = `COALESCE(e.date_validation, e.date_soumission, e.created_at, e.date_creation::timestamp)`;
const EVALUATION_EFFECTIVE_DATE_E_SQL = `COALESCE(e.date_validation::date, e.date_soumission::date, e.created_at::date, e.date_creation)`;
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
    private notificationsService?: NotificationsService,
  ) {
    this.serviceUrl = config.get('ANALYTICS_SERVICE_URL', 'http://analytics-service:8080');
    this.serviceKey = config.get('ANALYTICS_SERVICE_KEY', 'internal-service-key');
    this.enabled = config.get('ANALYTICS_MICROSERVICE_ENABLED', 'false') === 'true';
  }

  async runAnomalyDetectionBatch(): Promise<{ total: number; critical: number; inserted: number }> {
    const result = await this._detecterAnomalies();
    let inserted = 0;
    for (const anomalie of result.anomalies) {
      await this.pg.query(
        `INSERT INTO logs_anomalies (type, description, severite, matricule, details)
         VALUES ($1, $2, $3, $4, $5)`,
        [anomalie.type, anomalie.description, anomalie.severite, anomalie.matricule ?? null, JSON.stringify(anomalie.details)],
      );
      inserted++;
    }
    if (result.par_severite.critical > 0) {
      await this.notifierAdminsCritical(result.par_severite.critical);
    }
    return { total: result.total, critical: result.par_severite.critical, inserted };
  }

  async getAnomaliesHistory(filters: { severite?: string; type?: string; resolue?: string; limit?: number }) {
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIdx = 1;
    if (filters.severite) { conditions.push(`severite = $${paramIdx++}`); params.push(filters.severite); }
    if (filters.type) { conditions.push(`type = $${paramIdx++}`); params.push(filters.type); }
    if (filters.resolue !== undefined && filters.resolue !== '') {
      conditions.push(`resolue = $${paramIdx++}`);
      params.push(filters.resolue === 'true');
    }
    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    params.push(clampLimit(filters.limit));
    const rows = await this.pg.query(
      `SELECT * FROM logs_anomalies ${where} ORDER BY created_at DESC LIMIT $${paramIdx}`,
      params,
    );
    return { anomalies: rows, total: rows.length };
  }

  async acknowledgeAnomalie(id: string): Promise<{ success: boolean; id: string; resolue: boolean; date_resolution: string }> {
    await this.pg.query(
      `UPDATE logs_anomalies SET resolue = true, date_resolution = NOW() WHERE id = $1`,
      [id],
    );
    const dateResolution = new Date().toISOString();
    return { success: true, id, resolue: true, date_resolution: dateResolution };
  }

  async runRecommandationsBatch(): Promise<{ inserted: number }> {
    const usersWithEvals = await this.pg.query<{ matricule: string }>(
      `SELECT DISTINCT e.evalue_matricule as matricule
       FROM evaluations e
       LEFT JOIN regles_evaluation r ON r.id_regle = e.id_regle
       WHERE e.statut = 'valide' AND e.note_globale IS NOT NULL
         AND ${ruleVisibilitySql('admin')}
       LIMIT 200`,
    );
    let inserted = 0;
    for (const row of usersWithEvals) {
      const recos = await this._getRecommandations(row.matricule, 'admin');
      for (const reco of recos.recommandations ?? []) {
        await this.pg.query(
          `INSERT INTO recommandations_admin (type, priorite, matricule, titre, description, details)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [reco.type, reco.priorite, row.matricule, reco.titre, reco.description, JSON.stringify(reco.details)],
        );
        inserted++;
      }
    }
    return { inserted };
  }

  async getAdminRecommandations(filters: { statut?: string; type?: string; matricule?: string; limit?: number }) {
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIdx = 1;
    if (filters.statut) { conditions.push(`statut = $${paramIdx++}`); params.push(filters.statut); }
    if (filters.type) { conditions.push(`type = $${paramIdx++}`); params.push(filters.type); }
    if (filters.matricule) { conditions.push(`matricule = $${paramIdx++}`); params.push(filters.matricule); }
    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    params.push(clampLimit(filters.limit));
    const rows = await this.pg.query(
      `SELECT * FROM recommandations_admin ${where} ORDER BY created_at DESC LIMIT $${paramIdx}`,
      params,
    );
    return { recommandations: rows, total: rows.length };
  }

  async validateRecommandation(id: string, validateurMatricule: string) {
    await this.pg.query(
      `UPDATE recommandations_admin SET statut='validee', validateur_matricule=$1, date_validation=NOW() WHERE id=$2`,
      [validateurMatricule, id],
    );
    return { success: true, id, statut: 'validee' };
  }

  async rejectRecommandation(id: string, validateurMatricule: string, motif: string) {
    await this.pg.query(
      `UPDATE recommandations_admin SET statut='rejetee', validateur_matricule=$1, date_validation=NOW(), motif_rejet=$2 WHERE id=$3`,
      [validateurMatricule, motif, id],
    );
    return { success: true, id, statut: 'rejetee' };
  }

  private async notifierAdminsCritical(nbCritical: number): Promise<void> {
    if (!this.notificationsService) return;
    const admins = await this.prisma.utilisateur.findMany({
      where: { est_admin: true, est_actif: true },
      select: { matricule: true },
    });
    for (const admin of admins) {
      await this.notificationsService.create({
        destinataire_matricule: admin.matricule,
        titre: `${nbCritical} anomalie(s) critique(s) détectée(s)`,
        message: `Le batch de détection a identifié ${nbCritical} anomalie(s) critique(s). Consultez le dashboard Analytics.`,
        type: 'warning',
        lien: '/admin/dashboard?tab=anomalies',
      });
    }
  }

  async getDashboard(filters: { start_date?: string; end_date?: string; id_periode?: string } = {}) {
    const key = `analytics:dashboard:${filters.start_date ?? ''}:${filters.end_date ?? ''}:${filters.id_periode ?? ''}`;
    return this.cache.getOrCompute(key, 120, () => this._getDashboard(filters));
  }

  private async _getDashboard(filters: { start_date?: string; end_date?: string; id_periode?: string } = {}) {
    if (this.enabled && !filters.start_date && !filters.end_date && !filters.id_periode) {
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
      `SELECT e.statut, COUNT(*) as count
       FROM evaluations e
       LEFT JOIN regles_evaluation r ON r.id_regle = e.id_regle
       WHERE ${EVALUATION_EFFECTIVE_DATE_E_SQL} BETWEEN $1 AND $2
         AND ${ruleVisibilitySql('admin')}
       GROUP BY e.statut`,
      [startDate, endDate],
    );
  }

  async exportEvaluations(
    format: 'csv' | 'xlsx',
    filters: { start_date?: string; end_date?: string } = {},
  ): Promise<{ buffer: Buffer; filename: string; contentType: string }> {
    const rows = await this.pg.query<{
      date_evaluation: string | Date | null;
      statut: string;
      evalue_nom: string;
      evalue_matricule: string;
      poste: string;
      branche: string;
      region: string;
      evaluateur_nom: string;
      type_evaluation: string;
      competence: string;
      score: number | string | null;
    }>(
      `SELECT
         ${EVALUATION_EFFECTIVE_DATE_E_SQL} AS date_evaluation,
         e.statut,
         CONCAT_WS(' ', evalue.prenom, evalue.nom) AS evalue_nom,
         e.evalue_matricule,
         COALESCE(evalue.role, '') AS poste,
         COALESCE(evalue.id_branche, '') AS branche,
         COALESCE(evalue.region_nom, '') AS region,
         CONCAT_WS(' ', evaluateur.prenom, evaluateur.nom) AS evaluateur_nom,
         e.type_evaluation,
         COALESCE(note->>'nom', note->>'critere', note->>'categorie', critere->>'nom', critere->>'libelle', note->>'critere_id', 'Compétence') AS competence,
         NULLIF(note->>'note', '')::numeric AS score
       FROM evaluations e
       LEFT JOIN regles_evaluation r ON r.id_regle = e.id_regle
       LEFT JOIN utilisateurs_ref evalue ON evalue.matricule = e.evalue_matricule
       LEFT JOIN utilisateurs_ref evaluateur ON evaluateur.matricule = e.evaluateur_matricule
       CROSS JOIN LATERAL jsonb_array_elements(COALESCE(e.notations_json, '[]'::jsonb)) AS note
       LEFT JOIN LATERAL jsonb_array_elements(
         CASE
           WHEN jsonb_typeof(COALESCE(e.criteres_snapshot_json, r.criteres_evaluation_json)) = 'object'
             THEN COALESCE(COALESCE(e.criteres_snapshot_json, r.criteres_evaluation_json)->'criteres', '[]'::jsonb)
           WHEN jsonb_typeof(COALESCE(e.criteres_snapshot_json, r.criteres_evaluation_json)) = 'array'
             THEN COALESCE(e.criteres_snapshot_json, r.criteres_evaluation_json)
           ELSE '[]'::jsonb
         END
       ) AS critere ON COALESCE(note->>'critere_id', note->>'id_critere', note->>'id') = critere->>'id'
       WHERE ${EVALUATION_EFFECTIVE_DATE_E_SQL} BETWEEN COALESCE($1::date, '-infinity'::date) AND COALESCE($2::date, 'infinity'::date)
         AND ${ruleVisibilitySql('admin')}
         AND note->>'note' IS NOT NULL
       ORDER BY ${EVALUATION_EFFECTIVE_DATE_E_SQL} DESC, e.evalue_matricule, competence`,
      [filters.start_date ?? null, filters.end_date ?? null],
    );

    const headers = [
      "Date d'évaluation", "Statut de l'évaluation", "Noms et prénoms de l'évalué", "Matricule de l'évalué", "Poste de l'évalué",
      'Branche', "Région de l'évalué", "Nom de l'évaluateur", "Type d'évaluation", 'Compétence',
      'Note ou score de la compétence', 'Description',
    ];
    const data = rows.map((row) => {
      const score = row.score == null ? null : Number(row.score);
      return [
        row.date_evaluation ? new Date(row.date_evaluation).toISOString().slice(0, 10) : '',
        this.formatEvaluationStatusForExport(row.statut),
        row.evalue_nom || row.evalue_matricule,
        row.evalue_matricule,
        row.poste,
        row.branche,
        row.region,
        row.evaluateur_nom,
        this.formatEvaluationTypeForExport(row.type_evaluation),
        row.competence,
        score == null || Number.isNaN(score) ? '' : score,
        this.describeScore(score),
      ];
    });
    const date = new Date().toISOString().slice(0, 10);
    const filename = `evaluations-consolidees-${date}`;

    if (format === 'csv') {
      const csv = [headers, ...data]
        .map((line) => line.map((value) => this.escapeCsvCell(value)).join(';'))
        .join('\r\n');
      return {
        buffer: Buffer.from(`\uFEFF${csv}`, 'utf8'),
        filename: `${filename}.csv`,
        contentType: 'text/csv; charset=utf-8',
      };
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'SABC Eval360';
    const worksheet = workbook.addWorksheet('Evaluations');
    worksheet.columns = headers.map((header) => ({ header, key: header, width: Math.max(18, Math.min(header.length + 4, 32)) }));
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC62828' } };
    data.forEach((line) => worksheet.addRow(line));
    worksheet.autoFilter = { from: 'A1', to: `L${Math.max(1, data.length + 1)}` };
    worksheet.views = [{ state: 'frozen', ySplit: 1 }];

    return {
      buffer: Buffer.from(await workbook.xlsx.writeBuffer()),
      filename: `${filename}.xlsx`,
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };
  }

  private escapeCsvCell(value: unknown): string {
    const text = value == null ? '' : String(value);
    return /[;"\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  }

  private describeScore(score: number | null): string {
    if (score == null || Number.isNaN(score)) return '';
    if (score >= 4) return 'Acquis';
    if (score >= 3) return "En cours d'acquisition";
    return 'Non acquis';
  }

  private formatEvaluationTypeForExport(type: string): string {
    const labels: Record<string, string> = {
      auto: 'Auto-évaluation',
      pairs: 'Évaluation pair',
      manager: 'Évaluation manager',
      subordonnes: 'Évaluation descendante',
      descendante: 'Évaluation descendante',
    };
    return labels[type] ?? type;
  }

  private formatEvaluationStatusForExport(status: string): string {
    const labels: Record<string, string> = {
      valide: 'Validée',
      rejete: 'Rejetée',
      brouillon: 'Brouillon',
      soumis: 'Soumise',
    };
    return labels[status] ?? status;
  }

  async getPerformances(filters: { start_date?: string; end_date?: string } = {}) {
    const startDate = filters.start_date ?? this.sixMonthsAgo();
    const endDate = filters.end_date ?? new Date().toISOString().split('T')[0];

    return this.pg.query(
      `SELECT e.type_evaluation as channel,
              AVG(e.note_globale) as average_score,
              COUNT(*) as count
       FROM evaluations e
       LEFT JOIN regles_evaluation r ON r.id_regle = e.id_regle
       WHERE ${EVALUATION_EFFECTIVE_DATE_E_SQL} BETWEEN $1 AND $2
         AND e.note_globale IS NOT NULL
         AND ${ruleVisibilitySql('admin')}
       GROUP BY e.type_evaluation`,
      [startDate, endDate],
    );
  }

  async getRegionAnalytics(
    idRegion: string,
    audience: AnalyticsVisibilityAudience = 'evaluated',
  ) {
    return this.pg.query(
      `SELECT
         COUNT(*) as total_evaluations,
         COUNT(*) FILTER (WHERE e.statut = 'valide') as validees,
         AVG(e.note_globale) FILTER (WHERE e.note_globale IS NOT NULL) as score_moyen
       FROM evaluations e
       LEFT JOIN regles_evaluation r ON r.id_regle = e.id_regle
       WHERE e.evalue_matricule IN (
         SELECT matricule FROM ${USER_REF_TABLE} WHERE id_region = $1
       )
         AND ${audience === 'admin' ? ruleVisibilitySql('admin') : EVALUATED_VISIBILITY_SQL}`,
      [idRegion],
    );
  }

  async getAdminOverview(filters: { start_date?: string; end_date?: string; id_periode?: string } = {}) {
    const cacheKey = `analytics:admin:overview:${filters.start_date ?? 'all'}:${filters.end_date ?? 'all'}:${filters.id_periode ?? 'all'}`;
    return this.cache.getOrCompute(cacheKey, 120, () => this._getAdminOverview(filters));
  }

  private async _getAdminOverview(filters: { start_date?: string; end_date?: string; id_periode?: string } = {}) {
    const today = new Date(`${getDoualaDate()}T00:00:00.000Z`);
    const [dashboard, userStats, evaluationStatus, remplacements, regionsOverview, roleAnalytics] = await Promise.all([
      this.getDashboard(filters),
      (async () => ({
        total_users: String(await this.prisma.utilisateur.count()),
        active_users: String(await this.prisma.utilisateur.count({ where: { est_actif: true } })),
      }))(),
      (async () => {
        const startDate = filters.start_date;
        const endDate = filters.end_date;
        const dateFilter = startDate && endDate
          ? `AND ${EVALUATION_EFFECTIVE_DATE_E_SQL} BETWEEN $1 AND $2`
          : '';
        const dateParams = startDate && endDate ? [startDate, endDate] : [];
        return this.pg.queryOne<any>(
          `SELECT
             COUNT(*)::text as total_evaluations,
             COUNT(*) FILTER (WHERE e.statut = 'valide')::text as validated_evaluations,
             COUNT(*) FILTER (WHERE e.statut = 'soumis')::text as submitted_evaluations,
             COUNT(*) FILTER (WHERE e.statut = 'brouillon')::text as draft_evaluations
           FROM evaluations e
           LEFT JOIN regles_evaluation r ON r.id_regle = e.id_regle
           WHERE ${ruleVisibilitySql('admin')} ${dateFilter}`,
          dateParams,
        );
      })(),
      this.prisma.replacement_temporaire.count({
        where: {
          est_actif: true,
          date_debut: { lte: today },
          OR: [{ date_fin: null }, { date_fin: { gte: today } }],
        },
      }),
      this.getAdminRegionsOverview(filters),
      this.getAdminRoleAnalytics(filters),
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
        active_replacements: remplacements,
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

  async getAdminRoleAnalytics(filters: { start_date?: string; end_date?: string; type_evaluation?: string } = {}) {
    const cacheKey = `analytics:admin:roles:${filters.start_date ?? 'all'}:${filters.end_date ?? 'all'}:${filters.type_evaluation ?? 'global'}`;
    return this.cache.getOrCompute(cacheKey, 120, () => this._getAdminRoleAnalytics(filters));
  }

  private async _getAdminRoleAnalytics(filters: { start_date?: string; end_date?: string; type_evaluation?: string } = {}) {
    const [roles, channels] = await Promise.all([
      this.getAdminRolePerformance(filters),
      this.getPerformances(filters),
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

  async getAdminRegionsOverview(filters: { start_date?: string; end_date?: string } = {}) {
    const cacheKey = `analytics:admin:regions:${filters.start_date ?? 'all'}:${filters.end_date ?? 'all'}`;
    return this.cache.getOrCompute(cacheKey, 120, () => this._getAdminRegionsOverview(filters));
  }

  private async _getAdminRegionsOverview(filters: { start_date?: string; end_date?: string } = {}) {
    const rows = await this.getAdminRegionAggregates(filters);

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
      this.getRegionAnalytics(idRegion, 'admin'),
      this.getClassementRegional(idRegion, 'admin'),
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
  private async getDashboardFallback(filters: { start_date?: string; end_date?: string; id_periode?: string }) {
    const startDate = filters.start_date ?? this.sixMonthsAgo();
    const endDate = filters.end_date ?? new Date().toISOString().split('T')[0];

    const kpis = await this.pg.queryOne<any>(
      `SELECT
         COUNT(*) as total_evaluations,
         COUNT(DISTINCT e.evalue_matricule) as unique_users,
         AVG(e.note_globale) as average_score
       FROM evaluations e
       LEFT JOIN regles_evaluation r ON r.id_regle = e.id_regle
       WHERE ${EVALUATION_EFFECTIVE_DATE_E_SQL} BETWEEN $1 AND $2
         AND ${ruleVisibilitySql('admin')}`,
      [startDate, endDate],
    );

    const channels = await this.pg.query(
      `SELECT e.type_evaluation as channel, COUNT(*) as total, AVG(e.note_globale) as average_score
       FROM evaluations e
       LEFT JOIN regles_evaluation r ON r.id_regle = e.id_regle
       WHERE ${EVALUATION_EFFECTIVE_DATE_E_SQL} BETWEEN $1 AND $2
         AND ${ruleVisibilitySql('admin')}
       GROUP BY e.type_evaluation`,
      [startDate, endDate],
    );

    const trendFilter = filters.id_periode
      ? `e.id_periode = $1 AND ${ruleVisibilitySql('admin')}`
      : `${EVALUATION_EFFECTIVE_DATE_E_SQL} BETWEEN $1 AND $2 AND ${ruleVisibilitySql('admin')}`;
    const trendParams = filters.id_periode
      ? [filters.id_periode]
      : [startDate, endDate];
    const trends = await this.pg.query(
      `SELECT TO_CHAR(${EVALUATION_EFFECTIVE_DATE_E_SQL}, 'YYYY-MM') as period,
              AVG(e.note_globale) as score, COUNT(*) as count
       FROM evaluations e
       LEFT JOIN regles_evaluation r ON r.id_regle = e.id_regle
       WHERE ${trendFilter}
       GROUP BY TO_CHAR(${EVALUATION_EFFECTIVE_DATE_E_SQL}, 'YYYY-MM')
       ORDER BY period`,
      trendParams,
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
  async getAxesAmelioration(
    matricule: string,
    audience: AnalyticsVisibilityAudience = 'evaluated',
  ) {
    return this.cache.getOrCompute(`analytics:axes:${audience}:${matricule}`, 300, () =>
      this._getAxesAmelioration(matricule, audience),
    );
  }

  private async _getAxesAmelioration(
    matricule: string,
    audience: AnalyticsVisibilityAudience,
  ) {
    const visibilitySql =
      audience === 'admin' ? ruleVisibilitySql('admin') : EVALUATED_VISIBILITY_SQL;
    const criteria = await this.pg.query<any>(
      `WITH latest AS (
         SELECT e.id_evaluation, e.id_regle, e.notations_json, e.criteres_snapshot_json,
                ROW_NUMBER() OVER (
                  ORDER BY ${EVALUATION_EFFECTIVE_TS_E_SQL} DESC, e.created_at DESC, e.id_evaluation DESC
                ) AS recency_rank
         FROM evaluations e
         LEFT JOIN regles_evaluation r ON r.id_regle = e.id_regle
         WHERE e.evalue_matricule = $1
           AND e.statut = 'valide'
           AND e.notations_json IS NOT NULL
           AND ${visibilitySql}
           AND ${ruleVisibilityDetailSql('detailed')}
       )
       SELECT COALESCE(criterion.value->>'libelle', note.value->>'nom', note.value->>'critere', note.value->>'critere_id') AS critere,
              ROUND(AVG(NULLIF(note.value->>'note', '')::numeric), 2) AS moyenne,
              COALESCE(MAX(NULLIF(criterion.value->>'niveau_requis', '')::numeric), 3) AS niveau_requis,
              MAX(NULLIF(criterion.value->>'recommendation_text', '')) AS recommendation_text,
              COUNT(NULLIF(note.value->>'note', ''))::int AS nb_evaluations,
              ARRAY_AGG(DISTINCT note.value->>'commentaire') FILTER (
                WHERE note.value->>'commentaire' IS NOT NULL
              ) AS commentaires
       FROM latest e
       LEFT JOIN regles_evaluation r ON r.id_regle = e.id_regle
       CROSS JOIN LATERAL jsonb_array_elements(e.notations_json) AS note(value)
       LEFT JOIN LATERAL jsonb_array_elements(
         CASE
           WHEN jsonb_typeof(COALESCE(e.criteres_snapshot_json, r.criteres_evaluation_json)) = 'object'
             THEN COALESCE(COALESCE(e.criteres_snapshot_json, r.criteres_evaluation_json)->'criteres', '[]'::jsonb)
           WHEN jsonb_typeof(COALESCE(e.criteres_snapshot_json, r.criteres_evaluation_json)) = 'array'
             THEN COALESCE(e.criteres_snapshot_json, r.criteres_evaluation_json)
           ELSE '[]'::jsonb
         END
       ) AS criterion(value) ON criterion.value->>'id' = note.value->>'critere_id'
       WHERE e.recency_rank <= 20 AND note.value->>'note' IS NOT NULL
       GROUP BY 1`,
      [matricule],
    );

    if (!criteria.length) return { axes_amelioration: [], forces: [], total_criteres: 0 };

    const criteriaScores = criteria.map((row) => ({
      critere: String(row.critere ?? 'Compétence'),
      moyenne: Number(row.moyenne),
      niveau_requis: Number(row.niveau_requis ?? 3),
      recommendation_text: typeof row.recommendation_text === 'string' ? row.recommendation_text : null,
      nb_evaluations: Number(row.nb_evaluations ?? 0),
      commentaires: Array.isArray(row.commentaires) ? row.commentaires.filter(Boolean).slice(0, 3) : [],
    }));

    const axes = criteriaScores
      .filter((criterion) => criterion.moyenne < criterion.niveau_requis)
      .sort((left, right) => (left.niveau_requis - left.moyenne) - (right.niveau_requis - right.moyenne));
    const suggestions = axes.map((axe) => {
      const ecart = Math.round((axe.niveau_requis - axe.moyenne) * 100) / 100;
      return {
        critere: axe.critere,
        score_actuel: axe.moyenne,
        niveau_requis: axe.niveau_requis,
        ecart,
        nb_evaluations: axe.nb_evaluations,
        priorite: ecart >= 1 || axe.moyenne < 2 ? 'haute' : 'moyenne',
        suggestion: axe.recommendation_text || this.genererSuggestion(axe.critere, axe.moyenne, axe.niveau_requis),
        objectif_smart: this.genererObjectifSmart(axe.critere, axe.moyenne, axe.niveau_requis),
        commentaires_evaluateurs: axe.commentaires,
      };
    });
    const forces = criteriaScores
      .filter((criterion) => criterion.moyenne >= 4)
      .sort((left, right) => right.moyenne - left.moyenne);

    return { axes_amelioration: suggestions, forces, total_criteres: criteriaScores.length };
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
        // Chargés ici pour que buildImprovementPlanSnapshot n'ait pas à
        // relire chaque utilisateur depuis MySQL.
        id_region: true,
        niveau_hierarchique: true,
      },
      orderBy: [{ nom: 'asc' }, { prenom: 'asc' }],
    });

    // Seuls les utilisateurs ayant au moins une évaluation validée peuvent
    // produire des recommandations: analyser les autres coûtait deux requêtes
    // PostgreSQL chacun pour un résultat vide.
    const evaluated = await this.pg.query<{ matricule: string }>(
      `SELECT DISTINCT evalue_matricule AS matricule
       FROM evaluations
       WHERE statut = 'valide' AND notations_json IS NOT NULL`,
    );
    const evaluatedMatricules = new Set(evaluated.map((row) => String(row.matricule)));
    const analysable = users.filter((user) => evaluatedMatricules.has(String(user.matricule)));

    // Plafond explicite: sans lui, la mémoire et le nombre de requêtes croissent
    // linéairement avec l'effectif. La troncature est remontée dans la réponse
    // plutôt que silencieuse.
    const analysed = analysable.slice(0, IMPROVEMENT_PLAN_MAX_USERS);
    const truncated = analysable.length - analysed.length;
    if (truncated > 0) {
      this.logger.warn(
        `Plans d'amélioration: ${analysed.length} utilisateurs analysés sur ${analysable.length} (plafond ${IMPROVEMENT_PLAN_MAX_USERS}).`,
      );
    }

    const snapshots = await this.mapWithConcurrency(analysed, 8, async (user) =>
      this.buildImprovementPlanSnapshot(user, 'admin'),
    );
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
        // Utilisateurs éligibles (au moins une évaluation validée) et nombre
        // écarté par le plafond: la troncature doit rester visible côté UI.
        users_evaluable: analysable.length,
        users_truncated: truncated,
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

  // ─── Tendances Multi-Périodes ────────────────────────────────────────────

  async getTendancesMultiPeriodes(filters: { id_region?: string; role?: string; limit?: number } = {}) {
    const limit = filters.limit ?? 6;
    const key = `analytics:tendances:${filters.id_region ?? ''}:${filters.role ?? ''}:${limit}`;
    return this.cache.getOrCompute(key, 300, () => this._getTendancesMultiPeriodes(filters));
  }

  private async _getTendancesMultiPeriodes(filters: { id_region?: string; role?: string; limit?: number } = {}) {
    const limit = filters.limit ?? 6;
    const params: any[] = [];

    // Build optional filter clauses on evaluations
    const regionClause = filters.id_region
      ? (() => { params.push(filters.id_region); return `AND e.evalue_matricule IN (SELECT matricule FROM ${USER_REF_TABLE} WHERE id_region = $${params.length})`; })()
      : '';

    const roleClause = filters.role
      ? (() => { params.push(filters.role); return `AND e.evalue_matricule IN (SELECT matricule FROM ${USER_REF_TABLE} WHERE role = $${params.length})`; })()
      : '';

    params.push(limit);
    const limitParam = `$${params.length}`;

    const closedWhereClause = `WHERE p.est_ouverte = false OR p.statut IN ('fermee', 'closed')`;

    const buildQuery = (whereClause: string) => `
      SELECT p.id_periode, p.code_periode, p.nom_periode,
             p.date_debut::text as date_debut, p.date_fin::text as date_fin,
             ROUND(AVG(e.note_globale) FILTER (WHERE e.statut = 'valide' AND e.note_globale IS NOT NULL)::numeric, 2) as score_moyen,
             COUNT(e.id_evaluation) as nb_evaluations,
             COUNT(e.id_evaluation) FILTER (WHERE e.statut = 'valide') as nb_valides,
             CASE WHEN COUNT(e.id_evaluation) > 0
               THEN ROUND(COUNT(e.id_evaluation) FILTER (WHERE e.statut = 'valide') * 100.0 / COUNT(e.id_evaluation), 1)
               ELSE 0
             END as taux_completion
      FROM periodes_evaluation p
      LEFT JOIN (
        SELECT evaluation.*
        FROM evaluations evaluation
        LEFT JOIN regles_evaluation rule ON rule.id_regle = evaluation.id_regle
        WHERE ${ruleVisibilitySql('admin', 'rule')}
      ) e ON e.id_periode = p.id_periode
        ${regionClause}
        ${roleClause}
      ${whereClause}
      GROUP BY p.id_periode, p.code_periode, p.nom_periode, p.date_debut, p.date_fin
      ORDER BY p.date_debut ASC
      LIMIT ${limitParam}
    `;

    // First try with only closed periods
    let rows = await this.pg.query<any>(buildQuery(closedWhereClause), params);

    // Fallback: if no closed periods found, include all periods
    if (!rows || rows.length === 0) {
      rows = await this.pg.query<any>(buildQuery(''), params);
    }

    // Calculate deltas
    const tendances = rows.map((row: any, index: number) => {
      const scoreMoyen = row.score_moyen != null ? Number(row.score_moyen) : null;
      const tauxCompletion = Number(row.taux_completion ?? 0);
      const nbEvaluations = Number(row.nb_evaluations ?? 0);
      const nbValides = Number(row.nb_valides ?? 0);

      let deltaScore: number | null = null;
      let deltaCompletion: number | null = null;

      if (index > 0) {
        const prev = rows[index - 1];
        const prevScore = prev.score_moyen != null ? Number(prev.score_moyen) : null;
        if (scoreMoyen != null && prevScore != null) {
          deltaScore = Math.round((scoreMoyen - prevScore) * 100) / 100;
        }
        const prevCompletion = Number(prev.taux_completion ?? 0);
        deltaCompletion = Math.round((tauxCompletion - prevCompletion) * 10) / 10;
      }

      return {
        id_periode: String(row.id_periode),
        code_periode: String(row.code_periode ?? ''),
        nom_periode: String(row.nom_periode ?? ''),
        date_debut: String(row.date_debut ?? ''),
        date_fin: String(row.date_fin ?? ''),
        score_moyen: scoreMoyen,
        taux_completion: tauxCompletion,
        nb_evaluations: nbEvaluations,
        nb_valides: nbValides,
        delta_score: deltaScore,
        delta_completion: deltaCompletion,
      };
    });

    return {
      tendances,
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
       LEFT JOIN regles_evaluation r_auto ON r_auto.id_regle = e_auto.id_regle
       LEFT JOIN regles_evaluation r_autres ON r_autres.id_regle = e_autres.id_regle
       WHERE e_auto.type_evaluation = 'auto' AND e_auto.statut = 'valide'
         AND e_autres.type_evaluation != 'auto' AND e_autres.statut = 'valide'
         AND e_auto.note_globale IS NOT NULL AND e_autres.note_globale IS NOT NULL
         AND ${ruleVisibilitySql('admin', 'r_auto')}
         AND ${ruleVisibilitySql('admin', 'r_autres')}
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
         SELECT e.evalue_matricule, AVG(e.note_globale) as score_recent
         FROM evaluations e
         LEFT JOIN regles_evaluation r ON r.id_regle = e.id_regle
         WHERE e.statut = 'valide' AND e.note_globale IS NOT NULL
           AND ${ruleVisibilitySql('admin')}
           AND ${EVALUATION_EFFECTIVE_TS_E_SQL} >= NOW() - INTERVAL '3 months'
           ${matricule ? 'AND e.evalue_matricule = $1' : ''}
         GROUP BY e.evalue_matricule
       ),
       ancien AS (
         SELECT e.evalue_matricule, AVG(e.note_globale) as score_ancien
         FROM evaluations e
         LEFT JOIN regles_evaluation r ON r.id_regle = e.id_regle
         WHERE e.statut = 'valide' AND e.note_globale IS NOT NULL
           AND ${ruleVisibilitySql('admin')}
           AND ${EVALUATION_EFFECTIVE_TS_E_SQL} < NOW() - INTERVAL '3 months'
           AND ${EVALUATION_EFFECTIVE_TS_E_SQL} >= NOW() - INTERVAL '6 months'
           ${matricule ? 'AND e.evalue_matricule = $1' : ''}
         GROUP BY e.evalue_matricule
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
      `SELECT e.evaluateur_matricule as matricule,
              COUNT(*) as nb_evaluations,
              VARIANCE(e.note_globale) as variance_notes,
              AVG(e.note_globale) as moyenne_notes
       FROM evaluations e
       LEFT JOIN regles_evaluation r ON r.id_regle = e.id_regle
       WHERE e.statut = 'valide' AND e.note_globale IS NOT NULL
         AND e.type_evaluation NOT IN ('auto', 'pairs')
         AND ${ruleVisibilitySql('admin')}
         ${matricule ? 'AND e.evaluateur_matricule = $1' : ''}
       GROUP BY e.evaluateur_matricule
       HAVING COUNT(*) >= 3 AND VARIANCE(e.note_globale) < 0.5`,
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
         SELECT AVG(e.note_globale) as avg_global
         FROM evaluations e
         LEFT JOIN regles_evaluation r ON r.id_regle = e.id_regle
         WHERE e.statut = 'valide' AND e.note_globale IS NOT NULL
           AND e.type_evaluation NOT IN ('auto', 'pairs')
           AND ${ruleVisibilitySql('admin')}
       )
       SELECT e.evaluateur_matricule as matricule,
              AVG(e.note_globale) as moyenne_evaluateur,
              g.avg_global,
              AVG(e.note_globale) - g.avg_global as ecart_vs_global,
              COUNT(*) as nb_evaluations
       FROM evaluations e
       LEFT JOIN regles_evaluation r ON r.id_regle = e.id_regle
       CROSS JOIN global_avg g
       WHERE e.statut = 'valide' AND e.note_globale IS NOT NULL
         AND e.type_evaluation NOT IN ('auto', 'pairs')
         AND ${ruleVisibilitySql('admin')}
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

  async getEvaluationGaps(matricule?: string) {
    const params = matricule ? [matricule] : [];
    const scoreRows = await this.pg.query<any>(
      `WITH historical_counts AS (
         SELECT e.evalue_matricule, e.type_evaluation,
                COUNT(*)::int AS nb_evaluations,
                COUNT(DISTINCT e.evaluateur_matricule)::int AS nb_evaluateurs
         FROM evaluations e
         LEFT JOIN regles_evaluation r ON r.id_regle = e.id_regle
         WHERE e.statut = 'valide' AND e.note_globale IS NOT NULL
           AND ${ruleVisibilitySql('admin')}
           ${matricule ? 'AND e.evalue_matricule = $1' : ''}
         GROUP BY e.evalue_matricule, e.type_evaluation
       ), latest AS (
         SELECT e.evalue_matricule, e.type_evaluation, e.note_globale,
                ROW_NUMBER() OVER (
                  PARTITION BY e.evalue_matricule, e.type_evaluation
                  ORDER BY COALESCE(e.date_soumission, e.updated_at, e.created_at) DESC,
                           e.created_at DESC, e.id_evaluation DESC
                ) AS recency_rank
         FROM evaluations e
         LEFT JOIN regles_evaluation r ON r.id_regle = e.id_regle
         WHERE e.statut = 'valide' AND e.note_globale IS NOT NULL
           AND ${ruleVisibilitySql('admin')}
           ${matricule ? 'AND e.evalue_matricule = $1' : ''}
       )
       SELECT latest.evalue_matricule AS matricule, latest.type_evaluation,
              ROUND(latest.note_globale, 2) AS score,
              counts.nb_evaluations, counts.nb_evaluateurs
       FROM latest
       JOIN historical_counts counts
         ON counts.evalue_matricule = latest.evalue_matricule
        AND counts.type_evaluation = latest.type_evaluation
       WHERE latest.recency_rank = 1`,
      params,
    );
    const rows = await this.pg.query<any>(
      `WITH latest AS (
       SELECT e.id_evaluation, e.evalue_matricule, e.type_evaluation, e.id_regle, e.notations_json,
              e.criteres_snapshot_json,
              ROW_NUMBER() OVER (
                PARTITION BY e.evalue_matricule, e.type_evaluation
                ORDER BY COALESCE(e.date_soumission, e.updated_at, e.created_at) DESC,
                         e.created_at DESC, e.id_evaluation DESC
              ) AS recency_rank
       FROM evaluations e
       LEFT JOIN regles_evaluation r ON r.id_regle = e.id_regle
       WHERE e.statut = 'valide'
         AND e.notations_json IS NOT NULL
         AND ${ruleVisibilitySql('admin')}
         ${matricule ? 'AND e.evalue_matricule = $1' : ''}
      )
      SELECT
         e.evalue_matricule AS matricule,
         e.type_evaluation,
         n->>'critere_id' AS critere_id,
         ROUND(MAX((n->>'note')::numeric), 2) AS score,
         COALESCE(MAX((critere->>'niveau_requis')::numeric), 3) AS niveau_requis,
         COUNT(*)::int AS nb_notes
       FROM latest e
       LEFT JOIN regles_evaluation r ON r.id_regle = e.id_regle
       CROSS JOIN LATERAL jsonb_array_elements(e.notations_json) AS n
       LEFT JOIN LATERAL jsonb_array_elements(
         CASE
           WHEN jsonb_typeof(COALESCE(e.criteres_snapshot_json, r.criteres_evaluation_json)) = 'object'
             THEN COALESCE(COALESCE(e.criteres_snapshot_json, r.criteres_evaluation_json)->'criteres', '[]'::jsonb)
           WHEN jsonb_typeof(COALESCE(e.criteres_snapshot_json, r.criteres_evaluation_json)) = 'array'
             THEN COALESCE(e.criteres_snapshot_json, r.criteres_evaluation_json)
           ELSE '[]'::jsonb
         END
       ) AS critere ON critere->>'id' = n->>'critere_id'
       WHERE e.recency_rank = 1
         AND n->>'note' IS NOT NULL
         AND n->>'critere_id' IS NOT NULL
         AND ${ruleVisibilitySql('admin')}
         ${matricule ? 'AND e.evalue_matricule = $1' : ''}
      GROUP BY e.evalue_matricule, e.type_evaluation, n->>'critere_id'`,
      params,
    );

    const profiles = new Map<string, any>();
    for (const row of scoreRows) {
      const profile = profiles.get(row.matricule) ?? {
        matricule: row.matricule,
        types: {},
        competences: new Map<string, any>(),
      };
      profile.types[row.type_evaluation] = {
        score: Number(row.score),
        nb_evaluations: Number(row.nb_evaluations ?? 0),
        nb_evaluateurs: Number(row.nb_evaluateurs ?? 0),
        competences: 0,
      };
      profiles.set(row.matricule, profile);
    }

    for (const row of rows) {
      const score = Number(row.score);
      const required = Number(row.niveau_requis ?? 3);
      const profile = profiles.get(row.matricule) ?? {
        matricule: row.matricule,
        types: {},
        competences: new Map<string, any>(),
      };
      profile.types[row.type_evaluation] = profile.types[row.type_evaluation] ?? {
        score: null,
        nb_evaluations: 0,
        nb_evaluateurs: 0,
        competences: 0,
      };
      profile.types[row.type_evaluation].competences += 1;

      const competence = profile.competences.get(row.critere_id) ?? {
        critere_id: row.critere_id,
        niveau_requis: required,
        par_type: {},
      };
      competence.niveau_requis = Math.max(competence.niveau_requis, required);
      competence.par_type[row.type_evaluation] = {
        score,
        ecart_niveau: Math.round((score - required) * 100) / 100,
        nb_evaluations: Number(row.nb_evaluations ?? 0),
      };
      profile.competences.set(row.critere_id, competence);
      profiles.set(row.matricule, profile);
    }

    return {
      seuil_divergence: 1.5,
      profils: [...profiles.values()].map((profile) => {
        const types = profile.types;
        const typeScores = Object.values(types)
          .map((value: any) => value.score)
          .filter((value): value is number => typeof value === 'number');
        const divergence = typeScores.length > 1 ? Math.max(...typeScores) - Math.min(...typeScores) : 0;
        const competences = [...profile.competences.values()].map((competence: any) => ({
          ...competence,
          gap_types: Object.entries(competence.par_type)
            .filter(([, value]: [string, any]) => value.ecart_niveau < 0)
            .map(([type, value]) => ({ type, ...(value as any) })),
        }));
        const deficits = competences.reduce((count, competence) => count + competence.gap_types.length, 0);
        return {
          matricule: profile.matricule,
          types,
          competences,
          divergence: Math.round(divergence * 100) / 100,
          anomalie: divergence >= 1.5 || deficits > 0,
          deficits,
        };
      }),
      generated_at: new Date().toISOString(),
    };
  }

  // ─── Recommandations personnalisées ─────────────────────────────────────
  /**
   * `knownUser` évite un aller-retour MySQL quand l'appelant a déjà chargé
   * l'utilisateur — c'est le cas des plans d'amélioration, qui parcourent des
   * centaines d'utilisateurs déjà en mémoire. Le résultat est identique, donc
   * la clé de cache reste inchangée.
   */
  async getRecommandations(
    matricule: string,
    audience: AnalyticsVisibilityAudience = 'evaluated',
    knownUser?: RecommendationUser | null,
  ) {
    return this.cache.getOrCompute(`analytics:reco:${audience}:${matricule}`, 300, () =>
      this._getRecommandations(matricule, audience, knownUser),
    );
  }

  private async _getRecommandations(
    matricule: string,
    audience: AnalyticsVisibilityAudience,
    knownUser?: RecommendationUser | null,
  ) {
    const [axes, scores, user] = await Promise.all([
      this.getAxesAmelioration(matricule, audience),
      this.getScoresUtilisateur(matricule, audience),
      knownUser
        ? Promise.resolve(knownUser)
        : this.prisma.utilisateur.findUnique({
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
         LEFT JOIN regles_evaluation r ON r.id_regle = e.id_regle
         WHERE e.statut = 'valide' AND e.note_globale IS NOT NULL
           AND u.id_region = $1 AND u.est_actif = true
           AND e.evalue_matricule != $2
           AND ${audience === 'admin' ? ruleVisibilitySql('admin') : EVALUATED_VISIBILITY_SQL}
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

  // ─── Évolution temporelle par critère ────────────────────────────────────

  /**
   * Progression d'un agent période après période, critère par critère.
   *
   * Complète getTendancesMultiPeriodes, qui agrège tout un périmètre pour les
   * administrateurs: ici la lecture est individuelle et détaillée par critère,
   * afin d'alimenter les courbes d'évolution des tableaux de bord de rôle.
   */
  async getEvolutionCriteres(
    matricule: string,
    audience: AnalyticsVisibilityAudience = 'evaluated',
    limitPeriodes = 8,
  ) {
    return this.cache.getOrCompute(
      `analytics:evolution:${audience}:${matricule}:${limitPeriodes}`,
      300,
      () => this._getEvolutionCriteres(matricule, audience, limitPeriodes),
    );
  }

  private async _getEvolutionCriteres(
    matricule: string,
    audience: AnalyticsVisibilityAudience,
    limitPeriodes: number,
  ) {
    const visibilitySql =
      audience === 'admin' ? ruleVisibilitySql('admin') : EVALUATED_VISIBILITY_SQL;

    const rows = await this.pg.query<{
      code_periode: string;
      nom_periode: string;
      date_debut: string;
      critere_id: string;
      moyenne: string | null;
    }>(
      // Les périodes sont bornées puis les moyennes calculées dessus: une
      // carrière longue ne fait donc pas grossir la réponse indéfiniment.
      `WITH periodes_retenues AS (
         SELECT p.id_periode, p.code_periode, p.nom_periode, p.date_debut
         FROM periodes_evaluation p
         WHERE EXISTS (
           SELECT 1 FROM evaluations e
           LEFT JOIN regles_evaluation r ON r.id_regle = e.id_regle
           WHERE e.id_periode = p.id_periode
             AND e.evalue_matricule = $1
             AND e.statut = 'valide'
             AND ${visibilitySql}
         )
         ORDER BY p.date_debut DESC
         LIMIT $2
       )
       SELECT pr.code_periode,
              pr.nom_periode,
              pr.date_debut::text AS date_debut,
              n->>'critere_id' AS critere_id,
              ROUND(AVG((n->>'note')::numeric), 2) AS moyenne
       FROM periodes_retenues pr
       JOIN evaluations e ON e.id_periode = pr.id_periode
       LEFT JOIN regles_evaluation r ON r.id_regle = e.id_regle
       CROSS JOIN LATERAL jsonb_array_elements(e.notations_json) AS n
       WHERE e.evalue_matricule = $1
         AND e.statut = 'valide'
         AND e.notations_json IS NOT NULL
         AND n->>'note' IS NOT NULL
         AND n->>'critere_id' IS NOT NULL
         AND ${visibilitySql}
       GROUP BY pr.code_periode, pr.nom_periode, pr.date_debut, n->>'critere_id'
       ORDER BY pr.date_debut ASC, n->>'critere_id' ASC`,
      [matricule, limitPeriodes],
    );

    const criteres = [...new Set(rows.map((row) => row.critere_id))].sort((a, b) =>
      a.localeCompare(b),
    );

    const parPeriode = new Map<
      string,
      { code_periode: string; nom_periode: string; date_debut: string; notes: Record<string, number> }
    >();
    for (const row of rows) {
      const existante = parPeriode.get(row.code_periode) ?? {
        code_periode: row.code_periode,
        nom_periode: row.nom_periode,
        date_debut: row.date_debut,
        notes: {} as Record<string, number>,
      };
      if (row.moyenne != null) existante.notes[row.critere_id] = Number(row.moyenne);
      parPeriode.set(row.code_periode, existante);
    }

    // Chaque période expose tous les critères rencontrés: une série continue
    // évite qu'un critère non évalué une fois ne casse la courbe.
    const periodes = [...parPeriode.values()].map((periode) => ({
      code_periode: periode.code_periode,
      nom_periode: periode.nom_periode,
      date_debut: periode.date_debut,
      notes: Object.fromEntries(
        criteres.map((critere) => [critere, periode.notes[critere] ?? null]),
      ) as Record<string, number | null>,
    }));

    return { matricule, criteres, periodes, generated_at: new Date().toISOString() };
  }

  // ─── Heatmap d'équipe ────────────────────────────────────────────────────

  /**
   * Matrice collaborateurs × critères: moyenne validée de chaque membre sur
   * chaque critère, pour repérer forces collectives et relais de compétence.
   *
   * Une seule requête agrégée quel que soit l'effectif: l'appelant borne déjà
   * la liste (500 matricules maximum côté DTO).
   */
  async getTeamHeatmap(
    matricules: string[],
    audience: AnalyticsVisibilityAudience = 'evaluated',
  ) {
    const uniques = [...new Set((matricules ?? []).filter(Boolean))];
    if (uniques.length === 0) {
      return { membres: [], criteres: [], generated_at: new Date().toISOString() };
    }

    const visibilitySql =
      audience === 'admin' ? ruleVisibilitySql('admin') : EVALUATED_VISIBILITY_SQL;

    const rows = await this.pg.query<{
      matricule: string;
      critere_id: string;
      moyenne: string | null;
    }>(
      `SELECT e.evalue_matricule AS matricule,
              n->>'critere_id' AS critere_id,
              ROUND(AVG((n->>'note')::numeric), 2) AS moyenne
       FROM evaluations e
       LEFT JOIN regles_evaluation r ON r.id_regle = e.id_regle
       CROSS JOIN LATERAL jsonb_array_elements(e.notations_json) AS n
       WHERE e.evalue_matricule = ANY($1)
         AND e.statut = 'valide'
         AND e.notations_json IS NOT NULL
         AND n->>'note' IS NOT NULL
         AND n->>'critere_id' IS NOT NULL
         AND ${visibilitySql}
       GROUP BY e.evalue_matricule, n->>'critere_id'
       ORDER BY e.evalue_matricule, n->>'critere_id'`,
      [uniques],
    );

    const criteres = [...new Set(rows.map((row) => row.critere_id))].sort((a, b) =>
      a.localeCompare(b),
    );
    const parMatricule = new Map<string, Record<string, number>>();
    for (const row of rows) {
      const notes = parMatricule.get(row.matricule) ?? {};
      if (row.moyenne != null) notes[row.critere_id] = Number(row.moyenne);
      parMatricule.set(row.matricule, notes);
    }

    // Chaque membre expose la totalité des critères de l'équipe: une case vide
    // (null) signale « non évalué » et se distingue d'une note faible.
    const membres = [...parMatricule.keys()].sort((a, b) => a.localeCompare(b)).map((matricule) => {
      const notes = parMatricule.get(matricule) ?? {};
      return {
        matricule,
        notes: Object.fromEntries(
          criteres.map((critere) => [critere, notes[critere] ?? null]),
        ) as Record<string, number | null>,
      };
    });

    return { membres, criteres, generated_at: new Date().toISOString() };
  }

  // ─── Benchmarks comparatifs ──────────────────────────────────────────────

  /**
   * Compare, critère par critère, la moyenne du sujet à celle de sa région et
   * à celle des meilleurs profils de cette région.
   *
   * Les critères ne sont pas une liste figée: chaque métier (commercial,
   * marketing, sponsoring, trade) a son propre jeu de cinq critères. Ils sont
   * donc lus depuis les notes réellement saisies.
   *
   * L'agrégation est faite entièrement en SQL: exploser le JSONB côté
   * application aurait imposé de charger toutes les évaluations de la région
   * en mémoire.
   */
  async getBenchmarks(
    matricule: string,
    audience: AnalyticsVisibilityAudience = 'evaluated',
  ) {
    return this.cache.getOrCompute(`analytics:benchmarks:${audience}:${matricule}`, 300, () =>
      this._getBenchmarks(matricule, audience),
    );
  }

  private async _getBenchmarks(
    matricule: string,
    audience: AnalyticsVisibilityAudience,
  ) {
    const visibilitySql =
      audience === 'admin' ? ruleVisibilitySql('admin') : EVALUATED_VISIBILITY_SQL;

    const rows = await this.pg.query<{
      critere_id: string;
      sujet: string | null;
      region: string | null;
      top_performers: string | null;
    }>(
      `WITH cible AS (
         SELECT id_region FROM ${USER_REF_TABLE} WHERE matricule = $1
       ),
       notes AS (
         SELECT e.evalue_matricule,
                n->>'critere_id' AS critere_id,
                (n->>'note')::numeric AS note,
                e.note_globale
         FROM evaluations e
         LEFT JOIN regles_evaluation r ON r.id_regle = e.id_regle
         JOIN ${USER_REF_TABLE} u ON u.matricule = e.evalue_matricule
         CROSS JOIN LATERAL jsonb_array_elements(e.notations_json) AS n
         WHERE e.statut = 'valide'
           AND e.notations_json IS NOT NULL
           AND n->>'note' IS NOT NULL
           AND n->>'critere_id' IS NOT NULL
           AND ${visibilitySql}
           AND (u.id_region = (SELECT id_region FROM cible)
                OR e.evalue_matricule = $1)
       ),
       -- « Top performers »: bande experte de l'échelle 1-5, cohérente avec la
       -- légende de la heatmap (4-5 = expert).
       -- La moyenne est calculée sur les évaluations, pas sur les notes
       -- éclatées par critère: sinon une évaluation à 8 critères pèserait plus
       -- qu'une évaluation à 5 critères dans la moyenne du même agent.
       tops AS (
         SELECT e.evalue_matricule
         FROM evaluations e
         LEFT JOIN regles_evaluation r ON r.id_regle = e.id_regle
         JOIN ${USER_REF_TABLE} u ON u.matricule = e.evalue_matricule
         WHERE e.statut = 'valide'
           AND e.note_globale IS NOT NULL
           AND ${visibilitySql}
           AND (u.id_region = (SELECT id_region FROM cible)
                OR e.evalue_matricule = $1)
         GROUP BY e.evalue_matricule
         HAVING AVG(e.note_globale) >= 4
       )
       SELECT critere_id,
              ROUND(AVG(note) FILTER (WHERE evalue_matricule = $1), 2) AS sujet,
              ROUND(AVG(note), 2) AS region,
              ROUND(AVG(note) FILTER (
                WHERE evalue_matricule IN (SELECT evalue_matricule FROM tops)
              ), 2) AS top_performers
       FROM notes
       GROUP BY critere_id
       ORDER BY critere_id`,
      [matricule],
    );

    const toNumber = (value: string | null) => (value == null ? null : Number(value));

    return {
      matricule,
      criteres: rows.map((row) => ({
        critere_id: row.critere_id,
        sujet: toNumber(row.sujet),
        region: toNumber(row.region),
        top_performers: toNumber(row.top_performers),
      })),
      generated_at: new Date().toISOString(),
    };
  }

  // ─── Scores détaillés utilisateur ────────────────────────────────────────
  async getScoresUtilisateur(
    matricule: string,
    audience: AnalyticsVisibilityAudience = 'evaluated',
  ) {
    return this.cache.getOrCompute(`analytics:scores:${audience}:${matricule}`, 120, () =>
      this._getScoresUtilisateur(matricule, audience),
    );
  }

  /**
   * Récupère les scores de plusieurs utilisateurs en un seul appel HTTP.
   * Réutilise le cache par matricule et borne la concurrence pour ménager le pool PostgreSQL.
   * Retourne un dictionnaire { matricule: scores }.
   */
  async getScoresBatch(matricules: string[]): Promise<Record<string, any>> {
    return this.mapByMatricule(matricules, (matricule) => this.getScoresUtilisateur(matricule));
  }

  /**
   * Récupère les axes d'amélioration de plusieurs utilisateurs en un seul appel HTTP.
   * Retourne un dictionnaire { matricule: axes }.
   */
  async getAxesAmeliorationBatch(matricules: string[]): Promise<Record<string, any>> {
    return this.mapByMatricule(matricules, (matricule) => this.getAxesAmelioration(matricule));
  }

  private async mapByMatricule(
    matricules: string[],
    compute: (matricule: string) => Promise<any>,
    concurrency = 10,
  ): Promise<Record<string, any>> {
    const unique = [...new Set((matricules ?? []).filter((m): m is string => typeof m === 'string' && m.length > 0))];
    const result: Record<string, any> = {};

    for (let i = 0; i < unique.length; i += concurrency) {
      const chunk = unique.slice(i, i + concurrency);
      const computed = await Promise.all(chunk.map((matricule) => compute(matricule)));
      chunk.forEach((matricule, index) => {
        result[matricule] = computed[index];
      });
    }

    return result;
  }

  private async _getScoresUtilisateur(
    matricule: string,
    audience: AnalyticsVisibilityAudience,
  ) {
    const visibilitySql =
      audience === 'admin' ? ruleVisibilitySql('admin') : EVALUATED_VISIBILITY_SQL;
    const recent = await this.pg.queryOne<any>(
      `SELECT e.note_globale as score_recent
       FROM evaluations e
       LEFT JOIN regles_evaluation r ON r.id_regle = e.id_regle
       WHERE e.evalue_matricule = $1 AND e.statut = 'valide' AND e.note_globale IS NOT NULL
         AND ${visibilitySql}
         AND ${EVALUATION_EFFECTIVE_TS_E_SQL} >= NOW() - INTERVAL '6 months'
       ORDER BY ${EVALUATION_EFFECTIVE_TS_E_SQL} DESC, e.created_at DESC, e.id_evaluation DESC
       LIMIT 1`,
      [matricule],
    );

    const ancien = await this.pg.queryOne<any>(
      `SELECT e.note_globale as score_ancien
       FROM evaluations e
       LEFT JOIN regles_evaluation r ON r.id_regle = e.id_regle
       WHERE e.evalue_matricule = $1 AND e.statut = 'valide' AND e.note_globale IS NOT NULL
         AND ${visibilitySql}
         AND ${EVALUATION_EFFECTIVE_TS_E_SQL} < NOW() - INTERVAL '6 months'
         AND ${EVALUATION_EFFECTIVE_TS_E_SQL} >= NOW() - INTERVAL '12 months'
       ORDER BY ${EVALUATION_EFFECTIVE_TS_E_SQL} DESC, e.created_at DESC, e.id_evaluation DESC
       LIMIT 1`,
      [matricule],
    );

    const parType = await this.pg.query<any>(
      `WITH ranked AS (
         SELECT e.type_evaluation, e.note_globale,
                COUNT(*) OVER (PARTITION BY e.type_evaluation) AS nb,
                ROW_NUMBER() OVER (
                  PARTITION BY e.type_evaluation
                  ORDER BY ${EVALUATION_EFFECTIVE_TS_E_SQL} DESC, e.created_at DESC, e.id_evaluation DESC
                ) AS recency_rank
         FROM evaluations e
         LEFT JOIN regles_evaluation r ON r.id_regle = e.id_regle
         WHERE e.evalue_matricule = $1 AND e.statut = 'valide' AND e.note_globale IS NOT NULL
           AND ${visibilitySql}
       )
       SELECT type_evaluation, note_globale AS moyenne, nb
       FROM ranked WHERE recency_rank = 1`,
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
  async getClassementRegional(
    idRegion: string,
    audience: AnalyticsVisibilityAudience = 'evaluated',
  ) {
    return this.cache.getOrCompute(`analytics:classement:${audience}:${idRegion}`, 300, () =>
      this._getClassementRegional(idRegion, audience),
    );
  }

  private async _getClassementRegional(
    idRegion: string,
    audience: AnalyticsVisibilityAudience,
  ) {
    const classement = await this.pg.query<any>(
      `SELECT
         e.evalue_matricule,
         AVG(e.note_globale) as score_moyen,
         COUNT(*) as nb_evaluations
       FROM evaluations e
       JOIN ${USER_REF_TABLE} u ON e.evalue_matricule = u.matricule
       LEFT JOIN regles_evaluation r ON r.id_regle = e.id_regle
       WHERE u.id_region = $1 AND e.statut = 'valide' AND e.note_globale IS NOT NULL
         AND ${audience === 'admin' ? ruleVisibilitySql('admin') : EVALUATED_VISIBILITY_SQL}
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

  private genererSuggestion(critere: string, score: number, niveauRequis = 3): string {
    const critLower = critere.toLowerCase();
    const ecart = Math.max(0, niveauRequis - score);
    const action = score < 2
      ? 'Prévoir un accompagnement prioritaire, une mise en situation et un suivi rapproché.'
      : critLower.includes('leadership') || critLower.includes('management')
        ? 'Planifier une mise en situation de leadership avec retour d’expérience du manager.'
        : critLower.includes('communication')
          ? 'Pratiquer des situations de communication liées au poste et demander un retour ciblé.'
          : critLower.includes('équipe') || critLower.includes('collaboration')
            ? 'Confier une activité de collaboration transverse avec un point de suivi.'
            : 'Définir une action de mise en pratique et un point de suivi avec le manager.';

    return `${action} Écart au niveau requis : ${ecart.toFixed(2)} point(s) sur 5.`;
  }

  private genererObjectifSmart(critere: string, score: number, niveauRequis = 3): string {
    const objectifScore = Math.min(5, Math.max(score + 0.5, niveauRequis));
    return `Atteindre le niveau requis de ${objectifScore.toFixed(1)}/5 sur "${critere}" d'ici 3 mois, `
      + `mesuré par les évaluations du prochain cycle, avec un point de suivi mensuel.`;
  }

  private sixMonthsAgo(): string {
    const d = new Date();
    d.setMonth(d.getMonth() - 6);
    return d.toISOString().split('T')[0];
  }

  private async buildImprovementPlanSnapshot(
    user: any,
    audience: AnalyticsVisibilityAudience,
  ): Promise<ImprovementPlanSnapshot> {
    const [axes, recommandations] = await Promise.all([
      this.getAxesAmelioration(String(user.matricule), audience),
      // L'utilisateur est déjà chargé: le passer évite une requête MySQL par
      // utilisateur analysé.
      this.getRecommandations(String(user.matricule), audience, {
        matricule: String(user.matricule),
        nom: user.nom ?? null,
        prenom: user.prenom ?? null,
        role: user.role ?? null,
        role_nom: user.role_nom ?? null,
        id_region: user.id_region ?? null,
        niveau_hierarchique: user.niveau_hierarchique ?? null,
      }),
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

  private async getAdminRegionAggregates(filters: { start_date?: string; end_date?: string } = {}): Promise<AdminRegionAggregate[]> {
    const dateJoinCondition = filters.start_date && filters.end_date
      ? `AND ${EVALUATION_EFFECTIVE_DATE_E_SQL} BETWEEN $1 AND $2`
      : '';
    const dateParams = filters.start_date && filters.end_date
      ? [filters.start_date, filters.end_date]
      : [];
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
       LEFT JOIN (
         SELECT evaluation.*
         FROM evaluations evaluation
         LEFT JOIN regles_evaluation rule ON rule.id_regle = evaluation.id_regle
         WHERE ${ruleVisibilitySql('admin', 'rule')}
       ) e ON e.evalue_matricule = u.matricule ${dateJoinCondition}
       WHERE COALESCE(u.est_actif, true) = true
       GROUP BY COALESCE(NULLIF(TRIM(u.id_region), ''), 'unknown'),
                COALESCE(NULLIF(TRIM(u.region_nom), ''), COALESCE(NULLIF(TRIM(u.id_region), ''), 'Région non renseignée'))
       ORDER BY nom_region ASC`,
      dateParams,
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

  private async getAdminRolePerformance(filters: { start_date?: string; end_date?: string; type_evaluation?: string } = {}) {
    const dateJoinCondition = filters.start_date && filters.end_date
      ? `AND ${EVALUATION_EFFECTIVE_DATE_E_SQL} BETWEEN $1 AND $2`
      : '';
    const dateParams = filters.start_date && filters.end_date
      ? [filters.start_date, filters.end_date]
      : [];
    const typeJoinCondition = filters.type_evaluation
      ? `AND e.type_evaluation = $${dateParams.length + 1}`
      : '';
    const queryParams = filters.type_evaluation
      ? [...dateParams, filters.type_evaluation]
      : dateParams;
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
       LEFT JOIN (
         SELECT evaluation.*
         FROM evaluations evaluation
         LEFT JOIN regles_evaluation rule ON rule.id_regle = evaluation.id_regle
         WHERE ${ruleVisibilitySql('admin', 'rule')}
       ) e ON e.evalue_matricule = u.matricule ${dateJoinCondition} ${typeJoinCondition}
       WHERE COALESCE(u.est_actif, true) = true
       GROUP BY COALESCE(NULLIF(TRIM(u.role), ''), 'Rôle non renseigné')
       ${filters.type_evaluation ? "HAVING COUNT(e.id_evaluation) FILTER (WHERE e.statut = 'valide' AND e.note_globale IS NOT NULL) > 0" : ''}
       ORDER BY avg_score DESC NULLS LAST, count DESC`,
      queryParams,
    );

    return rows.map((row: any) => ({
      role: String(row.role),
      count: Number(row.count ?? 0),
      avgScore: Number(row.avg_score ?? 0),
      completion: Number(row.completion ?? 0),
    }));
  }
}
