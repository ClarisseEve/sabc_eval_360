import type {
  PublishedRule,
  RuleAnalyticsMetadata,
  RuleBuilderInput,
  RuleCriterion,
  RuleSection,
  RuleVisibilityPolicy,
} from '@/types/rules';

const DEFAULT_SECTION_LABEL = 'Compétences';

export function createDefaultVisibilityPolicy(): RuleVisibilityPolicy {
  return {
    evaluated: true,
    manager_n1: true,
    upper_management: true,
    admin: true,
    detail: 'aggregated',
  };
}

export function createDefaultAnalyticsMetadata(): RuleAnalyticsMetadata {
  return {
    individual_dashboard: true,
    team_dashboard: true,
    admin_dashboard: true,
    alerts: true,
    improvement_plans: true,
  };
}

const toStringValue = (value: unknown, fallback = '') => {
  if (typeof value === 'string' && value.trim().length > 0) return value.trim();
  return fallback;
};

const toNumberValue = (value: unknown, fallback: number) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
};

const toTags = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  if (typeof value === 'string') {
    return value.split(',').map((item) => item.trim()).filter(Boolean);
  }
  return [];
};

const safeParseJson = (value: unknown): any => {
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

export function normalizeRuleCriterion(raw: any, index: number): RuleCriterion {
  const sectionLabel = toStringValue(raw?.section_label ?? raw?.sectionLabel ?? raw?.categorie, DEFAULT_SECTION_LABEL);
  return {
    id: toStringValue(raw?.id, `${sectionLabel.toLowerCase().replace(/\s+/g, '-')}-${index + 1}`),
    libelle: toStringValue(raw?.libelle ?? raw?.nom, `Critère ${index + 1}`),
    description: toStringValue(raw?.description),
    poids: toNumberValue(raw?.poids ?? raw?.ponderation, 0),
    section_label: sectionLabel,
    section_order: toNumberValue(raw?.section_order ?? raw?.sectionOrder, 1),
    niveau_requis: toNumberValue(raw?.niveau_requis, 3),
    improvement_axis_code: toStringValue(raw?.improvement_axis_code) || null,
    recommendation_tags: toTags(raw?.recommendation_tags),
    commentaire_requis_si_note_lt:
      raw?.commentaire_requis_si_note_lt == null ? 3 : toNumberValue(raw?.commentaire_requis_si_note_lt, 3),
    echelle: {
      min: toNumberValue(raw?.echelle?.min, 1),
      max: toNumberValue(raw?.echelle?.max, 5),
    },
  };
}

export function buildSectionsFromCriteria(criteria: RuleCriterion[]): RuleSection[] {
  const map = new Map<string, RuleSection>();

  criteria.forEach((criterion, index) => {
    const key = `${criterion.section_order}:${criterion.section_label}`;
    if (!map.has(key)) {
      map.set(key, {
        id: key,
        titre: criterion.section_label,
        description: '',
        ordre: criterion.section_order,
        competences: [],
      });
    }

    map.get(key)!.competences.push({
      id: criterion.id,
      libelle: criterion.libelle,
      description: criterion.description,
      niveau_requis: criterion.niveau_requis,
      ordre: index + 1,
    });
  });

  return Array.from(map.values())
    .sort((a, b) => a.ordre - b.ordre)
    .map((section) => ({
      ...section,
      competences: section.competences.sort((a, b) => a.ordre - b.ordre),
    }));
}

export function normalizePublishedRule(raw: any): PublishedRule {
  const payload = safeParseJson(raw?.criteres_evaluation_json);
  const criteresSource = Array.isArray(payload?.criteres)
    ? payload.criteres
    : Array.isArray(payload)
      ? payload
      : [];
  const criteres = criteresSource.map((criterion: any, index: number) => normalizeRuleCriterion(criterion, index));
  const sections = Array.isArray(payload?.sections) && payload.sections.length > 0
    ? buildSectionsFromCriteria(criteres).map((section, index) => ({
        ...section,
        titre: toStringValue(payload.sections[index]?.titre, section.titre),
        description: toStringValue(payload.sections[index]?.description),
        ordre: toNumberValue(payload.sections[index]?.ordre, section.ordre),
      }))
    : buildSectionsFromCriteria(criteres);

  return {
    id_regle: String(raw?.id_regle ?? ''),
    nom_regle: toStringValue(raw?.nom_regle, 'Règle sans nom'),
    description: raw?.description ?? null,
    est_active: Boolean(raw?.est_active),
    role_evaluateur: raw?.role_evaluateur ?? null,
    role_evalue: raw?.role_evalue ?? null,
    type_evaluation: raw?.type_evaluation ?? null,
    sections,
    criteres,
    visibility_policy: {
      ...createDefaultVisibilityPolicy(),
      ...(payload?.visibility_policy ?? raw?.visibility_policy ?? {}),
    },
    analytics_metadata: {
      ...createDefaultAnalyticsMetadata(),
      ...(payload?.analytics_metadata ?? raw?.analytics_metadata ?? {}),
    },
    constraints: {
      meme_region_obligatoire: payload?.constraints?.meme_region_obligatoire ?? raw?.meme_region_obligatoire ?? true,
      meme_branche_obligatoire: payload?.constraints?.meme_branche_obligatoire ?? raw?.meme_branche_obligatoire ?? true,
    },
    created_at: raw?.created_at ?? null,
    updated_at: raw?.updated_at ?? null,
    criteres_evaluation_json: payload ?? raw?.criteres_evaluation_json,
    nb_criteres: raw?.nb_criteres ?? criteres.length,
  };
}

/** Une règle ne peut initialiser un brouillon que si son détail publié est exploitable. */
export function isPublishedRuleReady(raw: unknown, expectedId?: string | null) {
  if (!raw || typeof raw !== 'object') return false;

  const rule = normalizePublishedRule(raw);
  if (!rule.id_regle || !rule.est_active || rule.criteres.length === 0) return false;
  return !expectedId || rule.id_regle === String(expectedId);
}

export function createEmptyRuleBuilderInput(): RuleBuilderInput {
  return {
    nom_regle: '',
    description: '',
    role_evaluateur: '',
    role_evalue: '',
    type_evaluation: '',
    est_active: true,
    criteres: Array.from({ length: 5 }, (_, index) => ({
      id: `critere-${index + 1}`,
      libelle: '',
      description: '',
      poids: index === 4 ? 20 : 20,
      section_label: DEFAULT_SECTION_LABEL,
      section_order: 1,
      niveau_requis: 3,
      improvement_axis_code: null,
      recommendation_tags: [],
      commentaire_requis_si_note_lt: 3,
      echelle: { min: 1, max: 5 },
    })),
    sections: [],
    visibility_policy: createDefaultVisibilityPolicy(),
    analytics_metadata: createDefaultAnalyticsMetadata(),
    meme_region_obligatoire: true,
    meme_branche_obligatoire: true,
  };
}

export function ruleToBuilderInput(rule: any): RuleBuilderInput {
  const normalized = normalizePublishedRule(rule);
  return {
    nom_regle: normalized.nom_regle,
    description: normalized.description ?? '',
    role_evaluateur: normalized.role_evaluateur ?? '',
    role_evalue: normalized.role_evalue ?? '',
    type_evaluation: normalized.type_evaluation ?? '',
    est_active: normalized.est_active,
    criteres: normalized.criteres,
    sections: normalized.sections,
    visibility_policy: normalized.visibility_policy,
    analytics_metadata: normalized.analytics_metadata,
    meme_region_obligatoire: normalized.constraints.meme_region_obligatoire,
    meme_branche_obligatoire: normalized.constraints.meme_branche_obligatoire,
  };
}

export function builderInputToPayload(input: RuleBuilderInput) {
  return {
    nom_regle: input.nom_regle,
    description: input.description,
    role_evaluateur: input.role_evaluateur,
    role_evalue: input.role_evalue,
    type_evaluation: input.type_evaluation,
    est_active: input.est_active,
    criteres: input.criteres,
    sections: buildSectionsFromCriteria(input.criteres),
    visibility_policy: input.visibility_policy,
    analytics_metadata: input.analytics_metadata,
    meme_region_obligatoire: input.meme_region_obligatoire,
    meme_branche_obligatoire: input.meme_branche_obligatoire,
  };
}

export function getRuleSummary(rule: any) {
  const normalized = normalizePublishedRule(rule);
  return {
    id: normalized.id_regle,
    name: normalized.nom_regle,
    description: normalized.description,
    sections: normalized.sections,
    criteresCount: normalized.criteres.length,
    weights: normalized.criteres.map((criterion) => ({ label: criterion.libelle, poids: criterion.poids })),
    axes: Array.from(
      new Set(
        normalized.criteres
          .map((criterion) => criterion.improvement_axis_code)
          .filter(Boolean),
      ),
    ),
  };
}

export function filterApplicableRules(
  rules: any[],
  evaluatorRole: string | null | undefined,
  evaluateeRole: string | null | undefined,
  typeEvaluation: string | null | undefined,
) {
  const evaluator = (evaluatorRole ?? '').toUpperCase();
  const evaluatee = (evaluateeRole ?? '').toUpperCase();
  const type = (typeEvaluation ?? '').toLowerCase();

  return rules
    .map((rule) => normalizePublishedRule(rule))
    .filter((rule) => {
      const matchesEvaluator = !rule.role_evaluateur || String(rule.role_evaluateur).toUpperCase() === evaluator;
      const matchesEvaluatee = !rule.role_evalue || String(rule.role_evalue).toUpperCase() === evaluatee;
      const matchesType = !rule.type_evaluation || String(rule.type_evaluation).toLowerCase() === type;
      return rule.est_active && matchesEvaluator && matchesEvaluatee && matchesType;
    });
}
