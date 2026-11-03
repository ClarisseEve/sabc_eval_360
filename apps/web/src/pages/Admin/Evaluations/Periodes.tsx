import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Calendar, Edit3, Plus, Power, RefreshCw, Trash2 } from 'lucide-react';
import { Button } from '@/Components/UI/Button/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/UI/Card/Card';
import { Input } from '@/Components/UI/Input/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/UI/Select';
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
import { useToast } from '@/Contexts/ToastContext';
import { periodesApi } from '@/Services/api';
import { EmptyState } from '@/Components/UI/EmptyState';
import { PageHeader } from '@/Components/UI/Page/PageHeader';
import { KpiCard, KpiGrid } from '@/Components/UI/KpiCard';
import { formatDateFr, formatPercent } from '@/utils/helpers';
import { AdminEvaluationsLayout, PeriodeStatusBadge } from './shared';

type FormState = {
  code_periode: string;
  nom_periode: string;
  description: string;
  date_debut: string;
  date_fin: string;
};
type EvaluationCadence = 'trimestrielle' | 'semestrielle';

const EMPTY_FORM: FormState = {
  code_periode: '',
  nom_periode: '',
  description: '',
  date_debut: '',
  date_fin: '',
};

function toInputDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Construit une nomenclature de période pré-remplie (modifiable par l'admin).
 * Le numéro du cycle suit la cadence configurée pour l'année.
 * La période est pré-remplie avec une durée d'environ 90 jours, modifiable par l'admin.
 * Si le code calculé existe déjà dans la liste, on incrémente vers le
 * cycle/année suivant disponible.
 */
function buildSuggestedForm(periodes: any[], cadence: EvaluationCadence): FormState {
  const existingCodes = new Set(
    periodes.map((p) => String(p?.code_periode || '').toUpperCase()).filter(Boolean),
  );

  const now = new Date();
  let year = now.getFullYear();
  const cyclesPerYear = cadence === 'trimestrielle' ? 4 : 2;
  const monthsPerCycle = cadence === 'trimestrielle' ? 3 : 6;
  let cycle = Math.floor(now.getMonth() / monthsPerCycle) + 1;

  // Cherche le premier (année, semestre) dont le code n'existe pas encore.
  // Borne de sécurité pour éviter toute boucle infinie.
  for (let guard = 0; guard < 24; guard += 1) {
    const code = `P${String(year).slice(-2)}${String(cycle).padStart(2, '0')}`;
    if (!existingCodes.has(code)) break;
    if (cycle < cyclesPerYear) {
      cycle += 1;
    } else {
      cycle = 1;
      year += 1;
    }
  }

  const code = `P${String(year).slice(-2)}${String(cycle).padStart(2, '0')}`;
  const cycleLabel = cadence === 'trimestrielle' ? 'Trimestre' : 'Semestre';
  const nom = `Cycle ${year} - ${cycleLabel} ${cycle}`;

  const startMonth = (cycle - 1) * monthsPerCycle;
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
  const { success: toastSuccess, error: toastError } = useToast();
  const [search, setSearch] = React.useState('');
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState<FormState>(EMPTY_FORM);
  const [modalError, setModalError] = React.useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [cadenceYear, setCadenceYear] = React.useState(String(new Date().getFullYear()));
  const [cadence, setCadence] = React.useState<EvaluationCadence | ''>('');

  const periodes = Array.isArray(data) ? data : [];
  const selectedCadenceYear = Number(cadenceYear);
  const cadenceQuery = useQuery({
    queryKey: ['periodes', 'cadence', selectedCadenceYear],
    queryFn: () => periodesApi.cadence(selectedCadenceYear).then((response) => response.data),
    enabled: /^\d{4}$/.test(cadenceYear) && selectedCadenceYear >= 1900 && selectedCadenceYear <= 2200,
  });
  React.useEffect(() => {
    setCadence(cadenceQuery.data?.cadence ?? '');
  }, [cadenceQuery.data]);

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
      toastSuccess(editingId ? 'Période mise à jour.' : 'Période créée.');
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
      toastSuccess('Statut de la période mis à jour.');
      await refresh();
    },
    onError: (mutationError: any) => {
      toastError(mutationError?.response?.data?.message || 'Impossible de modifier le statut.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => periodesApi.delete(id),
    onSuccess: async () => {
      toastSuccess('Période supprimée.');
      await refresh();
    },
    onError: (mutationError: any) => {
      toastError(mutationError?.response?.data?.message || 'Impossible de supprimer la période.');
    },
  });

  const cadenceMutation = useMutation({
    mutationFn: () => {
      if (!cadence) throw new Error('Choisissez une cadence.');
      return periodesApi.configureCadence(selectedCadenceYear, cadence);
    },
    onSuccess: async () => {
      toastSuccess('Cadence annuelle enregistrée.');
      await queryClient.invalidateQueries({ queryKey: ['periodes', 'cadence', selectedCadenceYear] });
      await refresh();
    },
    onError: (mutationError: any) => {
      toastError(mutationError?.response?.data?.message || mutationError?.message || 'Impossible d’enregistrer la cadence.');
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
    setForm(buildSuggestedForm(periodes, cadence || 'semestrielle'));
    setModalError(null);
    setIsModalOpen(true);
  }, [periodes, cadence]);

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
    setIsModalOpen(true);
  }, []);

  const isBusy = saveMutation.isPending || toggleMutation.isPending || deleteMutation.isPending;
  const isFormIncomplete =
    !form.code_periode || !form.nom_periode || !form.date_debut || !form.date_fin;

  return (
    <AdminEvaluationsLayout title="Périodes d'évaluation">
      <PageHeader
        title="Périodes d’évaluation"
        description="Création, ouverture, fermeture et mise à jour des cycles d’évaluation."
        breadcrumbs={[{ label: 'Administration' }, { label: 'Évaluations' }, { label: 'Périodes' }]}
        actions={(
          <>
            <Button variant="outline" onClick={() => refresh()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Rafraîchir
            </Button>
            <Button onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle période
            </Button>
          </>
        )}
      />

      <KpiGrid>
        <KpiCard label="Total" value={stats.total} />
        <KpiCard label="Ouvertes" value={stats.ouvertes} />
        <KpiCard label="Fermées" value={stats.fermees} />
        <KpiCard label="Planifiées" value={stats.planifiees} />
      </KpiGrid>

      <Card>
        <CardHeader>
          <CardTitle>Cadence annuelle</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-[140px_minmax(0,1fr)_auto] sm:items-end">
            <div className="space-y-1">
              <label htmlFor="cadence-year" className="text-sm font-medium">Année</label>
              <Input
                id="cadence-year"
                type="number"
                min={1900}
                max={2200}
                value={cadenceYear}
                onChange={(event) => {
                  setCadenceYear(event.target.value);
                  setCadence('');
                }}
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="evaluation-cadence" className="text-sm font-medium">Fréquence</label>
              <Select value={cadence} onValueChange={(value: EvaluationCadence) => setCadence(value)}>
                <SelectTrigger id="evaluation-cadence" disabled={cadenceQuery.isLoading || cadenceQuery.isError}>
                  <SelectValue placeholder="Choisir une fréquence" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="semestrielle">Semestrielle · maximum 2 périodes</SelectItem>
                  <SelectItem value="trimestrielle">Trimestrielle · maximum 4 périodes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={() => cadenceMutation.mutate()}
              disabled={
                !cadence ||
                selectedCadenceYear < 1900 ||
                selectedCadenceYear > 2200 ||
                !/^\d{4}$/.test(cadenceYear) ||
                cadenceMutation.isPending ||
                cadenceQuery.isLoading ||
                cadenceQuery.isError
              }
            >
              {cadenceMutation.isPending ? 'Enregistrement…' : 'Enregistrer la cadence'}
            </Button>
          </div>
          <p className={`text-sm ${cadenceQuery.isError ? 'text-red-700' : 'text-sabc-gray-500'}`}>
            {cadenceQuery.isError
              ? 'Impossible de charger la cadence de cette année.'
              : cadenceQuery.data?.cadence
                ? `Cadence actuelle : ${cadenceQuery.data.cadence}. Les périodes et leurs dates restent à créer manuellement.`
                : 'Aucune cadence configurée. Les périodes existantes restent inchangées ; les nouvelles périodes seront limitées après configuration.'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Liste des périodes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input placeholder="Rechercher une période" value={search} onChange={(e) => setSearch(e.target.value)} />
          {filtered.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title={search ? 'Aucun résultat' : 'Aucune période'}
              description={search ? 'Aucune période ne correspond à votre recherche.' : 'Créez une première période d’évaluation pour démarrer.'}
            />
          ) : (
            <Table className="min-w-[760px]">
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
                    <TableCell className="whitespace-nowrap text-sm text-sabc-gray-600">
                      {formatDateFr(periode.date_debut)} – {formatDateFr(periode.date_fin)}
                    </TableCell>
                    <TableCell><PeriodeStatusBadge statut={periode.statut} estOuverte={periode.est_ouverte} /></TableCell>
                    <TableCell className="whitespace-nowrap tabular-nums">
                      {periode.nb_evaluations_attendues == null
                        ? 'n.d.'
                        : `${periode.nb_evaluations_completees ?? 0} / ${periode.nb_evaluations_attendues}`}
                    </TableCell>
                    <TableCell className="whitespace-nowrap tabular-nums">{formatPercent(periode.taux_completion)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleMutation.mutate(periode.id_periode)}
                          disabled={isBusy || periode.est_cloturee}
                          title={periode.est_cloturee ? 'Période terminée : non modifiable' : undefined}
                        >
                          <Power className="mr-1 h-3.5 w-3.5" />
                          {periode.est_ouverte ? 'Fermer' : 'Ouvrir'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => startEdit(periode)}
                          aria-label={`Modifier la période ${periode.nom_periode}`}
                          title="Modifier"
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-700 hover:bg-red-50 hover:text-red-800 dark:text-red-400 dark:hover:bg-red-900/30"
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
                          aria-label={`Supprimer la période ${periode.nom_periode}`}
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4" />
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
