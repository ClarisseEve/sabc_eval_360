import React, { Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Head } from '@/lib/inertia-shim';
import { useSearchParams } from 'react-router-dom';
import { Badge } from '@/Components/UI/Badge/Badge';
import AppLayout from '@/Components/Layout/app/AppLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/Components/UI/Tabs/Tabs';
import { WelcomeMessage } from '@/Components/UI/WelcomeMessage';
import { ErrorBoundary } from '@/Components/ErrorBoundary';
import { DashboardSkeleton } from '@/Components/Dashboard/DashboardSkeleton';
import { useAuthContext } from '@/Contexts/AuthContext';
import { analyticsApi } from '@/Services/api';

const DashboardTab = React.lazy(() => import('@/Components/Dashboard/Admin/Tabs/DashboardTab'));
const RegionsTab = React.lazy(() => import('@/Components/Dashboard/Admin/Tabs/RegionsTab'));
const RoleAnalysisTab = React.lazy(() => import('@/Components/Dashboard/Admin/Tabs/RoleAnalysisTab'));
const AnomaliesTab = React.lazy(() => import('@/Components/Dashboard/Admin/Tabs/AnomaliesTab'));
const IndividualSearchTab = React.lazy(() => import('@/Components/Dashboard/Admin/Tabs/IndividualSearchTab'));
const ImprovementPlansTab = React.lazy(() => import('@/Components/Dashboard/Admin/Tabs/ImprovementPlansTab'));

const ADMIN_TABS = [
  { value: 'overview', label: "Vue d'ensemble" },
  { value: 'regions', label: 'Analyse régionale' },
  { value: 'roles', label: 'Analyse par rôle' },
  { value: 'anomalies', label: 'Anomalies & alertes' },
  { value: 'individual', label: 'Recherche individuelle' },
  { value: 'improvement', label: 'Plans d’amélioration' },
] as const;

type AdminTabValue = (typeof ADMIN_TABS)[number]['value'];

function resolveTab(rawValue: string | null): AdminTabValue {
  if (ADMIN_TABS.some((tab) => tab.value === rawValue)) {
    return rawValue as AdminTabValue;
  }
  return 'overview';
}

export default function AdminDashboard() {
  const { user } = useAuthContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = resolveTab(searchParams.get('tab'));
  const { data: anomalyTotal = 0 } = useQuery({
    queryKey: ['admin', 'dashboard', 'anomalies', 'badge'],
    queryFn: async () => {
      const response = await analyticsApi.anomalies();
      return Number(response.data?.total ?? 0);
    },
    staleTime: 60_000,
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

  return (
    <AppLayout user={layoutUser} pageTitle="Dashboard 360°" notifications={[]}>
      <Head title="Dashboard Administrateur 360° - SABC Eval360" />

      <div className="container mx-auto px-4 py-6">
        <WelcomeMessage userName={layoutUser.name} className="mb-8" />

        <Tabs value={activeTab} variant="card" onValueChange={handleTabChange}>
          <TabsList className="mb-4 flex w-full flex-wrap justify-start gap-2">
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
                <DashboardTab />
              </Suspense>
            </ErrorBoundary>
          </TabsContent>

          <TabsContent value="regions">
            <ErrorBoundary>
              <Suspense fallback={<DashboardSkeleton />}>
                <RegionsTab />
              </Suspense>
            </ErrorBoundary>
          </TabsContent>

          <TabsContent value="roles">
            <ErrorBoundary>
              <Suspense fallback={<DashboardSkeleton />}>
                <RoleAnalysisTab />
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
        </Tabs>
      </div>
    </AppLayout>
  );
}
