import api, { getToken } from '../api';
import { User } from '../../types';

const API_URL = '/api/users';

export const userService = {
  /**
   * Récupère tous les utilisateurs avec filtres optionnels
   */
  getAll: async (filters?: { role?: string, region?: string, actif?: boolean, page?: number }) => {
    const response = await api.get(API_URL, { params: filters });
    return response.data;
  },

  /**
   * Récupère un utilisateur spécifique
   */
  getById: async (id: number) => {
    const response = await api.get(`${API_URL}/${id}`);
    return response.data;
  },

  /**
   * Crée un nouvel utilisateur
   */
  create: async (user: Partial<User>) => {
    const response = await api.post(API_URL, user);
    return response.data;
  },

  /**
   * Met à jour un utilisateur existant
   */
  update: async (id: number, user: Partial<User>) => {
    const response = await api.put(`${API_URL}/${id}`, user);
    return response.data;
  },

  /**
   * Supprime un utilisateur
   */
  delete: async (id: number) => {
    const response = await api.delete(`${API_URL}/${id}`);
    return response.data;
  },

  /**
   * Change le rôle d'un utilisateur
   */
  changeRole: async (id: number, idRole: number) => {
    const response = await api.post(`${API_URL}/${id}/change-role`, { id_role: idRole });
    return response.data;
  },

  /**
   * Active ou désactive un utilisateur
   */
  toggleStatus: async (id: number) => {
    const response = await api.post(`${API_URL}/${id}/toggle-status`);
    return response.data;
  },

  /**
   * Réinitialise le mot de passe d'un utilisateur
   */
  resetPassword: async (id: number) => {
    const response = await api.post(`${API_URL}/${id}/reset-password`);
    return response.data;
  },

  /**
   * Récupère les statistiques d'un utilisateur
   */
  getUserStats: async (id: number) => {
    const response = await api.get(`${API_URL}/${id}/stats`);
    return response.data;
  },

  /**
   * Exporte les données utilisateurs au format CSV/Excel
   */
  export: async (format: 'csv' | 'excel' = 'excel', filters?: { role?: string, region?: string }) => {
    const url = new URL(`${window.location.origin}${API_URL}/export`);
    url.searchParams.set('format', format);
    if (filters?.role) url.searchParams.set('role', filters.role);
    if (filters?.region) url.searchParams.set('region', filters.region);

    const response = await fetch(url.toString(), {
      headers: getToken() ? { Authorization: `Bearer ${getToken()}` } : undefined,
    });
    return response.blob();
  },

  /**
   * Importe des utilisateurs depuis un fichier
   */
  import: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post(`${API_URL}/import`, formData);
    return response.data;
  }
};

export default userService;
