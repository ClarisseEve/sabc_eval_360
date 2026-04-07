import api from '../api';

/**
 * Service pour les analyses et rapports avancés
 * Utilise les nouveaux endpoints API
 */
export const analyticsService = {
  /**
   * Récupère les analyses de performance par région
   */
  getPerformanceByRegion: async (filters?: { id_periode?: number }) => {
    const response = await api.get('/api/scores/analytics', { 
      params: { ...filters, group_by: 'region' } 
    });
    return response.data;
  },

  /**
   * Récupère les analyses de performance par rôle
   */
  getPerformanceByRole: async (filters?: { id_periode?: number, id_region?: number }) => {
    const response = await api.get('/api/scores/analytics', { 
      params: { ...filters, group_by: 'role' } 
    });
    return response.data;
  },

  /**
   * Récupère les analyses de performance par compétence
   */
  getPerformanceByCompetency: async (filters?: { id_periode?: number, id_region?: number, id_role?: number }) => {
    const response = await api.get('/api/scores/analytics', { 
      params: { ...filters, group_by: 'competence' } 
    });
    return response.data;
  },

  /**
   * Génère des rapports d'évaluation
   */
  generateEvaluationReports: async (filters?: { 
    id_region?: number, 
    id_periode?: number, 
    id_role?: number 
  }) => {
    const response = await api.get('/api/evaluations/reports', { params: filters });
    return response.data;
  },

  /**
   * Récupère les tendances d'évaluation sur plusieurs périodes
   */
  getEvaluationTrends: async (filters?: { 
    id_region?: number, 
    id_role?: number, 
    nb_periodes?: number 
  }) => {
    const response = await api.get('/api/scores/trends/global', { params: filters });
    return response.data;
  },

  /**
   * Récupère les statistiques d'évaluation
   */
  getEvaluationStats: async (filters?: { 
    id_region?: number, 
    id_periode?: number 
  }) => {
    const response = await api.get('/api/evaluations/stats', { params: filters });
    return response.data;
  }
};

export default analyticsService;
