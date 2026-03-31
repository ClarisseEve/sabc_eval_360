import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { dashboardApi } from '../Services/api';

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
      const { data } = await dashboardApi.getMy();
      const transformedData: DashboardStats = {
        evaluationsCompleted: data.pendingEvaluations?.completed || 0,
        evaluationsPending: data.pendingEvaluations?.pending?.length || 0,
        evaluationsTotal: (data.pendingEvaluations?.completed || 0) + (data.pendingEvaluations?.pending?.length || 0),
        completionRate: data.pendingEvaluations?.completionRate || 0,
        averageScore: data.performanceMetrics?.overall || 0,
        recentEvaluations: data.pendingEvaluations?.recent || [],
        topSkills: data.performanceMetrics?.byCompetency ?
          Object.entries(data.performanceMetrics.byCompetency)
            .map(([name, score]) => ({ name, score: score as number }))
            .sort((a, b) => b.score - a.score)
            .slice(0, 3) : [],
        improvementAreas: data.performanceMetrics?.byCompetency ?
          Object.entries(data.performanceMetrics.byCompetency)
            .map(([name, score]) => ({ name, score: score as number }))
            .sort((a, b) => a.score - b.score)
            .slice(0, 3) : []
      };

      setStats(transformedData);
    } catch (err: any) {
      setError(err.message || 'Impossible de charger les statistiques du tableau de bord');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Charger les statistiques régionales (pour DR et CDTT uniquement)
  const loadRegionalStats = useCallback(async () => {
    if (!user || !hasPermission('view_all_regions')) return;

    setLoading(true);
    setError(null);

    try {
      const { data } = await dashboardApi.getStats();
      const transformedData: RegionalStats[] = [];

      if (data.hierarchyStats && data.hierarchyStats.regions) {
        Object.entries(data.hierarchyStats.regions).forEach(([regionName, stats]: [string, any]) => {
          transformedData.push({
            region: regionName,
            commercial: {
              completionRate: stats.commercial?.completionRate || 0,
              averageScore: stats.commercial?.averageScore || 0
            },
            marketing: {
              completionRate: stats.marketing?.completionRate || 0,
              averageScore: stats.marketing?.averageScore || 0
            }
          });
        });
      }

      setRegionalStats(transformedData);
    } catch (err: any) {
      setError(err.message || 'Impossible de charger les statistiques régionales');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user, hasPermission]);

  // Charger les données au montage et lorsque la période change
  useEffect(() => {
    loadDashboardStats();

    if (hasPermission('view_all_regions') || hasPermission('cross_branch')) {
      loadRegionalStats();
    }
  }, [loadDashboardStats, loadRegionalStats, hasPermission, period]);

  // Changer la période des données
  const changePeriod = useCallback((newPeriod: 'month' | 'quarter' | 'year') => {
    setPeriod(newPeriod);
  }, []);

  // Obtenir les statistiques spécifiques au rôle
  const getRoleSpecificStats = useCallback(async () => {
    if (!stats) return null;

    try {
      setLoading(true);

      let roleData;
      const isManager = ['CSC', 'RTM', 'CDV', 'TMO'].includes(user?.role || '');
      const isDirector = ['DR', 'CDTT'].includes(user?.role || '');
      const isAdmin = user?.est_admin || (user?.role || '').toUpperCase() === 'ADMIN';

      if (isAdmin) {
        const { data } = await dashboardApi.getAdmin();
        roleData = data;
      } else if (isDirector || isManager) {
        const { data } = await dashboardApi.getStats();
        roleData = data;
      } else {
        const { data } = await dashboardApi.getMy();
        roleData = data;
      }

      setLoading(false);
      return roleData;
    } catch (err: any) {
      setError(err.message || 'Impossible de charger les statistiques spécifiques au rôle');
      console.error(err);
      setLoading(false);

      // Fallback en cas d'erreur
      switch (user?.role) {
        case 'DR':
          return { ...stats, regionalComparison: regionalStats, hasRegionalAccess: true, hasCrossBranchAccess: true };
        case 'CDTT':
          return { ...stats, departmentComparison: true, hasRegionalAccess: true, hasCrossBranchAccess: true };
        case 'CSC':
        case 'RTM':
          return { ...stats, teamFocus: true, hasRegionalAccess: false, hasCrossBranchAccess: false };
        case 'CDV':
        case 'TMO':
          return { ...stats, districtFocus: true, hasRegionalAccess: false, hasCrossBranchAccess: false };
        default:
          return { ...stats, personalFocus: true, hasRegionalAccess: false, hasCrossBranchAccess: false };
      }
    }
  }, [stats, regionalStats, user?.role, user?.est_admin]);

  const [roleStats, setRoleStats] = useState<any>(null);

  const loadRoleSpecificStats = useCallback(async () => {
    const data = await getRoleSpecificStats();
    setRoleStats(data);
  }, [getRoleSpecificStats]);

  useEffect(() => {
    if (stats) {
      loadRoleSpecificStats();
    }
  }, [stats, loadRoleSpecificStats]);

  return {
    stats,
    regionalStats,
    roleSpecificStats: roleStats,
    loading,
    error,
    period,
    changePeriod,
    refresh: loadDashboardStats,
    refreshRoleStats: loadRoleSpecificStats,
    hasRegionalAccess: hasPermission('view_all_regions') || hasPermission('view_region'),
    hasCrossBranchAccess: hasPermission('cross_branch')
  };
};

export default useDashboard;
