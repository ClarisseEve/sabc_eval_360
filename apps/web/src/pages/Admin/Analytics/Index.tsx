import React, { Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Head } from '@/lib/inertia-shim';
import { useSearchParams } from 'react-router-dom';
import { Badge } from '@/Components/UI/Badge/Badge';
import AppLayout from '@/Components/Layout/app/AppLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/Components/UI/Tabs/Tabs';
import { ErrorBoundary } from '@/Components/ErrorBoundary';
import { DashboardSkeleton } from '@/Components/Dashboard/DashboardSkeleton';
import { useAuthContext } from '@/Contexts/AuthContext';
import { analyticsApi, periodesApi } from '@/Services/api';
import { Calendar } from 'lucide-react';

const DashboardTab = React.lazy(() => import('@/Components/Dashboard/Admin/Tabs/DashboardTab'));
const RegionsTab = React.lazy(() => import('@/Components/Dashboard/Admin/Tabs/RegionsTab'));
const RoleAnalysisTab = React.lazy(() => import('@/Components/Dashboard/Admin/Tabs/RoleAnalysisTab'));
const AnomaliesTab = React.lazy(() => import('@/Components/Dashboard/Admin/Tabs/AnomaliesTab'));
const IndividualSearchTab = React.lazy(() => import('@/Components/Dashboard/Admin/Tabs/IndividualSearchTab'));
const ImprovementPlansTab = React.lazy(() => import('@/Components/Dashboard/Admin/Tabs/ImprovementPlansTab'));
const TendancesTab = React.lazy(() => import('@/Components/Dashboard/Admin/Tabs/TendancesTab'));

const ADMIN_TABS = [
  { value: 'overview', label: "Vue d'ensemble" },
  { value: 'regions', label: 'Analyse régionale' },
  { value: 'roles', label: 'Analyse par rôle' },
  { value: 'anomalies', label: 'Anomalies & alertes' },
  { value: 'individual', label: 'Recherche individuelle' },
  { value: 'improvement', label: "Plans d'amélioration" },
  { value: 'tendances', label: 'Tendances' },
] as const;

type AdminTabValue = (typeof ADMIN_TABS)[number]['value'];

function resolveTab(rawValue: string | null): AdminTabValue {
  if (ADMIN_TABS.some((tab) => tab.value === rawValue)) {
    return rawValue as AdminTabValue;
  }
  return 'overview';
}

