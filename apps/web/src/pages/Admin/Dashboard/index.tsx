import React, { Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Head } from '@/lib/inertia-shim';
import { Link } from 'react-router-dom';
import AppLayout from '@/Components/Layout/app/AppLayout';
import { WelcomeMessage } from '@/Components/UI/WelcomeMessage';
import { ErrorBoundary } from '@/Components/ErrorBoundary';
import { useAuthContext } from '@/Contexts/AuthContext';
import { analyticsApi, periodesApi, reglesApi } from '@/Services/api';
import { useAdminOverviewTabData } from '@/Hooks/queries/useAdminDashboardTabs';
import { DashboardExportMenu } from '@/Components/Dashboard/DashboardExportMenu';
import { AdminOverviewMetricsSection } from '@/Components/Dashboard/Admin/Sections/OverviewSections';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

function KpiSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-28 animate-pulse rounded-lg bg-sabc-gray-100 dark:bg-sabc-gray-800" />
      ))}
    </div>
  );
}

function AdminKpis() {
  const { data } = useAdminOverviewTabData();
  return (
    <AdminOverviewMetricsSection
      totalEvaluations={data.totalEvaluations}
      uniqueUsers={data.uniqueUsers}
      averageScore={data.averageScore}
      completionRate={data.completionRate}
      validatedEvaluations={data.validatedEvaluations}
    />
  );
}

const QUICK_LINKS = [
  { label: 'Analyses 360°', caption: 'Résultats par région, rôle et tendance', href: '/admin/analytics?tab=overview' },
  { label: 'Gestion des évaluations', caption: 'Suivi global des évaluations', href: '/admin/evaluations/management' },
  { label: 'Périodes', caption: 'Ouverture et clôture des cycles', href: '/admin/evaluations/periodes' },
  { label: 'Règles', caption: 'Cadres et critères d’évaluation', href: '/admin/evaluations/regles' },
  { label: 'Utilisateurs', caption: 'Annuaire et hiérarchie', href: '/admin/utilisateurs' },
  { label: 'Rapports', caption: 'Exports PowerPoint et Excel', href: '/admin/reports' },
];

