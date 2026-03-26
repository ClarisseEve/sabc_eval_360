import React, { useMemo, useState } from 'react';
import { Head, Link } from '@/lib/inertia-shim';
import AppLayout from '@/Components/Layout/app/AppLayout';
import { adaptUserForLayout } from '@/utils/userAdapter';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/UI/Card';
import Badge from '@/Components/UI/Badge';
import { Alert, AlertDescription, AlertTitle } from '@/Components/UI/Alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/Components/UI/Tabs';
import { Button } from '@/Components/UI/Button';
import { Avatar } from '@/Components/UI/Avatar/Avatar';
import { cn } from '@/utils/helpers';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Clock,
  Layers,
  Sparkles,
  Target,
  TimerReset,
  Users,
  Users2,
} from 'lucide-react';

interface EvaluationModel {
  id_evaluation?: string;
  id?: string;
  statut?: string;
  note_globale?: number | string | null;
  notations_json?: any;
  date_soumission?: string | null;
}

interface EvaluationTask {
  type: string;
  statut: 'a_faire' | 'a_terminer' | string;
  deadline?: string | null;
  evaluation?: EvaluationModel | null;
  cible: Record<string, any>;
}

interface Props {
  user: any;
  evaluations?: Record<string, EvaluationTask[]>;
  statistiques?: {
    total_a_faire?: number;
    total_a_terminer?: number;
    total_general?: number;
  };
  role_permissions?: Record<string, boolean>;
  pageTitle?: string;
}

type TypeMeta = {
  key: string;
  label: string;
  description: string;
  accentClass: string;
  icon: React.ReactNode;
};

type StatusMeta = {
  label: string;
  tone: 'primary' | 'secondary' | 'warning';
  helper: string;
};

const TYPE_METADATA: TypeMeta[] = [
  {
    key: 'auto',
    label: 'Auto-évaluation',
    description: 'Analysez vos propres performances et définissez vos axes de progrès.',
    accentClass: 'border border-sabc-red-primary bg-white text-sabc-red-primary',
    icon: <Sparkles className="h-4 w-4" />,
  },
  {
    key: 'pairs',
    label: 'Évaluation par les pairs',
    description: 'Partagez un feedback constructif avec vos collègues du même niveau.',
    accentClass: 'border border-sabc-info bg-white text-sabc-info',
    icon: <Users2 className="h-4 w-4" />,
  },
  {
    key: 'descendante',
    label: 'Équipe à évaluer',
    description: 'Accompagnez vos collaborateurs en évaluant leurs compétences clés.',
    accentClass: 'border border-sabc-success bg-white text-sabc-success',
    icon: <Layers className="h-4 w-4" />,
  },
  {
    key: 'ascendante',
    label: 'Feedback ascendant',
    description: 'Remontez votre perception de vos encadrants pour améliorer le leadership.',
    accentClass: 'border border-sabc-warning bg-white text-sabc-warning',
    icon: <Target className="h-4 w-4" />,
  },
];

const STATUS_METADATA: Record<string, StatusMeta> = {
  a_faire: {
    label: 'À démarrer',
    tone: 'secondary',
    helper: 'Vous n\'avez pas encore commencé cette évaluation.',
  },
  a_terminer: {
    label: 'Brouillon',
    tone: 'warning',
    helper: 'Un brouillon est en cours, pensez à le finaliser.',
  },
  termine: {
    label: 'Terminée',
    tone: 'primary',
    helper: 'Évaluation finalisée et soumise.',
  },
};

const getTypeMeta = (key: string): TypeMeta =>
  TYPE_METADATA.find((meta) => meta.key === key) || {
    key,
    label: key,
    description: 'Évaluations prévues par le parcours SABC.',
    accentClass: 'border border-sabc-gray-200 bg-white text-sabc-gray-600',
    icon: <Users className="h-4 w-4" />,
  };

