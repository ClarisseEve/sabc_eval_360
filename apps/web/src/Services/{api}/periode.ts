import api from '../api';

const API_URL = '/api/periodes';

export const periodeService = {
  /**
   * Récupère toutes les périodes d'évaluation
   */
  getAll: async (filters?: { active?: boolean, page?: number }) => {
    const response = await api.get(API_URL, { params: filters });
    return response.data;
  },

  /**
   * Récupère une période d'évaluation spécifique
   */
  getById: async (id: number) => {
    const response = await api.get(`${API_URL}/${id}`);
    return response.data;
  },

  /**
   * Crée une nouvelle période d'évaluation
   */
  create: async (periode: {
    titre: string,
    date_debut: string,
    date_fin: string,
    active: boolean,
    description?: string
  }) => {
    const response = await api.post(API_URL, periode);
    return response.data;
  },

  /**
   * Met à jour une période d'évaluation
   */
  update: async (id: number, periode: {
    titre?: string,
    date_debut?: string,
    date_fin?: string,
    active?: boolean,
    description?: string
  }) => {
    const response = await api.put(`${API_URL}/${id}`, periode);
    return response.data;
  },

  /**
   * Supprime une période d'évaluation
   */
  delete: async (id: number) => {
    const response = await api.delete(`${API_URL}/${id}`);
    return response.data;
  },

  /**
   * Récupère les périodes actives
   */
  getActivePeriodes: async () => {
    const response = await api.get(`${API_URL}/active`);
    return response.data;
  }
};

export default periodeService;
