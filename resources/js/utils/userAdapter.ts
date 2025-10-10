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

  const formattedName = `${user.prenom ?? ''} ${user.nom ?? ''}`.trim();
  const displayName = formattedName
    || user.name
    || user.email
    || user.matricule
    || '';

  const roleCandidates = [user.role_nom, user.role]
    .map((value) => (typeof value === 'string' ? value.trim() : ''))
    .filter((value) => value.length > 0);
  const roleValue = roleCandidates.length > 0 ? roleCandidates.join(' / ') : '';

  const avatar = user.avatar ?? (user as any).photo_url ?? undefined;

  return {
    name: displayName,
    email: user.email || '',
    role: roleValue,
    avatar,
  };
};

export default adaptUserForLayout;
