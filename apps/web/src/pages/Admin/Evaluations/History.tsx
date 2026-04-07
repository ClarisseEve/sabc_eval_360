import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, ClipboardList, Download, Search } from 'lucide-react';
import { Badge } from '@/Components/UI/Badge/Badge';
import { Button } from '@/Components/UI/Button/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/UI/Card/Card';
import { Input } from '@/Components/UI/Input/Input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/UI/Table/Table';
import { useHistorique } from '@/Hooks/queries/useEvaluationsQuery';
import { AdminEvaluationsLayout } from './shared';

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

function StatusBadge({ status }: { status?: string }) {
  const normalized = normalizeStatus(status);
  if (normalized === 'brouillon') return <Badge variant="outline" className="bg-sabc-gray-100 text-sabc-gray-800">Brouillon</Badge>;
  if (normalized === 'soumis') return <Badge variant="outline" className="bg-sabc-accent-light text-sabc-accent">Soumis</Badge>;
  if (normalized === 'validé') return <Badge variant="outline" className="bg-sabc-success/20 text-sabc-success">Validé</Badge>;
  if (normalized === 'rejeté') return <Badge variant="outline" className="bg-sabc-red-light text-sabc-red-primary">Rejeté</Badge>;
  return <Badge variant="outline">{normalized}</Badge>;
}

export default function EvaluationHistoryPage() {
  const { data } = useHistorique();
  const [search, setSearch] = React.useState('');
  const [status, setStatus] = React.useState('all');

  const rows = React.useMemo(() => (Array.isArray(data) ? data : []).map((item: any) => ({
    id: item.id_evaluation,
    titre: item.regle?.nom_regle || item.type_evaluation || 'Évaluation',
    evaluateur: formatPerson(item.evaluateur),
    evalue: formatPerson(item.evalue),
    statut: normalizeStatus(item.statut),
    note: item.note_globale != null ? Number(item.note_globale) : null,
    periode: item.periode?.nom_periode || item.id_periode,
    date: item.date_soumission || item.date_evaluation || item.updated_at,
  })), [data]);

  const filtered = React.useMemo(() => {
    return rows.filter((row) => {
      const matchesSearch = !search || [row.titre, row.evaluateur, row.evalue, row.periode]
        .join(' ')
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesStatus = status === 'all' || row.statut === status;
      return matchesSearch && matchesStatus;
    });
  }, [rows, search, status]);

  const stats = React.useMemo(() => ({
    total: rows.length,
    soumis: rows.filter((row) => row.statut === 'soumis').length,
    valides: rows.filter((row) => row.statut === 'validé').length,
    brouillons: rows.filter((row) => row.statut === 'brouillon').length,
  }), [rows]);

  return (
    <AdminEvaluationsLayout title="Historique des évaluations">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-sabc-gray-900">Historique des évaluations</h1>
          <p className="text-sm text-sabc-gray-600">Vue consolidée des évaluations créées, soumises et validées.</p>
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

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardContent className="p-5"><div className="text-sm text-sabc-gray-600">Total</div><div className="text-3xl font-bold">{stats.total}</div></CardContent></Card>
        <Card><CardContent className="p-5"><div className="text-sm text-sabc-gray-600">Soumises</div><div className="text-3xl font-bold text-sabc-accent">{stats.soumis}</div></CardContent></Card>
        <Card><CardContent className="p-5"><div className="text-sm text-sabc-gray-600">Validées</div><div className="text-3xl font-bold text-sabc-success">{stats.valides}</div></CardContent></Card>
        <Card><CardContent className="p-5"><div className="text-sm text-sabc-gray-600">Brouillons</div><div className="text-3xl font-bold text-sabc-gray-700">{stats.brouillons}</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtres</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-[1fr,220px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sabc-gray-400" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher une évaluation, un évaluateur ou une période" className="pl-10" />
          </div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-md border border-sabc-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sabc-red-primary"
          >
            <option value="all">Tous les statuts</option>
            <option value="brouillon">Brouillon</option>
            <option value="soumis">Soumis</option>
            <option value="validé">Validé</option>
            <option value="rejeté">Rejeté</option>
          </select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Évaluations ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="rounded-lg border border-dashed border-sabc-gray-200 p-8 text-center text-sm text-sabc-gray-500">
              Aucune évaluation ne correspond aux filtres courants.
            </div>
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
                {filtered.map((row) => (
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
                    <TableCell><StatusBadge status={row.statut} /></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-sabc-gray-600">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(row.date)}
                      </div>
                    </TableCell>
                    <TableCell>{row.note != null ? row.note.toFixed(2) : 'N/A'}</TableCell>
                    <TableCell className="text-right">
                      <Link to={`/common/evaluations/${row.id}`}>
                        <Button variant="outline" size="sm">Ouvrir</Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </AdminEvaluationsLayout>
  );
}
