import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';
import { regleService } from '../Services/{api}';
import { RegleEvaluation } from '../types';

/**
 * Hook personnalisé pour la gestion des règles d'évaluation
 * Conforme aux règles SABC pour les hooks et les règles d'évaluation
 * Utilise le nouveau service de règles
 */
export const useRegles = () => {
  const { hasPermission } = useAuth();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [regles, setRegles] = useState<RegleEvaluation[]>([]);
  const [currentRegle, setCurrentRegle] = useState<RegleEvaluation | null>(null);

  /**
   * Récupère toutes les règles d'évaluation
   */
  const getAllRegles = useCallback(async (filters?: { active?: boolean, page?: number }) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await regleService.getAll(filters);
      setRegles(data);
      return data;
    } catch (err: any) {
      setError(err.message || 'Impossible de récupérer les règles d\'évaluation');
      console.error(err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Récupère une règle d'évaluation spécifique
   */
  const getRegleById = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await regleService.getById(id);
      setCurrentRegle(data);
      return data;
    } catch (err: any) {
      setError(err.message || 'Impossible de récupérer la règle d\'évaluation');
      console.error(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Récupère les règles d'évaluation par rôle
   */
  const getReglesByRole = useCallback(async (idRole: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await regleService.getReglesByRole(idRole);
      return data;
    } catch (err: any) {
      setError(err.message || 'Impossible de récupérer les règles d\'évaluation pour ce rôle');
      console.error(err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Crée une nouvelle règle d'évaluation
   */
  const createRegle = useCallback(async (regleData: {
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
    if (!hasPermission('manage_regles')) {
      setError('Vous n\'avez pas les permissions nécessaires pour créer des règles d\'évaluation');
      return null;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await regleService.create(regleData);
      setRegles(prev => [...prev, data]);
      return data;
    } catch (err: any) {
      setError(err.message || 'Impossible de créer la règle d\'évaluation');
      console.error(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [hasPermission]);

  /**
   * Met à jour une règle d'évaluation existante
   */
  const updateRegle = useCallback(async (id: number, regleData: {
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
    if (!hasPermission('manage_regles')) {
      setError('Vous n\'avez pas les permissions nécessaires pour modifier des règles d\'évaluation');
      return null;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await regleService.update(id, regleData);
      setRegles(prev => prev.map(regle => regle.id === id ? data : regle));
      if (currentRegle?.id === id) {
        setCurrentRegle(data);
      }
      return data;
    } catch (err: any) {
      setError(err.message || 'Impossible de mettre à jour la règle d\'évaluation');
      console.error(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [hasPermission, currentRegle]);

  /**
   * Supprime une règle d'évaluation
   */
  const deleteRegle = useCallback(async (id: number) => {
    if (!hasPermission('manage_regles')) {
      setError('Vous n\'avez pas les permissions nécessaires pour supprimer des règles d\'évaluation');
      return false;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      await regleService.delete(id);
      setRegles(prev => prev.filter(regle => regle.id !== id));
      if (currentRegle?.id === id) {
        setCurrentRegle(null);
      }
      return true;
    } catch (err: any) {
      setError(err.message || 'Impossible de supprimer la règle d\'évaluation');
      console.error(err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [hasPermission, currentRegle]);

  return {
    loading,
    error,
    regles,
    currentRegle,
    getAllRegles,
    getRegleById,
    getReglesByRole,
    createRegle,
    updateRegle,
    deleteRegle
  };
};

export default useRegles;
