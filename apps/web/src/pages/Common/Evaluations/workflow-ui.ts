export type EditableEvaluationNote = {
  critere_id: string;
  note: number | null;
  commentaire: string;
};

type CriterionInput = {
  id?: string | number | null;
  note?: unknown;
  commentaire?: string | null;
  commentaireRequisSiNoteLt?: number | null;
};

type DraftNoteInput = {
  critere_id?: unknown;
  id_critere?: unknown;
  id?: unknown;
  note?: unknown;
  commentaire?: unknown;
};

export type EvaluationSubmissionState = {
  canSubmit: boolean;
  ratedCount: number;
  totalCount: number;
  completion: number;
  missingRatings: number;
  missingComments: number;
  invalidCriteria: number;
};

const EDITABLE_STATUSES = new Set(['brouillon', 'rejete']);

export function isValidEvaluationScore(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) >= 1 && Number(value) <= 5;
}

export function isRequiredCriterionCommentMissing({
  note,
  commentaire,
  threshold = 3,
}: {
  note: number | null | undefined;
  commentaire: string | null | undefined;
  threshold?: number | null;
}) {
  if (!isValidEvaluationScore(note)) return false;
  const effectiveThreshold = threshold ?? 3;
  return note < effectiveThreshold && (!commentaire || commentaire.trim().length === 0);
}

export function findNoteForCriterion<T extends DraftNoteInput>(
  notes: T[],
  criterionId: string,
  criterionIndex: number,
): T | undefined {
  const matchingNote = notes.find((entry) => {
    const entryId = entry.critere_id ?? entry.id_critere ?? entry.id;
    return entryId !== undefined && entryId !== null && String(entryId) === criterionId;
  });
  if (matchingNote) return matchingNote;

  // Le repli positionnel est réservé aux anciens payloads réellement sans ID.
  // Il ne doit jamais attribuer la note d'un autre critère à un brouillon partiel.
  const positionalNote = notes[criterionIndex];
  const positionalId = positionalNote?.critere_id ?? positionalNote?.id_critere ?? positionalNote?.id;
  return positionalId === undefined || positionalId === null ? positionalNote : undefined;
}

/**
 * Construit l'état éditable sans inventer de note. Un brouillon local peut
 * surcharger la version serveur, y compris pour restaurer un commentaire vide.
 */
export function buildEditableEvaluationNotes(
  criteria: CriterionInput[],
  draftNotes?: DraftNoteInput[],
): EditableEvaluationNote[] {
  return criteria.map((criterion, index) => {
    const criterionId = String(criterion.id ?? '');
    const matchingDraft = draftNotes ? findNoteForCriterion(draftNotes, criterionId, index) : undefined;
    const rawNote = matchingDraft ? matchingDraft.note : criterion.note;
    const rawComment = matchingDraft ? matchingDraft.commentaire : criterion.commentaire;

    return {
      critere_id: criterionId,
      note: isValidEvaluationScore(rawNote) ? rawNote : null,
      commentaire: typeof rawComment === 'string' ? rawComment : '',
    };
  });
}

/** Le contrat API d'un brouillon accepte une liste incomplète, mais pas de note nulle. */
export function serializeRatedEvaluationNotes(notes: EditableEvaluationNote[]) {
  return notes.flatMap((entry) => {
    const criterionId = entry.critere_id.trim();
    if (!criterionId || !isValidEvaluationScore(entry.note)) return [];
    return [{
      critere_id: criterionId,
      note: entry.note,
      commentaire: entry.commentaire,
    }];
  });
}

export function getEvaluationSubmissionState(
  notes: EditableEvaluationNote[],
  criteria: CriterionInput[],
): EvaluationSubmissionState {
  const totalCount = criteria.length;
  const ratedCount = notes.slice(0, totalCount).filter((entry) => isValidEvaluationScore(entry.note)).length;
  const missingRatings = Math.max(0, totalCount - ratedCount);
  const missingComments = criteria.reduce((count, criterion, index) => (
    count + (isRequiredCriterionCommentMissing({
      note: notes[index]?.note,
      commentaire: notes[index]?.commentaire,
      threshold: criterion.commentaireRequisSiNoteLt,
    }) ? 1 : 0)
  ), 0);
  const invalidCriteria = notes.slice(0, totalCount).filter((entry) => entry.critere_id.trim().length === 0).length;
  const completion = totalCount === 0 ? 0 : Math.round((ratedCount / totalCount) * 100);

  return {
    canSubmit: totalCount > 0 && missingRatings === 0 && missingComments === 0 && invalidCriteria === 0,
    ratedCount,
    totalCount,
    completion,
    missingRatings,
    missingComments,
    invalidCriteria,
  };
}

function evaluationOwnerMatricule(evaluation: Record<string, any>) {
  return evaluation.evaluateur_matricule ?? evaluation.evaluateur?.matricule ?? null;
}

/**
 * La page « À compléter » ne montre que les actions de l'évaluateur. Les
 * soumissions et la file manager ont leurs propres écrans.
 */
export function selectEvaluatorActionEvaluations(
  pendingEvaluations: Array<Record<string, any>>,
  historyList: Array<Record<string, any>>,
  currentMatricule?: string | null,
) {
  const pendingActions = pendingEvaluations.filter((evaluation) =>
    EDITABLE_STATUSES.has(String(evaluation.statut ?? '').toLowerCase()),
  );
  const rejectedOwnedEvaluations = currentMatricule
    ? historyList.filter((evaluation) =>
        String(evaluation.statut ?? '').toLowerCase() === 'rejete'
        && String(evaluationOwnerMatricule(evaluation) ?? '') === String(currentMatricule),
      )
    : [];
  const seen = new Set<string>();

  return [...pendingActions, ...rejectedOwnedEvaluations].filter((evaluation) => {
    const id = String(evaluation.id_evaluation ?? evaluation.id ?? '');
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}
