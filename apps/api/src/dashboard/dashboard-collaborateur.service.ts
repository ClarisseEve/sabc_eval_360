import { Injectable } from '@nestjs/common';
import { DatabasePgService } from '../database/database-pg.service';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from '../common/cache.service';

interface EvalRow {
  id_evaluation: string;
  evaluateur_matricule: string;
  evalue_matricule: string;
  statut: string;
  id_periode: string;
  note_globale: number | null;
  date_soumission: string | null;
  created_at: string;
  nom_periode: string;
}

interface UtilisateurRow {
  matricule: string;
  nom: string;
  prenom: string;
}

export interface EvalEnriched {
  id_evaluation: string;
  evaluateur_matricule: string;
  evaluateur_nom: string;
  evalue_matricule: string;
  evalue_nom: string;
  statut: string;
  id_periode: string;
  nom_periode: string;
  note_globale: number | null;
  date_soumission: string | null;
  created_at: string;
}

export interface CollaborateurKpi {
  score_global: number;
  progression_vs_periode_precedente: number | null;
  nb_a_completer: number;
}

export interface StatutPersonnelResult {
  a_completer: EvalEnriched[];
  recues: EvalEnriched[];
  kpi: CollaborateurKpi;
}

@Injectable()
export class DashboardCollaborateurService {
  constructor(
    private pg: DatabasePgService,
    private prisma: PrismaService,
    private cache: CacheService,
  ) {}

  async getStatutPersonnel(matricule: string): Promise<StatutPersonnelResult> {
    return this.cache.getOrCompute(
      `dashboard:collaborateur:${matricule}`,
      60,
      () => this._getStatutPersonnel(matricule),
    );
  }

  private async _getStatutPersonnel(matricule: string): Promise<StatutPersonnelResult> {
    // 1. a_completer: évals où le collaborateur EST l'évaluateur (brouillon ou soumis)
    const aCompleterRows = await this.pg.query<EvalRow>(
      `SELECT e.id_evaluation, e.evaluateur_matricule, e.evalue_matricule,
              e.statut, e.id_periode, e.note_globale,
              e.date_soumission, e.created_at, p.nom_periode
       FROM evaluations e
       JOIN periodes_evaluation p ON p.id_periode = e.id_periode
       WHERE e.evaluateur_matricule = $1 AND e.statut IN ('brouillon', 'soumis')
       ORDER BY e.created_at DESC`,
      [matricule],
    );

    // 2. recues: évals où le collaborateur EST l'évalué (soumis ou valide — pas brouillon AC3)
    const recuesRows = await this.pg.query<EvalRow>(
      `SELECT e.id_evaluation, e.evaluateur_matricule, e.evalue_matricule,
              e.statut, e.id_periode, e.note_globale,
              e.date_soumission, e.created_at, p.nom_periode
       FROM evaluations e
       JOIN periodes_evaluation p ON p.id_periode = e.id_periode
       WHERE e.evalue_matricule = $1 AND e.statut IN ('soumis', 'valide')
       ORDER BY e.created_at DESC`,
      [matricule],
    );

    // 3. score_global: moyenne des évals validées où ce collaborateur est l'évalué
    const scoreRow = await this.pg.queryOne<{ score: string }>(
      `SELECT COALESCE(AVG(note_globale), 0)::text as score
       FROM evaluations
       WHERE evalue_matricule = $1 AND statut = 'valide' AND note_globale IS NOT NULL`,
      [matricule],
    );
    const scoreGlobal = Math.round(parseFloat(scoreRow?.score ?? '0') * 100) / 100;

    // 4. progression vs période précédente
    const progression = await this._getProgression(matricule);

    // 5. Enrichissement: récupérer noms/prénoms en une seule requête Prisma
    const allMatricules = Array.from(
      new Set([
        ...aCompleterRows.map((r) => r.evaluateur_matricule),
        ...aCompleterRows.map((r) => r.evalue_matricule),
        ...recuesRows.map((r) => r.evaluateur_matricule),
        ...recuesRows.map((r) => r.evalue_matricule),
      ]),
    );

    const utilisateurs: UtilisateurRow[] = allMatricules.length > 0
      ? await this.prisma.utilisateur.findMany({
          where: { matricule: { in: allMatricules } },
          select: { matricule: true, nom: true, prenom: true },
        })
      : [];

    const userMap: Record<string, UtilisateurRow> = {};
    for (const u of utilisateurs) {
      userMap[u.matricule] = u;
    }

    const formatNom = (mat: string): string => {
      const u = userMap[mat];
      return u ? `${u.prenom} ${u.nom}` : mat;
    };

    const enrich = (row: EvalRow): EvalEnriched => ({
      id_evaluation: row.id_evaluation,
      evaluateur_matricule: row.evaluateur_matricule,
      evaluateur_nom: formatNom(row.evaluateur_matricule),
      evalue_matricule: row.evalue_matricule,
      evalue_nom: formatNom(row.evalue_matricule),
      statut: row.statut,
      id_periode: row.id_periode,
      nom_periode: row.nom_periode,
      note_globale: row.note_globale,
      date_soumission: row.date_soumission,
      created_at: row.created_at,
    });

    const aCompleter = aCompleterRows.map(enrich);
    const recues = recuesRows.map(enrich);

    return {
      a_completer: aCompleter,
      recues,
      kpi: {
        score_global: scoreGlobal,
        progression_vs_periode_precedente: progression,
        nb_a_completer: aCompleter.length,
      },
    };
  }

  private async _getProgression(matricule: string): Promise<number | null> {
    // a. Période active
    const periodeActive = await this.pg.queryOne<{ id_periode: string }>(
      `SELECT id_periode FROM periodes_evaluation WHERE est_ouverte = true LIMIT 1`,
    );

    if (!periodeActive) {
      return null;
    }

    // c. Score période active
    const scoreActifRow = await this.pg.queryOne<{ avg: string | null }>(
      `SELECT AVG(note_globale)::text as avg
       FROM evaluations
       WHERE evalue_matricule = $1 AND statut = 'valide' AND id_periode = $2`,
      [matricule, periodeActive.id_periode],
    );
    const scoreActif = scoreActifRow?.avg != null ? parseFloat(scoreActifRow.avg) : null;

    // d. Période précédente (dernière fermée / date_fin < NOW())
    const periodePrecedente = await this.pg.queryOne<{ id_periode: string }>(
      `SELECT id_periode FROM periodes_evaluation
       WHERE statut != 'ouverte' AND date_fin < NOW()
       ORDER BY date_fin DESC LIMIT 1`,
    );

    if (!periodePrecedente) {
      return null;
    }

    // e. Score période précédente
    const scorePrecRow = await this.pg.queryOne<{ avg: string | null }>(
      `SELECT AVG(note_globale)::text as avg
       FROM evaluations
       WHERE evalue_matricule = $1 AND statut = 'valide' AND id_periode = $2`,
      [matricule, periodePrecedente.id_periode],
    );
    const scorePrec = scorePrecRow?.avg != null ? parseFloat(scorePrecRow.avg) : null;

    // f. progression = score_actuel - score_precedent (null si l'un est null)
    if (scoreActif == null || scorePrec == null) {
      return null;
    }

    return Math.round((scoreActif - scorePrec) * 100) / 100;
  }
}
