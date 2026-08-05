import { Injectable } from '@nestjs/common';
import { DatabasePgService } from '../database/database-pg.service';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from '../common/cache.service';
import { HierarchyService } from '../hierarchy/hierarchy.service';
import {
  INTERNAL_RULE_ENVELOPE_FIELD,
  redactEvaluationForVisibility,
  resolveEvaluationVisibilityPolicy,
  ruleVisibilitySql,
} from '../evaluations/evaluation-visibility';

export interface SubordonneStat {
  matricule: string;
  nom: string;
  prenom: string;
  role_nom: string;
  nb_recues: number;
  nb_donnees: number;
  nb_en_attente: number;
  statut_couleur: 'grey' | 'green' | 'orange' | 'red';
}

export interface HistoriqueMois {
  mois: string;
  completes: number;
  en_attente: number;
}

export interface ProgressionKpi {
  total: number;
  completes: number;
  en_attente: number;
  restantes: number;
  taux_completion: number;
}

export interface ProgressionEquipeResult {
  kpi: ProgressionKpi;
  subordonnes: SubordonneStat[];
  historique: HistoriqueMois[];
}

export interface ValidationAttente {
  id_evaluation: string;
  evaluateur_matricule: string | null;
  evaluateur_nom: string;
  evalue_matricule: string;
  evalue_nom: string;
  date_soumission: string;
  jours_attente: number;
  nom_periode: string;
  id_periode: string;
  priorite: 'urgente' | 'normale';
}

export interface ValidationsAttenteFilters {
  page?: number;
  limit?: number;
  evaluateur_matricule?: string;
  priorite?: string;
  id_periode?: string;
}

export interface ValidationsAttenteResult {
  data: ValidationAttente[];
  meta: {
    total: number;
    page: number;
  };
}

interface EvalStatRow {
  evalue_matricule: string;
  statut: string;
  count: string;
}

interface HistoriqueRow {
  mois: string;
  completes: string;
  en_attente: string;
}

interface ValidationRow {
  id_evaluation: string;
  evaluateur_matricule: string | null;
  evalue_matricule: string;
  type_evaluation: string;
  date_soumission: string;
  jours_attente: number;
  nom_periode: string;
  id_periode: string;
  __rule_envelope?: unknown;
}

interface UtilisateurRow {
  matricule: string;
  nom: string;
  prenom: string;
  role_nom: string | null;
}

@Injectable()
export class DashboardManagerService {
  constructor(
    private pg: DatabasePgService,
    private prisma: PrismaService,
    private cache: CacheService,
    private hierarchyService: HierarchyService,
  ) {}

  async getProgressionEquipe(
    managerMatricule: string,
    idPeriode?: string,
  ): Promise<ProgressionEquipeResult> {
    const cacheKey = `dashboard:manager:${managerMatricule}:${idPeriode ?? 'all'}`;
    return this.cache.getOrCompute(cacheKey, 30, () =>
      this._getProgressionEquipe(managerMatricule, idPeriode),
    );
  }

