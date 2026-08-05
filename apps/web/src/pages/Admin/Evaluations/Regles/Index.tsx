import React from 'react';
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Check, Edit, LayoutGrid, List, Pencil, Plus, Power, Trash2, X } from 'lucide-react';
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
import type { PublishedRule } from '@/types/rules';

const EVALUATION_TYPES = ['auto', 'pairs', 'descendante', 'ascendante', '360'] as const;

const TYPE_LABELS: Record<string, string> = {
  auto: 'Auto-évaluation',
  pairs: 'Pairs',
  descendante: 'Descendante',
  ascendante: 'Ascendante',
  '360': '360°',
};

type ViewMode = 'matrix' | 'list';

// State for the cell-driven modal: which evaluator/evaluatee couple, and an
// existing rule if one already matches the selected type.
interface CellSelection {
  evaluator: string;
  evaluatee: string;
  type: string;
  rule: PublishedRule | null;
}

export default function RulesIndexPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

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

  const toggleMutation = useMutation({
    mutationFn: (id: string) => adminApi.roles.toggleRegle(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'roles', 'regles'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => reglesApi.delete(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'roles', 'regles'] });
      setSelection(null);
    },
  });

  const activeCount = rules.filter((rule) => rule.est_active).length;
  const compatibleForType = rules.filter(
    (rule) => rule.est_active && String(rule.type_evaluation).toLowerCase() === selectedType,
  ).length;

  const openCell = (evaluator: string, evaluatee: string) => {
    setSelection({
      evaluator,
      evaluatee,
      type: selectedType,
      rule: findRule(evaluator, evaluatee, selectedType),
    });
  };

  const goToCreate = (evaluator?: string, evaluatee?: string) => {
    const params = new URLSearchParams();
    if (evaluator) params.set('role_evaluateur', evaluator);
    if (evaluatee) params.set('role_evalue', evaluatee);
    params.set('type_evaluation', selectedType);
    navigate(`/admin/evaluations/regles/create?${params.toString()}`);
  };

  return (
    <AdminEvaluationsLayout title="Règles d’évaluation">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-sabc-gray-900">Règles d’évaluation</h1>
          <p className="mt-1 text-sm text-sabc-gray-400">
            Matrice de compatibilité entre rôles évaluateurs et rôles évalués.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle: matrix vs. detailed list */}
          <div className="flex items-center rounded-xl border border-sabc-gray-200 p-1">
            <button
              type="button"
              onClick={() => setView('matrix')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                view === 'matrix'
                  ? 'bg-sabc-red-primary text-white'
                  : 'text-sabc-gray-600 hover:bg-sabc-gray-100'
              }`}
            >
              <LayoutGrid size={15} />
              Matrice
            </button>
            <button
              type="button"
              onClick={() => setView('list')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                view === 'list'
                  ? 'bg-sabc-red-primary text-white'
                  : 'text-sabc-gray-600 hover:bg-sabc-gray-100'
              }`}
            >
              <List size={15} />
              Liste
            </button>
          </div>
          <Button
            className="bg-sabc-red-primary text-white hover:bg-sabc-red-dark"
            onClick={() => goToCreate()}
          >
            <Plus size={16} className="mr-2" />
            Nouvelle règle
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-sabc-gray-400">Total règles</div>
            <div className="text-2xl font-bold text-sabc-gray-900">{rules.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-sabc-gray-400">Actives</div>
            <div className="text-2xl font-bold text-sabc-success">{activeCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-sabc-gray-400">Rôles</div>
            <div className="text-2xl font-bold text-sabc-gray-900">{roles.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-sabc-gray-400">Compatibles ({TYPE_LABELS[selectedType] ?? selectedType})</div>
            <div className="text-2xl font-bold text-sabc-gray-900">{compatibleForType}</div>
          </CardContent>
        </Card>
      </div>

      {view === 'matrix' ? (
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle>Matrice de compatibilité</CardTitle>
              {/* Type filter as tabs — the matrix recomputes for the selected type */}
              <div className="flex flex-wrap items-center gap-1 rounded-xl border border-sabc-gray-200 p-1">
                {EVALUATION_TYPES.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setSelectedType(type)}
                    className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                      selectedType === type
                        ? 'bg-sabc-red-primary text-white'
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
                  <table className="border-collapse text-sm">
                    <thead>
                      <tr>
                        <th className="sticky left-0 z-10 bg-white px-3 py-2 text-left text-xs font-semibold uppercase text-sabc-gray-500">
                          <div className="flex flex-col">
                            <span>Évaluateur</span>
                            <span className="font-normal normal-case text-sabc-gray-400">↓ / Évalué →</span>
                          </div>
                        </th>
                        {roles.map((evaluatee) => (
                          <th
                            key={evaluatee}
                            className="min-w-[3.5rem] px-2 py-2 text-center text-xs font-semibold text-sabc-gray-700"
                          >
                            {evaluatee}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {roles.map((evaluator) => (
                        <tr key={evaluator}>
                          <th className="sticky left-0 z-10 bg-white px-3 py-2 text-left text-xs font-semibold text-sabc-gray-700">
                            {evaluator}
                          </th>
                          {roles.map((evaluatee) => {
                            const rule = findRule(evaluator, evaluatee, selectedType);
                            const isDiagonal = evaluator === evaluatee;
                            const compatible = Boolean(rule);
                            const active = rule?.est_active ?? false;

                            return (
                              <td key={evaluatee} className="p-1 text-center">
                                <button
                                  type="button"
                                  onClick={() => openCell(evaluator, evaluatee)}
                                  title={
                                    compatible
                                      ? `${rule?.nom_regle ?? 'Règle'} — cliquer pour modifier`
                                      : 'Aucune règle — cliquer pour créer'
                                  }
                                  className={[
                                    'flex h-9 w-9 items-center justify-center rounded-lg border transition',
                                    isDiagonal ? 'ring-1 ring-inset ring-sabc-gray-300' : '',
                                    compatible
                                      ? active
                                        ? 'border-sabc-success/30 bg-sabc-success/10 text-sabc-success hover:bg-sabc-success/20'
                                        : 'border-sabc-warning/30 bg-sabc-warning/10 text-sabc-warning hover:bg-sabc-warning/20'
                                      : 'border-sabc-gray-200 bg-sabc-gray-50 text-sabc-gray-300 hover:bg-sabc-gray-100',
                                  ].join(' ')}
                                >
                                  {compatible ? <Check size={16} /> : <X size={14} />}
                                </button>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Legend */}
                <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-sabc-gray-500">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="flex h-5 w-5 items-center justify-center rounded border border-sabc-success/30 bg-sabc-success/10 text-sabc-success">
                      <Check size={12} />
                    </span>
                    Compatible (règle active)
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="flex h-5 w-5 items-center justify-center rounded border border-sabc-warning/30 bg-sabc-warning/10 text-sabc-warning">
                      <Check size={12} />
                    </span>
                    Règle existante mais inactive
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="flex h-5 w-5 items-center justify-center rounded border border-sabc-gray-200 bg-sabc-gray-50 text-sabc-gray-300">
                      <X size={11} />
                    </span>
                    Incompatible (aucune règle)
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="flex h-5 w-5 items-center justify-center rounded border border-sabc-gray-200 ring-1 ring-inset ring-sabc-gray-300" />
                    Diagonale (auto-évaluation)
                  </span>
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
                <table className="w-full">
                  <thead className="bg-sabc-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-sabc-gray-800">Nom</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-sabc-gray-800">Contexte</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-sabc-gray-800">Critères</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-sabc-gray-800">Statut</th>
                      <th className="px-4 py-3 text-right text-xs font-medium uppercase text-sabc-gray-800">Actions</th>
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
                            <Badge variant="primary">{rule.type_evaluation || 'N/A'}</Badge>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm text-sabc-gray-700">
                          <div>{rule.criteres.length} critères</div>
                          <div className="text-xs text-sabc-gray-400">
                            {rule.sections.map((section) => section.titre).slice(0, 3).join(', ')}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <Badge className={rule.est_active ? 'bg-sabc-success text-white' : 'bg-sabc-gray-400 text-white'}>
                            {rule.est_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/admin/evaluations/regles/${rule.id_regle}/edit`)}
                            >
                              <Edit size={14} />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleMutation.mutate(rule.id_regle)}
                              className={rule.est_active ? 'text-sabc-error hover:bg-red-50' : 'text-sabc-success hover:bg-green-50'}
                            >
                              <Power size={14} />
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

      {/* Cell-driven modal: edit/toggle/delete an existing rule, or create one. */}
      <Dialog open={selection !== null} onOpenChange={(open) => !open && setSelection(null)}>
        <DialogContent>
          {selection ? (
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

              {selection.rule ? (
                <div className="space-y-4">
                  <div className="rounded-xl border border-sabc-gray-200 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-medium text-sabc-gray-900">{selection.rule.nom_regle}</div>
                        <div className="mt-1 text-sm text-sabc-gray-400">
                          {selection.rule.description || 'Sans description'}
                        </div>
                      </div>
                      <Badge
                        className={
                          selection.rule.est_active
                            ? 'bg-sabc-success text-white'
                            : 'bg-sabc-gray-400 text-white'
                        }
                      >
                        {selection.rule.est_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <div className="mt-3 text-sm text-sabc-gray-600">
                      {selection.rule.criteres.length} critères ·{' '}
                      {selection.rule.sections.map((s) => s.titre).slice(0, 3).join(', ') || 'aucune section'}
                    </div>
                  </div>

                  <DialogFooter className="gap-2">
                    <Button
                      variant="outline"
                      className="text-sabc-error hover:bg-red-50"
                      loading={deleteMutation.isPending}
                      onClick={() => selection.rule && deleteMutation.mutate(selection.rule.id_regle)}
                    >
                      <Trash2 size={15} className="mr-1.5" />
                      Supprimer
                    </Button>
                    <Button
                      variant="outline"
                      loading={toggleMutation.isPending}
                      onClick={() =>
                        selection.rule && toggleMutation.mutate(selection.rule.id_regle)
                      }
                    >
                      <Power size={15} className="mr-1.5" />
                      {selection.rule.est_active ? 'Désactiver' : 'Activer'}
                    </Button>
                    <Button
                      className="bg-sabc-red-primary text-white hover:bg-sabc-red-dark"
                      onClick={() =>
                        selection.rule &&
                        navigate(`/admin/evaluations/regles/${selection.rule.id_regle}/edit`)
                      }
                    >
                      <Pencil size={15} className="mr-1.5" />
                      Modifier
                    </Button>
                  </DialogFooter>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-xl border border-dashed border-sabc-gray-300 bg-sabc-gray-50 p-4 text-sm text-sabc-gray-500">
                    Aucune règle ne lie ces deux rôles pour ce type d’évaluation. Vous pouvez en créer
                    une — le couple de rôles et le type seront pré-remplis.
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setSelection(null)}>
                      Annuler
                    </Button>
                    <Button
                      className="bg-sabc-red-primary text-white hover:bg-sabc-red-dark"
                      onClick={() => goToCreate(selection.evaluator, selection.evaluatee)}
                    >
                      <Plus size={15} className="mr-1.5" />
                      Créer la règle
                    </Button>
                  </DialogFooter>
                </div>
              )}
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </AdminEvaluationsLayout>
  );
}
