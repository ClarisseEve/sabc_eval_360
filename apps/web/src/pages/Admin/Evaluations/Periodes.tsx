import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, Edit3, Plus, Power, RefreshCw, Trash2 } from 'lucide-react';
import { Button } from '@/Components/UI/Button/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/UI/Card/Card';
import { Input } from '@/Components/UI/Input/Input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/UI/Table/Table';
import { usePeriodes } from '@/Hooks/queries/useEvaluationsQuery';
import { periodesApi } from '@/Services/api';
import { AdminEvaluationsLayout } from './shared';

type FormState = {
  code_periode: string;
  nom_periode: string;
  description: string;
  date_debut: string;
  date_fin: string;
};

const EMPTY_FORM: FormState = {
  code_periode: '',
  nom_periode: '',
  description: '',
  date_debut: '',
  date_fin: '',
};

function formatDate(value?: string | null) {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function statusLabel(raw?: string, estOuverte?: boolean) {
  const value = String(raw || '').toLowerCase();
  if (value === 'planifiee') return 'Planifiée';
  if (value === 'ouverte') return estOuverte ? 'Active ouverte' : 'Active';
  if (value === 'fermee') return 'Terminée';
  return raw || 'Inconnue';
}

export default function AdminPeriodesPage() {
  const { data } = usePeriodes();
  const queryClient = useQueryClient();
  const [search, setSearch] = React.useState('');
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState<FormState>(EMPTY_FORM);
  const [feedback, setFeedback] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const periodes = Array.isArray(data) ? data : [];

  const resetForm = React.useCallback(() => {
    setEditingId(null);
    setForm(EMPTY_FORM);
  }, []);

  const refresh = React.useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['periodes'] });
  }, [queryClient]);

  const saveMutation = useMutation({
    mutationFn: async (payload: FormState) => {
      if (editingId) {
        return periodesApi.update(editingId, {
          nom_periode: payload.nom_periode,
          description: payload.description,
          date_debut: payload.date_debut,
          date_fin: payload.date_fin,
        });
      }
      return periodesApi.create(payload);
    },
    onSuccess: async () => {
      setFeedback(editingId ? 'Période mise à jour.' : 'Période créée.');
      setError(null);
      resetForm();
      await refresh();
    },
    onError: (mutationError: any) => {
      setError(mutationError?.response?.data?.message || 'Impossible de sauvegarder la période.');
      setFeedback(null);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => periodesApi.toggle(id),
    onSuccess: async () => {
      setFeedback('Statut de la période mis à jour.');
      setError(null);
      await refresh();
    },
    onError: (mutationError: any) => {
      setError(mutationError?.response?.data?.message || 'Impossible de modifier le statut.');
      setFeedback(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => periodesApi.delete(id),
    onSuccess: async () => {
      setFeedback('Période supprimée.');
      setError(null);
      await refresh();
    },
    onError: (mutationError: any) => {
      setError(mutationError?.response?.data?.message || 'Impossible de supprimer la période.');
      setFeedback(null);
    },
  });

  const filtered = React.useMemo(() => {
    return periodes.filter((periode: any) => {
      if (!search) return true;
      const blob = [
        periode.code_periode,
        periode.nom_periode,
        periode.description,
      ].filter(Boolean).join(' ').toLowerCase();
      return blob.includes(search.toLowerCase());
    });
  }, [periodes, search]);

  const stats = React.useMemo(() => ({
    total: periodes.length,
    ouvertes: periodes.filter((periode: any) => periode.est_ouverte).length,
    fermees: periodes.filter((periode: any) => periode.est_cloturee).length,
    planifiees: periodes.filter((periode: any) => String(periode.statut).toLowerCase() === 'planifiee').length,
  }), [periodes]);

  const startEdit = React.useCallback((periode: any) => {
    setEditingId(periode.id_periode);
    setForm({
      code_periode: periode.code_periode || '',
      nom_periode: periode.nom_periode || '',
      description: periode.description || '',
      date_debut: periode.date_debut ? String(periode.date_debut).slice(0, 10) : '',
      date_fin: periode.date_fin ? String(periode.date_fin).slice(0, 10) : '',
    });
    setError(null);
    setFeedback(null);
  }, []);

  const isBusy = saveMutation.isPending || toggleMutation.isPending || deleteMutation.isPending;

  return (
    <AdminEvaluationsLayout title="Périodes d'évaluation">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-sabc-gray-900">Périodes d’évaluation</h1>
          <p className="text-sm text-sabc-gray-600">Gestion des cycles d’évaluation, ouverture, clôture et mise à jour.</p>
        </div>
        <Button variant="outline" onClick={() => refresh()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Rafraîchir
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardContent className="p-5"><div className="text-sm text-sabc-gray-600">Total</div><div className="text-3xl font-bold">{stats.total}</div></CardContent></Card>
        <Card><CardContent className="p-5"><div className="text-sm text-sabc-gray-600">Ouvertes</div><div className="text-3xl font-bold text-sabc-success">{stats.ouvertes}</div></CardContent></Card>
        <Card><CardContent className="p-5"><div className="text-sm text-sabc-gray-600">Fermées</div><div className="text-3xl font-bold text-sabc-gray-700">{stats.fermees}</div></CardContent></Card>
        <Card><CardContent className="p-5"><div className="text-sm text-sabc-gray-600">Planifiées</div><div className="text-3xl font-bold text-sabc-accent">{stats.planifiees}</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{editingId ? 'Modifier une période' : 'Créer une période'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {feedback ? <div className="rounded-lg border border-sabc-success/30 bg-sabc-success/10 px-4 py-3 text-sm text-sabc-success">{feedback}</div> : null}
          {error ? <div className="rounded-lg border border-sabc-red-primary/30 bg-sabc-red-light px-4 py-3 text-sm text-sabc-red-primary">{error}</div> : null}
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <Input placeholder="Code période" value={form.code_periode} disabled={!!editingId} onChange={(e) => setForm((current) => ({ ...current, code_periode: e.target.value }))} />
            <Input placeholder="Nom période" value={form.nom_periode} onChange={(e) => setForm((current) => ({ ...current, nom_periode: e.target.value }))} />
            <Input type="date" value={form.date_debut} onChange={(e) => setForm((current) => ({ ...current, date_debut: e.target.value }))} />
            <Input type="date" value={form.date_fin} onChange={(e) => setForm((current) => ({ ...current, date_fin: e.target.value }))} />
            <Input placeholder="Description" value={form.description} onChange={(e) => setForm((current) => ({ ...current, description: e.target.value }))} />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              className="bg-sabc-red-primary text-white hover:bg-sabc-red-dark"
              disabled={isBusy || !form.code_periode || !form.nom_periode || !form.date_debut || !form.date_fin}
              onClick={() => saveMutation.mutate(form)}
            >
              <Plus className="mr-2 h-4 w-4" />
              {editingId ? 'Enregistrer les modifications' : 'Créer la période'}
            </Button>
            {editingId ? <Button variant="outline" onClick={resetForm}>Annuler</Button> : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Liste des périodes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input placeholder="Rechercher une période" value={search} onChange={(e) => setSearch(e.target.value)} />
          {filtered.length === 0 ? (
            <div className="rounded-lg border border-dashed border-sabc-gray-200 p-8 text-center text-sm text-sabc-gray-500">
              Aucune période trouvée.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Période</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Évaluations</TableHead>
                  <TableHead>Taux</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((periode: any) => (
                  <TableRow key={periode.id_periode}>
                    <TableCell>
                      <div className="font-medium text-sabc-gray-900">{periode.nom_periode}</div>
                      <div className="text-xs text-sabc-gray-500">{periode.code_periode}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-sabc-gray-600">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(periode.date_debut)} - {formatDate(periode.date_fin)}
                      </div>
                    </TableCell>
                    <TableCell>{statusLabel(periode.statut, periode.est_ouverte)}</TableCell>
                    <TableCell>{periode.nb_evaluations_completees ?? 0} / {periode.nb_evaluations_attendues ?? 0}</TableCell>
                    <TableCell>{Number(periode.taux_completion ?? 0).toFixed(0)}%</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => startEdit(periode)}>
                          <Edit3 className="mr-1 h-3.5 w-3.5" />
                          Modifier
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => toggleMutation.mutate(periode.id_periode)} disabled={isBusy}>
                          <Power className="mr-1 h-3.5 w-3.5" />
                          Basculer
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (window.confirm('Supprimer cette période ?')) deleteMutation.mutate(periode.id_periode);
                          }}
                          disabled={isBusy}
                        >
                          <Trash2 className="mr-1 h-3.5 w-3.5" />
                          Supprimer
                        </Button>
                      </div>
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
