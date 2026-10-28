import React, { useMemo, useState } from 'react';
import { Head } from '@/lib/inertia-shim';
import { Card, CardHeader, CardTitle } from '@/Components/UI/Card';
import Badge from '@/Components/UI/Badge';
import { Alert, AlertDescription, AlertTitle } from '@/Components/UI/Alert';
import { Button } from '@/Components/UI/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/Components/UI/Tabs';
import { useEvaluationWorkflowData } from '@/Hooks/queries';
import { EvaluationPageLayout, formatDisplayName, formatRole } from './shared';
import {
  QuickActionsCard,
  formatDateLabel,
  formatEvaluationType,
  formatStatusLabel,
  getStatusBadgeVariant,
} from '@/Components/Dashboard/RoleDashboardShared';
import { TruncatedList } from '@/Components/UI/TruncatedList/TruncatedList';
import { PageHeader } from '@/Components/UI/Page/PageHeader';
import { KpiCard, KpiGrid } from '@/Components/UI/KpiCard';
import { formatDateFr } from '@/utils/helpers';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/Contexts/AuthContext';
import { selectEvaluatorActionEvaluations } from './workflow-ui';

type StatusMeta = {
  groupLabel: string;
  action: string;
};

const STATUS_META: Record<string, StatusMeta> = {
  brouillon: { groupLabel: 'Brouillons à reprendre', action: 'Reprendre' },
  rejete: { groupLabel: 'Retours à corriger', action: 'Corriger' },
};

const FALLBACK_STATUS_META: StatusMeta = { groupLabel: 'Autres', action: 'Voir' };

const STATUS_ORDER = ['rejete', 'brouillon'];

