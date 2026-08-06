export type TeamEvaluationQueue = 'completion' | 'validation';

export type TeamEvaluationItem = Record<string, any> & {
  teamQueue: TeamEvaluationQueue;
};

function asArray(value: unknown): Record<string, any>[] {
  return Array.isArray(value) ? value : [];
}

function getEvaluationId(evaluation: Record<string, any>, fallback: string) {
  return String(evaluation.id_evaluation ?? evaluation.id ?? fallback);
}

function isRelatedToTeam(evaluation: Record<string, any>, subordinateMatricules: Set<string>) {
  const participants = [
    evaluation.evalue_matricule,
    evaluation.evaluateur_matricule,
    evaluation.evalue?.matricule,
    evaluation.evaluateur?.matricule,
  ];

  return participants.some((matricule) =>
    matricule != null && subordinateMatricules.has(String(matricule)),
  );
}

/**
 * L'endpoint GET /evaluations renvoie deux files et non une liste plate.
 * On les fusionne sans perdre la nature de l'action attendue. Si une même
 * soumission est présente dans les deux files, la validation est prioritaire.
 */
export function buildTeamEvaluationItems(
  payload: unknown,
  subordinateMatricules: Iterable<string>,
): TeamEvaluationItem[] {
  const team = new Set(Array.from(subordinateMatricules, String));
  const legacyList = Array.isArray(payload) ? payload : [];
  const source = payload && typeof payload === 'object' && !Array.isArray(payload)
    ? payload as Record<string, unknown>
    : {};

  const validation = asArray(source.a_valider).map((evaluation) => ({
    ...evaluation,
    teamQueue: 'validation' as const,
  }));
  const completion = asArray(source.en_attente ?? legacyList).map((evaluation) => ({
    ...evaluation,
    teamQueue: 'completion' as const,
  }));

  const unique = new Map<string, TeamEvaluationItem>();
  [...validation, ...completion]
    .filter((evaluation) => isRelatedToTeam(evaluation, team))
    .forEach((evaluation, index) => {
      const id = getEvaluationId(evaluation, `${evaluation.teamQueue}-${index}`);
      if (!unique.has(id)) unique.set(id, evaluation);
    });

  return Array.from(unique.values());
}

export function getTeamEvaluationStep(evaluation: TeamEvaluationItem) {
  if (evaluation.teamQueue === 'validation') {
    return { label: 'À valider', badge: 'warning' as const, action: 'Examiner' as const };
  }

  const status = String(evaluation.statut ?? '').toLowerCase();
  if (status === 'brouillon' || status === 'rejete') {
    return { label: 'À compléter', badge: 'warning' as const, action: 'Continuer' as const };
  }
  if (status === 'soumis') {
    return { label: 'En validation', badge: 'info' as const, action: 'Consulter' as const };
  }

  return { label: 'En cours', badge: 'secondary' as const, action: 'Consulter' as const };
}

export function buildTeamEvaluationSummary(evaluations: TeamEvaluationItem[]) {
  return {
    total: evaluations.length,
    toComplete: evaluations.filter((evaluation) =>
      evaluation.teamQueue === 'completion' && ['brouillon', 'rejete'].includes(String(evaluation.statut ?? '').toLowerCase()),
    ).length,
    awaitingValidation: evaluations.filter((evaluation) =>
      evaluation.teamQueue === 'completion' && String(evaluation.statut ?? '').toLowerCase() === 'soumis',
    ).length,
    toValidate: evaluations.filter((evaluation) => evaluation.teamQueue === 'validation').length,
  };
}

export function getTeamEvaluationActionHref(evaluation: TeamEvaluationItem) {
  const id = encodeURIComponent(String(evaluation.id_evaluation ?? evaluation.id ?? ''));
  const step = getTeamEvaluationStep(evaluation);

  if (evaluation.teamQueue === 'validation') return `/evaluations/validate?id=${id}`;
  if (step.action === 'Continuer') return `/evaluations/${id}/edit`;
  return `/evaluations/${id}`;
}