const getStatusMeta = (status: string): StatusMeta =>
  STATUS_METADATA[status] || {
    label: status,
    tone: 'secondary',
    helper: 'Suivez les indications fournies pour poursuivre.',
  };

const statusVariant = (tone: StatusMeta['tone']): 'primary' | 'secondary' | 'outline' => {
  switch (tone) {
    case 'primary':
      return 'primary';
    case 'warning':
      return 'outline';
    default:
      return 'secondary';
  }
};

const formatDisplayName = (target: Record<string, any>) => {
  if (target?.prenom || target?.nom) {
    return `${target?.prenom ?? ''} ${target?.nom ?? ''}`.trim();
  }
  if (target?.name) {
    return target.name;
  }
  return target?.matricule ?? 'Collaborateur';
};

const formatRole = (target: Record<string, any>) =>
  target?.role_nom || target?.role || 'Rôle non renseigné';

const formatDeadline = (deadline?: string | null) => {
  if (!deadline) return 'Sans échéance précise';
  const date = new Date(deadline);
  if (Number.isNaN(date.getTime())) return 'Sans échéance précise';
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
};

const getEvaluationId = (evaluation?: EvaluationModel | null): string | null => {
  if (!evaluation) return null;
  return (
    (typeof evaluation.id_evaluation === 'string' && evaluation.id_evaluation) ||
    (typeof evaluation.id === 'string' && evaluation.id) ||
    null
  );
};

