import React from 'react';
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Check, Edit, LayoutGrid, List, Pencil, Plus, Power, Trash2 } from 'lucide-react';
import { PageHeader } from '@/Components/UI/Page/PageHeader';
import { KpiCard, KpiGrid } from '@/Components/UI/KpiCard';
import { adminApi, reglesApi } from '@/Services/api';
import { AdminEvaluationsLayout } from '../shared';
import { Button } from '@/Components/UI/Button/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/UI/Card/Card';
import { Badge } from '@/Components/UI/Badge/Badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/Components/UI/Dialog/Dialog';
import { normalizePublishedRule } from '@/utils/rules';
import { useConfirm } from '@/Contexts/ConfirmContext';
import { useToast } from '@/Contexts/ToastContext';
import type { PublishedRule } from '@/types/rules';

const MATRIX_RULE_TYPES = ['auto', 'pairs', 'descendante', 'ascendante'] as const;
const EVALUATION_TYPES = [...MATRIX_RULE_TYPES, '360'] as const;
type MatrixRuleType = (typeof MATRIX_RULE_TYPES)[number];

const TYPE_LABELS: Record<string, string> = {
  auto: 'Auto-évaluation',
  pairs: 'Pairs',
  descendante: 'Descendante',
  ascendante: 'Ascendante',
  '360': '360°',
};

// Code court affiché dans les cellules de la vue 360° (un seul état visuel par sens :
// la couleur indique le statut de la règle, le code indique son type).
const TYPE_CODES: Record<MatrixRuleType, string> = {
  auto: 'Au',
  pairs: 'Pa',
  descendante: 'De',
  ascendante: 'As',
};

type CellState = 'active' | 'inactive' | 'none';

const CELL_STYLES: Record<CellState, string> = {
  active: 'border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  inactive: 'border-dashed border-sabc-gray-400 bg-white text-sabc-gray-500 hover:bg-sabc-gray-50 dark:bg-transparent',
  none: 'border-sabc-gray-200 bg-sabc-gray-50 text-transparent hover:border-sabc-gray-300 hover:bg-white hover:text-sabc-gray-400 dark:border-sabc-gray-700 dark:bg-sabc-gray-800/40',
};

const CELL_STATE_LABELS: Record<CellState, string> = {
  active: 'règle active',
  inactive: 'règle inactive',
  none: 'aucune règle',
};

type ViewMode = 'matrix' | 'list';

// State for the cell-driven modal: which evaluator/evaluatee couple, and an
// existing rule if one already matches the selected type.
// Volontairement sans la règle elle-même: elle est relue depuis l'index au
// rendu, sinon la modale garderait un état périmé après un basculement.
interface CellSelection {
  evaluator: string;
  evaluatee: string;
  type: string;
}

