import {
  RuleVisibilityPolicy,
  createDefaultVisibilityPolicy,
  parseRuleEnvelope,
} from '../regles/rule-schema';

/**
 * SQL predicate used on evaluated-side views. The `r` alias must refer to
 * regles_evaluation. A missing/legacy rule keeps the backwards-compatible
 * default (visible), while an explicit `evaluated: false` removes the row.
 */
type RuleVisibilityFlag =
  | 'evaluated'
  | 'manager_n1'
  | 'upper_management'
  | 'admin';

export function ruleVisibilitySql(
  flag: RuleVisibilityFlag,
  ruleAlias = 'r',
): string {
  return `COALESCE(${ruleAlias}.criteres_evaluation_json #>> '{visibility_policy,${flag}}', 'true') <> 'false'`;
}

export const EVALUATED_VISIBILITY_SQL = ruleVisibilitySql('evaluated');

export const INTERNAL_RULE_ENVELOPE_FIELD = '__rule_envelope';

export function resolveEvaluationVisibilityPolicy(
  source: unknown,
): RuleVisibilityPolicy {
  if (source == null) return createDefaultVisibilityPolicy();

  const record = source as Record<string, unknown>;
  const payload =
    record[INTERNAL_RULE_ENVELOPE_FIELD] ??
    record.criteres_evaluation_json ??
    record.regle_criteres_evaluation_json ??
    source;

  return parseRuleEnvelope(payload).visibility_policy;
}

export function isVisibleToEvaluated(
  evaluation: Record<string, unknown>,
  policy: RuleVisibilityPolicy,
): boolean {
  return (
    policy.evaluated &&
    (evaluation.statut === 'soumis' || evaluation.statut === 'valide')
  );
}

export function redactEvaluationForVisibility<T extends Record<string, any>>(
  evaluation: T,
  options: {
    policy?: RuleVisibilityPolicy;
    preserveDetails?: boolean;
  } = {},
): T {
  const result: Record<string, any> = { ...evaluation };
  const policy =
    options.policy ?? resolveEvaluationVisibilityPolicy(evaluation);

  delete result[INTERNAL_RULE_ENVELOPE_FIELD];
  delete result.regle_criteres_evaluation_json;

  // Peer-review identity is never part of a consultation response. Access and
  // ownership checks must therefore run against the raw row before this step.
  if (evaluation.type_evaluation === 'pairs') {
    result.evaluateur_matricule = null;
    result.evaluateur = null;
    result.evaluateur_nom = 'Anonyme';
    result.evaluateur_prenom = null;
    result.evaluateur_role_nom = null;
  }

  if (!options.preserveDetails && policy.detail === 'aggregated') {
    result.notations_json = null;
    result.commentaire_global = null;
    result.commentaire_general = null;
    result.commentaire_validation = null;
    result.motif_rejet = null;
  }

  return result as T;
}
