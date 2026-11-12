export type AdminUserEvaluation = Record<string, any>;

const ADMIN_USER_EVALUATION_TYPES = new Set([
  'auto',
  'descendante',
  'ascendante',
  'pairs',
  '360',
]);

export type AdminUserCompetenceSummary = {
  id: string;
  critere: string;
  niveau_requis: number;
  moyenne: number;
  nb_evaluations: number;
  par_type: Record<string, { moyenne: number; nb_evaluations: number }>;
  commentaires: string[];
};

type EvaluationCriterionForSummary = {
  id: string | number;
  libelle: string;
  niveauRequis: number;
  note: unknown;
  commentaire: string;
};

type MutableCompetenceSummary = {
  id: string;
  critere: string;
  niveau_requis: number;
  notes: number[];
  notesParType: Map<string, number[]>;
  commentaires: Set<string>;
};

function parseJson(value: unknown): any {
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function getEvaluationCriteria(evaluation: AdminUserEvaluation): EvaluationCriterionForSummary[] {
  const rawNotes = parseJson(evaluation.notations_json);
  const notes = Array.isArray(rawNotes) ? rawNotes : [];
  const rawRule = evaluation.regle ?? {};
  const rawDefinition = parseJson(
    evaluation.criteres_snapshot_json ?? rawRule.criteres_evaluation_json,
  );
  const criteria: Record<string, any>[] = Array.isArray(rawDefinition?.criteres)
    ? rawDefinition.criteres
    : Array.isArray(rawDefinition) ? rawDefinition : [];

  if (criteria.length === 0) {
    return notes.map((note, index) => ({
      id: note.critere_id ?? note.id_critere ?? note.id ?? index,
      libelle: note.critere_nom ?? note.nom ?? note.critere ?? `Critère ${index + 1}`,
      niveauRequis: 3,
      note: note.note,
      commentaire: note.commentaire ?? '',
    }));
  }

  return criteria.map((criterion, index) => {
    const id = String(criterion.id ?? index);
    const note = notes.find((item) =>
      String(item.critere_id ?? item.id_critere ?? item.id ?? '') === id,
    ) ?? notes[index];
    return {
      id,
      libelle: criterion.libelle ?? criterion.nom ?? `Critère ${index + 1}`,
      niveauRequis: Number(criterion.niveau_requis ?? 3),
      note: note?.note,
      commentaire: note?.commentaire ?? '',
    };
  });
}

export function getAdminUserEvaluations(
  evaluations: unknown,
  matricule: string,
): AdminUserEvaluation[] {
  if (!Array.isArray(evaluations)) return [];

  return evaluations.filter((evaluation): evaluation is AdminUserEvaluation => Boolean(
    evaluation &&
    evaluation.evalue_matricule === matricule &&
    ADMIN_USER_EVALUATION_TYPES.has(evaluation.type_evaluation) &&
    ['soumis', 'valide'].includes(evaluation.statut),
  ));
}

export function filterAdminUserEvaluations(
  evaluations: AdminUserEvaluation[],
  filters: { type?: string; periodId?: string },
): AdminUserEvaluation[] {
  return evaluations.filter((evaluation) =>
    (!filters.type || filters.type === 'all' || evaluation.type_evaluation === filters.type) &&
    (!filters.periodId || String(evaluation.id_periode ?? '') === filters.periodId),
  );
}

export function getLatestSubmittedSelfEvaluation(
  evaluations: AdminUserEvaluation[],
): AdminUserEvaluation | null {
  return getLatestSubmittedEvaluation(evaluations, 'auto');
}

export function getLatestSubmittedEvaluation(
  evaluations: AdminUserEvaluation[],
  type: string,
): AdminUserEvaluation | null {
  return evaluations.find(
    (evaluation) => evaluation.type_evaluation === type && evaluation.statut === 'soumis',
  ) ?? null;
}

export function getAdminUserEvaluationPeriods(evaluations: AdminUserEvaluation[]) {
  const periods = new Map<string, { id: string; label: string; date: number }>();
  evaluations.forEach((evaluation) => {
    const id = String(evaluation.id_periode ?? '');
    if (!id || periods.has(id)) return;
    const label = String(
      evaluation.periode?.nom_periode ??
      evaluation.periode?.code_periode ??
      evaluation.periode_code ??
      'Période non renseignée',
    );
    const date = Date.parse(evaluation.periode?.date_debut ?? evaluation.date_soumission ?? evaluation.created_at ?? '');
    periods.set(id, { id, label, date: Number.isFinite(date) ? date : 0 });
  });
  return [...periods.values()].sort((left, right) => right.date - left.date);
}

export function getEvaluationGapSummary(
  evaluations: AdminUserEvaluation[],
): AdminUserCompetenceSummary[] {
  const criteriaById = new Map<string, MutableCompetenceSummary>();

  evaluations.forEach((evaluation) => {
    const type = String(evaluation.type_evaluation);
    getEvaluationCriteria(evaluation).forEach((criterion) => {
      if (
        criterion.note === null ||
        criterion.note === undefined ||
        criterion.note === '' ||
        !Number.isFinite(Number(criterion.note))
      ) return;
      const id = String(criterion.id);
      const summary = criteriaById.get(id) ?? {
        id,
        critere: criterion.libelle,
        niveau_requis: Number(criterion.niveauRequis ?? 3),
        notes: [],
        notesParType: new Map<string, number[]>(),
        commentaires: new Set<string>(),
      };
      const note = Number(criterion.note);
      summary.niveau_requis = Math.max(summary.niveau_requis, Number(criterion.niveauRequis ?? 3));
      summary.notes.push(note);
      summary.notesParType.set(type, [...(summary.notesParType.get(type) ?? []), note]);
      if (criterion.commentaire.trim()) summary.commentaires.add(criterion.commentaire.trim());
      criteriaById.set(id, summary);
    });
  });

  return [...criteriaById.values()].map((summary) => ({
    id: summary.id,
    critere: summary.critere,
    niveau_requis: summary.niveau_requis,
    moyenne: summary.notes.reduce((sum, note) => sum + note, 0) / summary.notes.length,
    nb_evaluations: summary.notes.length,
    par_type: Object.fromEntries([...summary.notesParType.entries()].map(([type, notes]) => [
      type,
      {
        moyenne: notes.reduce((sum, note) => sum + note, 0) / notes.length,
        nb_evaluations: notes.length,
      },
    ])),
    commentaires: [...summary.commentaires].slice(0, 4),
  })).sort((left, right) => left.moyenne - right.moyenne);
}