export default function AdminDashboard() {
  const { user } = useAuthContext();
  const dashboardRef = React.useRef<HTMLDivElement>(null);

  const { data: anomalyTotal = 0 } = useQuery({
    queryKey: ['admin', 'dashboard', 'anomalies', 'badge'],
    queryFn: async () => Number((await analyticsApi.anomalies()).data?.total ?? 0),
    staleTime: 60_000,
  });

  const { data: periodesData } = useQuery({
    queryKey: ['admin', 'setup', 'periodes'],
    queryFn: () => periodesApi.list().then((r) => (Array.isArray(r.data) ? r.data : [])),
    staleTime: 30_000,
  });

  const { data: reglesData } = useQuery({
    queryKey: ['admin', 'setup', 'regles'],
    queryFn: () => reglesApi.list().then((r) => (Array.isArray(r.data) ? r.data : [])),
    staleTime: 30_000,
  });

  const periodes = Array.isArray(periodesData) ? periodesData : [];
  const openPeriode = periodes.find((p: any) => p.est_ouverte) ?? null;
  const hasOpenPeriod = Boolean(openPeriode);
  const hasActiveRules = Array.isArray(reglesData) && reglesData.length > 0;
  const isSetupComplete = hasOpenPeriod && hasActiveRules;

  const layoutUser = {
    name: user ? [user.prenom, user.nom].filter(Boolean).join(' ') || 'Administrateur' : 'Administrateur',
    email: user?.email || '',
    role: user?.role_nom || 'ADMIN',
    avatar: user?.avatar,
  };

  return (
    <AppLayout user={layoutUser} pageTitle="Tableau de bord" notifications={[]}>
      <Head title="Tableau de bord - SABC Eval360" />

      <div ref={dashboardRef} className="container mx-auto space-y-6 px-4 py-6">
        <div className="flex items-start justify-between gap-4">
          <WelcomeMessage userName={layoutUser.name} />
          <DashboardExportMenu targetRef={dashboardRef} filename="tableau-de-bord-admin" />
        </div>

        {/* Checklist de configuration */}
        {!isSetupComplete && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              <div className="flex-1">
                <div className="font-semibold text-amber-900 dark:text-amber-200">Configuration requise avant le lancement des évaluations</div>
                <div className="mt-2 space-y-1.5">
                  <div className="flex items-center gap-2 text-sm">
                    {hasActiveRules
                      ? <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      : <AlertTriangle className="h-4 w-4 text-amber-500" />}
                    <span className={hasActiveRules ? 'text-emerald-800' : 'text-amber-800'}>
                      {hasActiveRules ? 'Au moins une règle active publiée' : 'Aucune règle active — '}
                    </span>
                    {!hasActiveRules && (
                      <Link to="/admin/evaluations/regles/create" className="font-medium text-sabc-red-primary underline-offset-2 hover:underline">
                        Créer une règle →
                      </Link>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    {hasOpenPeriod
                      ? <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      : <AlertTriangle className="h-4 w-4 text-amber-500" />}
                    <span className={hasOpenPeriod ? 'text-emerald-800' : 'text-amber-800'}>
                      {hasOpenPeriod ? "Période d'évaluation ouverte" : 'Aucune période ouverte — '}
                    </span>
                    {!hasOpenPeriod && (
                      <Link to="/admin/evaluations/periodes" className="font-medium text-sabc-red-primary underline-offset-2 hover:underline">
                        Créer et ouvrir une période →
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Campagne en cours et anomalies: une ligne d'état, sans tuiles décoratives */}
        <section
          data-dashboard-export-section
          className="flex flex-col gap-3 border-y border-sabc-gray-200 py-4 text-sm dark:border-sabc-gray-700 sm:flex-row sm:items-center sm:gap-8"
        >
          <div>
            <span className="text-sabc-gray-500">Campagne en cours : </span>
            <span className="font-semibold text-sabc-gray-900 dark:text-white">
              {openPeriode ? (openPeriode.nom_periode || openPeriode.code_periode) : 'aucune période ouverte'}
            </span>
          </div>
          <Link
            to="/admin/analytics?tab=anomalies"
            className="text-sabc-gray-700 hover:text-sabc-red-primary dark:text-sabc-gray-300"
          >
            <span className={anomalyTotal > 0 ? 'font-semibold text-sabc-red-primary' : 'font-semibold'}>
              {anomalyTotal}
            </span>{' '}
            {anomalyTotal > 1 ? 'anomalies à examiner' : anomalyTotal === 1 ? 'anomalie à examiner' : 'anomalie détectée'}
          </Link>
        </section>

        <section data-dashboard-export-section>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-lg font-semibold text-sabc-gray-900 dark:text-white">Indicateurs du cycle</h2>
            <Link to="/admin/analytics?tab=overview" className="text-sm font-medium text-sabc-red-primary hover:underline">
              Analyses détaillées
            </Link>
          </div>
          <ErrorBoundary>
            <Suspense fallback={<KpiSkeleton />}>
              <AdminKpis />
            </Suspense>
          </ErrorBoundary>
        </section>

        <section data-dashboard-export-section>
          <h2 className="mb-3 text-lg font-semibold text-sabc-gray-900 dark:text-white">Administration</h2>
          <nav aria-label="Administration" className="grid overflow-hidden rounded-lg border border-sabc-gray-200 bg-white dark:border-sabc-gray-700 dark:bg-sabc-gray-900 sm:grid-cols-2 xl:grid-cols-3">
            {QUICK_LINKS.map(({ label, caption, href }) => (
              <Link
                key={href}
                to={href}
                className="group -mb-px -mr-px border-b border-r border-sabc-gray-200 px-5 py-4 transition-colors hover:bg-sabc-gray-50 dark:border-sabc-gray-700 dark:hover:bg-sabc-gray-800"
              >
                <div className="font-semibold text-sabc-gray-900 group-hover:text-sabc-red-primary dark:text-white">{label}</div>
                <div className="mt-0.5 text-sm text-sabc-gray-500">{caption}</div>
              </Link>
            ))}
          </nav>
        </section>
      </div>
    </AppLayout>
  );
}
