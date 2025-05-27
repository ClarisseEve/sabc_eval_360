import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';

// Types pour les données du tableau de bord
export interface DashboardStats {
  evaluationsCompleted: number;
  evaluationsPending: number;
  evaluationsTotal: number;
  completionRate: number;
  averageScore: number;
  teamPerformance?: number;
  recentEvaluations: Array<{
    id: string;
    evaluatee: string;
    status: 'draft' | 'submitted' | 'validated' | 'rejected';
    date: string;
  }>;
  topSkills: Array<{
    name: string;
    score: number;
  }>;
  improvementAreas: Array<{
    name: string;
    score: number;
  }>;
}

export interface RegionalStats {
  region: string;
  commercial: {
    completionRate: number;
    averageScore: number;
  };
  marketing: {
    completionRate: number;
    averageScore: number;
  };
}

/**
 * Hook personnalisé pour gérer les données du tableau de bord
 * Conforme aux règles SABC pour les hooks et les dashboards
 */
export const useDashboard = () => {
  const { user, hasPermission } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [regionalStats, setRegionalStats] = useState<RegionalStats[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<'month' | 'quarter' | 'year'>('month');

  // Charger les statistiques du tableau de bord
  const loadDashboardStats = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/dashboard/stats?period=${period}`);
      if (!response.ok) throw new Error('Erreur lors du chargement des statistiques');
      
      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError('Impossible de charger les statistiques du tableau de bord');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user, period]);

  // Charger les statistiques régionales (pour DR et CDTT uniquement)
  const loadRegionalStats = useCallback(async () => {
    if (!user || !hasPermission('view_all_regions')) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/dashboard/regional-stats?period=${period}`);
      if (!response.ok) throw new Error('Erreur lors du chargement des statistiques régionales');
      
      const data = await response.json();
      setRegionalStats(data);
    } catch (err) {
      setError('Impossible de charger les statistiques régionales');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user, hasPermission, period]);

  // Charger les données au montage et lorsque la période change
  useEffect(() => {
    loadDashboardStats();
    
    // Charger les statistiques régionales uniquement pour les rôles autorisés
    if (hasPermission('view_all_regions') || hasPermission('cross_branch')) {
      loadRegionalStats();
    }
  }, [loadDashboardStats, loadRegionalStats, hasPermission, period]);

  // Changer la période des données
  const changePeriod = useCallback((newPeriod: 'month' | 'quarter' | 'year') => {
    setPeriod(newPeriod);
  }, []);

  // Obtenir les statistiques spécifiques au rôle
  const getRoleSpecificStats = useCallback(() => {
    if (!stats) return null;
    
    // Adapter les statistiques en fonction du rôle de l'utilisateur
    switch (user?.role) {
      case 'DR':
        // Directeur Régional - Vue globale de toute la région
        return {
          ...stats,
          regionalComparison: regionalStats,
          hasRegionalAccess: true,
          hasCrossBranchAccess: true
        };
      
      case 'CDTT':
        // Chef de Département - Vue du département avec comparaison Commercial/Marketing
        return {
          ...stats,
          departmentComparison: true,
          hasRegionalAccess: true,
          hasCrossBranchAccess: true
        };
      
      case 'CSC':
      case 'RTM':
        // Chefs de Service - Vue de leur service uniquement
        return {
          ...stats,
          teamFocus: true,
          hasRegionalAccess: false,
          hasCrossBranchAccess: false
        };
      
      case 'CDV':
      case 'TMO':
        // Chefs de District/TMO - Vue de leur district
        return {
          ...stats,
          districtFocus: true,
          hasRegionalAccess: false,
          hasCrossBranchAccess: false
        };
      
      default:
        // CDS/AS et autres rôles opérationnels - Vue personnelle
        return {
          ...stats,
          personalFocus: true,
          hasRegionalAccess: false,
          hasCrossBranchAccess: false
        };
    }
  }, [stats, regionalStats, user?.role]);

  return {
    stats,
    regionalStats,
    roleSpecificStats: getRoleSpecificStats(),
    loading,
    error,
    period,
    changePeriod,
    refresh: loadDashboardStats,
    hasRegionalAccess: hasPermission('view_all_regions') || hasPermission('view_region'),
    hasCrossBranchAccess: hasPermission('cross_branch')
  };
};

export default useDashboard;