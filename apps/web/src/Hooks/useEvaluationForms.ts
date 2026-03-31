import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';
import { usePermissions } from './usePermissions';
import { evaluationFormsService } from '../Services/{api}';
import { Competency, EvaluationFormTemplate } from '../types';

// Utilisation des types depuis le fichier types/index.ts

/**
 * Hook personnalisé pour gérer les formulaires d'évaluation spécifiques à chaque rôle
 * Conforme aux règles métier SABC pour les évaluations 360°
 */
export const useEvaluationForms = () => {
  const { user } = useAuth();
  const { getEvaluationRules } = usePermissions();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [formTemplates, setFormTemplates] = useState<EvaluationFormTemplate[]>([]);
  const [currentTemplate, setCurrentTemplate] = useState<EvaluationFormTemplate | null>(null);

  // Charger tous les modèles de formulaires disponibles
  const loadFormTemplates = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await evaluationFormsService.getAll();
      setFormTemplates(data);
      return data;
    } catch (err: any) {
      setError(err.message || 'Impossible de charger les modèles de formulaires');
      console.error(err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Charger un modèle de formulaire spécifique par rôle
  const loadFormTemplateByRole = useCallback(async (role: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await evaluationFormsService.getByRole(role);
      setCurrentTemplate(data);
      return data;
    } catch (err: any) {
      setError(err.message || `Impossible de charger le formulaire pour le rôle ${role}`);
      console.error(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Vérifier si un rôle peut être évalué selon les règles SABC
  const canRoleBeEvaluated = useCallback((role: string): boolean => {
    // Selon les règles métier SABC, DR et CDTT ne peuvent pas être évalués
    if (role === 'DR' || role === 'CDTT') {
      return false;
    }
    
    // Pour les autres rôles, vérifier les règles d'évaluation
    const evaluationRules = getEvaluationRules(role);
    return evaluationRules.canBeEvaluated;
  }, [getEvaluationRules]);

  // Obtenir les descriptions des niveaux d'évaluation (échelle 1-5)
  const getEvaluationLevelDescriptions = useCallback(async () => {
    try {
      return await evaluationFormsService.getEvaluationLevels();
    } catch (err) {
      console.error("Erreur lors du chargement des niveaux d'évaluation:", err);
      // Fallback aux valeurs par défaut en cas d'erreur
      return {
        1: 'Insuffisant - Compétence non maîtrisée, nécessite une formation approfondie',
        2: 'Basique - Compétence partiellement maîtrisée, nécessite un accompagnement',
        3: 'Satisfaisant - Compétence correctement maîtrisée, autonomie suffisante',
        4: 'Bon - Compétence bien maîtrisée, peut former d\'autres collaborateurs',
        5: 'Excellent - Compétence parfaitement maîtrisée, référent dans ce domaine'
      };
    }
  }, []);

  // Obtenir les catégories de compétences pour un rôle spécifique
  const getCompetencyCategoriesForRole = useCallback(async (role: string): Promise<string[]> => {
    try {
      const competencies = await evaluationFormsService.getCompetenciesForRole(role);
      // Extraire les catégories uniques des compétences
      return [...new Set(competencies.map(comp => comp.category))] as string[];
    } catch (err) {
      console.error(`Erreur lors du chargement des compétences pour le rôle ${role}:`, err);
      // Fallback aux valeurs par défaut en cas d'erreur
      switch (role) {
        case 'CSC':
          return ['Compétences techniques', 'Compétences analytiques', 'Compétences managériales', 'Compétences métier', 'Compétences personnelles'];
        case 'CDV':
          return ['Compétences techniques', 'Compétences analytiques', 'Compétences organisationnelles', 'Compétences de leadership', 'Compétences relationnelles'];
        case 'CDS':
          return ['Compétences techniques', 'Compétences analytiques', 'Compétences organisationnelles', 'Compétences relationnelles'];
        case 'RTM':
          return ['Compétences techniques', 'Compétences analytiques', 'Compétences managériales', 'Compétences marketing', 'Compétences personnelles'];
        case 'TMO':
          return ['Compétences techniques', 'Compétences analytiques', 'Compétences marketing', 'Compétences organisationnelles', 'Compétences relationnelles'];
        case 'SS':
          return ['Compétences techniques', 'Compétences marketing', 'Compétences relationnelles', 'Compétences organisationnelles'];
        case 'AS':
          return ['Compétences techniques', 'Compétences administratives', 'Compétences relationnelles', 'Compétences organisationnelles'];
        case 'SRMO':
          return ['Compétences techniques', 'Compétences marketing', 'Compétences managériales', 'Compétences relationnelles'];
        default:
          return ['Compétences techniques', 'Compétences relationnelles', 'Compétences organisationnelles'];
      }
    }
  }, []);

  // Obtenir un message d'erreur approprié si un rôle ne peut pas être évalué
  const getNonEvaluableRoleMessage = useCallback((role: string): string => {
    if (role === 'DR' || role === 'CDTT') {
      return `Les ${role === 'DR' ? 'Directeurs Régionaux' : 'Chefs de Département Tanière Territoriale'} ne peuvent pas être évalués selon les règles SABC.`;
    }
    return `Le rôle ${role} ne peut pas être évalué actuellement.`;
  }, []);

  // Méthode synchrone pour vérifier rapidement les catégories sans appel API
  const getDefaultCompetencyCategoriesForRole = (role: string): string[] => {
    switch (role) {
      // Rôles de direction
      case 'DR':
        return ['Compétences stratégiques', 'Compétences de leadership', 'Compétences managériales', 'Compétences décisionnelles', 'Compétences relationnelles'];
      case 'CDTT':
        return ['Compétences stratégiques', 'Compétences de leadership', 'Compétences managériales', 'Compétences commerciales', 'Compétences relationnelles'];
        
      // Rôles commerciaux
      case 'CSC':
        return ['Compétences techniques', 'Compétences analytiques', 'Compétences managériales', 'Compétences métier', 'Compétences personnelles'];
      case 'CDV':
        return ['Compétences techniques', 'Compétences analytiques', 'Compétences organisationnelles', 'Compétences de leadership', 'Compétences relationnelles'];
      case 'CDS':
        return ['Compétences techniques', 'Compétences analytiques', 'Compétences organisationnelles', 'Compétences relationnelles'];
        
      // Rôles marketing
      case 'RTM':
        return ['Compétences techniques', 'Compétences analytiques', 'Compétences managériales', 'Compétences marketing', 'Compétences personnelles'];
      case 'TMO':
        return ['Compétences techniques', 'Compétences analytiques', 'Compétences marketing', 'Compétences organisationnelles', 'Compétences relationnelles'];
      case 'SRMO':
        return ['Compétences techniques', 'Compétences marketing', 'Compétences managériales', 'Compétences relationnelles'];
      case 'SS':
        return ['Compétences techniques', 'Compétences marketing', 'Compétences relationnelles', 'Compétences organisationnelles'];
      case 'AS':
        return ['Compétences techniques', 'Compétences administratives', 'Compétences relationnelles', 'Compétences organisationnelles'];
        
      // Fallback pour tout autre rôle
      default:
        return ['Compétences techniques', 'Compétences relationnelles', 'Compétences organisationnelles'];
    }
  };

  // Méthode synchrone pour obtenir rapidement les niveaux sans appel API
  const getDefaultEvaluationLevelDescriptions = () => {
    return {
      1: 'Insuffisant - Compétence non maîtrisée',
      2: 'Basique - Compétence partiellement maîtrisée',
      3: 'Satisfaisant - Compétence correctement maîtrisée',
      4: 'Bon - Compétence bien maîtrisée',
      5: 'Excellent - Compétence parfaitement maîtrisée'
    };
  };

  return {
    loading,
    error,
    formTemplates,
    currentTemplate,
    loadFormTemplates,
    loadFormTemplateByRole,
    canRoleBeEvaluated,
    getEvaluationLevelDescriptions,
    getCompetencyCategoriesForRole,
    getNonEvaluableRoleMessage,
    // Ajout des méthodes synchrones pour compatibilité avec le code existant
    getDefaultCompetencyCategoriesForRole,
    getDefaultEvaluationLevelDescriptions
  };
};

export default useEvaluationForms;
