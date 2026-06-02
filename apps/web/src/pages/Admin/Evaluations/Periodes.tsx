import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, Edit3, Plus, Power, RefreshCw, Trash2 } from 'lucide-react';
import { Button } from '@/Components/UI/Button/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/UI/Card/Card';
import { Input } from '@/Components/UI/Input/Input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/Components/UI/Dialog/Dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/UI/Table/Table';
import { usePeriodes } from '@/Hooks/queries/useEvaluationsQuery';
import { useConfirm } from '@/Contexts/ConfirmContext';
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

function toInputDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Construit une nomenclature de période pré-remplie (modifiable par l'admin).
 * - code_periode = P{AA}{SS} (AA = 2 derniers chiffres de l'année, SS = semestre '01' ou '02')
 * - nom_periode = "Cycle {AAAA} - Semestre {S}"
 * - dates par défaut : début = 1er jour du semestre suggéré, fin ≈ +90 jours
 * Si le code calculé existe déjà dans la liste, on incrémente vers le
 * semestre/année suivant disponible.
 */
function buildSuggestedForm(periodes: any[]): FormState {
  const existingCodes = new Set(
    periodes.map((p) => String(p?.code_periode || '').toUpperCase()).filter(Boolean),
  );

  const now = new Date();
  let year = now.getFullYear();
  let semester = now.getMonth() < 6 ? 1 : 2; // mois 0-5 → S1, 6-11 → S2

  // Cherche le premier (année, semestre) dont le code n'existe pas encore.
  // Borne de sécurité pour éviter toute boucle infinie.
  for (let guard = 0; guard < 24; guard += 1) {
    const code = `P${String(year).slice(-2)}${String(semester).padStart(2, '0')}`;
    if (!existingCodes.has(code)) break;
    if (semester === 1) {
      semester = 2;
    } else {
      semester = 1;
      year += 1;
    }
  }

  const code = `P${String(year).slice(-2)}${String(semester).padStart(2, '0')}`;
  const nom = `Cycle ${year} - Semestre ${semester}`;

  // 1er jour du semestre suggéré : janvier (S1) ou juillet (S2).
  const startMonth = semester === 1 ? 0 : 6;
  let start = new Date(year, startMonth, 1);
  // La règle métier exige une date de début dans le futur : si le 1er du
  // semestre est déjà passé, on décale au lendemain pour rester cohérent.
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (start <= today) {
    start = new Date(today);
    start.setDate(start.getDate() + 1);
  }
  const end = new Date(start);
  end.setDate(end.getDate() + 90); // durée par défaut dans la fenêtre 7–180 jours

  return {
    code_periode: code,
    nom_periode: nom,
    description: '',
    date_debut: toInputDate(start),
    date_fin: toInputDate(end),
  };
}

export default function AdminPeriodesPage() {
  const { data } = usePeriodes();
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const [search, setSearch] = React.useState('');
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState<FormState>(EMPTY_FORM);
  const [feedback, setFeedback] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [modalError, setModalError] = React.useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  const periodes = Array.isArray(data) ? data : [];

  const refresh = React.useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['periodes'] });
  }, [queryClient]);

  const closeModal = React.useCallback(() => {
    setIsModalOpen(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setModalError(null);
  }, []);

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
      closeModal();
      await refresh();
    },
    onError: (mutationError: any) => {
      // L'erreur reste DANS le modal, qui ne se ferme pas.
      setModalError(
        mutationError?.response?.data?.message || 'Impossible de sauvegarder la période.',
      );
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

  const openCreate = React.useCallback(() => {
    setEditingId(null);
    setForm(buildSuggestedForm(periodes));
    setModalError(null);
    setFeedback(null);
    setIsModalOpen(true);
  }, [periodes]);

  const startEdit = React.useCallback((periode: any) => {
    setEditingId(periode.id_periode);
    setForm({
      code_periode: periode.code_periode || '',
      nom_periode: periode.nom_periode || '',
      description: periode.description || '',
      date_debut: periode.date_debut ? String(periode.date_debut).slice(0, 10) : '',
      date_fin: periode.date_fin ? String(periode.date_fin).slice(0, 10) : '',
    });
    setModalError(null);
    setFeedback(null);
    setIsModalOpen(true);
  }, []);

  const isBusy = saveMutation.isPending || toggleMutation.isPending || deleteMutation.isPending;
  const isFormIncomplete =
    !form.code_periode || !form.nom_periode || !form.date_debut || !form.date_fin;

  return (
    <AdminEvaluationsLayout title="Périodes d'évaluation">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-sabc-gray-900">Périodes d’évaluation</h1>
          <p className="text-sm text-sabc-gray-600">Gestion des cycles d’évaluation, ouverture, clôture et mise à jour.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => refresh()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Rafraîchir
          </Button>
          <Button className="bg-sabc-red-primary text-white hover:bg-sabc-red-dark" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle période
          </Button>
        </div>
      </div>

      {feedback ? <div className="rounded-lg border border-sabc-success/30 bg-sabc-success/10 px-4 py-3 text-sm text-sabc-success">{feedback}</div> : null}
      {error ? <div className="rounded-lg border border-sabc-red-primary/30 bg-sabc-red-light px-4 py-3 text-sm text-sabc-red-primary">{error}</div> : null}

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardContent className="p-5"><div className="text-sm text-sabc-gray-600">Total</div><div className="text-2xl font-bold">{stats.total}</div></CardContent></Card>
        <Card><CardContent className="p-5"><div className="text-sm text-sabc-gray-600">Ouvertes</div><div className="text-2xl font-bold text-sabc-success">{stats.ouvertes}</div></CardContent></Card>
        <Card><CardContent className="p-5"><div className="text-sm text-sabc-gray-600">Fermées</div><div className="text-2xl font-bold text-sabc-gray-700">{stats.fermees}</div></CardContent></Card>
        <Card><CardContent className="p-5"><div className="text-sm text-sabc-gray-600">Planifiées</div><div className="text-2xl font-bold text-sabc-accent">{stats.planifiees}</div></CardContent></Card>
      </div>

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
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleMutation.mutate(periode.id_periode)}
                          disabled={isBusy || periode.est_cloturee}
                          title={periode.est_cloturee ? 'Période terminée — non modifiable' : undefined}
                        >
                          <Power className="mr-1 h-3.5 w-3.5" />
                          {periode.est_ouverte ? 'Fermer' : 'Ouvrir'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            const ok = await confirm({
                              title: 'Supprimer cette période ?',
                              description: 'Cette action est irréversible.',
                              confirmLabel: 'Supprimer',
                              variant: 'destructive',
                            });
                            if (ok) deleteMutation.mutate(periode.id_periode);
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

      <Dialog open={isModalOpen} onOpenChange={(open) => (open ? setIsModalOpen(true) : closeModal())}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Modifier une période' : 'Nouvelle période'}</DialogTitle>
            <DialogDescription>
              {editingId
                ? 'Mettez à jour les informations de la période. Seules les périodes planifiées sont modifiables.'
                : 'Les champs sont pré-remplis selon la nomenclature. Vous pouvez les ajuster librement.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {modalError ? (
              <div className="rounded-lg border border-sabc-red-primary/30 bg-sabc-red-light px-4 py-3 text-sm text-sabc-red-primary">
                {modalError}
              </div>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-medium text-sabc-gray-700">Code période</label>
                <Input
                  placeholder="P2602"
                  value={form.code_periode}
                  disabled={!!editingId}
                  onChange={(e) => setForm((current) => ({ ...current, code_periode: e.target.value }))}
                />
                {editingId ? (
                  <p className="text-xs text-sabc-gray-500">Le code n’est pas modifiable après création.</p>
                ) : null}
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-sabc-gray-700">Nom période</label>
                <Input
                  placeholder="Cycle 2026 - Semestre 2"
                  value={form.nom_periode}
                  onChange={(e) => setForm((current) => ({ ...current, nom_periode: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-sabc-gray-700">Date de début</label>
                <Input
                  type="date"
                  value={form.date_debut}
                  onChange={(e) => setForm((current) => ({ ...current, date_debut: e.target.value }))}
                />
                <p className="text-xs text-sabc-gray-500">
                  Durée entre 7 et 180 jours, sans chevauchement, début dans le futur.
                </p>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-sabc-gray-700">Date de fin</label>
                <Input
                  type="date"
                  value={form.date_fin}
                  onChange={(e) => setForm((current) => ({ ...current, date_fin: e.target.value }))}
                />
                <p className="text-xs text-sabc-gray-500">
                  Durée entre 7 et 180 jours, sans chevauchement, début dans le futur.
                </p>
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-medium text-sabc-gray-700">Description</label>
                <Input
                  placeholder="Description (optionnelle)"
                  value={form.description}
                  onChange={(e) => setForm((current) => ({ ...current, description: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={closeModal} disabled={saveMutation.isPending}>
              Annuler
            </Button>
            <Button
              className="bg-sabc-red-primary text-white hover:bg-sabc-red-dark"
              disabled={saveMutation.isPending || isFormIncomplete}
              onClick={() => {
                setModalError(null);
                saveMutation.mutate(form);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              {editingId ? 'Enregistrer les modifications' : 'Créer la période'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminEvaluationsLayout>
  );
}
