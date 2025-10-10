import React, { useEffect, useMemo, useState } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/Components/Layout/app/AppLayout';
import { adaptUserForLayout } from '@/utils/userAdapter';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/UI/Card';
import { Alert, AlertDescription, AlertTitle } from '@/Components/UI/Alert';
import Badge from '@/Components/UI/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/Components/UI/Tabs';
import { Button } from '@/Components/UI/Button';
import { Avatar } from '@/Components/UI/Avatar/Avatar';
import { Progress } from '@/Components/UI/Progress/Progress';
import EvaluationModal from '@/Components/Evaluation/EvaluationModal';
import { cn } from '@/utils/helpers';
import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Layers,
  PlayCircle,
  Sparkles,
  Target,
  Users2,
} from 'lucide-react';

interface TemplatePayload {
  id?: string | number;
  id_regle?: string | number;
  title?: string;
  nom?: string;
  description?: string | null;
  evaluated_role?: string | null;
  role_evalue?: string | null;
  status?: string | null;
}

interface RawUser {
  matricule?: string;
  prenom?: string;
  nom?: string;
  name?: string;
  role_nom?: string;
  role?: string;
  region_nom?: string;
  avatar?: string | null;
  isAvailable?: boolean;
}

interface EvaluationTargetsPayload {
  [key: string]: RawUser[];
}

interface Props {
  user: any;
  templates?: TemplatePayload[];
  evaluationTargets?: EvaluationTargetsPayload;
  stats?: Record<string, number> | null;
}

type NormalisedTemplate = {
  id: string;
  name: string;
  description: string;
  evaluatedRole?: string;
  status?: string;
};

type TargetGroupKey = 'auto' | 'peers' | 'subordinates' | 'ascendante' | string;

type TargetDefinition = {
  key: TargetGroupKey;
  label: string;
  description: string;
  icon: React.ReactNode;
};

const TARGET_DEFINITIONS: TargetDefinition[] = [
  {
    key: 'auto',
    label: 'Auto-évaluation',
    description: 'Prenez du recul sur vos propres performances.',
    icon: <Sparkles className="h-4 w-4" />,
  },
  {
    key: 'peers',
    label: 'Pairs',
    description: 'Feedback croisé entre collègues du même niveau.',
    icon: <Users2 className="h-4 w-4" />,
  },
  {
    key: 'subordinates',
    label: 'Équipe',
    description: 'Suivi des collaborateurs que vous encadrez.',
    icon: <Layers className="h-4 w-4" />,
  },
  {
    key: 'ascendante',
    label: 'Ascendante',
    description: 'Remontez votre perception à vos responsables.',
    icon: <Target className="h-4 w-4" />,
  },
];

const getTargetDefinition = (key: TargetGroupKey): TargetDefinition =>
  TARGET_DEFINITIONS.find((definition) => definition.key === key) || {
    key,
    label: key,
    description: 'Cibles définies par le modèle SABC.',
    icon: <Users2 className="h-4 w-4" />,
  };

const formatDisplayName = (target: RawUser): string => {
  if (target?.prenom || target?.nom) {
    return `${target?.prenom ?? ''} ${target?.nom ?? ''}`.trim();
  }
  if (target?.name) {
    return target.name;
  }
  return target?.matricule ?? 'Collaborateur';
};

const formatRole = (target: RawUser): string =>
  target?.role_nom || target?.role || 'Rôle non renseigné';

const safeId = (value: string | number | undefined, fallback: string): string => {
  if (typeof value === 'string' && value.trim().length) return value;
  if (typeof value === 'number') return String(value);
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `${fallback}-${Math.random().toString(36).slice(2, 10)}`;
};

const normaliseTemplates = (templates?: TemplatePayload[]): NormalisedTemplate[] => {
  if (!Array.isArray(templates)) return [];

  return templates.map((template, index) => ({
    id: safeId(template.id_regle ?? template.id, `template-${index}`),
    name: template.title ?? template.nom ?? 'Template publié',
    description: template.description ?? 'Template sans description détaillée.',
    evaluatedRole: template.evaluated_role ?? template.role_evalue ?? undefined,
    status: template.status ?? 'published',
  }));
};

