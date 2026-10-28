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
  ActiveRulesCard,
  QuickActionsCard,
  formatDateLabel,
  formatEvaluationType,
  formatStatusLabel,
  getStatusBadgeVariant,
} from '@/Components/Dashboard/RoleDashboardShared';
import { PageHeader } from '@/Components/UI/Page/PageHeader';
import { KpiCard, KpiGrid } from '@/Components/UI/KpiCard';
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
        <PageHeader
          title="Mes évaluations"
          description="Démarrez une évaluation pour un collaborateur éligible ou reprenez une évaluation en cours. Les grilles proposées dépendent de la période ouverte et du rôle de la personne évaluée."
          meta={data.activePeriod
            ? `Période active : ${data.activePeriod.nom_periode || data.activePeriod.code_periode}${data.activePeriod.date_fin ? ` (clôture le ${formatDateLabel(data.activePeriod.date_fin)})` : ''}`
            : 'Aucune période ouverte : le démarrage d’une évaluation est impossible pour l’instant.'}
        />

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

        <KpiGrid>
          <KpiCard
            label="Périodes ouvertes"
            value={data.summary.activePeriods}
            caption="Cycles actuellement disponibles"
          />
          <KpiCard
            label="Cibles éligibles"
            value={data.summary.eligibleTargets}
            caption={isAdmin ? 'Collaborateurs actifs et disponibles' : 'Auto, pairs et subordonnés selon la hiérarchie'}
          />
          <KpiCard
            label="Grilles actives"
            value={data.summary.activeRules}
            caption="Grilles d’évaluation publiées"
          />
          <KpiCard
            label="Historique"
            value={data.summary.historyEntries}
            caption="Évaluations reçues ou données"
          />
        </KpiGrid>

        <div className="grid gap-6">
          <ActiveRulesCard
            rules={data.rules}
            description={isAdmin
              ? 'Les règles compatibles sont filtrées selon le rôle de chaque collaborateur.'
              : 'Les règles compatibles sont filtrées selon votre rôle et les cibles disponibles.'}
            emptyMessage={isAdmin
              ? 'Aucune règle active publiée pour les rôles des collaborateurs.'
              : 'Aucune règle active publiée pour votre rôle.'}
          />
        </div>

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
