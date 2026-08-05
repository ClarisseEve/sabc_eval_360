import React, { useMemo, useState } from 'react';
import { Head } from '@/lib/inertia-shim';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/UI/Card';
import Badge from '@/Components/UI/Badge';
import { Alert, AlertDescription, AlertTitle } from '@/Components/UI/Alert';
import { Button } from '@/Components/UI/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/Components/UI/Tabs';
import { useEvaluationWorkflowData } from '@/Hooks/queries';
import { EvaluationPageLayout, formatDisplayName, formatRole } from './shared';
import { QuickActionsCard, formatDateLabel } from '@/Components/Dashboard/RoleDashboardShared';
import { TruncatedList } from '@/Components/UI/TruncatedList/TruncatedList';
import { CheckCheck, ClipboardList, Clock, FileEdit, Send } from 'lucide-react';
import { cn } from '@/utils/helpers';

type StatusMeta = {
  label: string;
  groupLabel: string;
  Icon: React.ElementType;
  badgeVariant: 'warning' | 'info' | 'secondary';
  accent: string;
  chip: string;
  action: string;
};

/** Code couleur cohérent avec les tuiles du haut : brouillon = ambre, soumis = bleu. */
const STATUS_META: Record<string, StatusMeta> = {
  brouillon: {
    label: 'Brouillon',
    groupLabel: 'Brouillons à reprendre',
    Icon: FileEdit,
    badgeVariant: 'warning',
    accent: 'border-l-amber-400 dark:border-l-amber-500',
    chip: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    action: 'Reprendre',
  },
  soumis: {
    label: 'Soumise',
    groupLabel: 'Soumises',
    Icon: Send,
    badgeVariant: 'info',
    accent: 'border-l-blue-400 dark:border-l-blue-500',
    chip: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    action: 'Voir',
  },
};

const FALLBACK_STATUS_META: StatusMeta = {
  label: '',
  groupLabel: 'Autres',
  Icon: Clock,
  badgeVariant: 'secondary',
  accent: 'border-l-sabc-gray-300 dark:border-l-sabc-gray-600',
  chip: 'bg-sabc-gray-100 text-sabc-gray-600 dark:bg-sabc-gray-800 dark:text-sabc-gray-300',
  action: 'Voir',
};

const STATUS_ORDER = ['brouillon', 'soumis'];