const Pending: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { data } = useEvaluationWorkflowData();
  const [activeTab, setActiveTab] = useState<string>('all');
  const actionableEvaluations = useMemo(
    () => selectEvaluatorActionEvaluations(
      data.pendingEvaluations,
      data.rejectedEvaluations,
      user?.matricule,
    ),
    [data.pendingEvaluations, data.rejectedEvaluations, user?.matricule],
  );

  const grouped = useMemo(() => {
    const groups = new Map<string, any[]>();
    for (const evaluation of actionableEvaluations) {
      const key = evaluation.type_evaluation || 'autre';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(evaluation);
    }
    return Array.from(groups.entries());
  }, [actionableEvaluations]);

  const filtered = activeTab === 'all'
    ? actionableEvaluations
    : actionableEvaluations.filter((evaluation) => (evaluation.type_evaluation || 'autre') === activeTab);

  const draftsCount = actionableEvaluations.filter((evaluation) => evaluation.statut === 'brouillon').length;
  const rejectedCount = actionableEvaluations.filter((evaluation) => evaluation.statut === 'rejete').length;

  // Regroupe par statut sans mélanger les retours prioritaires et les brouillons.
  const statusOrder = [...STATUS_ORDER];
  for (const evaluation of filtered) {
    if (!statusOrder.includes(evaluation.statut)) statusOrder.push(evaluation.statut);
  }
  const statusGroups = statusOrder
    .map((statut) => ({ statut, items: filtered.filter((evaluation) => evaluation.statut === statut) }))
    .filter((group) => group.items.length > 0);

  const renderEvaluationItem = (evaluation: any, meta: StatusMeta) => (
    <div className="flex flex-col gap-3 rounded-lg border border-sabc-gray-200 p-4 dark:border-sabc-gray-800 md:flex-row md:items-center md:justify-between">
      <div className="min-w-0">
        <div className="font-medium text-sabc-gray-900 dark:text-white">
          {formatDisplayName(evaluation.evalue || {})}
        </div>
        <div className="text-sm text-sabc-gray-500 dark:text-sabc-gray-400">
          {formatRole(evaluation.evalue || {})} · {evaluation.regle?.nom_regle || formatEvaluationType(evaluation.type_evaluation)}
        </div>
        <div className="text-xs text-sabc-gray-500 dark:text-sabc-gray-400">
          Créée le {formatDateFr(evaluation.created_at)}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Badge variant={getStatusBadgeVariant(evaluation.statut)}>
          {formatStatusLabel(evaluation.statut)}
        </Badge>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(`/evaluations/${evaluation.id_evaluation}/edit`)}
        >
          {meta.action}
        </Button>
      </div>
    </div>
  );

  return (
    <EvaluationPageLayout pageTitle="Évaluations à compléter">
      <Head title="Évaluations à compléter" />

      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <PageHeader
          title="Évaluations à compléter"
          description="Reprenez un brouillon ou corrigez une évaluation renvoyée. Les évaluations soumises et les validations du manager sont suivies dans leurs pages dédiées."
          meta={data.activePeriod
            ? `Période active : ${data.activePeriod.nom_periode || data.activePeriod.code_periode}${data.activePeriod.date_fin ? ` (clôture le ${formatDateLabel(data.activePeriod.date_fin)})` : ''}`
            : 'Aucune période ouverte'}
        />

        {!data.activePeriod ? (
          <Alert>
            <AlertTitle>Aucune période active</AlertTitle>
            <AlertDescription>
              Vous pouvez encore consulter vos brouillons et retours existants, mais aucun nouveau cycle ne peut être lancé tant qu’une période n’est pas ouverte.
            </AlertDescription>
          </Alert>
        ) : null}

        <KpiGrid className="lg:grid-cols-3">
          <KpiCard label="À compléter" value={actionableEvaluations.length} />
          <KpiCard label="Brouillons" value={draftsCount} />
          <KpiCard label="Retours à corriger" value={rejectedCount} />
        </KpiGrid>

        <Card>
          <CardHeader className="space-y-4">
            <CardTitle className="text-base">
              Mes évaluations en cours
            </CardTitle>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full justify-start overflow-x-auto">
                <TabsTrigger value="all">Toutes ({actionableEvaluations.length})</TabsTrigger>
                {grouped.map(([type, list]) => (
                  <TabsTrigger key={type} value={type}>
                    {formatEvaluationType(type)} ({list.length})
                  </TabsTrigger>
                ))}
              </TabsList>
              <TabsContent value={activeTab} className="mt-4 space-y-6">
                {filtered.length === 0 ? (
                  <Alert>
                    <AlertTitle>Tout est à jour</AlertTitle>
                    <AlertDescription>
                      Vous n’avez aucune évaluation à compléter pour ce filtre.
                    </AlertDescription>
                  </Alert>
                ) : (
                  statusGroups.map(({ statut, items }) => {
                    const meta = STATUS_META[statut] ?? FALLBACK_STATUS_META;
                    return (
                      <div key={statut} className="space-y-3">
                        <h3 className="text-sm font-semibold text-sabc-gray-900 dark:text-white">
                          {meta.groupLabel}
                          <span className="ml-2 font-normal text-sabc-gray-500">({items.length})</span>
                        </h3>
                        <TruncatedList
                          items={items}
                          previewCount={5}
                          keyExtractor={(evaluation: any) => evaluation.id_evaluation}
                          modalTitle={meta.groupLabel}
                          modalDescription={`${items.length} évaluation${items.length > 1 ? 's' : ''}`}
                          className="space-y-3"
                          modalClassName="space-y-3"
                          renderItem={(evaluation: any) => renderEvaluationItem(evaluation, meta)}
                        />
                      </div>
                    );
                  })
                )}
              </TabsContent>
            </Tabs>
          </CardHeader>
        </Card>

        <QuickActionsCard
          actions={[
            ...(data.activePeriod
              ? [{ label: 'Démarrer une évaluation', href: '/evaluations/mine' }]
              : []),
            { label: 'Axes d’amélioration', href: '/axes-amelioration', variant: 'secondary' },
          ]}
        />
      </div>
    </EvaluationPageLayout>
  );
};

export default Pending;
