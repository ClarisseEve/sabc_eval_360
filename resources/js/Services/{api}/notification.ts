import axios from 'axios';
import { Notification } from '../../types';

const API_URL = '/api/notifications';

export const notificationService = {
  /**
   * Récupère toutes les notifications de l'utilisateur connecté
   */
  getAll: async (filters?: { page?: number }) => {
    const response = await axios.get(API_URL, { params: filters });
    return response.data;
  },

  /**
   * Récupère les notifications non lues de l'utilisateur connecté
   */
  getUnreadNotifications: async () => {
    const response = await axios.get(`${API_URL}/unread`);
    return response.data;
  },

  /**
   * Marque une notification comme lue
   */
  markAsRead: async (id: string) => {
    const response = await axios.post(`${API_URL}/${id}/mark-as-read`);
    return response.data;
  },

  /**
   * Marque toutes les notifications comme lues
   */
  markAllAsRead: async () => {
    const response = await axios.post(`${API_URL}/mark-all-as-read`);
    return response.data;
  },

  /**
   * Supprime une notification
   */
  delete: async (id: string) => {
    const response = await axios.delete(`${API_URL}/${id}`);
    return response.data;
  }
};

export default notificationService;
