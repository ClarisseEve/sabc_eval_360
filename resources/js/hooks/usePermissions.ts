import { useCallback } from 'react';
import { useAuthContext } from '@/Context/AuthContext';

// Types pour les permissions
export type Permission = 
  // Permissions d'évaluation
  | 'self_evaluation'      // Auto-évaluation
  | 'peer_evaluation'      // Évaluation des pairs
  | 'evaluate_subordinates' // Évaluation descendante
  | 'validate_evaluations' // Validation des évaluations
  | 'cross_branch'         // Évaluation cross-branch (Commercial/Marketing)
  
  // Permissions de visualisation
  | 'view_analytics'       // Accès aux analytics
  | 'view_all_regions'     // Voir toutes les régions
  | 'view_region'          // Voir une région spécifique
  | 'view_service'         // Voir un service
  | 'view_district'        // Voir un district
  | 'view_team'            // Voir une équipe
  
  // Permissions administratives
  | 'manage_users'         // Gestion des utilisateurs
  | 'manage_roles'         // Gestion des rôles
  | 'manage_evaluations';  // Gestion des évaluations

// Interface pour les règles d'évaluation
export interface EvaluationRules {
  canSelfEvaluate: boolean;
  canEvaluatePeers: boolean;
  canEvaluateSubordinates: boolean;
  canCrossBranch: boolean;
  canBeEvaluated: boolean;
}

/**
 * Hook personnalisé pour gérer les permissions selon les règles métier SABC
 * Conforme aux règles SABC pour les hooks et les permissions d'évaluation 360°
 */
