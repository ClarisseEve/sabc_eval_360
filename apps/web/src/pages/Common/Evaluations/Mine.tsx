import React, { useEffect, useMemo, useState } from 'react';
import { Head } from '@/lib/inertia-shim';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/UI/Card';
import { Alert, AlertDescription, AlertTitle } from '@/Components/UI/Alert';
import Badge from '@/Components/UI/Badge';
import { Button } from '@/Components/UI/Button';
import EvaluationModal from '@/Components/Evaluation/EvaluationModal';
import { useEvaluationWorkflowData, findWorkflowTarget } from '@/Hooks/queries';
import { EvaluationPageLayout, formatDisplayName, formatRole } from './shared';
import {
  ActiveRulesCard,
  QuickActionsCard,
  formatDateLabel,
  formatEvaluationType,
} from '@/Components/Dashboard/RoleDashboardShared';
import {
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Layers3,
  PlayCircle,
  Users2,
} from 'lucide-react';
import { filterApplicableRules, getRuleSummary } from '@/utils/rules';
import { useAuthContext } from '@/Contexts/AuthContext';

type Target = Record<string, any>;

function MetricTile({
  label,
  value,
  caption,
  icon: Icon,
}: {
  label: string;
  value: React.ReactNode;
  caption: string;
  icon: React.ElementType;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-6">
        <Icon className="h-8 w-8 text-sabc-red-primary" />
        <div>
          <div className="text-2xl font-semibold text-sabc-gray-900">{value}</div>
          <div className="text-sm text-sabc-gray-500">{label}</div>
          <div className="mt-1 text-xs text-sabc-gray-400">{caption}</div>
        </div>
      </CardContent>
    </Card>
  );
}

