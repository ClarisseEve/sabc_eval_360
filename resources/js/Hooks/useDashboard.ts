import { useApiData } from '@/Services/useApiData';
import { useAuthContext } from '@/Contexts/AuthContext';
import { normalizeRole } from '@/config/rbac';

export interface DashboardData {
  role: string;
  title: string;
  stats: {
    evaluations_en_attente: number;
    evaluations_total: number;
    score_personnel: number | null;
    periode_active: { id: string; nom: string; fin: string } | null;
    // Admin-only fields
    total_utilisateurs?: number;
    utilisateurs_actifs?: number;
    total_evaluations?: number;
    evaluations_en_cours?: number;
    evaluations_validees?: number;
    taux_completion?: number;
    remplacements_actifs?: number;
  };
}

export interface AnalyticsScores {
  score_global: number | null;
  score_pondere: number | null;
  progression: number;
  par_type: Array<{ type: string; moyenne: number; nb_evaluations: number }>;
}

export interface EvaluationItem {
  id_evaluation: string;
  evaluateur_matricule: string;
  evalue_matricule: string;
  statut: string;
  date_evaluation: string;
  note_globale: number | null;
  type_evaluation: string;
}

/**
 * Main dashboard hook — calls GET /api/dashboard (cached server-side 30-60s).
 * Returns real data, loading state, and error.
 */
export function useDashboard() {
  const { user } = useAuthContext();
  const role = normalizeRole(user?.role_nom ?? user?.role);
  const isAdmin = role === 'ADMIN' || user?.est_admin;

  const dashboard = useApiData<DashboardData>('/dashboard');
  const scores = useApiData<AnalyticsScores>('/analytics/scores', { manual: isAdmin });
  const evaluations = useApiData<{ en_attente: EvaluationItem[]; a_valider: EvaluationItem[] }>('/evaluations');
  const notifications = useApiData<{ count: number }>('/notifications/count');

  return {
    role,
    isAdmin,
    dashboard: dashboard.data,
    scores: scores.data,
    evaluations: evaluations.data,
    unreadCount: notifications.data?.count ?? 0,
    loading: dashboard.loading,
    error: dashboard.error,
    refresh: dashboard.refetch,
  };
}

export default useDashboard;