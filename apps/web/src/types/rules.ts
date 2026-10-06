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
  niveaux: Array<{ niveau: number; description: string }>;
  improvement_axis_code: string | null;
  recommendation_tags: string[];
  recommendation_text: string | null;
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

export interface PublishedRule {
  id_regle: string;
  nom_regle: string;
  description: string | null;
  est_active: boolean;
  role_evaluateur: string | null;
  role_evalue: string | null;
  type_evaluation: string | null;
  sections: RuleSection[];
  criteres: RuleCriterion[];
  visibility_policy: RuleVisibilityPolicy;
  analytics_metadata: RuleAnalyticsMetadata;
  constraints: {
    meme_region_obligatoire: boolean;
    meme_branche_obligatoire: boolean;
  };
  created_at?: string | null;
  updated_at?: string | null;
  criteres_evaluation_json?: unknown;
  nb_criteres?: number;
}

export interface RuleBuilderInput {
  nom_regle: string;
  description: string;
  role_evaluateur: string;
  role_evalue: string;
  type_evaluation: string;
  est_active: boolean;
  criteres: RuleCriterion[];
  sections: RuleSection[];
  visibility_policy: RuleVisibilityPolicy;
  analytics_metadata: RuleAnalyticsMetadata;
  meme_region_obligatoire: boolean;
  meme_branche_obligatoire: boolean;
}
