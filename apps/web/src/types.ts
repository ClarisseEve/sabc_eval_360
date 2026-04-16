/**
 * Types communs utilisés dans l'application SABC Évaluation 360°
 */

/**
 * Configuration d'une route dans l'application
 */
export interface RouteConfig {
  /**
   * Nom logique de la route côté frontend
   */
  name: string;
  
  /**
   * Chemin URL de la route
   */
  path: string;
  
  /**
   * Composant React à charger pour cette route
   */
  component: React.LazyExoticComponent<any>;
  
  /**
   * Métadonnées associées à la route
   */
  meta: {
    /**
     * Titre de la page
     */
    title: string;
    
    /**
     * Icône à afficher dans la sidebar (optionnel)
     */
    icon?: string;
    
    /**
     * Rôles autorisés à accéder à cette route
     */
    roles: string[];
    
    /**
     * Indique si la route doit être affichée dans la sidebar
     */
    sidebar: boolean;
    
    /**
     * Parent de la route dans la sidebar (optionnel)
     */
    parent?: string;
  };
}

/**
 * Interface pour les éléments de breadcrumb
 */
export interface BreadcrumbItem {
  /**
   * Titre affiché dans le breadcrumb
   */
  title: string;
  
  /**
   * URL de destination (optionnel pour le dernier élément)
   */
  href?: string;
  
  /**
   * Indique si l'élément est actif (dernier élément)
   */
  active?: boolean;
}

/**
 * Données partagées entre les pages (contexte global)
 */
export interface SharedData {
  /**
   * Utilisateur actuellement connecté
   */
  user: {
    matricule: string;
    nom: string;
    prenom: string;
    email: string;
    role: string;
    region?: string;
    branche?: string;
  };
  
  /**
   * Configuration de l'application
   */
  app: {
    name: string;
    version: string;
    environment: string;
  };
  
  /**
   * Messages flash (succès, erreurs, etc.)
   */
  flash?: {
    success?: string;
    error?: string;
    warning?: string;
    info?: string;
  };

  name?: string;
  quote?: {
    message: string;
    author: string;
  };
  auth?: {
    user?: User | null;
  };
}

/**
 * Props pour le composant AppLayout
 */
export interface AppLayoutProps {
  /**
   * Contenu de la page
   */
  children: React.ReactNode;
  
  /**
   * Utilisateur connecté
   */
  user?: any;
  
  /**
   * Titre de la page
   */
  pageTitle?: string;
  
  /**
   * Indique si l'utilisateur est admin
   */
  isAdmin?: boolean;
  
  /**
   * Permissions de l'utilisateur
   */
  permissions?: string[];
}

export interface User {
  id?: number | string;
  matricule?: string;
  nom?: string;
  prenom?: string;
  name?: string;
  email: string;
  telephone?: string;
  avatar?: string;
  role: string;
  role_nom?: string;
  manager_matricule?: string;
  manager_nom?: string;
  region_nom?: string;
  type_region?: 'Tanière' | 'Non-Tanière' | string;
  id_branche?: string;
  branche_nom?: string;
  niveau_hierarchique?: number;
  est_actif?: boolean;
  est_admin?: boolean;
  est_indisponible?: boolean;
  [key: string]: any;
}

export interface PerformanceMetrics {
  scoreGlobal?: number;
  scoreMoyen?: number;
  noteGlobale?: number;
  completionRate?: number;
  totalEvaluations?: number;
  pendingEvaluations?: number;
  trend?: number;
  [key: string]: any;
}

export interface PaginatedResponse<T = any> {
  current_page: number;
  data: T[];
  last_page: number;
  total: number;
  [key: string]: any;
}

export interface UserFormData extends Partial<User> {
  password?: string;
  password_confirmation?: string;
}

export interface HierarchyNode {
  id?: string | number;
  name?: string;
  children?: HierarchyNode[];
  [key: string]: any;
}

export interface RegionStats {
  id_region?: string | number;
  nom_region?: string;
  total_evaluations?: number;
  score_moyen?: number;
  [key: string]: any;
}

export interface Periode {
  id_periode?: string | number;
  nom_periode?: string;
  est_active?: boolean;
  date_debut?: string;
  date_fin?: string;
  [key: string]: any;
}

export interface RegleEvaluation {
  id_regle?: string;
  nom_regle?: string;
  description?: string;
  type_evaluation?: string;
  est_active?: boolean;
  criteres?: any[];
  sections?: any[];
  [key: string]: any;
}

export type EvaluationStatus =
  | 'draft'
  | 'brouillon'
  | 'submitted'
  | 'soumis'
  | 'validated'
  | 'validee'
  | 'rejected'
  | 'rejetee'
  | string;

export interface EvaluationNote {
  id_evaluation?: string | number;
  id_competence: string | number;
  note: number;
  commentaire?: string;
  [key: string]: any;
}

export interface Evaluation {
  id?: string | number;
  id_evaluation?: string | number;
  statut?: EvaluationStatus;
  type_evaluation?: string;
  note_globale?: number;
  created_at?: string;
  evalue?: User;
  evaluateur?: User;
  regle?: RegleEvaluation;
  [key: string]: any;
}

export interface EvaluationStats {
  total?: number;
  pending?: number;
  validated?: number;
  rejected?: number;
  [key: string]: any;
}

export interface EvaluationReport {
  id?: string | number;
  title?: string;
  url?: string;
  [key: string]: any;
}

export interface Competency {
  id?: string | number;
  libelle?: string;
  label?: string;
  description?: string;
  category?: string;
  poids?: number;
  [key: string]: any;
}

export interface EvaluationFormTemplate {
  id?: string | number;
  role?: string;
  name?: string;
  title?: string;
  competencies?: Competency[];
  criteres?: any[];
  [key: string]: any;
}

export interface Notification {
  id?: string | number;
  title?: string;
  message?: string;
  status?: 'info' | 'warning' | 'error' | 'success' | string;
  read?: boolean;
  createdAt?: string;
  [key: string]: any;
}
