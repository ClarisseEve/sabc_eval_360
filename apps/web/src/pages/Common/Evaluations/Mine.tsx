import React, { useMemo, useState } from 'react';
import { Head } from '@/lib/inertia-shim';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/UI/Card';
import { Alert, AlertDescription, AlertTitle } from '@/Components/UI/Alert';
import Badge from '@/Components/UI/Badge';
import { Button } from '@/Components/UI/Button';
import EvaluationModal from '@/Components/Evaluation/EvaluationModal';
import { evaluationsApi, reglesApi } from '@/Services/api';
import { useEligibles, useHistorique } from '@/Hooks/queries';
import { EvaluationPageLayout, formatDisplayName, formatRole } from './shared';
import { CheckCircle2, ClipboardList, PlayCircle, Users2 } from 'lucide-react';

type Target = Record<string, any>;

const TARGET_LABELS: Record<string, string> = {
  auto: 'Auto-évaluation',
  pairs: 'Pairs',
  subordonnes: 'Subordonnés',
  ascendante: 'Ascendante',
};

const Mine: React.FC = () => {
  const { data: eligibles } = useEligibles();
  const { data: historique } = useHistorique();
  const { data: templates = [] } = useQuery({
    queryKey: ['regles', 'active-list'],
    queryFn: () => reglesApi.list().then((r) => r.data ?? []),
  });

  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const eligibleGroups = useMemo(() => {
    if (!eligibles || typeof eligibles !== 'object') return [];
    return Object.entries(eligibles)
      .map(([key, value]) => [key, Array.isArray(value) ? value : value ? [value] : []] as const)
      .filter(([, list]) => list.length > 0);
  }, [eligibles]);

  const historyList = Array.isArray(historique) ? historique : [];

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
              <Badge variant="outline" className="border-sabc-red-primary bg-sabc-red-primary/10 text-sabc-red-primary">
                Cycle d’évaluation
              </Badge>
              <h1 className="text-2xl font-semibold text-sabc-gray-900">Démarrer ou reprendre vos évaluations</h1>
              <p className="max-w-2xl text-sm text-sabc-gray-600">
                Sélectionnez un template actif, puis démarrez un brouillon pour une cible éligible. Votre historique validé et vos brouillons restent accessibles ci-dessous.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg bg-sabc-red-primary/5 p-4">
                <div className="text-xs uppercase text-sabc-gray-500">Templates actifs</div>
                <div className="mt-1 text-2xl font-semibold text-sabc-gray-900">{templates.length}</div>
              </div>
              <div className="rounded-lg bg-sabc-red-primary/5 p-4">
                <div className="text-xs uppercase text-sabc-gray-500">Historique</div>
                <div className="mt-1 text-2xl font-semibold text-sabc-gray-900">{historyList.length}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[340px,1fr]">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ClipboardList className="h-5 w-5 text-sabc-red-primary" />
                Templates actifs
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {templates.length === 0 ? (
                <Alert>
                  <AlertTitle>Aucun template actif</AlertTitle>
                  <AlertDescription>
                    La création d’évaluation est indisponible tant qu’aucune règle active n’est publiée.
                  </AlertDescription>
                </Alert>
              ) : (
                templates.map((template: any) => {
                  const active = selectedTemplate === template.id_regle;
                  return (
                    <button
                      key={template.id_regle}
                      type="button"
                      onClick={() => setSelectedTemplate(template.id_regle)}
                      className={`w-full rounded-lg border p-4 text-left transition ${active ? 'border-sabc-red-primary bg-sabc-red-primary/5' : 'border-sabc-gray-200 hover:border-sabc-red-primary/40'}`}
                    >
                      <div className="font-medium text-sabc-gray-900">{template.nom_regle}</div>
                      <div className="mt-1 text-xs text-sabc-gray-500">{template.description || 'Sans description.'}</div>
                    </button>
                  );
                })
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Users2 className="h-5 w-5 text-sabc-red-primary" />
                Cibles éligibles
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {eligibleGroups.length === 0 ? (
                <Alert>
                  <AlertTitle>Aucune cible disponible</AlertTitle>
                  <AlertDescription>
                    Vous n’avez actuellement aucune cible éligible selon la hiérarchie et les règles actives.
                  </AlertDescription>
                </Alert>
              ) : (
                eligibleGroups.map(([group, list]) => (
                  <div key={group} className="space-y-3">
                    <div className="text-sm font-semibold text-sabc-gray-900">
                      {TARGET_LABELS[group] || group}
                      <span className="ml-2 text-xs font-normal text-sabc-gray-500">({list.length})</span>
                    </div>
                    {list.map((target: Target) => (
                      <Card key={target.matricule || `${group}-${target.nom}-${target.prenom}`} className="border-sabc-gray-200 shadow-sm">
                        <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
                          <div>
                            <div className="font-medium text-sabc-gray-900">{formatDisplayName(target)}</div>
                            <div className="text-sm text-sabc-gray-500">{formatRole(target)}</div>
                          </div>
                          <Button
                            size="sm"
                            className="bg-sabc-red-primary text-white hover:bg-sabc-red-dark"
                            disabled={!selectedTemplate}
                            onClick={() => launchEvaluation(target.matricule)}
                          >
                            <PlayCircle className="mr-2 h-4 w-4" />
                            Démarrer
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle2 className="h-5 w-5 text-sabc-success" />
              Historique récent
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {historyList.length === 0 ? (
              <Alert>
                <AlertTitle>Aucun historique</AlertTitle>
                <AlertDescription>
                  Vous n’avez pas encore d’évaluation enregistrée sur votre périmètre.
                </AlertDescription>
              </Alert>
            ) : (
              historyList.slice(0, 12).map((evaluation: any) => (
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
                    <Badge variant="outline">{evaluation.note_globale != null ? `${Number(evaluation.note_globale).toFixed(1)}/5` : '—'}</Badge>
                    <Button variant="outline" size="sm" onClick={() => { window.location.href = `/evaluations/${evaluation.id_evaluation}`; }}>
                      Voir
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
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