export default function RulesIndexPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const { success, error } = useToast();

  const [view, setView] = React.useState<ViewMode>('matrix');
  const [selectedType, setSelectedType] = React.useState<string>(EVALUATION_TYPES[0]);
  const [selection, setSelection] = React.useState<CellSelection | null>(null);

  const { data } = useSuspenseQuery({
    queryKey: ['admin', 'roles', 'regles'],
    queryFn: () => adminApi.roles.regles().then((response) => response.data),
  });

  const { data: rolesData } = useSuspenseQuery({
    queryKey: ['admin', 'roles'],
    queryFn: () => adminApi.roles.list().then((response) => response.data),
  });

  const rules = React.useMemo(
    () => (Array.isArray(data) ? data.map((rule) => normalizePublishedRule(rule)) : []),
    [data],
  );

  // Distinct roles: prefer the roles catalogue, fall back to roles referenced by rules.
  const roles = React.useMemo(() => {
    const fromCatalogue = Array.isArray(rolesData)
      ? rolesData.map((role: any) => String(role?.nom_role ?? '')).filter(Boolean)
      : [];
    const fromRules = rules.flatMap((rule) => [rule.role_evaluateur, rule.role_evalue]);
    const set = new Set<string>();
    [...fromCatalogue, ...fromRules].forEach((role) => {
      if (role && String(role).trim().length > 0) set.add(String(role).trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [rolesData, rules]);

  // Index active rules by evaluator|evaluatee|type for O(1) cell lookups.
  const ruleIndex = React.useMemo(() => {
    const map = new Map<string, PublishedRule>();
    rules.forEach((rule) => {
      if (!rule.role_evaluateur || !rule.role_evalue || !rule.type_evaluation) return;
      const key = `${rule.role_evaluateur}|${rule.role_evalue}|${rule.type_evaluation}`.toUpperCase();
      // Keep the first one; toggling/edit operates on a single rule per couple.
      if (!map.has(key)) map.set(key, rule);
    });
    return map;
  }, [rules]);

  const findRule = React.useCallback(
    (evaluator: string, evaluatee: string, type: string): PublishedRule | null =>
      ruleIndex.get(`${evaluator}|${evaluatee}|${type}`.toUpperCase()) ?? null,
    [ruleIndex],
  );

  const readError = (e: any, fallback: string) =>
    typeof e?.response?.data?.message === 'string' ? e.response.data.message : fallback;

  const toggleMutation = useMutation({
    mutationFn: (id: string) => adminApi.roles.toggleRegle(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'roles', 'regles'] });
      success('Règle mise à jour.');
    },
    onError: (e: any) => error(readError(e, "La règle n'a pas pu être modifiée.")),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => reglesApi.delete(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'roles', 'regles'] });
      setSelection(null);
      success('Règle supprimée.');
    },
    onError: (e: any) => error(readError(e, "La règle n'a pas pu être supprimée.")),
  });

  const handleDelete = async (rule: PublishedRule) => {
    const confirmed = await confirm({
      title: 'Supprimer cette règle ?',
      description: `« ${rule.nom_regle} » sera définitivement supprimée. Cette action est irréversible.`,
      confirmLabel: 'Supprimer',
      variant: 'destructive',
    });
    if (confirmed) deleteMutation.mutate(rule.id_regle);
  };

  const activeCount = rules.filter((rule) => rule.est_active).length;
  const compatibleForType = rules.filter((rule) => {
    const type = String(rule.type_evaluation).toLowerCase();
    return rule.est_active && (
      selectedType === '360'
        ? MATRIX_RULE_TYPES.includes(type as MatrixRuleType)
        : type === selectedType
    );
  }).length;

  const findCellRule = (evaluator: string, evaluatee: string) => {
    if (selectedType !== '360') return findRule(evaluator, evaluatee, selectedType);

    const matchingRules = MATRIX_RULE_TYPES
      .map((type) => findRule(evaluator, evaluatee, type))
      .filter((rule): rule is PublishedRule => rule !== null);

    return matchingRules.find((rule) => rule.est_active) ?? matchingRules[0] ?? null;
  };

  const getCellRuleType = (rule: PublishedRule | null, evaluator: string, evaluatee: string): MatrixRuleType => {
    if (rule) {
      const ruleType = String(rule.type_evaluation).toLowerCase();
      return MATRIX_RULE_TYPES.find((type) => type === ruleType) ?? 'descendante';
    }
    return evaluator === evaluatee ? 'auto' : 'descendante';
  };

  const openCell = (evaluator: string, evaluatee: string, type?: string) => {
    const rule = selectedType === '360' ? findCellRule(evaluator, evaluatee) : null;
    const cellType = type ?? (rule ? String(rule.type_evaluation).toLowerCase() : evaluator === evaluatee ? 'auto' : 'descendante');
    setSelection({ evaluator, evaluatee, type: cellType });
  };

  const goToCreate = (evaluator?: string, evaluatee?: string, type = selectedType) => {
    const params = new URLSearchParams();
    if (evaluator) params.set('role_evaluateur', evaluator);
    if (evaluatee) params.set('role_evalue', evaluatee);
    params.set('type_evaluation', type);
    navigate(`/admin/evaluations/regles/create?${params.toString()}`);
  };

  return (
    <AdminEvaluationsLayout title="Règles d’évaluation">
      <PageHeader
        title="Règles d’évaluation"
        description="Qui évalue qui : compatibilité entre rôles évaluateurs et rôles évalués, par type d’évaluation."
        breadcrumbs={[{ label: 'Administration' }, { label: 'Évaluations' }, { label: 'Règles' }]}
        actions={(
          <>
          {/* View toggle: matrix vs. detailed list */}
          <div className="flex items-center rounded-lg border border-sabc-gray-200 p-1" role="group" aria-label="Affichage">
            <button
              type="button"
              aria-pressed={view === 'matrix'}
              onClick={() => setView('matrix')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                view === 'matrix'
                  ? 'bg-sabc-gray-100 text-sabc-gray-900 dark:bg-sabc-gray-800 dark:text-white'
                  : 'text-sabc-gray-600 hover:bg-sabc-gray-100'
              }`}
            >
              <LayoutGrid size={15} />
              Matrice
            </button>
            <button
              type="button"
              aria-pressed={view === 'list'}
              onClick={() => setView('list')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                view === 'list'
                  ? 'bg-sabc-gray-100 text-sabc-gray-900 dark:bg-sabc-gray-800 dark:text-white'
                  : 'text-sabc-gray-600 hover:bg-sabc-gray-100'
              }`}
            >
              <List size={15} />
              Liste
            </button>
          </div>
          <Button onClick={() => goToCreate()}>
            <Plus size={16} className="mr-2" />
            Nouvelle règle
          </Button>
          </>
        )}
      />

      <KpiGrid>
        <KpiCard label="Total règles" value={rules.length} />
        <KpiCard label="Actives" value={activeCount} />
        <KpiCard label="Rôles" value={roles.length} />
        <KpiCard
          label={selectedType === '360' ? 'Règles actives (360°)' : `Actives : ${TYPE_LABELS[selectedType] ?? selectedType}`}
          value={compatibleForType}
        />
      </KpiGrid>

      {view === 'matrix' ? (
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle>Matrice de compatibilité</CardTitle>
              {/* Filtre par type : la matrice est recalculée pour le type choisi */}
              <div className="flex flex-wrap items-center gap-1 rounded-lg border border-sabc-gray-200 p-1">
                {EVALUATION_TYPES.map((type) => (
                  <button
                    key={type}
                    type="button"
                    aria-pressed={selectedType === type}
                    onClick={() => setSelectedType(type)}
                    className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                      selectedType === type
                        ? 'bg-sabc-gray-100 text-sabc-gray-900 dark:bg-sabc-gray-800 dark:text-white'
                        : 'text-sabc-gray-600 hover:bg-sabc-gray-100'
                    }`}
                  >
                    {TYPE_LABELS[type] ?? type}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {roles.length === 0 ? (
              <div className="py-12 text-center text-sabc-gray-400">Aucun rôle disponible.</div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-max border-collapse text-sm">
                    <thead>
                      <tr>
                        <th
                          scope="col"
                          className="sticky left-0 z-10 min-w-[11rem] border-b border-r border-sabc-gray-200 bg-white px-3 py-2 text-left align-bottom text-xs font-medium text-sabc-gray-500 dark:border-sabc-gray-700 dark:bg-sabc-gray-900"
                        >
                          <span className="block">Évaluateur (lignes)</span>
                          <span className="block">Évalué (colonnes)</span>
                        </th>
                        {roles.map((evaluatee) => (
                          <th
                            key={evaluatee}
                            scope="col"
                            className="min-w-[3.5rem] border-b border-sabc-gray-200 px-1 py-2 text-center align-bottom text-xs font-semibold text-sabc-gray-700 dark:border-sabc-gray-700 dark:text-sabc-gray-300"
                          >
                            {evaluatee}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {roles.map((evaluator) => (
                        <tr key={evaluator} className="hover:bg-sabc-gray-50/60 dark:hover:bg-sabc-gray-800/30">
                          <th
                            scope="row"
                            className="sticky left-0 z-10 border-r border-sabc-gray-200 bg-white px-3 py-1.5 text-left text-xs font-semibold text-sabc-gray-700 dark:border-sabc-gray-700 dark:bg-sabc-gray-900 dark:text-sabc-gray-300"
                          >
                            {evaluator}
                          </th>
                          {roles.map((evaluatee) => {
                            const rule = findCellRule(evaluator, evaluatee);
                            const state: CellState = rule ? (rule.est_active ? 'active' : 'inactive') : 'none';
                            const type = selectedType === '360' ? getCellRuleType(rule, evaluator, evaluatee) : null;
                            const typeLabel = TYPE_LABELS[type ?? selectedType] ?? selectedType;
                            const label = `${typeLabel} : ${evaluator} évalue ${evaluatee}, ${CELL_STATE_LABELS[state]}. ${rule ? 'Gérer la règle' : 'Créer une règle'}`;

                            return (
                              <td key={evaluatee} className="p-1 text-center">
                                <button
                                  type="button"
                                  onClick={() => openCell(evaluator, evaluatee)}
                                  aria-label={label}
                                  title={rule?.nom_regle ? `${rule.nom_regle} (${CELL_STATE_LABELS[state]})` : label}
                                  className={`mx-auto flex h-9 w-9 items-center justify-center rounded-lg border text-xs font-semibold transition ${CELL_STYLES[state]}`}
                                >
                                  {state === 'none' ? (
                                    <Plus size={14} aria-hidden="true" />
                                  ) : type && rule ? (
                                    TYPE_CODES[type]
                                  ) : (
                                    <Check size={16} aria-hidden="true" />
                                  )}
                                </button>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Légende */}
                <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-sabc-gray-600">
                  <span className="inline-flex items-center gap-1.5">
                    <span className={`flex h-5 w-5 items-center justify-center rounded border ${CELL_STYLES.active}`}>
                      <Check size={12} aria-hidden="true" />
                    </span>
                    Règle active
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className={`flex h-5 w-5 items-center justify-center rounded border ${CELL_STYLES.inactive}`}>
                      <Check size={12} aria-hidden="true" />
                    </span>
                    Règle inactive
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="flex h-5 w-5 rounded border border-sabc-gray-200 bg-sabc-gray-50" />
                    Aucune règle (cliquer pour en créer une)
                  </span>
                  {selectedType === '360' ? (
                    <span className="inline-flex flex-wrap items-center gap-x-3 gap-y-1">
                      {MATRIX_RULE_TYPES.map((type) => (
                        <span key={type}>
                          <span className="font-semibold text-sabc-gray-800">{TYPE_CODES[type]}</span> {TYPE_LABELS[type]}
                        </span>
                      ))}
                    </span>
                  ) : null}
                  <span>La diagonale correspond aux évaluations d’un rôle par lui-même.</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Catalogue des règles</CardTitle>
          </CardHeader>
          <CardContent>
            {rules.length === 0 ? (
              <div className="py-12 text-center text-sabc-gray-400">Aucune règle d’évaluation définie.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px]">
                  <thead className="bg-sabc-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-sabc-gray-600">Nom</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-sabc-gray-600">Contexte</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-sabc-gray-600">Critères</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-sabc-gray-600">Statut</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-sabc-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sabc-gray-200">
                    {rules.map((rule) => (
                      <tr key={rule.id_regle} className="hover:bg-sabc-gray-50">
                        <td className="px-4 py-4">
                          <div className="font-medium text-sabc-gray-900">{rule.nom_regle}</div>
                          <div className="mt-1 text-sm text-sabc-gray-400">{rule.description || 'Sans description'}</div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="secondary">{rule.role_evaluateur || 'Tous'}</Badge>
                            <span>→</span>
                            <Badge variant="secondary">{rule.role_evalue || 'Tous'}</Badge>
                            <Badge variant="outline">{rule.type_evaluation ? (TYPE_LABELS[String(rule.type_evaluation).toLowerCase()] ?? rule.type_evaluation) : 'Type non défini'}</Badge>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm text-sabc-gray-700">
                          <div>{rule.criteres.length} critères</div>
                          <div className="text-xs text-sabc-gray-400">
                            {rule.sections.map((section) => section.titre).slice(0, 3).join(', ')}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <Badge variant={rule.est_active ? 'success' : 'secondary'}>
                            {rule.est_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={`Modifier la règle ${rule.nom_regle}`}
                              title="Modifier"
                              onClick={() => navigate(`/admin/evaluations/regles/${rule.id_regle}/edit`)}
                            >
                              <Edit size={15} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={`${rule.est_active ? 'Désactiver' : 'Activer'} la règle ${rule.nom_regle}`}
                              title={rule.est_active ? 'Désactiver' : 'Activer'}
                              onClick={() => toggleMutation.mutate(rule.id_regle)}
                            >
                              <Power size={15} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Cell-driven modal: edit/toggle/delete an existing rule, or create one.
          La règle est relue depuis l'index à chaque rendu: une copie figée dans
          `selection` afficherait encore l'ancien statut après un basculement. */}
      <Dialog open={selection !== null} onOpenChange={(open) => !open && setSelection(null)}>
        <DialogContent>
          {selection ? (
            (() => {
              const currentRule = findRule(selection.evaluator, selection.evaluatee, selection.type);
              return (
            <>
              <DialogHeader>
                <DialogTitle>
                  {selection.evaluator} → {selection.evaluatee}
                </DialogTitle>
                <DialogDescription>
                  Type : {TYPE_LABELS[selection.type] ?? selection.type}
                  {selection.evaluator === selection.evaluatee ? ' · auto-évaluation' : ''}
                </DialogDescription>
              </DialogHeader>

              {currentRule ? (
                <div className="space-y-4">
                  <div className="rounded-lg border border-sabc-gray-200 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-medium text-sabc-gray-900">{currentRule.nom_regle}</div>
                        <div className="mt-1 text-sm text-sabc-gray-400">
                          {currentRule.description || 'Sans description'}
                        </div>
                      </div>
                      <Badge variant={currentRule.est_active ? 'success' : 'secondary'}>
                        {currentRule.est_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <div className="mt-3 text-sm text-sabc-gray-600">
                      {currentRule.criteres.length} critères ·{' '}
                      {currentRule.sections.map((s) => s.titre).slice(0, 3).join(', ') || 'aucune section'}
                    </div>
                  </div>

                  <DialogFooter className="gap-2">
                    <Button
                      variant="outline"
                      className="border-red-200 text-red-700 hover:border-red-300 hover:bg-red-50 hover:text-red-800"
                      loading={deleteMutation.isPending}
                      onClick={() => handleDelete(currentRule)}
                    >
                      <Trash2 size={15} className="mr-1.5" />
                      Supprimer
                    </Button>
                    <Button
                      variant="outline"
                      loading={toggleMutation.isPending}
                      disabled={toggleMutation.isPending}
                      onClick={() => toggleMutation.mutate(currentRule.id_regle)}
                    >
                      <Power size={15} className="mr-1.5" />
                      {currentRule.est_active ? 'Désactiver' : 'Activer'}
                    </Button>
                    <Button
                      onClick={() =>
                        navigate(`/admin/evaluations/regles/${currentRule.id_regle}/edit`)
                      }
                    >
                      <Pencil size={15} className="mr-1.5" />
                      Modifier
                    </Button>
                  </DialogFooter>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-lg border border-dashed border-sabc-gray-300 bg-sabc-gray-50 p-4 text-sm text-sabc-gray-500">
                    Aucune règle ne lie ces deux rôles pour ce type d’évaluation. Vous pouvez en créer
                    une : le couple de rôles et le type seront pré-remplis.
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setSelection(null)}>
                      Annuler
                    </Button>
                    <Button
                      onClick={() => goToCreate(selection.evaluator, selection.evaluatee, selection.type)}
                    >
                      <Plus size={15} className="mr-1.5" />
                      Créer la règle
                    </Button>
                  </DialogFooter>
                </div>
              )}
            </>
              );
            })()
          ) : null}
        </DialogContent>
      </Dialog>
    </AdminEvaluationsLayout>
  );
}
