// Define the user type directly to avoid import issues
interface AuthUser {
  matricule?: string;
  email?: string;
  nom?: string;
  prenom?: string;
  name?: string;
  role?: string;
  role_nom?: string;
  avatar?: string;
  est_admin?: boolean;
}

/**
 * Adapte un utilisateur du système d'authentification au format attendu par AppLayout
 * Conforme aux règles SABC pour les utilitaires
 */
export const adaptUserForLayout = (user: AuthUser | null | undefined): {
  name: string;
  email: string;
  role: string;
  avatar?: string;
} => {
  if (!user) {
    return {
      name: '',
      email: '',
      role: '',
    };
  }

  return {
    name: `${user.nom || ''} ${user.prenom || ''}`.trim(),
    email: user.email || '',
    role: user.role_nom || '',
    avatar: user.avatar,
  };
};

export default adaptUserForLayout;
