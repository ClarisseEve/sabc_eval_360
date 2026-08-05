import { useCallback, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/Contexts/AuthContext';

/**
 * Hook personnalisé pour la gestion de l'authentification
 * Conforme aux règles SABC pour les hooks
 */
export const useAuth = () => {
  const auth = useAuthContext();
  const navigate = useNavigate();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState<boolean>(false);

  // Fonction de connexion avec gestion des erreurs
  const login = useCallback(async (email: string, password: string, remember: boolean = false) => {
    setProcessing(true);
    setErrors({});
    
    try {
      await auth.login(email, password, remember);
      return true;
    } catch (error: any) {
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        setErrors({ email: 'Une erreur est survenue lors de la connexion.' });
      }
      return false;
    } finally {
      setProcessing(false);
    }
  }, [auth]);

  // Fonction de déconnexion avec redirection
  const logout = useCallback(async () => {
    setProcessing(true);
    
    try {
      await auth.logout();
      navigate('/login', { replace: true });
      return true;
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      return false;
    } finally {
      setProcessing(false);
    }
  }, [auth, navigate]);

  // Fonction pour vérifier les permissions basées sur le rôle
  const hasPermission = useCallback((permission: string): boolean => {
    if (!auth.user) return false;
    
    // Mapping des rôles aux permissions selon les règles SABC
    const rolePermissions: Record<string, string[]> = {
      'DR': ['view_analytics', 'manage_evaluations', 'view_all_regions', 'cross_branch'],
      'CDTT': ['view_analytics', 'manage_evaluations', 'view_region', 'cross_branch'],
      'CSC': ['view_analytics', 'manage_evaluations', 'view_service', 'evaluate_subordinates'],
      'RTM': ['view_analytics', 'manage_evaluations', 'view_service', 'evaluate_subordinates'],
      'CDV': ['view_analytics', 'manage_evaluations', 'view_district', 'evaluate_subordinates'],
      'TMO': ['view_analytics', 'manage_evaluations', 'view_district', 'evaluate_subordinates'],
      'CDS': ['view_analytics', 'self_evaluation', 'peer_evaluation'],
      'AS': ['view_analytics', 'self_evaluation', 'peer_evaluation']
    };
    
    // Vérifier si le rôle de l'utilisateur a la permission demandée
    return rolePermissions[auth.user.role]?.includes(permission) || false;
  }, [auth.user]);

  // Vérifier si l'utilisateur peut évaluer un autre utilisateur
  const canEvaluate = useCallback((targetUserId: string): boolean => {
    if (!auth.user) return false;
    
    // Implémenter la logique selon les règles métier SABC
    // Cette fonction devrait faire un appel API pour vérifier les relations hiérarchiques
    
    return true; // Temporaire, à remplacer par la vraie logique
  }, [auth.user]);

  // Formater les données utilisateur pour assurer la cohérence dans toute l'application
  const standardizedUser = useMemo(() => {
    if (!auth.user) return null;
    
    // Créer un nouvel objet avec les propriétés standardisées
    const standardized = {
      // Informations pour l'affichage dans le header/sidebar
      name: auth.user.nom && auth.user.prenom 
        ? `${auth.user.prenom} ${auth.user.nom}` 
        : auth.user.name || 'Utilisateur SABC',
      role: auth.user.role_nom || auth.user.role || 'Utilisateur',
      avatar: auth.user.avatar,
      
      // Informations organisationnelles
      region: auth.user.region_nom || auth.user.region || '',
      department: auth.user.branche?.nom_branche || auth.user.department || ''
    };
    
    // Fusionner avec les données originales
    return {
      ...auth.user,
      ...standardized
    };
  }, [auth.user]);

  return {
    user: standardizedUser,
    isAuthenticated: auth.isAuthenticated,
    isLoading: auth.isLoading || processing,
    login,
    logout,
    errors,
    updateProfile: auth.updateProfile,
    hasPermission,
    canEvaluate
  };
};

export default useAuth;