const normaliseTargets = (targets?: EvaluationTargetsPayload): Record<TargetGroupKey, RawUser[]> => {
  const payload = targets ?? {};
  const result: Record<TargetGroupKey, RawUser[]> = {
    auto: [],
    peers: [],
    subordinates: [],
    ascendante: [],
  };

  Object.entries(payload).forEach(([key, list]) => {
    if (!Array.isArray(list) || list.length === 0) return;
    result[key as TargetGroupKey] = list;
  });

  return result;
};

const getStatusBadgeVariant = (status?: string) => {
  if (!status) return 'secondary';
  switch (status) {
    case 'published':
    case 'active':
      return 'primary';
    case 'draft':
      return 'secondary';
    default:
      return 'outline';
  }
};

const Mine: React.FC<Props> = ({ user, templates, evaluationTargets, stats }) => {
  const layoutUser = adaptUserForLayout(user);
  const normalisedTemplates = useMemo(() => normaliseTemplates(templates), [templates]);
  const targetGroups = useMemo(() => normaliseTargets(evaluationTargets), [evaluationTargets]);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTarget, setModalTarget] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedTemplate && normalisedTemplates.length > 0) {
      setSelectedTemplate(normalisedTemplates[0].id);
    }
  }, [normalisedTemplates, selectedTemplate]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const templateParam = params.get('template');
    const targetParam = params.get('target');

    if (templateParam) {
      setSelectedTemplate(templateParam);
    }

    if (targetParam) {
      setModalTarget(targetParam);
      setModalOpen(true);
    }

    if (templateParam || targetParam) {
      params.delete('template');
      params.delete('target');
      const qs = params.toString();
      const newUrl = `${window.location.pathname}${qs ? `?${qs}` : ''}`;
      window.history.replaceState({}, '', newUrl);
    }
  }, []);

  const selectedTemplateData = useMemo(
    () => normalisedTemplates.find((tpl) => tpl.id === selectedTemplate) ?? null,
    [normalisedTemplates, selectedTemplate]
  );

  const totalTargets = useMemo(
    () =>
      Object.values(targetGroups).reduce(
        (acc, list) => acc + (Array.isArray(list) ? list.length : 0),
        0
      ),
    [targetGroups]
  );

  const startEvaluation = (targetMatricule: string) => {
    if (!selectedTemplateData) return;
    setModalTarget(targetMatricule);
    setModalOpen(true);
  };

  const renderTargetCard = (target: RawUser) => (
    <Card key={target.matricule ?? formatDisplayName(target)} className="border-sabc-gray-200 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-sabc-gray-700">
      <CardContent className="flex items-center justify-between gap-4 p-4">
        <div className="flex items-center gap-4">
          <Avatar
            size="default"
            name={formatDisplayName(target)}
            src={target.avatar ?? undefined}
          />
          <div>
            <div className="font-semibold text-sabc-gray-900 dark:text-white">
              {formatDisplayName(target)}
            </div>
            <div className="text-xs text-sabc-gray-500">{formatRole(target)}</div>
            {target.region_nom && (
              <div className="text-xs text-sabc-gray-400">{target.region_nom}</div>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Button
            size="sm"
            className="bg-sabc-red-primary text-white hover:bg-sabc-red-dark"
            disabled={!selectedTemplateData}
            onClick={() => startEvaluation(target.matricule ?? '')}
          >
            <PlayCircle className="mr-2 h-4 w-4" />
            Évaluer
          </Button>
          {!selectedTemplateData && (
            <span className="text-xs text-sabc-gray-400">Sélectionnez un template</span>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const heroStats = [
    {
      label: 'Templates disponibles',
      value: normalisedTemplates.length,
      icon: <ClipboardList className="h-4 w-4" />,
    },
    {
      label: 'Personnes à évaluer',
      value: totalTargets,
      icon: <Users2 className="h-4 w-4" />,
    },
    {
      label: 'Évaluations complétées',
      value: stats?.completed ?? 0,
      icon: <CheckCircle2 className="h-4 w-4" />,
    },
  ];

  return (
    <AppLayout user={layoutUser} pageTitle="Mes évaluations" notifications={[]}> 
      <Head title="Mes évaluations" />
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <Card className="border-none bg-gradient-to-br from-sabc-red-primary/90 via-sabc-red-primary to-sabc-red-dark text-white shadow-lg">
          <CardContent className="flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <Badge variant="outline" className="border-white/40 bg-white/10 text-white backdrop-blur">
                {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </Badge>
              <h1 className="text-2xl font-semibold md:text-3xl">Préparez vos évaluations 360°</h1>
              <p className="max-w-xl text-sm text-white/80">
                Sélectionnez un template, choisissez votre collaborateur et démarrez l'évaluation en quelques secondes. Toutes les règles SABC sont automatiquement appliquées.
              </p>
              <div className="flex flex-wrap gap-3">
                {heroStats.map((stat) => (
                  <div key={stat.label} className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm text-white/80">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-white">
                      {stat.icon}
                    </span>
                    <div className="flex flex-col leading-4">
                      <span className="text-xs uppercase tracking-wide text-white/60">{stat.label}</span>
                      <span className="font-semibold text-white">{stat.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative hidden overflow-hidden rounded-2xl bg-white/10 p-6 text-sm text-white/80 backdrop-blur md:block">
              <Sparkles className="absolute -top-6 -right-6 h-24 w-24 text-white/20" />
              <div className="space-y-2">
                <p className="font-semibold text-white">Conseils rapides</p>
                <ul className="space-y-1 text-xs">
                  <li>• Choisissez un template pour activer les actions.</li>
                  <li>• Justifiez toute note inférieure à 3.</li>
                  <li>• Enregistrez un brouillon à tout moment.</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[360px,1fr]">
          <div className="space-y-4">
            <Card className="border-sabc-gray-200 dark:border-sabc-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <ClipboardList className="h-5 w-5 text-sabc-red-primary" />
                  Templates disponibles
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {normalisedTemplates.length === 0 ? (
                  <Alert className="border-sabc-gray-200 bg-sabc-gray-50 text-sabc-gray-600 dark:border-sabc-gray-700 dark:bg-sabc-gray-800 dark:text-sabc-gray-300">
                    <AlertTitle>Aucun template actif</AlertTitle>
                    <AlertDescription>
                      Votre administrateur doit publier un template avant de démarrer une évaluation.
                    </AlertDescription>
                  </Alert>
                ) : (
                  normalisedTemplates.map((template) => {
                    const isSelected = selectedTemplate === template.id;

                    return (
                      <button
                        key={template.id}
                        type="button"
                        onClick={() => setSelectedTemplate(template.id)}
                        className={cn(
                          'w-full rounded-lg border px-4 py-3 text-left transition',
                          isSelected
                            ? 'border-sabc-red-primary bg-sabc-red-primary/5 shadow-sm'
                            : 'border-sabc-gray-200 hover:border-sabc-red-primary/40 dark:border-sabc-gray-700'
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium text-sabc-gray-900 dark:text-white">{template.name}</p>
                            <p className="mt-1 text-xs text-sabc-gray-500">{template.description}</p>
                          </div>
                          <Badge variant={getStatusBadgeVariant(template.status)} className="text-[10px] uppercase">
                            {template.status === 'published' ? 'Publié' : template.status}
                          </Badge>
                        </div>
                        {template.evaluatedRole && (
                          <div className="mt-3 flex items-center gap-2 text-xs text-sabc-gray-500">
                            <Target className="h-3.5 w-3.5" />
                            {`Cible: ${template.evaluatedRole}`}
                          </div>
                        )}
                      </button>
                    );
                  })
                )}
              </CardContent>
            </Card>

            <Card className="border-sabc-gray-200 dark:border-sabc-gray-700">
              <CardHeader>
                <CardTitle className="text-base">Progression</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-xs text-sabc-gray-500">
                    <span>Évaluations complétées</span>
                    <span>{stats?.completed ?? 0}/{stats?.total ?? totalTargets}</span>
                  </div>
                  <Progress
                    value={stats?.total ? Math.min(100, Math.round(((stats?.completed ?? 0) / stats.total) * 100)) : 0}
                    className="mt-2 h-2"
                  />
                </div>
                <Alert className="border-sabc-gray-200 bg-sabc-gray-50 text-xs text-sabc-gray-600 dark:border-sabc-gray-700 dark:bg-sabc-gray-800 dark:text-sabc-gray-300">
                  <AlertTitle className="text-xs font-semibold">Rappel</AlertTitle>
                  <AlertDescription>
                    Vous pouvez lancer plusieurs évaluations en parallèle. Les brouillons restent accessibles depuis la section « À compléter ».
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card className="border-sabc-gray-200 dark:border-sabc-gray-700">
              <CardHeader className="flex flex-col gap-2">
                <CardTitle className="flex items-center justify-between text-base">
                  <span>Personnes à évaluer</span>
                  {selectedTemplateData ? (
                    <Badge variant="secondary" className="text-xs">
                      {selectedTemplateData.name}
                    </Badge>
                  ) : (
                    <span className="text-xs text-sabc-gray-400">Sélectionnez un template pour activer l'évaluation</span>
                  )}
                </CardTitle>
                <TabsList className="w-full justify-start overflow-x-auto">
                  {TARGET_DEFINITIONS.filter((definition) => (targetGroups[definition.key] ?? []).length > 0).map((definition) => (
                    <TabsTrigger key={definition.key} value={definition.key} className="flex items-center gap-2 text-xs">
                      {definition.icon}
                      {definition.label}
                      <span className="rounded-full bg-sabc-gray-100 px-1.5 py-0.5 text-[10px] text-sabc-gray-600 dark:bg-sabc-gray-800 dark:text-sabc-gray-300">
                        {(targetGroups[definition.key] ?? []).length}
                      </span>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue={
                  TARGET_DEFINITIONS.find((definition) => (targetGroups[definition.key] ?? []).length > 0)?.key ?? 'auto'
                } className="space-y-4">
                  {TARGET_DEFINITIONS.map((definition) => {
                    const targets = targetGroups[definition.key] ?? [];
                    return (
                      <TabsContent key={definition.key} value={definition.key} className="space-y-3">
                        {targets.length === 0 ? (
                          <Alert className="border-dashed border-sabc-gray-200 bg-sabc-gray-50 text-xs text-sabc-gray-600 dark:border-sabc-gray-700 dark:bg-sabc-gray-800 dark:text-sabc-gray-300">
                            <AlertTitle>{definition.label}</AlertTitle>
                            <AlertDescription>{definition.description}</AlertDescription>
                          </Alert>
                        ) : (
                          targets.map(renderTargetCard)
                        )}
                      </TabsContent>
                    );
                  })}
                </Tabs>
              </CardContent>
            </Card>

            <Card className="border-sabc-gray-200 dark:border-sabc-gray-700">
              <CardHeader>
                <CardTitle className="text-base">Comment se déroule une évaluation ?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-sabc-gray-600 dark:text-sabc-gray-300">
                <div className="flex items-start gap-3 rounded-lg border border-sabc-gray-100 p-3 dark:border-sabc-gray-700">
                  <Badge variant="secondary" className="mt-0.5">1</Badge>
                  <div>
                    <p className="font-medium text-sabc-gray-900 dark:text-white">Choisissez votre template et la personne à évaluer.</p>
                    <p className="text-xs">Les règles SABC garantissent que seules les combinaisons autorisées sont proposées.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-lg border border-sabc-gray-100 p-3 dark:border-sabc-gray-700">
                  <Badge variant="secondary" className="mt-0.5">2</Badge>
                  <div>
                    <p className="font-medium text-sabc-gray-900 dark:text-white">Attribuez une note à chaque critère.</p>
                    <p className="text-xs">Un commentaire est requis pour toute note inférieure à 3 afin d'expliciter le plan d'amélioration.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-lg border border-sabc-gray-100 p-3 dark:border-sabc-gray-700">
                  <Badge variant="secondary" className="mt-0.5">3</Badge>
                  <div>
                    <p className="font-medium text-sabc-gray-900 dark:text-white">Enregistrez puis soumettez.</p>
                    <p className="text-xs">Vous pouvez garder un brouillon et revenir dessus via « Évaluations à compléter ».</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <EvaluationModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        templateId={selectedTemplate}
        targetMatricule={modalTarget}
      />
    </AppLayout>
  );
};

export default Mine;
