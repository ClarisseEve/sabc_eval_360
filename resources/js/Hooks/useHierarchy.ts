import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';
import { hierarchyService } from '../Services/{api}';
import { User, HierarchyNode, RegionStats } from '../types';

/**
 * Hook personnalisé pour la gestion de la hiérarchie organisationnelle
 * Conforme aux règles SABC pour les hooks et la hiérarchie
 * Utilise le nouveau service de hiérarchie
 */
export const useHierarchy = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hierarchyData, setHierarchyData] = useState<HierarchyNode | null>(null);
  const [subordinates, setSubordinates] = useState<User[]>([]);
  const [regionStats, setRegionStats] = useState<RegionStats | null>(null);

  /**
   * Récupère la hiérarchie complète d'une région
   */
  const getRegionHierarchy = useCallback(async (idRegion: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await hierarchyService.getRegionHierarchy(idRegion);
      setHierarchyData(data);
      return data;
    } catch (err: any) {
      setError(err.message || 'Impossible de récupérer la hiérarchie de la région');
      console.error(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Récupère les subordonnés directs d'un utilisateur
   */
  const getSubordinates = useCallback(async (idUser?: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const userId = idUser || user?.id;
      if (!userId) {
        throw new Error('ID utilisateur requis');
      }
      
      const data = await hierarchyService.getSubordinates(userId);
      setSubordinates(data);
      return data;
    } catch (err: any) {
      setError(err.message || 'Impossible de récupérer les subordonnés');
      console.error(err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [user]);

  /**
   * Vérifie si un utilisateur peut évaluer un autre utilisateur
   */
  const canEvaluate = useCallback(async (idEvaluateur: number, idEvalue: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await hierarchyService.checkEvaluationPermission(idEvaluateur, idEvalue);
      return result;
    } catch (err: any) {
      setError(err.message || 'Impossible de vérifier les permissions d\'évaluation');
      console.error(err);
      return { allowed: false, reason: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Assigne un manager à un utilisateur
   */
  const assignManager = useCallback(async (idUser: number, idManager: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await hierarchyService.assignManager(idUser, idManager);
      return result;
    } catch (err: any) {
      setError(err.message || 'Impossible d\'assigner le manager');
      console.error(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Récupère les statistiques d'une région
   */
  const getRegionStats = useCallback(async (idRegion: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await hierarchyService.getRegionStats(idRegion);
      setRegionStats(data);
      return data;
    } catch (err: any) {
      setError(err.message || 'Impossible de récupérer les statistiques de la région');
      console.error(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Récupère les statistiques de la région actuelle de l'utilisateur
   */
  const getCurrentRegionStats = useCallback(async () => {
    if (!user?.id_region) {
      setError('Utilisateur non associé à une région');
      return null;
    }
    
    return getRegionStats(user.id_region);
  }, [user, getRegionStats]);

  return {
    loading,
    error,
    hierarchyData,
    subordinates,
    regionStats,
    getRegionHierarchy,
    getSubordinates,
    canEvaluate,
    assignManager,
    getRegionStats,
    getCurrentRegionStats
  };
};

export default useHierarchy;
