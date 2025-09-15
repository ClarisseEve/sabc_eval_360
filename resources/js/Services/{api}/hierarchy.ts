import axios from 'axios';
import { User } from '../../types';

const API_URL = '/api/hierarchy';

export const hierarchyService = {
  /**
   * Récupère la hiérarchie d'une région spécifique
   */
  getHierarchieRegion: async (idRegion: number) => {
    const response = await axios.get(`${API_URL}/region/${idRegion}`);
    return response.data;
  },

  /**
   * Récupère les subordonnés directs de l'utilisateur connecté
   */
  getSubordonnesDirects: async () => {
    const response = await axios.get(`${API_URL}/subordinates/direct`);
    return response.data;
  },

  /**
   * Récupère tous les subordonnés (directs et indirects) de l'utilisateur connecté
   */
  getTousSubordonnes: async () => {
    const response = await axios.get(`${API_URL}/subordinates/all`);
    return response.data;
  },

  /**
   * Récupère la chaîne hiérarchique de l'utilisateur connecté
   */
  getChaineHierarchique: async () => {
    const response = await axios.get(`${API_URL}/chain`);
    return response.data;
  },

  /**
   * Vérifie si un utilisateur peut superviser un autre utilisateur
   */
  verifierSupervision: async (idSuperviseur: number, idSubordonne: number) => {
    const response = await axios.post(`${API_URL}/verify-supervision`, {
      id_superviseur: idSuperviseur,
      id_subordonne: idSubordonne
    });
    return response.data;
  },

  /**
   * Valide l'assignation d'un manager à un utilisateur
   */
  validerAssignationManager: async (idUtilisateur: number, idManager: number) => {
    const response = await axios.post(`${API_URL}/validate-manager`, {
      id_utilisateur: idUtilisateur,
      id_manager: idManager
    });
    return response.data;
  },

  /**
   * Assigne un manager à un utilisateur
   */
  assignerManager: async (idUtilisateur: number, idManager: number) => {
    const response = await axios.post(`${API_URL}/assign-manager`, {
      id_utilisateur: idUtilisateur,
      id_manager: idManager
    });
    return response.data;
  },

  /**
   * Récupère les managers éligibles pour un utilisateur
   */
  getManagersEligibles: async (idUtilisateur: number) => {
    const response = await axios.get(`${API_URL}/eligible-managers/${idUtilisateur}`);
    return response.data;
  },

  /**
   * Récupère les statistiques d'une région
   */
  getStatistiquesRegion: async (idRegion: number) => {
    const response = await axios.get(`${API_URL}/stats/region/${idRegion}`);
    return response.data;
  }
};

export default hierarchyService;