const Mine: React.FC = () => {
  const { user } = useAuthContext();
  const { data } = useEvaluationWorkflowData();

  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const selectedTargetData = useMemo(
    () => findWorkflowTarget(data.eligibleGroups, selectedTarget),
    [data.eligibleGroups, selectedTarget],
  );

  const selectedTargetType = selectedTargetData?.workflowType ?? null;
  const applicableRules = useMemo(
    () => filterApplicableRules(
      data.rules,
      user?.role_nom || user?.role,
      selectedTargetData?.role_nom || selectedTargetData?.role,
      selectedTargetType,
    ),
    [data.rules, selectedTargetData, selectedTargetType, user?.role, user?.role_nom],
  );

  useEffect(() => {
    if (applicableRules.length === 0) {
      setSelectedTemplate(null);
      return;
    }

    setSelectedTemplate((current) => (
      current && applicableRules.some((rule) => rule.id_regle === current)
        ? current
        : applicableRules[0].id_regle
    ));
  }, [applicableRules]);

  const selectedRule = useMemo(
    () => applicableRules.find((rule) => rule.id_regle === selectedTemplate) ?? applicableRules[0] ?? null,
    [applicableRules, selectedTemplate],
  );

  const selectedRuleSummary = useMemo(
    () => (selectedRule ? getRuleSummary(selectedRule) : null),
    [selectedRule],
  );

  const launchEvaluation = (targetMatricule: string) => {
    setSelectedTarget(targetMatricule);
    setModalOpen(true);
  };

  return (
    <EvaluationPageLayout pageTitle="Mes évaluations">
      <Head title="Mes évaluations" />

      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <Card className="border-none bg-white shadow-lg">
          <CardContent className="flex flex-col gap-6 p-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <Badge variant="primary">
                Workflow d’évaluation
              </Badge>
              <h1 className="text-2xl font-semibold text-sabc-gray-900">Démarrer ou reprendre vos évaluations</h1>
              <p className="max-w-2xl text-sm text-sabc-gray-600">
                Le flux repose maintenant sur la période ouverte et les règles publiées compatibles avec la cible sélectionnée.
              </p>
            </div>
            <div className="rounded-xl border border-sabc-gray-200 bg-sabc-gray-50 p-4 text-sm">
              <div className="text-xs uppercase tracking-wide text-sabc-gray-500">Période active</div>
              <div className="mt-1 text-base font-semibold text-sabc-gray-900">
                {data.activePeriod?.nom_periode || data.activePeriod?.code_periode || 'Aucune période ouverte'}
              </div>
              <div className="mt-1 text-xs text-sabc-gray-500">
                {data.activePeriod?.date_fin ? `Clôture le ${formatDateLabel(data.activePeriod.date_fin)}` : 'Le démarrage est bloqué tant qu’aucune période n’est ouverte.'}
              </div>
            </div>
          </CardContent>
        </Card>

        {!data.activePeriod ? (
          <Alert>
            <AlertTitle>Aucune période active</AlertTitle>
            <AlertDescription>
              Les règles peuvent être publiées, mais aucune création d’évaluation ne doit être lancée tant qu’une période n’est pas ouverte.
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricTile
            label="Périodes ouvertes"
            value={data.summary.activePeriods}
            caption="Cycles actuellement disponibles"
            icon={CalendarClock}
          />
          <MetricTile
            label="Cibles éligibles"
            value={data.summary.eligibleTargets}
            caption="Auto, pairs et subordonnés selon la hiérarchie"
            icon={Users2}
          />
          <MetricTile
            label="Règles actives"
            value={data.summary.activeRules}
            caption="Cadres publiés exploitables par le workflow"
            icon={Layers3}
          />
          <MetricTile
            label="Historique"
            value={data.summary.historyEntries}
            caption="Évaluations reçues ou données déjà enregistrées"
            icon={CheckCircle2}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-[360px,1fr]">
          <ActiveRulesCard
            rules={applicableRules}
            description="Les règles compatibles sont filtrées par rôle évaluateur, rôle évalué et type d’évaluation."
            emptyMessage={selectedTargetData
              ? 'Aucune règle active ne couvre ce couple évaluateur / évalué / type.'
              : 'Sélectionnez une cible pour voir les règles réellement applicables.'}
          />

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ClipboardList className="h-5 w-5 text-sabc-red-primary" />
                Cadrage de la sélection courante
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!selectedTargetData ? (
                <Alert>
                  <AlertTitle>Sélectionnez une cible</AlertTitle>
                  <AlertDescription>
                    Le workflow déduit ensuite le type d’évaluation attendu et les règles actives compatibles.
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  <div className="rounded-lg border border-sabc-gray-200 p-4">
                    <div className="font-medium text-sabc-gray-900">{formatDisplayName(selectedTargetData)}</div>
                    <div className="text-sm text-sabc-gray-500">{formatRole(selectedTargetData)}</div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge variant="primary">{formatEvaluationType(selectedTargetType)}</Badge>
                      <Badge variant="info">
                        {selectedRuleSummary ? `${selectedRuleSummary.criteresCount} critères` : 'Aucune règle'}
                      </Badge>
                      {selectedRule ? <Badge variant="warning">visibilité {selectedRule.visibility_policy.detail}</Badge> : null}
                    </div>
                  </div>

                  {selectedRuleSummary ? (
                    <div className="space-y-3 rounded-lg border border-sabc-gray-200 p-4">
                      <div className="font-medium text-sabc-gray-900">{selectedRuleSummary.name}</div>
                      <div className="text-sm text-sabc-gray-500">
                        {selectedRuleSummary.description || 'Règle publiée sans description métier.'}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {selectedRuleSummary.sections.slice(0, 5).map((section) => (
                          <Badge key={`${selectedRuleSummary.id}-${section.id}`} variant="outline">
                            {section.titre}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <Alert>
                      <AlertTitle>Aucune règle exploitable</AlertTitle>
                      <AlertDescription>
                        Cette cible est visible, mais aucun formulaire publié ne peut être lancé dans le contexte actuel.
                      </AlertDescription>
                    </Alert>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users2 className="h-5 w-5 text-sabc-red-primary" />
              Cibles éligibles
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {data.eligibleGroups.length === 0 ? (
              <Alert>
                <AlertTitle>Aucune cible disponible</AlertTitle>
                <AlertDescription>
                  Vous n’avez actuellement aucune cible éligible selon la hiérarchie et les règles actives.
                </AlertDescription>
              </Alert>
            ) : (
              data.eligibleGroups.map((group) => (
                <div key={group.key} className="space-y-3">
                  <div className="text-sm font-semibold text-sabc-gray-900">
                    {group.label}
                    <span className="ml-2 text-xs font-normal text-sabc-gray-500">({group.targets.length})</span>
                  </div>
                  {group.targets.map((target: Target) => (
                    <Card key={target.matricule || `${group.key}-${target.nom}-${target.prenom}`} className="border-sabc-gray-200 shadow-sm">
                      <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
                        <div>
                          <div className="font-medium text-sabc-gray-900">{formatDisplayName(target)}</div>
                          <div className="text-sm text-sabc-gray-500">{formatRole(target)}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          {selectedTarget === target.matricule ? <Badge variant="success">Cible sélectionnée</Badge> : null}
                          <Button
                            size="sm"
                            variant={selectedTarget === target.matricule ? 'outline' : 'default'}
                            className={selectedTarget === target.matricule ? '' : 'bg-sabc-red-primary text-white hover:bg-sabc-red-dark'}
                            onClick={() => setSelectedTarget(target.matricule)}
                          >
                            Sélectionner
                          </Button>
                          <Button
                            size="sm"
                            className="bg-sabc-red-primary text-white hover:bg-sabc-red-dark"
                            disabled={!data.activePeriod || !selectedTemplate || selectedTarget !== target.matricule}
                            onClick={() => launchEvaluation(target.matricule)}
                          >
                            <PlayCircle className="mr-2 h-4 w-4" />
                            Démarrer
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle2 className="h-5 w-5 text-sabc-success" />
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
                      {evaluation.regle?.nom_regle || evaluation.type_evaluation || 'Évaluation'}
                    </div>
                    <div className="text-xs text-sabc-gray-400">Statut: {evaluation.statut}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="info">
                      {evaluation.note_globale != null ? `${Number(evaluation.note_globale).toFixed(1)}/5` : '—'}
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
