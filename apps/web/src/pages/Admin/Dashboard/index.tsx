import React, { Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Head } from '@/lib/inertia-shim';
import { Link } from 'react-router-dom';
import AppLayout from '@/Components/Layout/app/AppLayout';
import { Card, CardContent } from '@/Components/UI/Card';
import { WelcomeMessage } from '@/Components/UI/WelcomeMessage';
import { ErrorBoundary } from '@/Components/ErrorBoundary';
import { useAuthContext } from '@/Contexts/AuthContext';
import { analyticsApi, periodesApi, reglesApi } from '@/Services/api';
import { useAdminOverviewTabData } from '@/Hooks/queries/useAdminDashboardTabs';
import { AdminOverviewMetricsSection } from '@/Components/Dashboard/Admin/Sections/OverviewSections';
import {
  AlertTriangle,
  BarChart3,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  FileText,
  Layers3,
  ShieldAlert,
  Users,
} from 'lucide-react';

function KpiSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-28 animate-pulse rounded-2xl bg-sabc-gray-100 dark:bg-sabc-gray-800" />
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
  { label: 'Analytics 360°', caption: 'Analyses détaillées par région, rôle, tendances', href: '/admin/analytics?tab=overview', icon: BarChart3 },
  { label: 'Gestion des évaluations', caption: 'Suivi global des évaluations', href: '/admin/evaluations/management', icon: ClipboardList },
  { label: 'Périodes', caption: 'Ouvrir / fermer les cycles', href: '/admin/evaluations/periodes', icon: CalendarClock },
  { label: 'Règles', caption: 'Cadres et critères d’évaluation', href: '/admin/evaluations/regles', icon: Layers3 },
  { label: 'Utilisateurs', caption: 'Annuaire et hiérarchie', href: '/admin/utilisateurs', icon: Users },
  { label: 'Rapports', caption: 'Exports PPTX / XLSX', href: '/admin/reports', icon: FileText },
];

export default function AdminDashboard() {
  const { user } = useAuthContext();

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

      <div className="container mx-auto space-y-6 px-4 py-6">
        <WelcomeMessage userName={layoutUser.name} />

        {/* Checklist de configuration */}
        {!isSetupComplete && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950">
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

        {/* Indicateurs clés en un coup d'œil */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold text-sabc-gray-900 dark:text-white">Indicateurs clés</h2>
            <Link to="/admin/analytics?tab=overview" className="text-sm font-medium text-sabc-red-primary hover:underline">
              Voir les analyses détaillées →
            </Link>
          </div>
          <ErrorBoundary>
            <Suspense fallback={<KpiSkeleton />}>
              <AdminKpis />
            </Suspense>
          </ErrorBoundary>
        </section>

        {/* Alertes & état des campagnes */}
        <div className="grid gap-4 md:grid-cols-2">
          <Link to="/admin/analytics?tab=anomalies" className="block">
            <Card className="transition-shadow hover:shadow-md">
              <CardContent className="flex items-center gap-4 p-5">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${anomalyTotal > 0 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                  <ShieldAlert className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-sabc-gray-900 dark:text-white">{anomalyTotal}</div>
                  <div className="text-sm text-sabc-gray-500">
                    {anomalyTotal > 0 ? 'Anomalies à examiner' : 'Aucune anomalie détectée'}
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Card>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-sabc-gray-100 text-sabc-gray-600 dark:bg-sabc-gray-800">
                <CalendarClock className="h-6 w-6" />
              </div>
              <div>
                <div className="text-base font-semibold text-sabc-gray-900 dark:text-white">
                  {openPeriode ? (openPeriode.nom_periode || openPeriode.code_periode) : 'Aucune période ouverte'}
                </div>
                <div className="text-sm text-sabc-gray-500">
                  {openPeriode ? 'Campagne en cours' : 'Ouvrez une période pour lancer les évaluations'}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Accès rapides */}
        <section>
          <h2 className="mb-3 text-base font-semibold text-sabc-gray-900 dark:text-white">Accès rapides</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
            {QUICK_LINKS.map(({ label, caption, href, icon: Icon }) => (
              <Link key={href} to={href} className="block">
                <Card className="h-full transition-all hover:-translate-y-0.5 hover:border-sabc-red-primary/40 hover:shadow-md">
                  <CardContent className="flex h-full flex-col gap-2 p-4">
                    <Icon className="h-6 w-6 text-sabc-red-primary" />
                    <div className="text-sm font-semibold text-sabc-gray-900 dark:text-white">{label}</div>
                    <div className="text-xs text-sabc-gray-500">{caption}</div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
