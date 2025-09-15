export interface User {
  id: number;
  name: string; // Champ calculé (nom + prenom)
  nom: string;
  prenom: string;
  email: string;
  matricule: string;  // Clé primaire
  telephone?: string;
  avatar?: string;

  // Informations hiérarchiques et organisationnelles
  role: string; // ou un type Role plus complexe
  role_nom: string; // Dénormalisé
  manager_matricule?: string;
  manager_nom?: string; // Dénormalisé
  region_nom: string; // Dénormalisé
  type_region: 'Tanière' | 'Non-Tanière'; // Dénormalisé
  id_branche: string;
  branche_nom: string; // Dénormalisé
  niveau_hierarchique: number;

  // Dates importantes
  date_prise_poste?: string;
  date_creation_compte?: string;

  // Statuts
  est_actif: boolean;
  est_admin: boolean;
  est_indisponible: boolean;

  // Permet une extensibilité sans erreur TypeScript
  [key: string]: any;
}

export interface PaginatedResponse<T> {
  current_page: number;
  data: T[];
  first_page_url: string;
  from: number;
  last_page: number;
  last_page_url: string;
  links: { url: string | null; label: string; active: boolean }[];
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number;
  total: number;
}
