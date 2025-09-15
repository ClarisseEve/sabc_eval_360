/**
 * Types communs utilisés dans l'application SABC Évaluation 360°
 */

/**
 * Configuration d'une route dans l'application
 */
export interface RouteConfig {
  /**
   * Nom de la route (doit correspondre aux noms de routes Laravel)
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