export default function AdminAnalytics() {
  const { user } = useAuthContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = resolveTab(searchParams.get('tab'));
  const selectedPeriodeId = searchParams.get('periode') ?? '';

  const { data: anomalyTotal = 0 } = useQuery({
    queryKey: ['admin', 'analytics', 'anomalies', 'badge'],
    queryFn: async () => {
      const response = await analyticsApi.anomalies();
      return Number(response.data?.total ?? 0);
    },
    staleTime: 60_000,
  });

  const { data: periodesData } = useQuery({
    queryKey: ['admin', 'setup', 'periodes'],
    queryFn: () => periodesApi.list().then((r) => (Array.isArray(r.data) ? r.data : [])),
    staleTime: 30_000,
  });

  const layoutUser = {
    name: user ? [user.prenom, user.nom].filter(Boolean).join(' ') || 'Administrateur' : 'Administrateur',
    email: user?.email || '',
    role: user?.role_nom || 'ADMIN',
    avatar: user?.avatar,
  };

  const handleTabChange = (value: string) => {
    const nextTab = resolveTab(value);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('tab', nextTab);
    setSearchParams(nextParams, { replace: true });
  };

  const handlePeriodeChange = (id: string) => {
    const nextParams = new URLSearchParams(searchParams);
    if (id) {
      nextParams.set('periode', id);
    } else {
      nextParams.delete('periode');
    }
    setSearchParams(nextParams, { replace: true });
  };

  const periodes = Array.isArray(periodesData) ? periodesData : [];
  const selectedPeriode = periodes.find((p: any) => p.id_periode === selectedPeriodeId) ?? null;
  const dateRange = selectedPeriode
    ? {
        start_date: String(selectedPeriode.date_debut ?? '').split('T')[0],
        end_date: String(selectedPeriode.date_fin ?? '').split('T')[0],
      }
    : undefined;

  return (
    <AppLayout user={layoutUser} pageTitle="Analytics 360°" notifications={[]}>
      <Head title="Analytics 360° - SABC Eval360" />

      <div className="container mx-auto px-4 py-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-sabc-gray-900 dark:text-white">Analytics 360°</h1>
            <p className="text-sm text-sabc-gray-600 dark:text-sabc-gray-400">
              Exploration approfondie des performances, régions, rôles, anomalies et tendances.
            </p>
          </div>
          {periodes.length > 0 && (
            <div className="flex items-center gap-2 rounded-xl border border-sabc-gray-200 bg-white px-3 py-2 text-sm shadow-sm dark:border-sabc-gray-700 dark:bg-sabc-gray-100">
              <Calendar size={15} className="shrink-0 text-sabc-gray-400" />
              <select
                value={selectedPeriodeId}
                onChange={(e) => handlePeriodeChange(e.target.value)}
                className="border-none bg-transparent text-sm text-sabc-gray-900 outline-none"
              >
                <option value="">Toutes les périodes</option>
                {periodes.map((p: any) => (
                  <option key={p.id_periode} value={p.id_periode}>
                    {p.nom_periode}
                    {p.est_ouverte ? ' (active)' : ''}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <Tabs value={activeTab} variant="card" onValueChange={handleTabChange}>
          <TabsList className="mb-4 flex w-full flex-nowrap overflow-x-auto scrollbar-hide justify-start gap-2 pb-1">
            {ADMIN_TABS.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value} className="gap-2">
                <span>{tab.label}</span>
                {tab.value === 'anomalies' && anomalyTotal > 0 && (
                  <Badge
                    variant={activeTab === tab.value ? 'secondary' : 'destructive'}
                    className="border-0 px-2 py-0.5 text-[11px] leading-none"
                  >
                    {anomalyTotal > 99 ? '99+' : anomalyTotal}
                  </Badge>
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="overview">
            <ErrorBoundary>
              <Suspense fallback={<DashboardSkeleton />}>
                <DashboardTab dateRange={dateRange} />
              </Suspense>
            </ErrorBoundary>
          </TabsContent>

          <TabsContent value="regions">
            <ErrorBoundary>
              <Suspense fallback={<DashboardSkeleton />}>
                <RegionsTab dateRange={dateRange} />
              </Suspense>
            </ErrorBoundary>
          </TabsContent>

          <TabsContent value="roles">
            <ErrorBoundary>
              <Suspense fallback={<DashboardSkeleton />}>
                <RoleAnalysisTab dateRange={dateRange} />
              </Suspense>
            </ErrorBoundary>
          </TabsContent>

          <TabsContent value="anomalies">
            <ErrorBoundary>
              <Suspense fallback={<DashboardSkeleton />}>
                <AnomaliesTab />
              </Suspense>
            </ErrorBoundary>
          </TabsContent>

          <TabsContent value="individual">
            <ErrorBoundary>
              <Suspense fallback={<DashboardSkeleton />}>
                <IndividualSearchTab />
              </Suspense>
            </ErrorBoundary>
          </TabsContent>

          <TabsContent value="improvement">
            <ErrorBoundary>
              <Suspense fallback={<DashboardSkeleton />}>
                <ImprovementPlansTab />
              </Suspense>
            </ErrorBoundary>
          </TabsContent>

          <TabsContent value="tendances">
            <ErrorBoundary>
              <Suspense fallback={<DashboardSkeleton />}>
                <TendancesTab />
              </Suspense>
            </ErrorBoundary>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
