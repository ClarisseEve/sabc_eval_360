import axios from 'axios';

const API_URL = '/api/regles';

export const regleService = {
  /**
   * Récupère toutes les règles d'évaluation
   */
  getAll: async (filters?: { active?: boolean, page?: number }) => {
    const response = await axios.get(API_URL, { params: filters });
    return response.data;
  },

  /**
   * Récupère une règle d'évaluation spécifique
   */
  getById: async (id: number) => {
    const response = await axios.get(`${API_URL}/${id}`);
    return response.data;
  },

  /**
   * Crée une nouvelle règle d'évaluation
   */
  create: async (regle: {
    titre: string,
    description?: string,
    active: boolean,
    criteres: Array<{
      libelle: string,
      description?: string,
      poids: number
    }>,
    ponderation: {
      auto_evaluation: number,
      evaluation_pair: number,
      evaluation_manager: number
    }
  }) => {
    const response = await axios.post(API_URL, regle);
    return response.data;
  },

  /**
   * Met à jour une règle d'évaluation
   */
  update: async (id: number, regle: {
    titre?: string,
    description?: string,
    active?: boolean,
    criteres?: Array<{
      id?: number,
      libelle: string,
      description?: string,
      poids: number
    }>,
    ponderation?: {
      auto_evaluation?: number,
      evaluation_pair?: number,
      evaluation_manager?: number
    }
  }) => {
    const response = await axios.put(`${API_URL}/${id}`, regle);
    return response.data;
  },

  /**
   * Supprime une règle d'évaluation
   */
  delete: async (id: number) => {
    const response = await axios.delete(`${API_URL}/${id}`);
    return response.data;
  },

  /**
   * Récupère les règles d'évaluation par rôle
   */
  getReglesByRole: async (idRole: number) => {
    const response = await axios.get(`${API_URL}/role/${idRole}`);
    return response.data;
  }
};

export default regleService;