  private async _getProgressionEquipe(
    managerMatricule: string,
    idPeriode?: string,
  ): Promise<ProgressionEquipeResult> {
    const zeroResult: ProgressionEquipeResult = {
      kpi: { total: 0, completes: 0, en_attente: 0, restantes: 0, taux_completion: 0 },
      subordonnes: [],
      historique: [],
    };

    // Step 1: Get direct subordinates
    const subordonnesRaw = await this.hierarchyService.getSubordonnesDirects(managerMatricule);
    if (!subordonnesRaw || subordonnesRaw.length === 0) {
      return zeroResult;
    }

    const matricules: string[] = subordonnesRaw.map((s: { matricule: string }) => s.matricule);

    // Step 3: Build placeholders for IN clause
    const inPlaceholders = matricules.map((_, i) => `$${i + 1}`).join(',');

    // Build optional period filter
    let periodFilter = '';
    const periodParams: string[] = [];
    if (idPeriode) {
      periodParams.push(idPeriode);
      periodFilter = ` AND id_periode = $${matricules.length + 1}`;
    }

    const allParams = [...matricules, ...periodParams];

    // Step 3: Query eval stats grouped by evalue_matricule and statut
    const evalRows = await this.pg.query<EvalStatRow>(
      `SELECT evalue_matricule, statut, COUNT(*) as count
       FROM evaluations
       WHERE evalue_matricule IN (${inPlaceholders})${periodFilter}
       GROUP BY evalue_matricule, statut`,
      allParams,
    );

    // Step 4: Calculate KPI
    let totalCount = 0;
    let completesCount = 0;
    let enAttenteCount = 0;

    for (const row of evalRows) {
      const cnt = parseInt(row.count, 10);
      totalCount += cnt;
      if (row.statut === 'valide') completesCount += cnt;
      if (row.statut === 'brouillon' || row.statut === 'soumis') enAttenteCount += cnt;
    }

    const kpi: ProgressionKpi = {
      total: totalCount,
      completes: completesCount,
      en_attente: enAttenteCount,
      restantes: totalCount - completesCount,
      taux_completion: totalCount > 0 ? Math.round((completesCount / totalCount) * 100) : 0,
    };

    // Step 5: Enrich subordonnes from Prisma
    const utilisateurs = await this.prisma.utilisateur.findMany({
      where: { matricule: { in: matricules } },
      select: { matricule: true, nom: true, prenom: true, role_nom: true },
    });

    // Build map of evalue_matricule → statut counts
    const evalByMatricule: Record<string, Record<string, number>> = {};
    for (const row of evalRows) {
      if (!evalByMatricule[row.evalue_matricule]) {
        evalByMatricule[row.evalue_matricule] = {};
      }
      evalByMatricule[row.evalue_matricule][row.statut] = parseInt(row.count, 10);
    }

    // Also need nb_donnees (as evaluateur)
    const evalDonneesRows = await this.pg.query<{ evaluateur_matricule: string; count: string }>(
      `SELECT evaluateur_matricule, COUNT(*) as count
       FROM evaluations
       WHERE evaluateur_matricule IN (${inPlaceholders})
         AND type_evaluation <> 'pairs'${periodFilter}
       GROUP BY evaluateur_matricule`,
      allParams,
    );
    const evalDonneesMap: Record<string, number> = {};
    for (const row of evalDonneesRows) {
      evalDonneesMap[row.evaluateur_matricule] = parseInt(row.count, 10);
    }

    const subordonnes: SubordonneStat[] = utilisateurs.map((u: UtilisateurRow) => {
      const statuts = evalByMatricule[u.matricule] ?? {};
      const nb_recues = Object.values(statuts).reduce((sum, c) => sum + c, 0);
      const nb_donnees = evalDonneesMap[u.matricule] ?? 0;
      const nb_en_attente = (statuts['brouillon'] ?? 0) + (statuts['soumis'] ?? 0);
      const nb_valide = statuts['valide'] ?? 0;
      const nb_soumis = statuts['soumis'] ?? 0;
      const nb_brouillon = statuts['brouillon'] ?? 0;

      let statut_couleur: 'grey' | 'green' | 'orange' | 'red';
      if (nb_recues === 0) {
        statut_couleur = 'grey';
      } else if (nb_valide === nb_recues) {
        statut_couleur = 'green';
      } else if (nb_soumis >= 1) {
        statut_couleur = 'orange';
      } else if (nb_brouillon >= 1) {
        statut_couleur = 'red';
      } else {
        statut_couleur = 'grey';
      }

      return {
        matricule: u.matricule,
        nom: u.nom,
        prenom: u.prenom,
        role_nom: u.role_nom ?? '',
        nb_recues,
        nb_donnees,
        nb_en_attente,
        statut_couleur,
      };
    });

    // Step 6: Historique last 6 months
    const historique = await this.pg.query<HistoriqueRow>(
      `SELECT DATE_TRUNC('month', created_at) as mois,
              COUNT(*) FILTER (WHERE statut = 'valide') as completes,
              COUNT(*) FILTER (WHERE statut IN ('brouillon', 'soumis')) as en_attente
       FROM evaluations
       WHERE evalue_matricule IN (${inPlaceholders})
         AND created_at > NOW() - INTERVAL '6 months'
       GROUP BY mois
       ORDER BY mois`,
      matricules,
    );

    return {
      kpi,
      subordonnes,
      historique: historique.map((row) => ({
        mois: row.mois,
        completes: parseInt(row.completes, 10),
        en_attente: parseInt(row.en_attente, 10),
      })),
    };
  }

  async getValidationsAttente(
    managerMatricule: string,
    filters: ValidationsAttenteFilters,
  ): Promise<ValidationsAttenteResult> {
    return this._getValidationsAttente(managerMatricule, filters);
  }

