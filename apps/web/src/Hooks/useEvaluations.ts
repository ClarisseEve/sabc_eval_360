import { useState, useCallback, useEffect } from 'react';
import { router } from '@/lib/inertia-shim';
import { useAuth } from './useAuth';
import { evaluationService } from '../Services/{api}';
import { Evaluation, EvaluationNote, EvaluationStatus } from '../types';

// Types pour le formulaire d'évaluation
export interface EvaluationFormData {
  id_evalue: number;
  id_type_evaluation: number;
  notes: Array<{
    id_competence: number;
    note: number;
    commentaire?: string;
  }>;
  commentaire_global?: string;
}

// Interface pour la mise à jour des notes d'évaluation
export interface NotesUpdateData {
  notes: Array<{
    id_competence: number;
    note: number;
    commentaire?: string;
  }>;
  commentaire_global?: string;
}

/**
 * Hook personnalisé pour la gestion des évaluations 360°
 * Conforme aux règles SABC pour les hooks et les évaluations
 * Utilise le nouveau service d'évaluation
 */
export const useEvaluations = () => {
  const { user, hasPermission } = useAuth();
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [currentEvaluation, setCurrentEvaluation] = useState<Evaluation | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Charger les évaluations de l'utilisateur
  const loadEvaluations = useCallback(async (filters?: { periode?: number, statut?: string }) => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await evaluationService.getAll(filters);
      setEvaluations(data);
    } catch (err) {
      setError('Impossible de charger les évaluations');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Charger une évaluation spécifique
  const loadEvaluation = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await evaluationService.getById(id);
      setCurrentEvaluation(data);
      return data;
    } catch (err) {
      setError('Impossible de charger l\'évaluation');
      console.error(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Créer une nouvelle évaluation
  const createEvaluation = useCallback(async (formData: EvaluationFormData) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await evaluationService.create({
        id_evalue: formData.id_evalue,
        id_type_evaluation: formData.id_type_evaluation
      });
      
      setEvaluations(prev => [...prev, data]);
      return data;
    } catch (err: any) {
      setError(err.message || 'Impossible de créer l\'évaluation');
      console.error(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Mettre à jour les notes d'une évaluation
  const updateEvaluationNotes = useCallback(async (id: number, notesData: NotesUpdateData) => {
    setLoading(true);
    setError(null);
    
    try {
      // Transformer les notes pour qu'elles correspondent au type EvaluationNote
      const evaluationNotes = notesData.notes.map(note => ({
        id_evaluation: id,
        id_competence: note.id_competence,
        note: note.note,
        commentaire: note.commentaire
      }));
      
      const data = await evaluationService.updateNotes(id, evaluationNotes);
      
      setEvaluations(prev => prev.map(evaluation => evaluation.id === id ? data : evaluation));
      if (currentEvaluation?.id === id) {
        setCurrentEvaluation(data);
      }
      return data;
    } catch (err: any) {
      setError(err.message || 'Impossible de mettre à jour les notes de l\'évaluation');
      console.error(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentEvaluation]);

  // Soumettre une évaluation
  const submitEvaluation = useCallback(async (id: number, commentaire?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await evaluationService.submit(id, commentaire);
      
      setEvaluations(prev => prev.map(evaluation => evaluation.id === id ? data : evaluation));
      if (currentEvaluation?.id === id) {
        setCurrentEvaluation(data);
      }
      return data;
    } catch (err: any) {
      setError(err.message || 'Impossible de soumettre l\'évaluation');
      console.error(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentEvaluation]);

  // Valider une évaluation (pour les managers)
  const validateEvaluation = useCallback(async (id: number, commentaire?: string) => {
    if (!hasPermission('validate_evaluations')) {
      setError('Vous n\'avez pas les permissions nécessaires pour valider des évaluations');
      return null;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await evaluationService.validate(id, commentaire);
      
      setEvaluations(prev => prev.map(evaluation => evaluation.id === id ? data : evaluation));
      if (currentEvaluation?.id === id) {
        setCurrentEvaluation(data);
      }
      return data;
    } catch (err: any) {
      setError(err.message || 'Impossible de valider l\'évaluation');
      console.error(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [hasPermission, currentEvaluation]);

  // Rejeter une évaluation (pour les managers)
  const rejectEvaluation = useCallback(async (id: number, motif: string) => {
    if (!hasPermission('validate_evaluations')) {
      setError('Vous n\'avez pas les permissions nécessaires pour rejeter des évaluations');
      return null;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await evaluationService.reject(id, motif);
      
      setEvaluations(prev => prev.map(evaluation => evaluation.id === id ? data : evaluation));
      if (currentEvaluation?.id === id) {
        setCurrentEvaluation(data);
      }
      return data;
    } catch (err: any) {
      setError(err.message || 'Impossible de rejeter l\'évaluation');
      console.error(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [hasPermission, currentEvaluation]);
  
  // Récupérer les évaluations en attente
  const getPendingEvaluations = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await evaluationService.getPendingEvaluations();
      return data;
    } catch (err: any) {
      setError(err.message || 'Impossible de récupérer les évaluations en attente');
      console.error(err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Récupérer les évaluations à valider
  const getEvaluationsToValidate = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await evaluationService.getEvaluationsToValidate();
      return data;
    } catch (err: any) {
      setError(err.message || 'Impossible de récupérer les évaluations à valider');
      console.error(err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Récupérer l'historique des évaluations d'un utilisateur
  const getEvaluationHistory = useCallback(async (userId: number, filters?: { page?: number, periode?: number }) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await evaluationService.getEvaluationHistory(userId, filters);
      return data;
    } catch (err: any) {
      setError(err.message || 'Impossible de récupérer l\'historique des évaluations');
      console.error(err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Retourner les fonctions et états du hook
  return {
    evaluations,
    currentEvaluation,
    loading,
    error,
    loadEvaluations,
    loadEvaluation,
    createEvaluation,
    updateEvaluationNotes,
    submitEvaluation,
    validateEvaluation,
    rejectEvaluation,
    getPendingEvaluations,
    getEvaluationsToValidate,
    getEvaluationHistory
  };
};

export default useEvaluations;