const Pending: React.FC<Props> = ({ user, evaluations = {}, statistiques, role_permissions, pageTitle }) => {
  const layoutUser = adaptUserForLayout(user);
  const [activeStatus, setActiveStatus] = useState<'all' | 'a_faire' | 'a_terminer'>('all');

  const groupedEvaluations = useMemo(() => {
    const entries = Object.entries(evaluations).map(([key, list]) => [key, Array.isArray(list) ? list : []] as [string, EvaluationTask[]]);
    return entries.filter(([, list]) => list.length > 0);
  }, [evaluations]);

  const summaryStats = {
    total: statistiques?.total_general ?? groupedEvaluations.reduce((acc, [, list]) => acc + list.length, 0),
    todo: statistiques?.total_a_faire ?? groupedEvaluations.reduce((acc, [, list]) => acc + list.filter((item) => item.statut === 'a_faire').length, 0),
    drafts: statistiques?.total_a_terminer ?? groupedEvaluations.reduce((acc, [, list]) => acc + list.filter((item) => item.statut === 'a_terminer').length, 0),
  };

  const statusFilters: { key: typeof activeStatus; label: string; icon: React.ReactNode }[] = [
    { key: 'all', label: 'Toutes', icon: <ClipboardList className="h-4 w-4" /> },
    { key: 'a_faire', label: 'À démarrer', icon: <Sparkles className="h-4 w-4" /> },
    { key: 'a_terminer', label: 'Brouillons', icon: <TimerReset className="h-4 w-4" /> },
  ];

  const renderEvaluationCard = (task: EvaluationTask) => {
    const { label, accentClass, icon } = getTypeMeta(task.type);
    const statusMeta = getStatusMeta(task.statut);
    const evaluationId = getEvaluationId(task.evaluation);
    const startUrl = `/common/evaluations/mine?target=${task.cible?.matricule ?? ''}&type=${task.type}`;
    const editUrl = evaluationId ? `/common/evaluations/${evaluationId}/edit` : startUrl;
    const detailUrl = evaluationId ? `/common/evaluations/${evaluationId}` : null;

    if (activeStatus !== 'all' && task.statut !== activeStatus) {
      return null;
    }

    return (
      <Card key={`${task.type}-${task.cible?.matricule ?? Math.random()}`} className="border-sabc-gray-200 transition hover:-translate-y-0.5 hover:shadow-md dark:border-sabc-gray-700">
        <CardHeader className="space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className={cn('rounded-lg px-2.5 py-2 text-xs font-medium uppercase', accentClass)}>
                <div className="flex items-center gap-2 text-[11px] font-semibold">
                  {icon}
                  {label}
                </div>
              </div>
              <div>
                <div className="text-base font-semibold text-sabc-gray-900 dark:text-white">
                  {formatDisplayName(task.cible)}
                </div>
                <div className="text-xs text-sabc-gray-500">{formatRole(task.cible)}</div>
                {task.cible?.region_nom && (
                  <div className="text-xs text-sabc-gray-400">{task.cible.region_nom}</div>
                )}
              </div>
            </div>
            <Badge variant={statusVariant(statusMeta.tone)} className="text-[10px] uppercase">
              {statusMeta.label}
            </Badge>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-sabc-gray-500">
            <div className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {formatDeadline(task.deadline)}
            </div>
            {task.evaluation?.note_globale ? (
              <div className="inline-flex items-center gap-1 text-sabc-success">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Note globale préliminaire : <strong>{Number(task.evaluation.note_globale).toFixed(2)}</strong>
              </div>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 pb-4">
          <Alert className="border-sabc-gray-100 bg-sabc-gray-50 text-xs text-sabc-gray-600 dark:border-sabc-gray-700 dark:bg-sabc-gray-800 dark:text-sabc-gray-300">
            <AlertDescription>{statusMeta.helper}</AlertDescription>
          </Alert>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex gap-2">
              <Button
                asChild
                className={cn(
                  task.statut === 'a_terminer'
                    ? 'bg-sabc-red-primary text-white hover:bg-sabc-red-dark'
                    : 'bg-sabc-gray-900 text-white hover:bg-sabc-gray-800'
                )}
                size="sm"
              >
                <Link href={task.statut === 'a_terminer' ? editUrl : startUrl}>
                  {task.statut === 'a_terminer' ? 'Reprendre' : 'Commencer'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>

              {detailUrl ? (
                <Button asChild variant="outline" size="sm">
                  <Link href={detailUrl}>Voir le détail</Link>
                </Button>
              ) : (
                <Button variant="outline" size="sm" disabled>
                  Détail indisponible
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-sabc-gray-500">
              <Avatar
                size="sm"
                name={formatDisplayName(task.cible)}
                src={task.cible?.avatar ?? undefined}
              />
              <span>Matricule {task.cible?.matricule ?? '—'}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <AppLayout user={layoutUser} pageTitle={pageTitle ?? 'Évaluations à compléter'} notifications={[]}> 
      <Head title="Évaluations à compléter" />
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-sabc-gray-200 dark:border-sabc-gray-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-sabc-gray-900 dark:text-white">Actions à planifier</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sabc-red-primary/10 text-sabc-red-primary dark:bg-sabc-red-primary/20">
                <ClipboardList className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xl font-semibold text-sabc-gray-900 dark:text-white">{summaryStats.total}</div>
                <div className="text-xs text-sabc-gray-500">Évaluations prévues sur la période active</div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-sabc-gray-200 dark:border-sabc-gray-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-sabc-gray-900 dark:text-white">À démarrer</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sabc-gray-100 text-sabc-gray-600 dark:bg-sabc-gray-800 dark:text-sabc-gray-200">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xl font-semibold text-sabc-gray-900 dark:text-white">{summaryStats.todo}</div>
                <div className="text-xs text-sabc-gray-500">Feedbacks à initier</div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-sabc-gray-200 dark:border-sabc-gray-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-sabc-gray-900 dark:text-white">Brouillons à finaliser</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sabc-gray-100 text-sabc-gray-600 dark:bg-sabc-gray-800 dark:text-sabc-gray-200">
                <TimerReset className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xl font-semibold text-sabc-gray-900 dark:text-white">{summaryStats.drafts}</div>
                <div className="text-xs text-sabc-gray-500">Évaluations en cours d'édition</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {role_permissions && (
          <Alert className="border-sabc-gray-200 bg-sabc-gray-50 text-xs text-sabc-gray-600 dark:border-sabc-gray-700 dark:bg-sabc-gray-800 dark:text-sabc-gray-300">
            <AlertTitle className="flex items-center gap-2 text-sm font-semibold text-sabc-gray-900 dark:text-white">
              <Users className="h-4 w-4" />
              Permissions liées à votre rôle
            </AlertTitle>
            <AlertDescription>
              <div className="flex flex-wrap gap-2 pt-2">
                {Object.entries(role_permissions)
                  .filter(([, value]) => value)
                  .map(([key]) => (
                    <Badge key={key} variant="secondary" className="text-[10px] uppercase">
                      {key.replace('peut_', '').replace(/_/g, ' ')}
                    </Badge>
                  ))}
              </div>
            </AlertDescription>
          </Alert>
        )}

        <Card className="border-sabc-gray-200 dark:border-sabc-gray-700">
          <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <CardTitle className="text-base">Vos évaluations</CardTitle>
            <div className="flex flex-wrap gap-2">
              {statusFilters.map((filter) => (
                <button
                  key={filter.key}
                  type="button"
                  onClick={() => setActiveStatus(filter.key)}
                  className={cn(
                    'flex items-center gap-2 rounded-full border px-3 py-1 text-xs transition',
                    activeStatus === filter.key
                      ? 'border-sabc-red-primary bg-sabc-red-primary text-white'
                      : 'border-sabc-gray-200 bg-white text-sabc-gray-600 hover:border-sabc-red-primary/40 dark:border-sabc-gray-700 dark:bg-sabc-gray-900 dark:text-sabc-gray-300'
                  )}
                >
                  {filter.icon}
                  {filter.label}
                  <span className="ml-1 rounded-full bg-black/10 px-1.5 py-0.5 text-[10px]">
                    {filter.key === 'all'
                      ? summaryStats.total
                      : filter.key === 'a_faire'
                      ? summaryStats.todo
                      : summaryStats.drafts}
                  </span>
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            {groupedEvaluations.length === 0 ? (
              <Alert className="border-dashed border-sabc-gray-200 bg-sabc-gray-50 text-sabc-gray-600 dark:border-sabc-gray-700 dark:bg-sabc-gray-800 dark:text-sabc-gray-300">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Aucune action requise</AlertTitle>
                <AlertDescription>
                  Vous n'avez aucune évaluation à compléter pour le moment. Revenez plus tard ou contactez votre administrateur en cas de doute.
                </AlertDescription>
              </Alert>
            ) : (
              <Tabs
                defaultValue={groupedEvaluations[0]?.[0] ?? 'auto'}
                className="space-y-4"
              >
                <TabsList className="w-full justify-start overflow-x-auto">
                  {groupedEvaluations.map(([type, list]) => {
                    const meta = getTypeMeta(type);
                    return (
                      <TabsTrigger key={type} value={type} className="flex items-center gap-2 text-xs">
                        {meta.icon}
                        {meta.label}
                        <span className="rounded-full bg-sabc-gray-100 px-1.5 py-0.5 text-[10px] text-sabc-gray-600 dark:bg-sabc-gray-800 dark:text-sabc-gray-300">
                          {list.length}
                        </span>
                      </TabsTrigger>
                    );
                  })}
                </TabsList>

                {groupedEvaluations.map(([type, list]) => (
                  <TabsContent key={type} value={type} className="space-y-4">
                    {list
                      .map((task) => renderEvaluationCard(task))
                      .filter(Boolean)
                      .length === 0 ? (
                        <Alert className="border-dashed border-sabc-gray-200 bg-sabc-gray-50 text-xs text-sabc-gray-600 dark:border-sabc-gray-700 dark:bg-sabc-gray-800 dark:text-sabc-gray-300">
                          <AlertDescription>Aucune évaluation ne correspond au filtre sélectionné.</AlertDescription>
                        </Alert>
                      ) : (
                        list.map((task) => renderEvaluationCard(task)).filter(Boolean)
                      )}
                  </TabsContent>
                ))}
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Pending;
