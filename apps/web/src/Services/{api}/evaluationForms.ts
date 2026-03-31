import { EvaluationFormTemplate, Competency } from '../../types';

/**
 * Service pour la gestion des formulaires d'évaluation
 * Conforme aux règles métier SABC pour les évaluations 360°
 */
export const evaluationFormsService = {
  /**
   * Récupère tous les modèles de formulaires disponibles
   */
  getAll: async (): Promise<EvaluationFormTemplate[]> => {
    const response = await fetch('/api/evaluation-forms/templates');
    return await response.json();
  },

  /**
   * Récupère un modèle de formulaire spécifique par rôle
   */
  getByRole: async (role: string): Promise<EvaluationFormTemplate> => {
    const response = await fetch(`/api/evaluation-forms/templates/${role}`);
    return await response.json();
  },

  /**
   * Récupère les compétences pour un rôle spécifique
   */
  getCompetenciesForRole: async (role: string): Promise<Competency[]> => {
    const response = await fetch(`/api/evaluation-forms/competencies/${role}`);
    return await response.json();
  },

  /**
   * Récupère les descriptions des niveaux d'évaluation (échelle 1-5)
   */
  getEvaluationLevels: async () => {
    const response = await fetch('/api/evaluation-forms/levels');
    return await response.json();
  }
};

export default evaluationFormsService;
