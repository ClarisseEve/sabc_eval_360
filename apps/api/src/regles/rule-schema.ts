export type RuleVisibilityDetail = 'aggregated' | 'detailed';

export interface RuleVisibilityPolicy {
  evaluated: boolean;
  manager_n1: boolean;
  upper_management: boolean;
  admin: boolean;
  detail: RuleVisibilityDetail;
}

export interface RuleAnalyticsMetadata {
  individual_dashboard: boolean;
  team_dashboard: boolean;
  admin_dashboard: boolean;
  alerts: boolean;
  improvement_plans: boolean;
}

export interface RuleCriterion {
  id: string;
  libelle: string;
  description: string;
  poids: number;
  section_label: string;
  section_order: number;
  niveau_requis: number;
  improvement_axis_code: string | null;
  recommendation_tags: string[];
  commentaire_requis_si_note_lt: number | null;
  echelle: {
    min: number;
    max: number;
  };
}

export interface RuleSection {
  id: string;
  titre: string;
  description: string;
  ordre: number;
  competences: Array<{
    id: string;
    libelle: string;
    description: string;
    niveau_requis: number;
    ordre: number;
  }>;
}

export interface RuleEnvelope {
  version: number;
  sections: RuleSection[];
  criteres: RuleCriterion[];
  visibility_policy: RuleVisibilityPolicy;
  analytics_metadata: RuleAnalyticsMetadata;
}

export interface RuleRecord {
  id_regle: string | number;
  nom_regle: string;
  description: string | null;
  est_active: boolean;
  role_evaluateur: string | null;
  role_evalue: string | null;
  type_evaluation: string | null;
  criteres_evaluation_json: unknown;
  created_at?: string | Date | null;
  updated_at?: string | Date | null;
  [key: string]: unknown;
}

const DEFAULT_SECTION_LABEL = 'Compétences';
const DEFAULT_COMMENT_THRESHOLD = 3;

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

function safeParseJson(value: unknown): any {
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function toNonEmptyString(value: unknown, fallback: string) {
  if (typeof value === 'string' && value.trim().length > 0) return value.trim();
  return fallback;
}

function toNumber(value: unknown, fallback: number) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function normalizeTags(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((tag) => String(tag).trim())
      .filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
  }

  return [];
}