  private async _getValidationsAttente(
    managerMatricule: string,
    filters: ValidationsAttenteFilters,
  ): Promise<ValidationsAttenteResult> {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const offset = (page - 1) * limit;

    // Step 1: Get direct subordinates
    const subordonnesRaw = await this.hierarchyService.getSubordonnesDirects(managerMatricule);
    if (!subordonnesRaw || subordonnesRaw.length === 0) {
      return { data: [], meta: { total: 0, page } };
    }

    const matricules: string[] = subordonnesRaw.map((s: { matricule: string }) => s.matricule);
    const inPlaceholders = matricules.map((_, i) => `$${i + 1}`).join(',');

    // Build dynamic WHERE clauses after the IN clause
    const params: (string | number)[] = [...matricules];
    const extraConditions: string[] = [];

    if (filters.evaluateur_matricule) {
      params.push(filters.evaluateur_matricule);
      // Never let this filter become an identity oracle for peer evaluations.
      extraConditions.push(
        `(e.type_evaluation <> 'pairs' AND e.evaluateur_matricule = $${params.length})`,
      );
    }

    if (filters.id_periode) {
      params.push(filters.id_periode);
      extraConditions.push(`e.id_periode = $${params.length}`);
    }

    const extraWhere = extraConditions.length > 0 ? ' AND ' + extraConditions.join(' AND ') : '';

    // Step 5: Get total count
    const countResult = await this.pg.queryOne<{ count: string }>(
      `SELECT COUNT(*) as count
       FROM evaluations e
       JOIN periodes_evaluation p ON p.id_periode = e.id_periode
       LEFT JOIN regles_evaluation r ON r.id_regle = e.id_regle
       WHERE e.statut = 'soumis'
         AND e.evalue_matricule IN (${inPlaceholders})
         AND ${ruleVisibilitySql('manager_n1')}${extraWhere}`,
      params,
    );
    const totalBeforeFilter = parseInt(countResult?.count ?? '0', 10);

    // Step 2: Fetch paginated rows
    const paginatedParams = [...params, limit, offset];
    const rows = await this.pg.query<ValidationRow>(
      `SELECT e.id_evaluation, e.evaluateur_matricule, e.evalue_matricule,
              e.type_evaluation,
              e.date_soumission,
              EXTRACT(EPOCH FROM (NOW() - e.date_soumission))/86400 AS jours_attente,
              p.nom_periode, e.id_periode,
              r.criteres_evaluation_json AS ${INTERNAL_RULE_ENVELOPE_FIELD}
       FROM evaluations e
       JOIN periodes_evaluation p ON p.id_periode = e.id_periode
       LEFT JOIN regles_evaluation r ON r.id_regle = e.id_regle
       WHERE e.statut = 'soumis'
         AND e.evalue_matricule IN (${inPlaceholders})
         AND ${ruleVisibilitySql('manager_n1')}${extraWhere}
       ORDER BY e.date_soumission ASC
       LIMIT $${paginatedParams.length - 1} OFFSET $${paginatedParams.length}`,
      paginatedParams,
    );

    // Step 3: Enrich with user names
    const redactedRows = rows.flatMap((row) => {
      const policy = resolveEvaluationVisibilityPolicy(row);
      return policy.manager_n1
        ? [redactEvaluationForVisibility(row, { policy, preserveDetails: true })]
        : [];
    });
    const allMatricules = Array.from(
      new Set([
        ...redactedRows.map((row) => row.evaluateur_matricule),
        ...redactedRows.map((row) => row.evalue_matricule),
      ]),
    ).filter((candidate): candidate is string => Boolean(candidate));

    const utilisateurs = allMatricules.length > 0
      ? await this.prisma.utilisateur.findMany({
          where: { matricule: { in: allMatricules } },
          select: { matricule: true, nom: true, prenom: true, role_nom: true },
        })
      : [];

    const userMap: Record<string, UtilisateurRow> = {};
    for (const u of utilisateurs) {
      userMap[u.matricule] = u;
    }

    const formatNom = (matricule: string | null): string => {
      if (!matricule) return 'Anonyme';
      const u = userMap[matricule];
      return u ? `${u.prenom} ${u.nom}` : matricule;
    };

    // Step 4: Map with priorite
    let data: ValidationAttente[] = redactedRows.map((row) => {
      const joursAttente = typeof row.jours_attente === 'number'
        ? row.jours_attente
        : parseFloat(String(row.jours_attente));
      const priorite: 'urgente' | 'normale' = joursAttente >= 3 ? 'urgente' : 'normale';

      return {
        id_evaluation: row.id_evaluation,
        evaluateur_matricule: row.evaluateur_matricule,
        evaluateur_nom: formatNom(row.evaluateur_matricule),
        evalue_matricule: row.evalue_matricule,
        evalue_nom: formatNom(row.evalue_matricule),
        date_soumission: row.date_soumission,
        jours_attente: Math.floor(joursAttente),
        nom_periode: row.nom_periode,
        id_periode: row.id_periode,
        priorite,
      };
    });

    // Filter by priorite if requested (post-pagination)
    let total = totalBeforeFilter;
    if (filters.priorite) {
      data = data.filter((d) => d.priorite === filters.priorite);
      total = data.length;
    }

    return {
      data,
      meta: { total, page },
    };
  }
}
