import React, { useState } from 'react';
import { Head } from '@/lib/inertia-shim';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/UI/Card';
import { Alert, AlertDescription, AlertTitle } from '@/Components/UI/Alert';
import Badge from '@/Components/UI/Badge';
import { Button } from '@/Components/UI/Button';
import EvaluationModal from '@/Components/Evaluation/EvaluationModal';
import { useEvaluationWorkflowData } from '@/Hooks/queries';
import { EvaluationPageLayout, formatDisplayName, formatRole } from './shared';
import {
  QuickActionsCard,
  formatDateLabel,
  formatEvaluationType,
  formatStatusLabel,
  getStatusBadgeVariant,
} from '@/Components/Dashboard/RoleDashboardShared';
import {
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  EyeOff,
  Layers,
  ListChecks,
  UserRound,
  Users,
} from 'lucide-react';
import { filterAdminApplicableRules, filterApplicableRules } from '@/utils/rules';
import { useAuthContext } from '@/Contexts/AuthContext';
import { paginateEligibleGroups } from './eligible-targets-data';
import { formatScore } from '@/utils/helpers';

type Target = Record<string, any>;
const ELIGIBLE_TARGETS_PAGE_SIZE = 10;

const Mine: React.FC = () => {
  const { user } = useAuthContext();
  const { data } = useEvaluationWorkflowData();

  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [eligibleTargetsPage, setEligibleTargetsPage] = useState(1);
  const eligibleTargetsPagination = paginateEligibleGroups(
    data.eligibleGroups,
    eligibleTargetsPage,
    ELIGIBLE_TARGETS_PAGE_SIZE,
  );

  const isAdmin = (user?.role_nom || user?.role || '').toUpperCase() === 'ADMIN';

  const getApplicableRules = (target: Target) => isAdmin
    ? filterAdminApplicableRules(data.rules, target.role_nom || target.role)
    : filterApplicableRules(
      data.rules,
      user?.role_nom || user?.role,
      target.role_nom || target.role,
      target.workflowType ?? null,
    );

  const handleEvaluate = (target: Target) => {
    const rules = getApplicableRules(target);
    setSelectedTarget(target.matricule);
    setSelectedTemplate(rules[0]?.id_regle ?? null);
    setModalOpen(true);
  };

  return (
    <EvaluationPageLayout pageTitle="Mes évaluations">
      <Head title="Mes évaluations" />

      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <section className="flex flex-col gap-6 rounded-lg border border-sabc-gray-200 bg-white p-5 shadow-md dark:border-sabc-gray-700 dark:bg-sabc-gray-900 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="min-w-0">
            <Badge variant="secondary" className="mb-3 bg-sabc-red-light text-sabc-red-primary">
              Workflow d’évaluation
            </Badge>
            <h1 className="text-2xl font-semibold text-sabc-gray-900 dark:text-white">
              Démarrer ou reprendre vos évaluations
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-sabc-gray-600 dark:text-sabc-gray-400">
              Le flux repose maintenant sur la période ouverte et les règles publiées compatibles avec la cible sélectionnée.
            </p>
          </div>
          <div className="w-full shrink-0 rounded-md border border-sabc-gray-200 bg-sabc-gray-50 px-4 py-3 sm:w-56 dark:border-sabc-gray-700 dark:bg-sabc-gray-800">
            <div className="text-xs font-medium uppercase tracking-wide text-sabc-gray-500 dark:text-sabc-gray-400">
              Période active
            </div>
            {data.activePeriod ? (
              <>
                <div className="mt-1 font-semibold text-sabc-gray-900 dark:text-white">
                  {data.activePeriod.nom_periode || data.activePeriod.code_periode}
                </div>
                <div className="mt-1 text-xs text-sabc-gray-500 dark:text-sabc-gray-400">
                  Clôture le {data.activePeriod.date_fin ? formatDateLabel(data.activePeriod.date_fin) : 'date non renseignée'}
                </div>
              </>
            ) : (
              <div className="mt-1 text-sm text-sabc-gray-700 dark:text-sabc-gray-300">
                Aucune période ouverte
              </div>
            )}
          </div>
        </section>

        {!data.activePeriod ? (
          <Alert>
            <AlertTitle>Aucune période active</AlertTitle>
            <AlertDescription className="flex flex-col gap-2">
              <span>Aucune campagne d’évaluation n’est ouverte pour l’instant.</span>
              {isAdmin ? (
                <a
                  href="/admin/evaluations/periodes"
                  className="inline-flex items-center text-sm font-medium text-sabc-red-primary underline-offset-4 hover:underline"
                >
                  Créer et ouvrir une période
                </a>
              ) : (
                <span className="text-xs text-sabc-gray-500">Contactez l’administrateur pour ouvrir un cycle d’évaluation.</span>
              )}
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: 'Périodes ouvertes',
              value: data.summary.activePeriods,
              caption: 'Cycles actuellement disponibles',
              Icon: CalendarDays,
            },
            {
              label: 'Cibles éligibles',
              value: data.summary.eligibleTargets,
              caption: 'Collaborateurs actifs et disponibles',
              Icon: Users,
            },
            {
              label: 'Règles actives',
              value: data.summary.activeRules,
              caption: 'Cadres publiés exploitables par le workflow',
              Icon: Layers,
            },
            {
              label: 'Historique',
              value: data.summary.historyEntries,
              caption: 'Évaluations reçues ou données déjà enregistrées',
              Icon: CheckCircle2,
            },
          ].map(({ label, value, caption, Icon }) => (
            <div
              key={label}
              className="flex min-h-36 items-center gap-4 rounded-lg border border-sabc-gray-200 bg-white p-5 dark:border-sabc-gray-700 dark:bg-sabc-gray-900"
            >
              <Icon className="h-7 w-7 shrink-0 text-sabc-red-primary" aria-hidden="true" />
              <div className="min-w-0">
                <div className="sabc-display text-2xl tabular-nums text-sabc-gray-900 dark:text-white">
                  {value ?? 'n.d.'}
                </div>
                <div className="text-sm text-sabc-gray-500 dark:text-sabc-gray-400">{label}</div>
                <div className="mt-1 text-xs text-sabc-gray-500 dark:text-sabc-gray-400">{caption}</div>
              </div>
            </div>
          ))}
        </div>

        <section className="rounded-lg border border-blue-300 bg-blue-100/70 p-4 dark:border-blue-900 dark:bg-blue-950/40 sm:p-5">
          <div className="mb-4 flex items-center gap-3">
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-blue-600 text-white">
              <ClipboardList className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="font-semibold text-sabc-gray-900 dark:text-white">Cadre d’évaluation actif</h2>
              <p className="text-xs text-sabc-gray-600 dark:text-sabc-gray-400">
                Les règles compatibles sont filtrées selon le rôle de chaque collaborateur.
              </p>
            </div>
          </div>
          {data.rules.length === 0 ? (
            <div className="rounded-md bg-white px-4 py-5 text-sm text-sabc-gray-500 dark:bg-sabc-gray-900 dark:text-sabc-gray-400">
              {isAdmin
                ? 'Aucune règle active publiée pour les rôles des collaborateurs.'
                : 'Aucune règle active publiée pour votre rôle.'}
            </div>
          ) : (
            <ul className="divide-y divide-sabc-gray-100 overflow-hidden rounded-lg border border-sabc-gray-100 bg-white dark:divide-sabc-gray-800 dark:border-sabc-gray-700 dark:bg-sabc-gray-900">
              {data.rules.slice(0, 4).map((rule) => {
                const domains = rule.sections.map((section) => section.titre).slice(0, 3);
                const isDetailed = rule.visibility_policy.detail === 'detailed';

                return (
                  <li
                    key={rule.id_regle}
                    className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center"
                  >
                    <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
                      <UserRound className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline gap-x-2">
                        <span className="truncate text-sm font-semibold text-sabc-gray-900 dark:text-white">
                          {rule.nom_regle || formatEvaluationType(rule.type_evaluation)}
                        </span>
                        <span className="text-xs text-sabc-gray-500 dark:text-sabc-gray-400">
                          {formatEvaluationType(rule.type_evaluation)}
                        </span>
                      </div>
                      {domains.length > 0 ? (
                        <p className="mt-1 truncate text-xs text-sabc-gray-500 dark:text-sabc-gray-400">
                          {domains.join(' · ')}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 items-center gap-2 sm:ml-auto">
                      <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                        <ListChecks className="h-3.5 w-3.5" aria-hidden="true" />
                        {rule.criteres.length}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                        <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />
                        {isDetailed ? 'Détaillée' : 'Agrégée'}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Cibles éligibles
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {data.eligibleGroups.length === 0 ? (
              <Alert>
                <AlertTitle>Aucune cible disponible</AlertTitle>
                <AlertDescription className="flex flex-col gap-2">
                  <span>{isAdmin
                    ? 'Aucun collaborateur actif et disponible ne peut être évalué pour l’instant.'
                    : 'Votre hiérarchie ne compte aucun subordonné ou pair éligible pour l’instant.'}</span>
                  {isAdmin && (
                    <a
                      href="/admin/utilisateurs"
                      className="inline-flex items-center text-sm font-medium text-sabc-red-primary underline-offset-4 hover:underline"
                    >
                      Vérifier la configuration des utilisateurs
                    </a>
                  )}
                </AlertDescription>
              </Alert>
            ) : (
              eligibleTargetsPagination.groups.map((group) => (
                <div key={group.key} className="space-y-3">
                  <div className="text-sm font-semibold text-sabc-gray-900">
                    {group.label}
                    <span className="ml-2 text-xs font-normal text-sabc-gray-500">({group.targets.length})</span>
                  </div>
                  {group.targets.map((target: Target) => (
                    <Card key={target.matricule || `${group.key}-${target.nom}-${target.prenom}`} className="border-sabc-gray-200 shadow-none">
                      <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
                        <div>
                          <div className="font-medium text-sabc-gray-900">{formatDisplayName(target)}</div>
                          <div className="text-sm text-sabc-gray-500">{formatRole(target)}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          {(() => {
                            const rules = getApplicableRules(target);
                            const canStart = Boolean(data.activePeriod) && rules.length > 0;
                            return (
                              <>
                                {!canStart && (
                                  <span className="text-xs text-sabc-gray-400">
                                    {!data.activePeriod ? 'Aucune période active' : 'Aucune règle applicable'}
                                  </span>
                                )}
                                <Button
                                  size="sm"
                                  className="bg-sabc-red-primary text-white hover:bg-sabc-red-dark"
                                  disabled={!canStart}
                                  onClick={() => handleEvaluate(target)}
                                >
                                  Évaluer
                                </Button>
                              </>
                            );
                          })()}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ))
            )}
            {eligibleTargetsPagination.total > ELIGIBLE_TARGETS_PAGE_SIZE && (
              <nav
                aria-label="Pagination des cibles éligibles"
                className="flex flex-col gap-3 border-t border-sabc-gray-200 pt-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <p className="text-sm text-sabc-gray-500" aria-live="polite">
                  Affichage de {eligibleTargetsPagination.start} à {eligibleTargetsPagination.end} sur {eligibleTargetsPagination.total} collaborateurs
                </p>
                <div className="flex items-center justify-between gap-3 sm:justify-end">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={eligibleTargetsPagination.page <= 1}
                    onClick={() => setEligibleTargetsPage(Math.max(1, eligibleTargetsPagination.page - 1))}
                  >
                    Précédent
                  </Button>
                  <span className="text-sm text-sabc-gray-600">
                    Page {eligibleTargetsPagination.page} sur {eligibleTargetsPagination.totalPages}
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={eligibleTargetsPagination.page >= eligibleTargetsPagination.totalPages}
                    onClick={() => setEligibleTargetsPage(Math.min(eligibleTargetsPagination.totalPages, eligibleTargetsPagination.page + 1))}
                  >
                    Suivant
                  </Button>
                </div>
              </nav>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Historique récent
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.historyList.length === 0 ? (
              <Alert>
                <AlertTitle>Aucun historique</AlertTitle>
                <AlertDescription>
                  Vous n’avez pas encore d’évaluation enregistrée sur votre périmètre.
                </AlertDescription>
              </Alert>
            ) : (
              data.historyList.slice(0, 12).map((evaluation: any) => (
                <div key={evaluation.id_evaluation} className="flex flex-col gap-3 rounded-lg border border-sabc-gray-200 p-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="font-medium text-sabc-gray-900">
                      {formatDisplayName(evaluation.evalue || {})}
                    </div>
                    <div className="text-sm text-sabc-gray-500">
                      {evaluation.regle?.nom_regle || formatEvaluationType(evaluation.type_evaluation)}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm tabular-nums text-sabc-gray-700">
                      {formatScore(evaluation.note_globale)}
                    </span>
                    <Badge variant={getStatusBadgeVariant(evaluation.statut)}>
                      {formatStatusLabel(evaluation.statut)}
                    </Badge>
                    <Button variant="outline" size="sm" onClick={() => { window.location.href = `/evaluations/${evaluation.id_evaluation}`; }}>
                      Voir
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <QuickActionsCard
          actions={[
            { label: 'À compléter', href: '/evaluations/pending' },
            { label: 'Axes d’amélioration', href: '/axes-amelioration', variant: 'secondary' },
            { label: 'Mon profil', href: '/common/settings', variant: 'outline' },
          ]}
        />
      </div>

      <EvaluationModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        templateId={selectedTemplate}
        targetMatricule={selectedTarget}
      />
    </EvaluationPageLayout>
  );
};

export default Mine;
