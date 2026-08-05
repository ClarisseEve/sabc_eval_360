import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, ClipboardList, Download, Search } from 'lucide-react';
import { useSuspenseQuery } from '@tanstack/react-query';
import { Button } from '@/Components/UI/Button/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/UI/Card/Card';
import { Input } from '@/Components/UI/Input/Input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/UI/Table/Table';
import { adminApi } from '@/Services/api';
import { EmptyState } from '@/Components/UI/EmptyState';
import { AdminEvaluationsLayout, EvaluationStatusBadge } from './shared';
import { buildEvaluationContext } from '@/pages/Common/Evaluations/shared';
import { buildAdminHistoryParams } from './history-query';

function formatPerson(user?: any) {
  if (!user) return 'Inconnu';
  return [user.prenom, user.nom].filter(Boolean).join(' ').trim() || user.matricule || 'Inconnu';
}

function formatDate(value?: string | Date | null) {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function normalizeStatus(status?: string) {
  const raw = String(status || '').toLowerCase();
  if (raw === 'valide') return 'validé';
  if (raw === 'rejete') return 'rejeté';
  return raw || 'inconnu';
}

function Pagination({ meta, onPageChange }: { meta: { total: number; page: number; limit: number; totalPages: number }; onPageChange: (p: number) => void }) {
  if (meta.totalPages <= 1) return null;

  const pages: number[] = [];
  const start = Math.max(1, meta.page - 2);
  const end = Math.min(meta.totalPages, meta.page + 2);
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <div className="flex items-center justify-between border-t border-sabc-gray-200 pt-4">
      <p className="text-sm text-sabc-gray-600">
        {(meta.page - 1) * meta.limit + 1}–{Math.min(meta.page * meta.limit, meta.total)} sur {meta.total} évaluations
      </p>
      <div className="flex gap-1">
        <Button variant="outline" size="sm" disabled={meta.page <= 1} onClick={() => onPageChange(meta.page - 1)}>
          Précédent
        </Button>
        {pages.map((p) => (
          <Button key={p} variant={p === meta.page ? 'default' : 'outline'} size="sm" onClick={() => onPageChange(p)}
            className={p === meta.page ? 'bg-sabc-red-primary text-white' : ''}>
            {p}
          </Button>
        ))}
        <Button variant="outline" size="sm" disabled={meta.page >= meta.totalPages} onClick={() => onPageChange(meta.page + 1)}>
          Suivant
        </Button>
      </div>
    </div>
  );
}

export default function EvaluationHistoryPage() {
  const [page, setPage] = React.useState(1);
  const [status, setStatus] = React.useState('all');

  const params = buildAdminHistoryParams(page, status);
  const { data: response } = useSuspenseQuery({
    queryKey: ['admin', 'evaluations', 'history', params],
    queryFn: () => adminApi.evaluations.history(params).then((r: any) => r.data),
  });

  const rawData = response?.data ?? (Array.isArray(response) ? response : []);
  const responseMeta = Array.isArray(response) ? undefined : response?.meta;
  const meta = {
    total: Number(responseMeta?.total ?? rawData.length),
    page: Number(responseMeta?.page ?? page),
    limit: Number(responseMeta?.limit ?? params.limit),
    totalPages: Number(responseMeta?.totalPages ?? 1),
  };

  const rows = React.useMemo(() => rawData.map((item: any) => ({
    id: item.id_evaluation,
    titre: item.regle?.nom_regle || item.type_evaluation || 'Évaluation',
    evaluateur: formatPerson(item.evaluateur),
    evalue: formatPerson(item.evalue),
    statut: normalizeStatus(item.statut),
    note: item.note_globale != null ? Number(item.note_globale) : null,
    periode: item.periode?.nom_periode || item.id_periode,
    date: item.date_soumission || item.date_evaluation || item.updated_at,
    type: item.type_evaluation || 'autre',
    detail: buildEvaluationContext(item).visibilityDetail,
  })), [rawData]);

  return (
    <AdminEvaluationsLayout title="Historique des évaluations">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-sabc-gray-900">Historique des évaluations</h1>
          <p className="text-sm text-sabc-gray-600">{meta.total} évaluation{meta.total > 1 ? 's' : ''} au total</p>
        </div>
        <div className="flex gap-2">
          <Link to="/admin/evaluations/management">
            <Button variant="outline">Gestion</Button>
          </Link>
          <Button variant="outline" onClick={() => window.print()}>
            <Download className="mr-2 h-4 w-4" />
            Export rapide
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtres</CardTitle>
        </CardHeader>
        <CardContent>
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="rounded-md border border-sabc-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sabc-red-primary"
          >
            <option value="all">Tous les statuts</option>
            <option value="brouillon">Brouillon</option>
            <option value="soumis">Soumis</option>
            <option value="valide">Validé</option>
            <option value="rejete">Rejeté</option>
          </select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Évaluations ({meta.total})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {rows.length === 0 ? (
            <EmptyState
              icon={Search}
              title="Aucune évaluation"
              description="Aucune évaluation ne correspond aux filtres courants."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Évaluation</TableHead>
                  <TableHead>Évaluateur</TableHead>
                  <TableHead>Évalué</TableHead>
                  <TableHead>Période</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Note</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row: any) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <div className="font-medium text-sabc-gray-900">{row.titre}</div>
                      <div className="mt-1 flex items-center gap-1 text-xs text-sabc-gray-500">
                        <ClipboardList className="h-3.5 w-3.5" />
                        {row.id}
                      </div>
                    </TableCell>
                    <TableCell>{row.evaluateur}</TableCell>
                    <TableCell>{row.evalue}</TableCell>
                    <TableCell>{row.periode}</TableCell>
                    <TableCell><EvaluationStatusBadge statut={row.statut} /></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-sabc-gray-600">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(row.date)}
                      </div>
                    </TableCell>
                    <TableCell>{row.note != null ? row.note.toFixed(2) : 'N/A'}</TableCell>
                    <TableCell className="text-right">
                      <Link to={`/admin/evaluations/${row.id}`}>
                        <Button variant="outline" size="sm">Ouvrir</Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          <Pagination meta={meta} onPageChange={setPage} />
        </CardContent>
      </Card>
    </AdminEvaluationsLayout>
  );
}