function MetricTile({
  label,
  value,
  icon: Icon,
  iconClassName,
}: {
  label: string;
  value: React.ReactNode;
  icon: React.ElementType;
  iconClassName: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-6">
        <div className={`rounded-full p-3 ${iconClassName}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <div className="text-2xl font-semibold text-sabc-gray-900">{value}</div>
          <div className="text-sm text-sabc-gray-500">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}

const Pending: React.FC = () => {
  const { data } = useEvaluationWorkflowData();
  const [activeTab, setActiveTab] = useState<string>('all');

  const grouped = useMemo(() => {
    const groups = new Map<string, any[]>();
    for (const evaluation of data.pendingEvaluations) {
      const key = evaluation.type_evaluation || 'autre';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(evaluation);
    }
    return Array.from(groups.entries());
  }, [data.pendingEvaluations]);

  const filtered = activeTab === 'all'
    ? data.pendingEvaluations
    : data.pendingEvaluations.filter((evaluation) => (evaluation.type_evaluation || 'autre') === activeTab);

  // Regroupe par statut (brouillons d'abord), sans mélanger soumis et brouillons.
  const statusOrder = [...STATUS_ORDER];
  for (const evaluation of filtered) {
    if (!statusOrder.includes(evaluation.statut)) statusOrder.push(evaluation.statut);
  }
  const statusGroups = statusOrder
    .map((statut) => ({ statut, items: filtered.filter((evaluation) => evaluation.statut === statut) }))
    .filter((group) => group.items.length > 0);

  const renderEvaluationItem = (evaluation: any, meta: StatusMeta) => {
    const Icon = meta.Icon;
    return (
      <div
        className={cn(
          'flex flex-col gap-3 rounded-lg border border-l-4 border-sabc-gray-200 p-4 dark:border-sabc-gray-800 md:flex-row md:items-center md:justify-between',
          meta.accent,
        )}
      >
        <div className="min-w-0">
          <div className="font-medium text-sabc-gray-900 dark:text-white">
            {formatDisplayName(evaluation.evalue || {})}
          </div>
          <div className="text-sm text-sabc-gray-500 dark:text-sabc-gray-400">
            {formatRole(evaluation.evalue || {})} · {evaluation.regle?.nom_regle || evaluation.type_evaluation || 'Évaluation'}
          </div>
          <div className="text-xs text-sabc-gray-400 dark:text-sabc-gray-500">
            Créée le {evaluation.created_at ? new Date(evaluation.created_at).toLocaleDateString('fr-FR') : '—'}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Badge variant={meta.badgeVariant} className="gap-1">
            <Icon className="h-3 w-3" aria-hidden />
            {meta.label || evaluation.statut}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              window.location.href =
                evaluation.statut === 'brouillon'
                  ? `/evaluations/${evaluation.id_evaluation}/edit`
                  : `/evaluations/${evaluation.id_evaluation}`;
            }}
          >
            {meta.action}
          </Button>
        </div>
      </div>
    );
  };

  return (
    <EvaluationPageLayout pageTitle="Évaluations à compléter">
      <Head title="Évaluations à compléter" />

      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <Card className="border-none bg-white shadow-lg">
          <CardContent className="flex flex-col gap-6 p-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <Badge variant="primary">
                Workflow d’exécution
              </Badge>
              <h1 className="text-2xl font-semibold text-sabc-gray-900">Brouillons, soumissions et validations</h1>
              <p className="max-w-2xl text-sm text-sabc-gray-600">
                Cette page regroupe désormais vos évaluations à reprendre ainsi que les validations qui vous reviennent comme manager.
              </p>
            </div>
            <div className="rounded-xl border border-sabc-gray-200 bg-sabc-gray-50 p-4 text-sm">
              <div className="text-xs uppercase tracking-wide text-sabc-gray-500">Période active</div>
              <div className="mt-1 text-base font-semibold text-sabc-gray-900">
                {data.activePeriod?.nom_periode || data.activePeriod?.code_periode || 'Aucune période ouverte'}
              </div>
              <div className="mt-1 text-xs text-sabc-gray-500">
                {data.activePeriod?.date_fin ? `Clôture le ${formatDateLabel(data.activePeriod.date_fin)}` : 'Les brouillons restent visibles, mais aucun nouveau cycle n’est ouvert.'}
              </div>
            </div>
          </CardContent>
        </Card>

        {!data.activePeriod ? (
          <Alert>
            <AlertTitle>Aucune période active</AlertTitle>
            <AlertDescription>
              Vous pouvez encore consulter les brouillons ou les soumissions existantes, mais aucun nouveau cycle ne doit être lancé tant qu’une période n’est pas ouverte.
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricTile
            label="Évaluations en attente"
            value={data.summary.pendingTotal}
            icon={ClipboardList}
            iconClassName="bg-sabc-red-primary/10 text-sabc-red-primary"
          />
          <MetricTile
            label="Brouillons"
            value={data.summary.drafts}
            icon={FileEdit}
            iconClassName="bg-amber-100 text-amber-700"
          />
          <MetricTile
            label="Soumises"
            value={data.summary.submitted}
            icon={Send}
            iconClassName="bg-blue-100 text-blue-700"
          />
          <MetricTile
            label="À valider"
            value={data.summary.validations}
            icon={CheckCheck}
            iconClassName="bg-emerald-100 text-emerald-700"
          />
        </div>

        <Card>
          <CardHeader className="space-y-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-5 w-5 text-sabc-red-primary" />
              Mes brouillons et soumissions
            </CardTitle>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full justify-start overflow-x-auto">
                <TabsTrigger value="all">Toutes ({data.pendingEvaluations.length})</TabsTrigger>
                {grouped.map(([type, list]) => (
                  <TabsTrigger key={type} value={type}>
                    {type} ({list.length})
                  </TabsTrigger>
                ))}
              </TabsList>
              <TabsContent value={activeTab} className="mt-4 space-y-6">
                {filtered.length === 0 ? (
                  <Alert>
                    <AlertTitle>Aucune évaluation</AlertTitle>
                    <AlertDescription>
                      Aucun élément ne correspond au filtre sélectionné.
                    </AlertDescription>
                  </Alert>
                ) : (
                  statusGroups.map(({ statut, items }) => {
                    const meta = STATUS_META[statut] ?? FALLBACK_STATUS_META;
                    const GroupIcon = meta.Icon;
                    return (
                      <div key={statut} className="space-y-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              'inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-semibold',
                              meta.chip,
                            )}
                          >
                            <GroupIcon className="h-3.5 w-3.5" aria-hidden />
                            {meta.groupLabel}
                          </span>
                          <span className="text-xs font-medium text-sabc-gray-400">{items.length}</span>
                        </div>
                        <TruncatedList
                          items={items}
                          previewCount={5}
                          keyExtractor={(evaluation: any) => evaluation.id_evaluation}
                          modalTitle={meta.groupLabel}
                          modalDescription={`${items.length} évaluation(s)`}
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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCheck className="h-5 w-5 text-sabc-success" />
              Évaluations à valider
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.validations.length === 0 ? (
              <Alert>
                <AlertTitle>Aucune validation en attente</AlertTitle>
                <AlertDescription>
                  Aucun collaborateur de votre périmètre n’a actuellement de soumission en attente de validation.
                </AlertDescription>
              </Alert>
            ) : (
              <TruncatedList
                items={data.validations}
                previewCount={5}
                keyExtractor={(evaluation: any) => evaluation.id_evaluation}
                modalTitle="Évaluations à valider"
                modalDescription={`${data.validations.length} validation(s) en attente`}
                className="space-y-3"
                modalClassName="space-y-3"
                renderItem={(evaluation: any) => (
                  <div className="flex flex-col gap-3 rounded-lg border border-sabc-gray-200 p-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="font-medium text-sabc-gray-900">
                        {formatDisplayName(evaluation.evalue || {})}
                      </div>
                      <div className="text-sm text-sabc-gray-500">
                        Soumise par {formatDisplayName(evaluation.evaluateur || {})} · {evaluation.regle?.nom_regle || evaluation.type_evaluation || 'Évaluation'}
                      </div>
                      <div className="text-xs text-sabc-gray-400">
                        {formatRole(evaluation.evalue || {})}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="primary">soumis</Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          window.location.href = `/evaluations/${evaluation.id_evaluation}`;
                        }}
                      >
                        Contrôler
                      </Button>
                    </div>
                  </div>
                )}
              />
            )}
          </CardContent>
        </Card>

        <QuickActionsCard
          actions={[
            { label: 'Démarrer une évaluation', href: '/evaluations/mine' },
            { label: 'Axes d’amélioration', href: '/axes-amelioration', variant: 'secondary' },
          ]}
        />
      </div>
    </EvaluationPageLayout>
  );
};

export default Pending;
