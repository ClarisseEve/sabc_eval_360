import type {
  PublishedRule,
  RuleAnalyticsMetadata,
  RuleBuilderInput,
  RuleCriterion,
  RuleSection,
  RuleVisibilityPolicy,
} from '@/types/rules';
import { resolveKnownRole } from '../config/rbac';

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
    niveaux: [1, 2, 3, 4, 5].map((niveau) => {
      const level = Array.isArray(raw?.niveaux)
        ? raw.niveaux.find((entry: any) => Number(entry?.niveau) === niveau)
        : null;
      return { niveau, description: toStringValue(level?.description) };
    }),
    improvement_axis_code: toStringValue(raw?.improvement_axis_code) || null,
    recommendation_tags: toTags(raw?.recommendation_tags),
    recommendation_text: toStringValue(raw?.recommendation_text) || null,
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
    criteres: Array.from({ length: 3 }, (_, index) => ({
      id: `critere-${index + 1}`,
      libelle: '',
      description: '',
      poids: [34, 33, 33][index],
      section_label: DEFAULT_SECTION_LABEL,
      section_order: 1,
      niveau_requis: 3,
      niveaux: [1, 2, 3, 4, 5].map((niveau) => ({ niveau, description: '' })),
      improvement_axis_code: null,
      recommendation_tags: [],
      recommendation_text: null,
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
  const normalizeRoleIdentifier = (role: string | null | undefined) => {
    const value = (role ?? '').trim();
    return resolveKnownRole(value) ?? value.toUpperCase();
  };
  const evaluator = normalizeRoleIdentifier(evaluatorRole);
  const evaluatee = normalizeRoleIdentifier(evaluateeRole);
  const type = (typeEvaluation ?? '').toLowerCase();

  return rules
    .map((rule) => normalizePublishedRule(rule))
    .filter((rule) => {
      const matchesEvaluator = !rule.role_evaluateur || normalizeRoleIdentifier(rule.role_evaluateur) === evaluator;
      const matchesEvaluatee = !rule.role_evalue || normalizeRoleIdentifier(rule.role_evalue) === evaluatee;
      const matchesType = !rule.type_evaluation || String(rule.type_evaluation).toLowerCase() === type;
      return rule.est_active && matchesEvaluator && matchesEvaluatee && matchesType;
    });
}

export function filterAdminApplicableRules(
  rules: any[],
  evaluateeRole: string | null | undefined,
) {
  const value = (evaluateeRole ?? '').trim();
  if (!value) return [];
  const evaluatee = resolveKnownRole(value) ?? value.toUpperCase();

  return rules
    .map((rule) => normalizePublishedRule(rule))
    .filter((rule) => {
      const targetRole = (rule.role_evalue ?? '').trim();
      const matchesEvaluatee = !targetRole || (resolveKnownRole(targetRole) ?? targetRole.toUpperCase()) === evaluatee;
      return rule.est_active && matchesEvaluatee && String(rule.type_evaluation ?? '').toLowerCase() !== 'auto';
    });
}

interface TemplateCompetenceEntry {
  section: any;
  sectionIndex: number;
  competence: any;
  competenceIndex: number;
  weight: number;
  fallback: any;
}

function getTemplateCompetences(template: any): TemplateCompetenceEntry[] {
  const sections = Array.isArray(template?.sections) ? template.sections : [];
  const criteria = Array.isArray(template?.meta_json?.criteres)
    ? template.meta_json.criteres
    : Array.isArray(template?.criteres)
      ? template.criteres
      : [];

  return sections.flatMap((section: any, sectionIndex: number) => {
    const competences = Array.isArray(section?.competences) ? section.competences : [];
    return competences.map((competence: any, competenceIndex: number) => {
      const fallback = criteria.find((criterion: any) =>
        (competence.id && criterion.id === competence.id) ||
        (competence.libelle && criterion.libelle === competence.libelle),
      );
      return {
        section,
        sectionIndex,
        competence,
        competenceIndex,
        weight: Number(competence.poids ?? fallback?.poids),
        fallback,
      };
    });
  });
}

export function templateHasValidWeights(template: any) {
  const competences = getTemplateCompetences(template);
  if (competences.length === 0 || competences.some(({ weight }) => !Number.isFinite(weight) || weight <= 0)) {
    return false;
  }
  const total = competences.reduce((sum, { weight }) => sum + weight, 0);
  return Math.abs(total - 100) <= 0.01;
}

export function templateToRuleCriteria(template: any): RuleCriterion[] {
  const competences = getTemplateCompetences(template);
  const keepTemplateWeights = templateHasValidWeights(template);
  const equalWeight = Math.floor((100 / competences.length) * 100) / 100;

  return competences.map(({ section, sectionIndex, competence, competenceIndex, weight, fallback }, index) => ({
    id: String(competence.id ?? fallback?.id ?? `${sectionIndex + 1}-${competenceIndex + 1}`),
    libelle: String(competence.libelle ?? fallback?.libelle ?? ''),
    description: String(competence.description ?? fallback?.description ?? ''),
    poids: keepTemplateWeights
      ? weight
      : index === competences.length - 1
        ? Number((100 - equalWeight * (competences.length - 1)).toFixed(2))
        : equalWeight,
    section_label: String(section.titre ?? 'Compétences'),
    section_order: Number(section.ordre) || sectionIndex + 1,
    niveau_requis: Number(competence.niveau_requis ?? fallback?.niveau_requis) || 3,
    niveaux: [1, 2, 3, 4, 5].map((niveau) => {
      const levels = competence.niveaux ?? fallback?.niveaux;
      const level = Array.isArray(levels)
        ? levels.find((entry: any) => Number(entry?.niveau) === niveau)
        : null;
      return { niveau, description: String(level?.description ?? '') };
    }),
    improvement_axis_code: fallback?.improvement_axis_code ?? null,
    recommendation_tags: fallback?.recommendation_tags ?? [],
    recommendation_text: fallback?.recommendation_text ?? null,
    commentaire_requis_si_note_lt: fallback?.commentaire_requis_si_note_lt ?? 3,
    echelle: { min: 1, max: 5 },
  }));
}
