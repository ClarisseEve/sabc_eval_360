import api from '../api';
import { PerformanceMetrics } from '../../types';

const API_URL = '/api/scores';

export const scoreService = {
  /**
   * Récupère les scores d'un utilisateur
   */
  getUserScores: async (idUtilisateur: number, filters?: { id_periode?: number }) => {
    const response = await api.get(`${API_URL}/user/${idUtilisateur}`, { params: filters });
    return response.data;
  },

  /**
   * Récupère les scores d'une équipe
   */
  getTeamScores: async (idManager: number, filters?: { id_periode?: number }) => {
    const response = await api.get(`${API_URL}/team/${idManager}`, { params: filters });
    return response.data;
  },

  /**
   * Récupère les scores d'une région
   */
  getRegionScores: async (idRegion: number, filters?: { id_periode?: number }) => {
    const response = await api.get(`${API_URL}/region/${idRegion}`, { params: filters });
    return response.data;
  },

  /**
   * Récupère les tendances de score d'un utilisateur
   */
  getUserScoreTrends: async (idUtilisateur: number, filters?: { nb_periodes?: number }) => {
    const response = await api.get(`${API_URL}/trends/${idUtilisateur}`, { params: filters });
    return response.data;
  },

  /**
   * Récupère des analyses avancées sur les scores
   */
  getScoreAnalytics: async (filters?: { 
    id_region?: number, 
    id_role?: number, 
    id_periode?: number 
  }) => {
    const response = await api.get(`${API_URL}/analytics`, { params: filters });
    return response.data;
  }
};

export default scoreService;