function normalizeCriterionId(raw: any, index: number, sectionLabel: string) {
  if (raw?.id != null) return String(raw.id);
  const base = String(raw?.libelle ?? raw?.nom ?? `critere-${index + 1}`)
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const section = sectionLabel
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${section || 'section'}-${base || `critere-${index + 1}`}`;
}

export function normalizeRuleCriterion(raw: any, index: number): RuleCriterion {
  const sectionLabel = toNonEmptyString(
    raw?.section_label ?? raw?.sectionLabel ?? raw?.categorie,
    DEFAULT_SECTION_LABEL,
  );
  const sectionOrder = toNumber(raw?.section_order ?? raw?.sectionOrder, 1);

  return {
    id: normalizeCriterionId(raw, index, sectionLabel),
    libelle: toNonEmptyString(raw?.libelle ?? raw?.nom, `Critère ${index + 1}`),
    description: toNonEmptyString(raw?.description, ''),
    poids: toNumber(raw?.poids ?? raw?.ponderation, 0),
    section_label: sectionLabel,
    section_order: sectionOrder,
    niveau_requis: toNumber(raw?.niveau_requis, 3),
    improvement_axis_code:
      raw?.improvement_axis_code != null && String(raw.improvement_axis_code).trim().length > 0
        ? String(raw.improvement_axis_code).trim()
        : null,
    recommendation_tags: normalizeTags(raw?.recommendation_tags),
    commentaire_requis_si_note_lt:
      raw?.commentaire_requis_si_note_lt == null
        ? DEFAULT_COMMENT_THRESHOLD
        : toNumber(raw.commentaire_requis_si_note_lt, DEFAULT_COMMENT_THRESHOLD),
    echelle: {
      min: toNumber(raw?.echelle?.min, 1),
      max: toNumber(raw?.echelle?.max, 5),
    },
  };
}

function flattenSectionsToCriteria(sections: any[]): RuleCriterion[] {
  const rawCompetences = sections.flatMap((section: any, sectionIndex: number) =>
    Array.isArray(section?.competences)
      ? section.competences.map((competence: any, competenceIndex: number) => ({
          ...competence,
          section_label: section?.titre ?? section?.title ?? DEFAULT_SECTION_LABEL,
          section_order: toNumber(section?.ordre ?? section?.order, sectionIndex + 1),
          poids: competence?.poids ?? competence?.ponderation,
          ordre: competence?.ordre ?? competenceIndex + 1,
        }))
      : [],
  );

  if (rawCompetences.length === 0) return [];

  const equalWeight = Math.floor(100 / rawCompetences.length);
  let remainder = 100 - equalWeight * rawCompetences.length;

  return rawCompetences.map((competence, index) =>
    normalizeRuleCriterion(
      {
        ...competence,
        poids: competence?.poids ?? equalWeight + (remainder-- > 0 ? 1 : 0),
      },
      index,
    ),
  );
}

export function buildSectionsFromCriteria(criteria: RuleCriterion[]): RuleSection[] {
  const grouped = new Map<string, RuleSection>();

  criteria.forEach((criterion, index) => {
    const key = `${criterion.section_order}:${criterion.section_label}`;
    if (!grouped.has(key)) {
      grouped.set(key, {
        id: key,
        titre: criterion.section_label,
        description: '',
        ordre: criterion.section_order,
        competences: [],
      });
    }

    grouped.get(key)!.competences.push({
      id: criterion.id,
      libelle: criterion.libelle,
      description: criterion.description,
      niveau_requis: criterion.niveau_requis,
      ordre: index + 1,
    });
  });

  return Array.from(grouped.values())
    .sort((a, b) => a.ordre - b.ordre)
    .map((section) => ({
      ...section,
      competences: section.competences.sort((a, b) => a.ordre - b.ordre),
    }));
}

export function parseRuleEnvelope(payload: unknown): RuleEnvelope {
  const raw = safeParseJson(payload);

  let criteriaSource: any[] = [];
  let sectionsSource: any[] = [];
  let visibilityPolicy = createDefaultVisibilityPolicy();
  let analyticsMetadata = createDefaultAnalyticsMetadata();

  if (Array.isArray(raw)) {
    criteriaSource = raw;
  } else if (raw && typeof raw === 'object') {
    const record = raw as Record<string, any>;
    if (Array.isArray(record.criteres)) {
      criteriaSource = record.criteres;
    }
    if (Array.isArray(record.criteria)) {
      criteriaSource = record.criteria;
    }
    if (Array.isArray(record.sections)) {
      sectionsSource = record.sections;
    }
    if (record.visibility_policy && typeof record.visibility_policy === 'object') {
      visibilityPolicy = {
        ...visibilityPolicy,
        ...record.visibility_policy,
      };
    }
    if (record.analytics_metadata && typeof record.analytics_metadata === 'object') {
      analyticsMetadata = {
        ...analyticsMetadata,
        ...record.analytics_metadata,
      };
    }
  }

  const criteres =
    criteriaSource.length > 0
      ? criteriaSource.map((criterion, index) => normalizeRuleCriterion(criterion, index))
      : flattenSectionsToCriteria(sectionsSource);

  const sections =
    sectionsSource.length > 0
      ? buildSectionsFromCriteria(criteres).map((section, index) => ({
          ...section,
          titre: toNonEmptyString(sectionsSource[index]?.titre ?? sectionsSource[index]?.title, section.titre),
          description: toNonEmptyString(sectionsSource[index]?.description, ''),
          ordre: toNumber(sectionsSource[index]?.ordre ?? sectionsSource[index]?.order, section.ordre),
        }))
      : buildSectionsFromCriteria(criteres);

  return {
    version: 2,
    sections,
    criteres,
    visibility_policy: visibilityPolicy,
    analytics_metadata: analyticsMetadata,
  };
}

export function serializeRuleEnvelope(input: {
  sections?: RuleSection[];
  criteres?: RuleCriterion[];
  visibility_policy?: Partial<RuleVisibilityPolicy>;
  analytics_metadata?: Partial<RuleAnalyticsMetadata>;
}): RuleEnvelope {
  const normalizedCriteria = (input.criteres ?? []).map((criterion, index) =>
    normalizeRuleCriterion(criterion, index),
  );
  const sections =
    input.sections && input.sections.length > 0
      ? buildSectionsFromCriteria(normalizedCriteria).map((section, index) => ({
          ...section,
          titre: toNonEmptyString(input.sections?.[index]?.titre, section.titre),
          description: toNonEmptyString(input.sections?.[index]?.description, ''),
          ordre: toNumber(input.sections?.[index]?.ordre, section.ordre),
        }))
      : buildSectionsFromCriteria(normalizedCriteria);

  return {
    version: 2,
    sections,
    criteres: normalizedCriteria,
    visibility_policy: {
      ...createDefaultVisibilityPolicy(),
      ...(input.visibility_policy ?? {}),
    },
    analytics_metadata: {
      ...createDefaultAnalyticsMetadata(),
      ...(input.analytics_metadata ?? {}),
    },
  };
}

export function normalizeRuleRow<T extends RuleRecord>(row: T) {
  const envelope = parseRuleEnvelope(row.criteres_evaluation_json);
  return {
    ...row,
    criteres_evaluation_json: envelope,
    criteres: envelope.criteres,
    sections: envelope.sections,
    visibility_policy: envelope.visibility_policy,
    analytics_metadata: envelope.analytics_metadata,
    nb_criteres: envelope.criteres.length,
  };
}

export function validateRuleEnvelope(envelope: RuleEnvelope): string[] {
  const errors: string[] = [];
  const totalWeight = envelope.criteres.reduce((sum, criterion) => sum + criterion.poids, 0);

  if (envelope.criteres.length < 5) {
    errors.push(`Minimum 5 critères requis (actuellement: ${envelope.criteres.length})`);
  }

  if (totalWeight !== 100) {
    errors.push(`La somme des poids doit être de 100% (actuelle: ${totalWeight}%)`);
  }

  envelope.criteres.forEach((criterion, index) => {
    if (!criterion.libelle.trim()) {
      errors.push(`Critère #${index + 1}: libellé obligatoire`);
    }
    if (!criterion.section_label.trim()) {
      errors.push(`Critère #${index + 1}: section obligatoire`);
    }
    if (criterion.poids <= 0) {
      errors.push(`Critère #${index + 1}: poids invalide`);
    }
    if (criterion.echelle.min !== 1 || criterion.echelle.max !== 5) {
      errors.push(`Critère #${index + 1}: l'échelle doit rester comprise entre 1 et 5`);
    }
  });

  return errors;
}
