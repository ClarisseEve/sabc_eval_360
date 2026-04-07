import api from '../api';
import { PerformanceMetrics } from '../../types';

/**
 * Service pour les données du tableau de bord
 * Utilise les nouveaux endpoints API
 */
export const dashboardService = {
  /**
   * Récupère les données du tableau de bord pour l'utilisateur connecté
   */
  getUserDashboard: async () => {
    // Utilise les services existants pour composer le dashboard
    const [evaluationsResponse, statsResponse] = await Promise.all([
      api.get('/api/evaluations/pending'),
      api.get('/api/scores/user/current')
    ]);
    
    return {
      pendingEvaluations: evaluationsResponse.data,
      performanceMetrics: statsResponse.data
    };
  },

  /**
   * Récupère les données du tableau de bord pour un manager
   */
  getManagerDashboard: async () => {
    const [teamResponse, evaluationsResponse, regionResponse] = await Promise.all([
      api.get('/api/scores/team/current'),
      api.get('/api/evaluations/to-validate'),
      api.get('/api/hierarchy/stats/region/current')
    ]);
    
    return {
      teamPerformance: teamResponse.data,
      pendingValidations: evaluationsResponse.data,
      regionStats: regionResponse.data
    };
  },

  /**
   * Récupère les données du tableau de bord pour un directeur régional
   */
  getDirectorDashboard: async (idRegion: number) => {
    const [regionScores, hierarchyStats, evaluationStats] = await Promise.all([
      api.get(`/api/scores/region/${idRegion}`),
      api.get(`/api/hierarchy/stats/region/${idRegion}`),
      api.get('/api/evaluations/stats', { params: { id_region: idRegion } })
    ]);
    
    return {
      regionPerformance: regionScores.data,
      hierarchyStats: hierarchyStats.data,
      evaluationStats: evaluationStats.data
    };
  }
};

export default dashboardService;
