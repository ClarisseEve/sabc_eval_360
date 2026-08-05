import React from 'react';
import { Link } from 'react-router-dom';
import { useSuspenseQuery } from '@tanstack/react-query';
import {
  ArrowUpRight,
  BarChart3,
  Calendar,
  CalendarClock,
  ClipboardList,
  History,
  ListChecks,
  Radar,
  Sparkles,
} from 'lucide-react';
import { Badge } from '@/Components/UI/Badge/Badge';
import { Button } from '@/Components/UI/Button/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/UI/Card/Card';
import { Progress } from '@/Components/UI/Progress/Progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/UI/Table/Table';
import { analyticsApi } from '@/Services/api';
import { usePeriodes } from '@/Hooks/queries/useEvaluationsQuery';
import { EmptyState } from '@/Components/UI/EmptyState';
import { AdminEvaluationsLayout, PeriodeStatusBadge } from './shared';

function formatDate(value?: string | null) {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function normalizeLabel(value: unknown) {
  return String(value ?? '').trim().toLowerCase();
}

function formatChannelLabel(value: unknown) {
  const channel = normalizeLabel(value);
  if (channel === 'auto') return 'Auto-évaluation';
  if (channel === 'descendante') return 'Manager → collaborateur';
  if (channel === 'pairs') return 'Pairs';
  return String(value ?? 'Canal non défini');
}

function getStatusPresentation(value: unknown) {
  const status = normalizeLabel(value);

  if (status === 'valide') {
    return {
      label: 'Validées',
      badgeVariant: 'success' as const,
      progressVariant: 'success' as const,
      accentClassName: 'bg-emerald-50 text-emerald-700',
    };
  }

  if (status === 'soumis') {
    return {
      label: 'Soumises',
      badgeVariant: 'info' as const,
      progressVariant: 'info' as const,
      accentClassName: 'bg-sky-50 text-sky-700',
    };
  }

  if (status === 'brouillon') {
    return {
      label: 'Brouillons',
      badgeVariant: 'warning' as const,
      progressVariant: 'warning' as const,
      accentClassName: 'bg-amber-50 text-amber-700',
    };
  }

  return {
    label: String(value ?? 'Statut inconnu'),
    badgeVariant: 'secondary' as const,
    progressVariant: 'default' as const,
    accentClassName: 'bg-sabc-gray-100 text-sabc-gray-700',
  };
}

function getChannelPresentation(value: unknown) {
  const channel = normalizeLabel(value);

  if (channel === 'auto') {
    return {
      label: 'Auto-évaluation',
      badgeVariant: 'secondary' as const,
      progressVariant: 'default' as const,
    };
  }

  if (channel === 'descendante') {
    return {
      label: 'Manager → collaborateur',
      badgeVariant: 'info' as const,
      progressVariant: 'info' as const,
    };
  }

  if (channel === 'pairs') {
    return {
      label: 'Pairs',
      badgeVariant: 'warning' as const,
      progressVariant: 'warning' as const,
    };
  }

  return {
    label: formatChannelLabel(value),
    badgeVariant: 'secondary' as const,
    progressVariant: 'default' as const,
  };
}

export default function EvaluationManagementPage() {
  const { data: periodesData } = usePeriodes();
  const { data: dashboard } = useSuspenseQuery({
    queryKey: ['analytics', 'dashboard'],
    queryFn: () => analyticsApi.dashboard().then((r) => r.data),
  });
  const { data: evaluations } = useSuspenseQuery({
    queryKey: ['analytics', 'evaluations'],
    queryFn: () => analyticsApi.evaluations().then((r) => r.data),
  });
  const { data: performances } = useSuspenseQuery({
    queryKey: ['analytics', 'performances'],
    queryFn: () => analyticsApi.performances().then((r) => r.data),
  });

  const periodes = Array.isArray(periodesData) ? periodesData : [];
  const statuses = Array.isArray(evaluations) ? evaluations : [];
  const channels = Array.isArray(performances) ? performances : [];
  const activePeriodes = periodes.filter((periode: any) => periode.est_ouverte || String(periode.statut).toLowerCase() === 'ouverte');
  const statusTotal = statuses.reduce((sum: number, row: any) => sum + Number(row.count ?? 0), 0);
  const channelTotal = channels.reduce((sum: number, row: any) => sum + Number(row.total ?? row.count ?? 0), 0);

  const quickActions = [
    {
      to: '/admin/evaluations/periodes',
      title: 'Périodes',
      description: 'Ouvrir, fermer et planifier les campagnes.',
      icon: CalendarClock,
    },
    {
      to: '/admin/evaluations/history',
      title: 'Historique',
      description: 'Vérifier les flux soumis, validés et rejetés.',
      icon: History,
    },
    {
      to: '/admin/analytics?tab=overview',
      title: 'Analytics',
      description: 'Contrôler les tendances, graphes et anomalies.',
      icon: Radar,
    },
  ];

  return (
    <AdminEvaluationsLayout title="Pilotage des évaluations">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-sabc-gray-900">Pilotage global des évaluations</h1>
          <p className="text-sm text-sabc-gray-600">Vue de pilotage basée sur les données réelles des périodes et analytics NestJS.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/admin/evaluations/periodes"><Button variant="outline">Périodes</Button></Link>
          <Link to="/admin/evaluations/history"><Button variant="outline">Historique</Button></Link>
          <Link to="/admin/evaluations/form"><Button className="bg-sabc-red-primary text-white hover:bg-sabc-red-dark">Nouvelle évaluation</Button></Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardContent className="p-5"><div className="mb-2 flex items-center gap-2 text-sm text-sabc-gray-600"><ClipboardList className="h-4 w-4" />Total évaluations</div><div className="text-3xl font-bold text-sabc-gray-900">{dashboard?.kpis?.total_evaluations ?? 0}</div></CardContent></Card>
        <Card><CardContent className="p-5"><div className="mb-2 flex items-center gap-2 text-sm text-sabc-gray-600"><ListChecks className="h-4 w-4" />Utilisateurs évalués</div><div className="text-3xl font-bold text-sabc-gray-900">{dashboard?.kpis?.unique_users ?? 0}</div></CardContent></Card>
        <Card><CardContent className="p-5"><div className="mb-2 flex items-center gap-2 text-sm text-sabc-gray-600"><BarChart3 className="h-4 w-4" />Score moyen</div><div className="text-3xl font-bold text-sabc-gray-900">{dashboard?.kpis?.average_score != null ? Number(dashboard.kpis.average_score).toFixed(2) : '0.00'}</div></CardContent></Card>
        <Card><CardContent className="p-5"><div className="mb-2 flex items-center gap-2 text-sm text-sabc-gray-600"><Calendar className="h-4 w-4" />Périodes ouvertes</div><div className="text-3xl font-bold text-sabc-success">{activePeriodes.length}</div></CardContent></Card>
      </div>

      <Card className="overflow-hidden border-sabc-gray-200/80 shadow-sm">
        <CardHeader className="border-b border-sabc-gray-100 bg-gradient-to-r from-sabc-gray-50 via-white to-sabc-red-primary/5">
          <CardTitle>Périodes en cours</CardTitle>
          <CardDescription>Vue consolidée des périodes actives et de leur progression réelle.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {periodes.length === 0 ? (
            <EmptyState title="Aucune période" description="Aucune période d’évaluation n’est disponible pour le moment." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Période</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Progression</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {periodes.slice(0, 6).map((periode: any) => (
                  <TableRow key={periode.id_periode}>
                    <TableCell>
                      <div className="font-medium text-sabc-gray-900">{periode.nom_periode}</div>
                      <div className="text-xs text-sabc-gray-500">{periode.code_periode}</div>
                    </TableCell>
                    <TableCell>{formatDate(periode.date_debut)} - {formatDate(periode.date_fin)}</TableCell>
                    <TableCell><PeriodeStatusBadge statut={periode.statut} estOuverte={periode.est_ouverte} /></TableCell>
                    <TableCell>{Number(periode.taux_completion ?? 0).toFixed(0)}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-sabc-gray-200/80 shadow-sm">
          <CardContent className="p-4">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-sabc-red-primary" />
              <span className="text-sm font-semibold text-sabc-gray-900">Statuts</span>
            </div>
            <div className="space-y-2">
              {statuses.length === 0 ? (
                <p className="text-xs text-sabc-gray-500">Aucune donnée.</p>
              ) : statuses.map((row: any, index: number) => {
                const count = Number(row.count ?? 0);
                const ratio = statusTotal > 0 ? (count / statusTotal) * 100 : 0;
                const presentation = getStatusPresentation(row.statut);
                return (
                  <div key={`${row.statut}-${index}`} className="flex items-center gap-2">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${presentation.accentClassName}`}>
                      {presentation.label}
                    </span>
                    <Progress value={ratio} className="h-1.5 flex-1" indicatorVariant={presentation.progressVariant} />
                    <span className="min-w-[28px] text-right text-xs font-medium text-sabc-gray-700">{count}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="border-sabc-gray-200/80 shadow-sm">
          <CardContent className="p-4">
            <div className="mb-3 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-sabc-red-primary" />
              <span className="text-sm font-semibold text-sabc-gray-900">Canaux</span>
            </div>
            <div className="space-y-2">
              {channels.length === 0 ? (
                <p className="text-xs text-sabc-gray-500">Aucune donnée.</p>
              ) : channels.slice(0, 4).map((row: any, index: number) => {
                const score = row.average_score != null ? Number(row.average_score) : Number(row.moyenne ?? 0);
                const total = Number(row.total ?? row.count ?? 0);
                const presentation = getChannelPresentation(row.channel);
                return (
                  <div key={`${row.channel}-${index}`} className="flex items-center gap-2">
                    <span className="min-w-[80px] truncate text-xs font-medium text-sabc-gray-700">{presentation.label}</span>
                    <Progress value={score} max={5} className="h-1.5 flex-1" indicatorVariant={presentation.progressVariant} />
                    <span className="min-w-[36px] text-right text-xs font-medium text-sabc-gray-700">{score.toFixed(1)}/5</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="border-sabc-gray-200/80 shadow-sm">
          <CardContent className="p-4">
            <div className="mb-3 flex items-center gap-2">
              <ArrowUpRight className="h-4 w-4 text-sabc-red-primary" />
              <span className="text-sm font-semibold text-sabc-gray-900">Actions rapides</span>
            </div>
            <div className="space-y-1.5">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.to}
                    to={action.to}
                    className="group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-sabc-gray-700 transition-colors hover:bg-sabc-gray-50 hover:text-sabc-red-primary"
                  >
                    <Icon className="h-4 w-4 shrink-0 text-sabc-gray-400 group-hover:text-sabc-red-primary" />
                    <span className="font-medium">{action.title}</span>
                    <ArrowUpRight className="ml-auto h-3.5 w-3.5 text-sabc-gray-300 group-hover:text-sabc-red-primary" />
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminEvaluationsLayout>
  );
}
