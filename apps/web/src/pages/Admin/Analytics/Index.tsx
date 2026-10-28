import React, { Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Head } from '@/lib/inertia-shim';
import { useSearchParams } from 'react-router-dom';
import { Badge } from '@/Components/UI/Badge/Badge';
import AppLayout from '@/Components/Layout/app/AppLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/Components/UI/Tabs/Tabs';
import { ErrorBoundary } from '@/Components/ErrorBoundary';
import { DashboardSkeleton } from '@/Components/Dashboard/DashboardSkeleton';
import { DashboardExportMenu } from '@/Components/Dashboard/DashboardExportMenu';
import { useAuthContext } from '@/Contexts/AuthContext';
import { analyticsApi, periodesApi } from '@/Services/api';
import { PageHeader } from '@/Components/UI/Page/PageHeader';
import { useToast } from '@/Contexts/ToastContext';

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

/** Onglets dont les données suivent le filtre de période. */
const PERIOD_FILTERED_TABS: readonly AdminTabValue[] = ['overview', 'regions', 'roles'];

function resolveTab(rawValue: string | null): AdminTabValue {
  if (ADMIN_TABS.some((tab) => tab.value === rawValue)) {
    return rawValue as AdminTabValue;
  }
  return 'overview';
}

export default function AdminAnalytics() {
  const { user } = useAuthContext();
  const { error } = useToast();
  const dashboardRef = React.useRef<HTMLDivElement>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [exporting, setExporting] = React.useState(false);
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

  const downloadExport = async (format: string) => {
    if (format !== 'csv' && format !== 'excel') return;
    setExporting(true);
    try {
      const response = await analyticsApi.exportEvaluations(format === 'excel' ? 'xlsx' : 'csv', dateRange);
      const url = URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = `evaluations-consolidees.${format === 'excel' ? 'xlsx' : 'csv'}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (exportError: any) {
      error(exportError?.message || "L'extraction des évaluations a échoué.");
    } finally {
      setExporting(false);
    }
  };

  const periodFilterApplies = PERIOD_FILTERED_TABS.includes(activeTab);

  return (
    <AppLayout user={layoutUser} pageTitle="Analyses 360°" notifications={[]}>
      <Head title="Analyses 360° - SABC Eval360" />

      <div className="container mx-auto px-4 py-6">
        <PageHeader
          className="mb-6"
          title="Analyses 360°"
          description="Performances, régions, rôles, anomalies et tendances des évaluations."
          meta={periodFilterApplies && selectedPeriode ? `Période : ${selectedPeriode.nom_periode}` : undefined}
          actions={
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
              {periodes.length > 0 && periodFilterApplies && (
                <label className="flex items-center gap-2 text-sm text-sabc-gray-600 dark:text-sabc-gray-400">
                  <span className="shrink-0">Période</span>
                  <select
                    value={selectedPeriodeId}
                    onChange={(e) => handlePeriodeChange(e.target.value)}
                    className="h-9 w-full min-w-0 rounded-lg border border-sabc-gray-200 bg-white px-2 text-sm text-sabc-gray-900 outline-none focus-visible:ring-2 focus-visible:ring-sabc-red-primary sm:w-56 dark:border-sabc-gray-700 dark:bg-sabc-gray-900 dark:text-sabc-gray-100"
                  >
                    <option value="">Toutes les périodes</option>
                    {periodes.map((p: any) => (
                      <option key={p.id_periode} value={p.id_periode}>
                        {p.nom_periode}
                        {p.est_ouverte ? ' (en cours)' : ''}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <DashboardExportMenu
                targetRef={dashboardRef}
                filename="analyses-360"
                captureSelector="[role='tabpanel']"
                onRawExport={(format) => { void downloadExport(format); }}
                isRawExporting={exporting}
              />
            </div>
          }
        />

        <Tabs ref={dashboardRef} value={activeTab} variant="primary" onValueChange={handleTabChange}>
          {/* Barre d'onglets défilante sur petit écran, barre de défilement visible */}
          <TabsList className="mb-4 flex w-full flex-nowrap justify-start overflow-x-auto pb-px [scrollbar-width:thin]">
            {ADMIN_TABS.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value} className="shrink-0 gap-2 px-3">
                <span>{tab.label}</span>
                {tab.value === 'anomalies' && anomalyTotal > 0 && (
                  <Badge variant="secondary" className="border-0 px-1.5 py-0.5 text-[11px] leading-none tabular-nums">
                    {anomalyTotal > 99 ? '99+' : anomalyTotal}
                  </Badge>
                )}
              </TabsTrigger>
            ))}
          </TabsList>


          <TabsContent value="overview">
            <ErrorBoundary>
              <Suspense fallback={<DashboardSkeleton />}>
                <DashboardTab dateRange={dateRange} periodeId={selectedPeriodeId || undefined} />
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
