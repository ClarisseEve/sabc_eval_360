import React from 'react';
import { Link } from 'react-router-dom';
import { useSuspenseQuery } from '@tanstack/react-query';
import { ArrowRight, BarChart3, Calendar, ClipboardList, ListChecks } from 'lucide-react';
import { Button } from '@/Components/UI/Button/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/UI/Card/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/UI/Table/Table';
import { analyticsApi } from '@/Services/api';
import { usePeriodes } from '@/Hooks/queries/useEvaluationsQuery';
import { AdminEvaluationsLayout } from './shared';

function formatDate(value?: string | null) {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
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

      <div className="grid gap-6 xl:grid-cols-[1.3fr,0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Périodes en cours</CardTitle>
          </CardHeader>
          <CardContent>
            {periodes.length === 0 ? (
              <div className="rounded-lg border border-dashed border-sabc-gray-200 p-8 text-center text-sm text-sabc-gray-500">
                Aucune période disponible.
              </div>
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
                      <TableCell>{periode.est_ouverte ? 'Ouverte' : periode.est_cloturee ? 'Fermée' : 'Planifiée'}</TableCell>
                      <TableCell>{Number(periode.taux_completion ?? 0).toFixed(0)}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Statuts d’évaluation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {statuses.length === 0 ? (
                <p className="text-sm text-sabc-gray-500">Aucune donnée disponible.</p>
              ) : statuses.map((row: any, index: number) => (
                <div key={`${row.statut}-${index}`} className="flex items-center justify-between rounded-lg border border-sabc-gray-200 p-3">
                  <span className="font-medium text-sabc-gray-900">{row.statut}</span>
                  <span className="text-sm text-sabc-gray-600">{row.count}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Canaux de performance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {channels.length === 0 ? (
                <p className="text-sm text-sabc-gray-500">Aucune donnée disponible.</p>
              ) : channels.slice(0, 5).map((row: any, index: number) => (
                <div key={`${row.channel}-${index}`} className="rounded-lg border border-sabc-gray-200 p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sabc-gray-900">{row.channel}</span>
                    <span className="text-sm text-sabc-gray-600">{row.total ?? row.count ?? 0}</span>
                  </div>
                  <div className="mt-1 text-sm text-sabc-gray-500">
                    Score moyen: {row.average_score != null ? Number(row.average_score).toFixed(2) : Number(row.moyenne ?? 0).toFixed(2)}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Actions rapides</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link to="/admin/evaluations/periodes" className="flex items-center justify-between rounded-lg border border-sabc-gray-200 px-4 py-3 text-sm text-sabc-gray-800 hover:bg-sabc-gray-50">
                Gérer les périodes
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/admin/evaluations/history" className="flex items-center justify-between rounded-lg border border-sabc-gray-200 px-4 py-3 text-sm text-sabc-gray-800 hover:bg-sabc-gray-50">
                Consulter l’historique
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/analytics/dashboard" className="flex items-center justify-between rounded-lg border border-sabc-gray-200 px-4 py-3 text-sm text-sabc-gray-800 hover:bg-sabc-gray-50">
                Ouvrir les analytics
                <ArrowRight className="h-4 w-4" />
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminEvaluationsLayout>
  );
}