export const usePermissions = () => {
  const { user } = useAuthContext();

  // Vérifier si l'utilisateur a une permission spécifique
  const hasPermission = useCallback((permission: Permission): boolean => {
    if (!user) return false;
    
    // Mapping des rôles aux permissions selon les règles SABC
    const rolePermissions: Record<string, Permission[]> = {
      // Directeur Régional
      'DR': [
        'evaluate_subordinates', 'validate_evaluations', 'cross_branch',
        'view_analytics', 'view_all_regions', 'manage_evaluations'
      ],
      
      // Chef de Département Tanière Territoriale
      'CDTT': [
        'evaluate_subordinates', 'validate_evaluations', 'cross_branch',
        'view_analytics', 'view_region', 'manage_evaluations'
      ],
      
      // Chef de Service Commercial
      'CSC': [
        'self_evaluation', 'peer_evaluation', 'evaluate_subordinates', 'validate_evaluations',
        'view_analytics', 'view_service', 'manage_evaluations'
      ],
      
      // Responsable Trade Marketing
      'RTM': [
        'self_evaluation', 'peer_evaluation', 'evaluate_subordinates', 'validate_evaluations',
        'view_analytics', 'view_service', 'manage_evaluations'
      ],
      
      // Chef de District Vente
      'CDV': [
        'self_evaluation', 'peer_evaluation', 'evaluate_subordinates', 'validate_evaluations',
        'view_analytics', 'view_district', 'manage_evaluations'
      ],
      
      // Trade Marketing Officer
      'TMO': [
        'self_evaluation', 'peer_evaluation', 'evaluate_subordinates', 'validate_evaluations',
        'view_analytics', 'view_district', 'manage_evaluations'
      ],
      
      // Chef de Secteur
      'CDS': [
        'self_evaluation', 'peer_evaluation',
        'view_analytics', 'view_team'
      ],
      
      // Assistant de Secteur
      'AS': [
        'self_evaluation', 'peer_evaluation',
        'view_analytics', 'view_team'
      ],
      
      // Superviseur Sponsoring
      'SS': [
        'self_evaluation', 'peer_evaluation',
        'view_analytics', 'view_team'
      ],
      
      // Superviseur Régional Marketing Opérationnel
      'SRMO': [
        'self_evaluation', 'peer_evaluation',
        'view_analytics', 'view_team'
      ],
      
      // Administrateur
      'ADMIN': [
        'self_evaluation', 'peer_evaluation', 'evaluate_subordinates', 'validate_evaluations', 'cross_branch',
        'view_analytics', 'view_all_regions', 'view_region', 'view_service', 'view_district', 'view_team',
        'manage_users', 'manage_roles', 'manage_evaluations'
      ]
    };
    
    // Vérifier si le rôle de l'utilisateur a la permission demandée
    return rolePermissions[user.role]?.includes(permission) || false;
  }, [user]);

  // Obtenir les règles d'évaluation pour un rôle spécifique
  const getEvaluationRules = useCallback((role: string): EvaluationRules => {
    // Règles d'évaluation selon la matrice de permissions SABC
    const evaluationRules: Record<string, EvaluationRules> = {
      // Directeur Régional - Ne peut pas s'auto-évaluer ni être évalué par des pairs
      'DR': {
        canSelfEvaluate: false,
        canEvaluatePeers: false,
        canEvaluateSubordinates: true,
        canCrossBranch: true,
        canBeEvaluated: false
      },
      
      // Chef de Département Tanière Territoriale - Ne peut pas s'auto-évaluer ni être évalué par des pairs
      'CDTT': {
        canSelfEvaluate: false,
        canEvaluatePeers: false,
        canEvaluateSubordinates: true,
        canCrossBranch: true,
        canBeEvaluated: false
      },
      
      // Chef de Service Commercial - Peut s'auto-évaluer, évaluer ses pairs et ses subordonnés
      'CSC': {
        canSelfEvaluate: true,
        canEvaluatePeers: true,
        canEvaluateSubordinates: true,
        canCrossBranch: false,
        canBeEvaluated: true
      },
      
      // Responsable Trade Marketing - Peut s'auto-évaluer, évaluer ses pairs et ses subordonnés
      'RTM': {
        canSelfEvaluate: true,
        canEvaluatePeers: true,
        canEvaluateSubordinates: true,
        canCrossBranch: false,
        canBeEvaluated: true
      },
      
      // Chef de District Vente - Peut s'auto-évaluer, évaluer ses pairs et ses subordonnés
      'CDV': {
        canSelfEvaluate: true,
        canEvaluatePeers: true,
        canEvaluateSubordinates: true,
        canCrossBranch: false,
        canBeEvaluated: true
      },
      
      // Trade Marketing Officer - Peut s'auto-évaluer, évaluer ses pairs et ses subordonnés
      'TMO': {
        canSelfEvaluate: true,
        canEvaluatePeers: true,
        canEvaluateSubordinates: true,
        canCrossBranch: false,
        canBeEvaluated: true
      },
      
      // Chef de Secteur - Peut s'auto-évaluer et évaluer ses pairs, mais pas de subordonnés
      'CDS': {
        canSelfEvaluate: true,
        canEvaluatePeers: true,
        canEvaluateSubordinates: false,
        canCrossBranch: false,
        canBeEvaluated: true
      },
      
      // Assistant de Secteur - Peut s'auto-évaluer et évaluer ses pairs, mais pas de subordonnés
      'AS': {
        canSelfEvaluate: true,
        canEvaluatePeers: true,
        canEvaluateSubordinates: false,
        canCrossBranch: false,
        canBeEvaluated: true
      },
      
      // Superviseur Sponsoring - Peut s'auto-évaluer et évaluer ses pairs, mais pas de subordonnés
      'SS': {
        canSelfEvaluate: true,
        canEvaluatePeers: true,
        canEvaluateSubordinates: false,
        canCrossBranch: false,
        canBeEvaluated: true
      },
      
      // Superviseur Régional Marketing Opérationnel - Peut s'auto-évaluer et évaluer ses pairs, mais pas de subordonnés
      'SRMO': {
        canSelfEvaluate: true,
        canEvaluatePeers: true,
        canEvaluateSubordinates: false,
        canCrossBranch: false,
        canBeEvaluated: true
      }
    };
    
    // Retourner les règles pour le rôle demandé ou des règles par défaut
    return evaluationRules[role] || {
      canSelfEvaluate: false,
      canEvaluatePeers: false,
      canEvaluateSubordinates: false,
      canCrossBranch: false,
      canBeEvaluated: false
    };
  }, []);

  // Vérifier si l'utilisateur peut évaluer un autre utilisateur
  const canEvaluate = useCallback((targetUser: { id: string; role: string; region: string; department: string }): boolean => {
    if (!user) return false;
    
    // Obtenir les règles d'évaluation pour l'utilisateur courant
    const currentUserRules = getEvaluationRules(user.role);
    
    // Auto-évaluation
    if (user.id === targetUser.id) {
      return currentUserRules.canSelfEvaluate;
    }
    
    // Vérifier si les utilisateurs sont dans la même région (règle obligatoire)
    if (user.region !== targetUser.region) {
      return false;
    }
    
    // Évaluation des pairs
    if (user.role === targetUser.role) {
      return currentUserRules.canEvaluatePeers;
    }
    
    // Vérifier si l'utilisateur cible peut être évalué
    const targetUserRules = getEvaluationRules(targetUser.role);
    if (!targetUserRules.canBeEvaluated) {
      return false;
    }
    
    // Vérifier si les départements sont différents (Commercial vs Marketing)
    const isDifferentDepartment = user.department !== targetUser.department;
    
    // Si départements différents, vérifier si l'utilisateur peut faire du cross-branch
    if (isDifferentDepartment && !currentUserRules.canCrossBranch) {
      return false;
    }
    
    // Vérifier la hiérarchie pour l'évaluation descendante
    // Cette fonction nécessiterait un appel API pour vérifier la relation hiérarchique
    // Pour l'instant, nous supposons que c'est vrai si l'utilisateur peut évaluer des subordonnés
    return currentUserRules.canEvaluateSubordinates;
  }, [user, getEvaluationRules]);

  // Vérifier si l'utilisateur peut valider une évaluation
  const canValidateEvaluation = useCallback((evaluationData: { evaluator_id: string; evaluatee_id: string }): boolean => {
    if (!user) return false;
    
    // Vérifier si l'utilisateur a la permission de valider des évaluations
    if (!hasPermission('validate_evaluations')) {
      return false;
    }
    
    // Un utilisateur ne peut pas valider sa propre évaluation
    if (evaluationData.evaluator_id === user.id || evaluationData.evaluatee_id === user.id) {
      return false;
    }
    
    // Pour une validation plus précise, il faudrait vérifier la relation hiérarchique
    // entre l'évaluateur et l'évalué, et s'assurer que l'utilisateur actuel est leur supérieur
    
    return true;
  }, [user, hasPermission]);

  return {
    hasPermission,
    getEvaluationRules,
    canEvaluate,
    canValidateEvaluation,
    currentUserRules: user ? getEvaluationRules(user.role) : null
  };
};

export default usePermissions;