import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';
import { periodeService } from '../Services/{api}';
import { Periode } from '../types';

/**
 * Hook personnalisé pour la gestion des périodes d'évaluation
 * Conforme aux règles SABC pour les hooks et les périodes
 * Utilise le nouveau service de périodes
 */
export const usePeriodes = () => {
  const { hasPermission } = useAuth();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [periodes, setPeriodes] = useState<Periode[]>([]);
  const [currentPeriode, setCurrentPeriode] = useState<Periode | null>(null);
  const [activePeriode, setActivePeriode] = useState<Periode | null>(null);

  /**
   * Récupère toutes les périodes d'évaluation
   */
  const getAllPeriodes = useCallback(async (filters?: { active?: boolean, page?: number }) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await periodeService.getAll(filters);
      setPeriodes(data);
      return data;
    } catch (err: any) {
      setError(err.message || 'Impossible de récupérer les périodes d\'évaluation');
      console.error(err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Récupère une période d'évaluation spécifique
   */
  const getPeriodeById = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await periodeService.getById(id);
      setCurrentPeriode(data);
      return data;
    } catch (err: any) {
      setError(err.message || 'Impossible de récupérer la période d\'évaluation');
      console.error(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Récupère la période d'évaluation active
   */
  const getActivePeriode = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await periodeService.getActivePeriodes();
      if (data && data.length > 0) {
        setActivePeriode(data[0]);
        return data[0];
      }
      setActivePeriode(null);
      return null;
    } catch (err: any) {
      setError(err.message || 'Impossible de récupérer la période d\'évaluation active');
      console.error(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Crée une nouvelle période d'évaluation
   */
  const createPeriode = useCallback(async (periodeData: {
    titre: string,
    date_debut: string,
    date_fin: string,
    active: boolean,
    description?: string
  }) => {
    if (!hasPermission('manage_periodes')) {
      setError('Vous n\'avez pas les permissions nécessaires pour créer des périodes d\'évaluation');
      return null;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await periodeService.create(periodeData);
      setPeriodes(prev => [...prev, data]);
      return data;
    } catch (err: any) {
      setError(err.message || 'Impossible de créer la période d\'évaluation');
      console.error(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [hasPermission]);

  /**
   * Met à jour une période d'évaluation existante
   */
  const updatePeriode = useCallback(async (id: number, periodeData: {
    titre?: string,
    date_debut?: string,
    date_fin?: string,
    active?: boolean,
    description?: string
  }) => {
    if (!hasPermission('manage_periodes')) {
      setError('Vous n\'avez pas les permissions nécessaires pour modifier des périodes d\'évaluation');
      return null;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await periodeService.update(id, periodeData);
      setPeriodes(prev => prev.map(periode => periode.id === id ? data : periode));
      if (currentPeriode?.id === id) {
        setCurrentPeriode(data);
      }
      if (activePeriode?.id === id) {
        setActivePeriode(data);
      }
      return data;
    } catch (err: any) {
      setError(err.message || 'Impossible de mettre à jour la période d\'évaluation');
      console.error(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [hasPermission, currentPeriode, activePeriode]);

  /**
   * Supprime une période d'évaluation
   */
  const deletePeriode = useCallback(async (id: number) => {
    if (!hasPermission('manage_periodes')) {
      setError('Vous n\'avez pas les permissions nécessaires pour supprimer des périodes d\'évaluation');
      return false;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      await periodeService.delete(id);
      setPeriodes(prev => prev.filter(periode => periode.id !== id));
      if (currentPeriode?.id === id) {
        setCurrentPeriode(null);
      }
      if (activePeriode?.id === id) {
        setActivePeriode(null);
      }
      return true;
    } catch (err: any) {
      setError(err.message || 'Impossible de supprimer la période d\'évaluation');
      console.error(err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [hasPermission, currentPeriode, activePeriode]);

  return {
    loading,
    error,
    periodes,
    currentPeriode,
    activePeriode,
    getAllPeriodes,
    getPeriodeById,
    getActivePeriode,
    createPeriode,
    updatePeriode,
    deletePeriode
  };
};

export default usePeriodes;
