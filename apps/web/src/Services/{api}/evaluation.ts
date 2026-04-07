import api from '../api';
import { Evaluation, EvaluationNote, EvaluationStats, EvaluationReport } from '../../types';

const API_URL = '/api/evaluations';

export const evaluationService = {
  /**
   * Récupère toutes les évaluations avec filtres optionnels
   */
  getAll: async (filters?: { periode?: number, statut?: string, page?: number }) => {
    const response = await api.get(API_URL, { params: filters });
    return response.data;
  },

  /**
   * Récupère une évaluation spécifique
   */
  getById: async (id: number) => {
    const response = await api.get(`${API_URL}/${id}`);
    return response.data;
  },

  /**
   * Crée une nouvelle évaluation
   */
  create: async (evaluation: { id_evalue: number, id_type_evaluation: number }) => {
    const response = await api.post(API_URL, evaluation);
    return response.data;
  },

  /**
   * Met à jour les notes d'une évaluation
   */
  updateNotes: async (id: number, notes: EvaluationNote[]) => {
    const response = await api.put(`${API_URL}/${id}/notes`, { notes });
    return response.data;
  },

  /**
   * Soumet une évaluation pour validation
   */
  submit: async (id: number, commentaire?: string) => {
    const response = await api.post(`${API_URL}/${id}/submit`, { commentaire });
    return response.data;
  },

  /**
   * Valide une évaluation
   */
  validate: async (id: number, commentaire?: string) => {
    const response = await api.post(`${API_URL}/${id}/validate`, { commentaire });
    return response.data;
  },

  /**
   * Rejette une évaluation
   */
  reject: async (id: number, motif: string) => {
    const response = await api.post(`${API_URL}/${id}/reject`, { motif });
    return response.data;
  },

  /**
   * Récupère les évaluations en attente pour l'utilisateur connecté
   */
  getPendingEvaluations: async () => {
    const response = await api.get(`${API_URL}/pending`);
    return response.data;
  },

  /**
   * Récupère les évaluations à valider pour l'utilisateur connecté
   */
  getEvaluationsToValidate: async () => {
    const response = await api.get(`${API_URL}/to-validate`);
    return response.data;
  },

  /**
   * Récupère l'historique des évaluations d'un utilisateur
   */
  getEvaluationHistory: async (userId: number, filters?: { page?: number, periode?: number }) => {
    const response = await api.get(`${API_URL}/history/${userId}`, { params: filters });
    return response.data;
  },

  /**
   * Envoie des rappels pour les évaluations en retard
   */
  sendReminders: async (options?: { id_periode?: number, jours_retard?: number }) => {
    const response = await api.post(`${API_URL}/reminders`, options);
    return response.data;
  },

  /**
   * Récupère les utilisateurs éligibles pour évaluation
   */
  getEligibleUsers: async (typeEvaluation?: number) => {
    const response = await api.get(`${API_URL}/eligible-users`, { 
      params: { type_evaluation: typeEvaluation } 
    });
    return response.data;
  },

  /**
   * Génère des rapports d'évaluation
   */
  generateReports: async (filters?: { 
    id_region?: number, 
    id_periode?: number, 
    id_role?: number 
  }) => {
    const response = await api.get(`${API_URL}/reports`, { params: filters });
    return response.data;
  },

  /**
   * Récupère les statistiques d'évaluation
   */
  getEvaluationStats: async (filters?: { 
    id_region?: number, 
    id_periode?: number 
  }): Promise<EvaluationStats> => {
    const response = await api.get(`${API_URL}/stats`, { params: filters });
    return response.data;
  }
};

export default evaluationService;
