import { useState, useCallback, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { useAuth } from './useAuth';

// Types pour les évaluations
export interface Evaluation {
  id: string;
  evaluator_id: string;
  evaluatee_id: string;
  status: 'draft' | 'submitted' | 'validated' | 'rejected';
  competencies: Array<{
    id: string;
    name: string;
    score: number;
    comment?: string;
  }>;
  created_at: string;
  updated_at: string;
  submitted_at?: string;
  validated_at?: string;
  rejected_at?: string;
  rejection_reason?: string;
}

export interface EvaluationFormData {
  evaluatee_id: string;
  competencies: Array<{
    id: string;
    score: number;
    comment?: string;
  }>;
}

/**
 * Hook personnalisé pour la gestion des évaluations 360°
 * Conforme aux règles SABC pour les hooks et les évaluations
 */
export const useEvaluations = () => {
  const { user, hasPermission } = useAuth();
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [currentEvaluation, setCurrentEvaluation] = useState<Evaluation | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Charger les évaluations de l'utilisateur
  const loadEvaluations = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/evaluations');
      if (!response.ok) throw new Error('Erreur lors du chargement des évaluations');
      
      const data = await response.json();
      setEvaluations(data);
    } catch (err) {
      setError('Impossible de charger les évaluations');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Charger une évaluation spécifique
  const loadEvaluation = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/evaluations/${id}`);
      if (!response.ok) throw new Error('Erreur lors du chargement de l\'évaluation');
      
      const data = await response.json();
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
      const response = await fetch('/api/evaluations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
        },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la création de l\'évaluation');
      }
      
      const data = await response.json();
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

  // Mettre à jour une évaluation
  const updateEvaluation = useCallback(async (id: string, formData: Partial<EvaluationFormData>) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/evaluations/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
        },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la mise à jour de l\'évaluation');
      }
      
      const data = await response.json();
      setEvaluations(prev => prev.map(evaluation => evaluation.id === id ? data : evaluation));
      if (currentEvaluation?.id === id) {
        setCurrentEvaluation(data);
      }
      return data;
    } catch (err: any) {
      setError(err.message || 'Impossible de mettre à jour l\'évaluation');
      console.error(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentEvaluation]);

  // Soumettre une évaluation
  const submitEvaluation = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/evaluations/${id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la soumission de l\'évaluation');
      }
      
      const data = await response.json();
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
  const validateEvaluation = useCallback(async (id: string) => {
    if (!hasPermission('validate_evaluations')) {
      setError('Vous n\'avez pas les permissions nécessaires pour valider des évaluations');
      return null;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/evaluations/${id}/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la validation de l\'évaluation');
      }
      
      const data = await response.json();
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
  const rejectEvaluation = useCallback(async (id: string, reason: string) => {
    if (!hasPermission('validate_evaluations')) {
      setError('Vous n\'avez pas les permissions nécessaires pour rejeter des évaluations');
      return null;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/evaluations/${id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
        },
        body: JSON.stringify({ reason })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors du rejet de l\'évaluation');
      }
      
      const data = await response.json();
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
  
  // Retourner les fonctions et états du hook
  return {
    evaluations,
    currentEvaluation,
    loading,
    error,
    loadEvaluations,
    loadEvaluation,
    createEvaluation,
    updateEvaluation,
    submitEvaluation,
    validateEvaluation,
    rejectEvaluation
  };
};

export default useEvaluations;
