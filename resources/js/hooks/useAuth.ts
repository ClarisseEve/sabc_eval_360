import { useCallback, useState } from 'react';
import { useAuthContext } from '@/Context/AuthContext';
import { router } from '@inertiajs/react';

/**
 * Hook personnalisé pour la gestion de l'authentification
 * Conforme aux règles SABC pour les hooks
 */
export const useAuth = () => {
  const auth = useAuthContext();
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
      router.visit('/login');
      return true;
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      return false;
    } finally {
      setProcessing(false);
    }
  }, [auth]);

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

  return {
    user: auth.user,
    isAuthenticated: auth.isAuthenticated,
    isLoading: auth.isLoading || processing,
    login,
    logout,
    errors,
    hasPermission,
    canEvaluate,
    forgotPassword: auth.forgotPassword,
    resetPassword: auth.resetPassword,
    updateProfile: auth.updateProfile
  };
};

export default useAuth;