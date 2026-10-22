export type AdminUserEvaluation = Record<string, any>;

export function getAdminUserSelfEvaluations(evaluations: unknown): AdminUserEvaluation[] {
  if (!Array.isArray(evaluations)) return [];

  return evaluations.filter((evaluation): evaluation is AdminUserEvaluation => {
    return Boolean(
      evaluation &&
      evaluation.type_evaluation === 'auto' &&
      ['soumis', 'valide'].includes(evaluation.statut),
    );
  });
}

export function getLatestSubmittedSelfEvaluation(
  evaluations: AdminUserEvaluation[],
): AdminUserEvaluation | null {
  return evaluations.find((evaluation) => evaluation.statut === 'soumis') ?? null;
}
