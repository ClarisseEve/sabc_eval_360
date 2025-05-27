import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';
import { usePermissions } from './usePermissions';

// Types pour les compétences d'évaluation
export interface Competency {
  id: string;
  name: string;
  category: string;
  description: string;
  levels: Array<{
    level: number;
    description: string;
  }>;
}

// Types pour les formulaires d'évaluation
export interface EvaluationFormTemplate {
  id: string;
  role: string;
  title: string;
  description: string;
  competencies: Competency[];
}

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
      const response = await fetch('/api/evaluation-forms/templates');
      if (!response.ok) throw new Error('Erreur lors du chargement des modèles de formulaires');
      
      const data = await response.json();
      setFormTemplates(data);
      return data;
    } catch (err) {
      setError('Impossible de charger les modèles de formulaires');
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
      const response = await fetch(`/api/evaluation-forms/templates/${role}`);
      if (!response.ok) throw new Error(`Erreur lors du chargement du formulaire pour le rôle ${role}`);
      
      const data = await response.json();
      setCurrentTemplate(data);
      return data;
    } catch (err) {
      setError(`Impossible de charger le formulaire pour le rôle ${role}`);
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
  const getEvaluationLevelDescriptions = useCallback(() => {
    return {
      1: 'Insuffisant - Compétence non maîtrisée, nécessite une formation approfondie',
      2: 'Basique - Compétence partiellement maîtrisée, nécessite un accompagnement',
      3: 'Satisfaisant - Compétence correctement maîtrisée, autonomie suffisante',
      4: 'Bon - Compétence bien maîtrisée, peut former d\'autres collaborateurs',
      5: 'Excellent - Compétence parfaitement maîtrisée, référent dans ce domaine'
    };
  }, []);

  // Obtenir les catégories de compétences pour un rôle spécifique
  const getCompetencyCategoriesForRole = useCallback((role: string): string[] => {
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
  }, []);

  // Obtenir un message d'erreur approprié si un rôle ne peut pas être évalué
  const getNonEvaluableRoleMessage = useCallback((role: string): string => {
    if (role === 'DR' || role === 'CDTT') {
      return `Les ${role === 'DR' ? 'Directeurs Régionaux' : 'Chefs de Département Tanière Territoriale'} ne peuvent pas être évalués selon les règles SABC.`;
    }
    return `Le rôle ${role} ne peut pas être évalué actuellement.`;
  }, []);

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
    getNonEvaluableRoleMessage
  };
};

export default useEvaluationForms;
