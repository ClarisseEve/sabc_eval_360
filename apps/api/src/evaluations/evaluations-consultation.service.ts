import { Injectable, BadRequestException } from '@nestjs/common';
import { DatabasePgService } from '../database/database-pg.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  EVALUATED_VISIBILITY_SQL,
  INTERNAL_RULE_ENVELOPE_FIELD,
  isVisibleToEvaluated,
  redactEvaluationForVisibility,
  resolveEvaluationVisibilityPolicy,
} from './evaluation-visibility';

const ALLOWED_RECUES_STATUTS = new Set(['soumis', 'valide']);
const FORBIDDEN_RECUES_STATUTS = new Set(['brouillon', 'rejete']);

const ACTION_MAP: Record<string, string> = {
  brouillon: 'reprendre',
  soumis: 'consulter',
  valide: 'consulter',
  rejete: 'corriger',
};

interface RecuesFilters {
  id_periode?: string;
  type_evaluation?: string;
  statut?: string;
  page?: number;
  limit?: number;
}

interface DonneesFilters {
  id_periode?: string;
  type_evaluation?: string;
  statut?: string;
  page?: number;
  limit?: number;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class EvaluationsConsultationService {
  constructor(
    private pg: DatabasePgService,
    private prisma: PrismaService,
  ) {}

  // ---------------------------------------------------------------------------
  // getRecues — evaluations received by this user (as évalué)
  // ---------------------------------------------------------------------------

  async getRecues(
    matricule: string,
    filters: RecuesFilters = {},
  ): Promise<{ data: any[]; meta: PaginationMeta }> {
    // Validate requested statut: brouillon & rejete are never visible as évalué
    if (filters.statut && FORBIDDEN_RECUES_STATUTS.has(filters.statut)) {
      throw new BadRequestException('Statut non autorisé pour les évaluations reçues');
    }

    const page = Math.max(1, filters.page ?? 1);
    const limit = Math.min(100, Math.max(1, filters.limit ?? 20));
    const offset = (page - 1) * limit;

    // Build dynamic WHERE clauses
    const params: any[] = [matricule];
    let paramIdx = 2;

    // Base: only soumis/valide for évalué view
    let whereClause = `WHERE e.evalue_matricule = $1
      AND e.statut IN ('soumis', 'valide')
      AND ${EVALUATED_VISIBILITY_SQL}`;

    if (filters.statut && ALLOWED_RECUES_STATUTS.has(filters.statut)) {
      whereClause += ` AND e.statut = $${paramIdx++}`;
      params.push(filters.statut);
    }

    if (filters.id_periode) {
      whereClause += ` AND e.id_periode = $${paramIdx++}`;
      params.push(filters.id_periode);
    }

    if (filters.type_evaluation) {
      whereClause += ` AND e.type_evaluation = $${paramIdx++}`;
      params.push(filters.type_evaluation);
    }

    const countParams = [...params];
    const [countRow, rows] = await Promise.all([
      this.pg.queryOne<{ total: string }>(
        `SELECT COUNT(*)::text AS total
         FROM evaluations e
         LEFT JOIN regles_evaluation r ON r.id_regle = e.id_regle
         ${whereClause}`,
        countParams,
      ),
      this.pg.query<any>(
        `SELECT e.*, r.criteres_evaluation_json AS ${INTERNAL_RULE_ENVELOPE_FIELD}
         FROM evaluations e
         LEFT JOIN regles_evaluation r ON r.id_regle = e.id_regle
         ${whereClause}
         ORDER BY e.date_creation DESC
         LIMIT $${paramIdx++} OFFSET $${paramIdx++}`,
        [...params, limit, offset],
      ),
    ]);

    const total = parseInt(countRow?.total ?? '0', 10);

    // Enrich with MySQL user data
    const data = await this.enrichRecues(rows);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // ---------------------------------------------------------------------------
  // getDonnees — evaluations given by this user (as évaluateur)
  // ---------------------------------------------------------------------------

  async getDonnees(
    matricule: string,
    filters: DonneesFilters = {},
  ): Promise<{ data: any[]; meta: PaginationMeta }> {
    const page = Math.max(1, filters.page ?? 1);
    const limit = Math.min(100, Math.max(1, filters.limit ?? 20));
    const offset = (page - 1) * limit;

    const params: any[] = [matricule];
    let paramIdx = 2;

    let whereClause = `WHERE e.evaluateur_matricule = $1`;

    if (filters.statut) {
      whereClause += ` AND e.statut = $${paramIdx++}`;
      params.push(filters.statut);
    }

    if (filters.id_periode) {
      whereClause += ` AND e.id_periode = $${paramIdx++}`;
      params.push(filters.id_periode);
    }

    if (filters.type_evaluation) {
      whereClause += ` AND e.type_evaluation = $${paramIdx++}`;
      params.push(filters.type_evaluation);
    }

    const countParams = [...params];
    const [countRow, rows] = await Promise.all([
      this.pg.queryOne<{ total: string }>(
        `SELECT COUNT(*)::text AS total FROM evaluations e ${whereClause}`,
        countParams,
      ),
      this.pg.query<any>(
        `SELECT e.* FROM evaluations e ${whereClause}
         ORDER BY e.date_creation DESC
         LIMIT $${paramIdx++} OFFSET $${paramIdx++}`,
        [...params, limit, offset],
      ),
    ]);

    const total = parseInt(countRow?.total ?? '0', 10);

    // Enrich + decorate with action and conditional commentaire_validation
    const enriched = await this.enrichDonnees(rows);
    const data = enriched.map((ev) => ({
      ...ev,
      action: ACTION_MAP[ev.statut] ?? 'consulter',
      // Only expose rejection motive when statut is 'rejete'
      commentaire_validation: ev.statut === 'rejete' ? ev.commentaire_validation ?? null : null,
    }));

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // ---------------------------------------------------------------------------
  // getStatsRecues — aggregate stats for évalué view
  // ---------------------------------------------------------------------------

  async getStatsRecues(
    matricule: string,
  ): Promise<{ total: number; valide: number; note_moyenne: number | null }> {
    const row = await this.pg.queryOne<{
      total: string;
      valide: string;
      note_moyenne: string | null;
    }>(
      `SELECT
         COUNT(*)::text                                              AS total,
         COUNT(*) FILTER (WHERE e.statut = 'valide')::text         AS valide,
         ROUND(AVG(e.note_globale) FILTER (WHERE e.statut = 'valide' AND e.note_globale IS NOT NULL)::numeric, 2)::text
                                                                    AS note_moyenne
       FROM evaluations e
       LEFT JOIN regles_evaluation r ON r.id_regle = e.id_regle
       WHERE e.evalue_matricule = $1
         AND e.statut IN ('soumis', 'valide')
         AND ${EVALUATED_VISIBILITY_SQL}`,
      [matricule],
    );

    return {
      total: parseInt(row?.total ?? '0', 10),
      valide: parseInt(row?.valide ?? '0', 10),
      note_moyenne: row?.note_moyenne != null ? parseFloat(row.note_moyenne) : null,
    };
  }

  // ---------------------------------------------------------------------------
  // getStatsDonnees — per-status breakdown for évaluateur view
  // ---------------------------------------------------------------------------

  async getStatsDonnees(
    matricule: string,
  ): Promise<{ total: number; brouillon: number; soumis: number; valide: number; rejete: number }> {
    const rows = await this.pg.query<{ statut: string; count: string }>(
      `SELECT statut, COUNT(*)::text AS count
       FROM evaluations
       WHERE evaluateur_matricule = $1
       GROUP BY statut`,
      [matricule],
    );

    const counts: Record<string, number> = {
      brouillon: 0,
      soumis: 0,
      valide: 0,
      rejete: 0,
    };

    for (const row of rows) {
      if (row.statut in counts) {
        counts[row.statut] = parseInt(row.count, 10);
      }
    }

    const total = Object.values(counts).reduce((sum, n) => sum + n, 0);

    return {
      total,
      brouillon: counts.brouillon,
      soumis: counts.soumis,
      valide: counts.valide,
      rejete: counts.rejete,
    };
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /**
   * Enrich évalué-side evaluations.
   * - Pairs type: anonymize evaluateur
   * - Otherwise: attach evaluateur nom/prenom/role_nom
   * - Always attach evalue data
   */
  private async enrichRecues(evaluations: any[]): Promise<any[]> {
    if (!evaluations.length) return [];

    const redacted = evaluations.flatMap((evaluation) => {
      const policy = resolveEvaluationVisibilityPolicy(evaluation);
      return isVisibleToEvaluated(evaluation, policy)
        ? [redactEvaluationForVisibility(evaluation, { policy })]
        : [];
    });
    const matricules = this.collectMatricules(redacted, ['evaluateur_matricule', 'evalue_matricule']);
    const users = await this.fetchUsers(matricules);

    return redacted.map((ev) => {
      const evalue = users.get(ev.evalue_matricule) ?? null;
      const isPairs = ev.type_evaluation === 'pairs';

      const evaluateur = isPairs
        ? {
            evaluateur_nom: 'Anonyme',
            evaluateur_prenom: null,
            evaluateur_matricule: null,
            evaluateur_role_nom: null,
          }
        : this.buildEvaluateurFields(users.get(ev.evaluateur_matricule) ?? null);

      return {
        ...ev,
        ...evaluateur,
        evalue_nom: evalue?.nom ?? null,
        evalue_prenom: evalue?.prenom ?? null,
        evalue_role_nom: evalue?.role_nom ?? null,
      };
    });
  }

  /**
   * Enrich évaluateur-side evaluations.
   * Non-pairs: full evaluateur info; pairs: keep real identity (évaluateur sees their own submissions).
   */
  private async enrichDonnees(evaluations: any[]): Promise<any[]> {
    if (!evaluations.length) return [];

    const redacted = evaluations.map((evaluation) =>
      redactEvaluationForVisibility(evaluation, {
        policy: resolveEvaluationVisibilityPolicy(evaluation),
        preserveDetails: true,
      }),
    );
    const matricules = this.collectMatricules(redacted, ['evaluateur_matricule', 'evalue_matricule']);
    const users = await this.fetchUsers(matricules);

    return redacted.map((ev) => {
      const evaluateur = users.get(ev.evaluateur_matricule) ?? null;
      const evalue = users.get(ev.evalue_matricule) ?? null;
      const evaluateurFields =
        ev.type_evaluation === 'pairs'
          ? {
              evaluateur_nom: 'Anonyme',
              evaluateur_prenom: null,
              evaluateur_matricule: null,
              evaluateur_role_nom: null,
            }
          : this.buildEvaluateurFields(evaluateur);

      return {
        ...ev,
        ...evaluateurFields,
        evalue_nom: evalue?.nom ?? null,
        evalue_prenom: evalue?.prenom ?? null,
        evalue_role_nom: evalue?.role_nom ?? null,
      };
    });
  }

  private collectMatricules(evaluations: any[], fields: string[]): string[] {
    const set = new Set<string>();
    for (const ev of evaluations) {
      for (const field of fields) {
        if (ev[field]) set.add(ev[field]);
      }
    }
    return Array.from(set);
  }

  private async fetchUsers(matricules: string[]): Promise<Map<string, any>> {
    if (!matricules.length) return new Map();

    const users = await this.prisma.utilisateur.findMany({
      where: { matricule: { in: matricules } },
      select: {
        matricule: true,
        nom: true,
        prenom: true,
        role: true,
        role_nom: true,
      },
    });

    return new Map(users.map((u: { matricule: string; nom: string; prenom: string; role: string | null; role_nom: string | null }) => [u.matricule, u]));
  }

  private buildEvaluateurFields(user: any | null): {
    evaluateur_nom: string | null;
    evaluateur_prenom: string | null;
    evaluateur_matricule: string | null;
    evaluateur_role_nom: string | null;
  } {
    return {
      evaluateur_nom: user?.nom ?? null,
      evaluateur_prenom: user?.prenom ?? null,
      evaluateur_matricule: user?.matricule ?? null,
      evaluateur_role_nom: user?.role_nom ?? null,
    };
  }
}
