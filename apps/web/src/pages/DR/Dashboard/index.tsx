import React, { Suspense } from 'react';
import { Head, Link } from '@/lib/inertia-shim';
import AppLayout from '@/Components/Layout/app/AppLayout';
import { DirectorDashboard } from '@/Components/Dashboard/DirectorDashboard';
import { Card, CardContent } from '@/Components/UI/Card/Card';
import { ErrorBoundary } from '@/Components/ErrorBoundary';
import { DashboardSkeleton } from '@/Components/Dashboard/DashboardSkeleton';
import { useAuthContext } from '@/Contexts/AuthContext';
import { useMyDashboard } from '@/Hooks/queries';

function DRDashboardContent() {
  const { user } = useAuthContext();
  const { data } = useMyDashboard();

  const userName = user ? [user.prenom, user.nom].filter(Boolean).join(' ') || 'Utilisateur SABC' : 'Utilisateur SABC';
  const userRole = user?.role_nom || user?.role || 'DR';

  const dashboardUser = {
    id: user?.matricule || '',
    name: userName,
    email: user?.email || '',
    role: userRole,
    region: user?.region_nom || 'Non specifiee',
    department: user?.branche_nom || 'Direction',
    avatar: undefined,
  };

  // Transformer les donnees API en format attendu par DirectorDashboard
  const metrics = {
    globalPerformance: {
      value: data.score_personnel ? Math.round(data.score_personnel * 20) : 0,
      previousValue: 0,
      change: 0,
      changeType: 'positive' as const,
      label: 'Performance Globale',
    },
    commercialPerformance: {
      value: 0,
      previousValue: 0,
      change: 0,
      changeType: 'positive' as const,
      label: 'Performance Commerciale',
    },
    marketingPerformance: {
      value: 0,
      previousValue: 0,
      change: 0,
      changeType: 'positive' as const,
      label: 'Performance Marketing',
    },
    evaluationCompletion: {
      value: data.evaluations_total > 0
        ? Math.round(((data.evaluations_total - data.evaluations_en_attente) / data.evaluations_total) * 100)
        : 0,
      previousValue: 0,
      change: 0,
      changeType: 'positive' as const,
      label: 'Evaluations Completees',
    },
  };

  return (
    <>
      <div className="px-4 pt-6 max-w-7xl mx-auto">
        <Link href="/common/evaluations/pending">
          <Card className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-amber-400">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-600">
                    {data.evaluations_en_attente > 0
                      ? `${data.evaluations_en_attente} evaluation(s) a valider`
                      : 'Aucune evaluation en attente'}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">Soumises par vos subordonnes</div>
                </div>
                <div className="text-2xl text-amber-500">&#8594;</div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      <DirectorDashboard
        user={dashboardUser}
        stats={data}
        metrics={metrics}
        departmentPerformance={data.departement_performance ?? []}
        topPerformers={data.top_performers ?? []}
        pendingEvaluations={data.evaluations_en_attente_liste ?? []}
      />
    </>
  );
}

const DRDashboard: React.FC = () => {
  const { user } = useAuthContext();

  const layoutUser = {
    name: user ? [user.prenom, user.nom].filter(Boolean).join(' ') || 'Utilisateur' : 'Utilisateur',
    email: user?.email || '',
    role: user?.role_nom || user?.role || 'DR',
    avatar: undefined,
  };

  const handleLogout = () => {
    localStorage.removeItem('sabc_access_token');
    window.location.href = '/login';
  };

  return (
    <AppLayout user={layoutUser} notifications={[]} onLogout={handleLogout}>
      <Head title="Tableau de bord - SABC Eval360" />
      <ErrorBoundary>
        <Suspense fallback={<DashboardSkeleton />}>
          <DRDashboardContent />
        </Suspense>
      </ErrorBoundary>
    </AppLayout>
  );
};

export default DRDashboard;
