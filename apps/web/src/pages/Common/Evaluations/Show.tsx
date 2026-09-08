import React, { useMemo } from 'react';
import { Head } from '@/lib/inertia-shim';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/UI/Card';
import Badge from '@/Components/UI/Badge';
import { Alert, AlertDescription, AlertTitle } from '@/Components/UI/Alert';
import { Button } from '@/Components/UI/Button';
import { Avatar } from '@/Components/UI/Avatar/Avatar';
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  Download,
  Edit3,
  FileText,
  MessageSquare,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useEvaluation } from '@/Hooks/queries';
import {
  buildEvaluationContext,
  EvaluationPageLayout,
  formatDisplayName,
  formatRole,
  useEvaluationLayoutUser,
} from './shared';
import { ActiveRulesCard, formatDateLabel, formatEvaluationType } from '@/Components/Dashboard/RoleDashboardShared';

const STATUS_VARIANTS: Record<string, { label: string; variant: 'primary' | 'secondary' | 'destructive'; helper: string }> = {
  brouillon: {
    label: 'Brouillon',
    variant: 'secondary',
    helper: 'Cette évaluation est en cours de rédaction et n\'a pas encore été soumise.',
  },
  soumis: {
    label: 'Soumise',
    variant: 'primary',
    helper: 'Évaluation transmise pour validation. Vous serez notifié du retour.',
  },
  valide: {
    label: 'Validée',
    variant: 'primary',
    helper: 'Cette évaluation est validée et visible par la personne évaluée.',
  },
  rejete: {
    label: 'Rejetée',
    variant: 'destructive',
    helper: 'Des ajustements sont nécessaires suite au rejet de cette évaluation.',
  },
};

const formatDate = (value?: string | null, withTime = false) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  }).format(date);
};

function hasInternalBrowserHistory() {
  const routerIndex = Number(window.history.state?.idx);
  if (Number.isFinite(routerIndex) && routerIndex > 0) return true;
  if (!document.referrer) return false;

  try {
    return new URL(document.referrer).origin === window.location.origin;
  } catch {
    return false;
  }
}

const ShowEvaluation: React.FC = () => {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { data: evaluation } = useEvaluation(id);
  const { authUser: rawUser } = useEvaluationLayoutUser();
  const statusMeta = STATUS_VARIANTS[evaluation?.statut] ?? STATUS_VARIANTS.brouillon;
  const context = useMemo(() => buildEvaluationContext(evaluation), [evaluation]);
  const mergedCriteria = context.criteria;
  const isEvaluator = evaluation?.evaluateur?.matricule && evaluation.evaluateur.matricule === rawUser?.matricule;
  const canEditDraft = isEvaluator && evaluation?.statut === 'brouillon';
  const canEditRejected = isEvaluator && evaluation?.statut === 'rejete';
  const canEdit = canEditDraft || canEditRejected;
  const evaluationId = evaluation?.id_evaluation ?? evaluation?.id;
  const overallScore = evaluation?.note_globale ? Number(evaluation.note_globale) : null;
  const hasComments = Boolean(evaluation?.commentaire_general);
  const decisionDateLabel = evaluation?.statut === 'valide' ? 'Validée le' : 'Dernier retour le';
  const fallbackBackPath = isEvaluator && ['brouillon', 'rejete'].includes(String(evaluation?.statut))
    ? '/evaluations/pending'
    : '/evaluations/historique';
  const handleBack = () => {
    if (hasInternalBrowserHistory()) {
      navigate(-1);
      return;
    }
    navigate(fallbackBackPath, { replace: true });
  };

  return (
    <EvaluationPageLayout pageTitle="Détail de l'évaluation">
      <Head title="Détail de l'évaluation" />
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button asChild={false} variant="ghost" size="sm" className="text-sabc-gray-500 hover:text-sabc-gray-800" onClick={handleBack}>
            <span className="inline-flex items-center">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour
            </span>
          </Button>
          <div className="flex flex-wrap items-center gap-2">
            {canEdit && evaluationId && (
              <>
                <Button asChild={false} size="sm" className="bg-sabc-red-primary text-white hover:bg-sabc-red-dark" onClick={() => { window.location.href = `/evaluations/${evaluationId}/edit`; }}>
                  <span className="inline-flex items-center">
                    <Edit3 className="mr-2 h-4 w-4" />
                    {canEditDraft ? 'Continuer la saisie' : 'Corriger et resoumettre'}
                  </span>
                </Button>
              </>
            )}
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Download className="mr-2 h-4 w-4" />
              Télécharger un PDF
            </Button>
          </div>
        </div>

        <Card className="border-none bg-gradient-to-br from-white via-white to-sabc-red-light/40 shadow-lg dark:from-sabc-gray-900 dark:via-sabc-gray-900 dark:to-sabc-gray-800">
          <CardContent className="grid gap-6 p-6 md:grid-cols-3">
            <div className="md:col-span-2 space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant={statusMeta.variant}>{statusMeta.label}</Badge>
                <span className="text-xs text-sabc-gray-500">ID {evaluationId}</span>
                {context.rule.type_evaluation ? <Badge variant="primary">{formatEvaluationType(context.rule.type_evaluation)}</Badge> : null}
              </div>
              <h1 className="text-2xl font-semibold text-sabc-gray-900 dark:text-white">
                Évaluation 360° {context.summary.name ? `— ${context.summary.name}` : ''}
              </h1>
              <p className="text-sm text-sabc-gray-600 dark:text-sabc-gray-300">{statusMeta.helper}</p>
            </div>
            <div className="flex flex-col items-start gap-3 rounded-lg border border-sabc-gray-200 bg-white p-4 text-sm dark:border-sabc-gray-700 dark:bg-sabc-gray-900">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-sabc-gray-500">
                <FileText className="h-4 w-4" />
                Période d'évaluation
              </div>
              <div className="text-base font-semibold text-sabc-gray-900 dark:text-white">{context.periodLabel}</div>
              {context.periodRange && (
                <div className="text-xs text-sabc-gray-500">
                  {`${formatDateLabel(context.periodRange.start)} — ${formatDateLabel(context.periodRange.end)}`}
                </div>
              )}
              {evaluation?.deadline && (
                <div className="rounded-md bg-sabc-red-light/60 px-3 py-1 text-xs text-sabc-red-primary">
                  Échéance : {formatDate(evaluation.deadline)}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-sabc-gray-200 dark:border-sabc-gray-700">
            <CardHeader>
              <CardTitle className="text-base">Évaluateur</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-4">
              <Avatar
                size="lg"
                name={formatDisplayName(evaluation?.evaluateur ?? {})}
                src={evaluation?.evaluateur?.avatar ?? undefined}
              />
              <div>
                <div className="font-semibold text-sabc-gray-900 dark:text-white">
                  {formatDisplayName(evaluation?.evaluateur ?? {})}
                </div>
                <div className="text-xs text-sabc-gray-500">{formatRole(evaluation?.evaluateur ?? {})}</div>
                {evaluation?.evaluateur?.region_nom && (
                  <div className="text-xs text-sabc-gray-400">{evaluation.evaluateur.region_nom}</div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-sabc-gray-200 dark:border-sabc-gray-700">
            <CardHeader>
              <CardTitle className="text-base">Évalué</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-4">
              <Avatar
                size="lg"
                name={formatDisplayName(evaluation?.evalue ?? {})}
                src={evaluation?.evalue?.avatar ?? undefined}
                variant="warning"
              />
              <div>
                <div className="font-semibold text-sabc-gray-900 dark:text-white">
                  {formatDisplayName(evaluation?.evalue ?? {})}
                </div>
                <div className="text-xs text-sabc-gray-500">{formatRole(evaluation?.evalue ?? {})}</div>
                {evaluation?.evalue?.region_nom && (
                  <div className="text-xs text-sabc-gray-400">{evaluation.evalue.region_nom}</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-[340px,1fr]">
          <div className="space-y-6">
            <Card className="border-sabc-gray-200 dark:border-sabc-gray-700">
              <CardContent className="p-0">
                <div className="flex">
                  {/* Score — gauche, large */}
                  <div className="flex w-44 shrink-0 flex-col items-center justify-center border-r border-sabc-gray-200 bg-gradient-to-b from-sabc-red-light/50 to-white py-6 dark:border-sabc-gray-700 dark:from-sabc-red-primary/10 dark:to-sabc-gray-900">
                    <ShieldCheck className="mb-1.5 h-6 w-6 text-sabc-success" />
                    <div className="text-[10px] font-semibold uppercase tracking-widest text-sabc-gray-400">Note globale</div>
                    <div
                      className={`mt-1 text-5xl font-extrabold leading-none ${
                        overallScore != null && getScoreTone(overallScore) === 'success' ? 'text-sabc-success' : 'text-sabc-red-primary'
                      }`}
                    >
                      {overallScore != null ? overallScore.toFixed(2) : '—'}
                    </div>
                    <div className="mt-0.5 text-sm font-medium text-sabc-gray-400">/5</div>
                    {overallScore != null && (
                      <div className="mt-3 h-2 w-20 overflow-hidden rounded-full bg-sabc-gray-200 dark:bg-sabc-gray-700">
                        <div
                          className={`h-full rounded-full transition-all ${
                            getScoreTone(overallScore) === 'success' ? 'bg-sabc-success' : 'bg-sabc-red-primary'
                          }`}
                          style={{ width: `${Math.min((overallScore / 5) * 100, 100)}%` }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Centre — cadre, cycle, validation */}
                  <div className="flex flex-1 flex-col justify-center space-y-3 p-4">
                    <div className="flex flex-wrap items-start gap-x-6 gap-y-2 text-xs">
                      <div>
                        <span className="font-semibold uppercase text-sabc-gray-400">Cadre</span>
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          <Badge variant="info">{context.criteriaCount} critères</Badge>
                          <Badge variant="info">{context.sections.length} sections</Badge>
                        </div>
                      </div>
                      <div>
                        <span className="font-semibold uppercase text-sabc-gray-400">Cycle</span>
                        <div className="mt-1 font-medium text-sabc-gray-800 dark:text-sabc-gray-200">{context.periodLabel}</div>
                        {context.periodRange && (
                          <div className="text-sabc-gray-500">
                            {`${formatDateLabel(context.periodRange.start)} — ${formatDateLabel(context.periodRange.end)}`}
                          </div>
                        )}
                      </div>
                    </div>

                    {evaluation?.validateur && (
                      <div className="flex items-start gap-2 border-t border-sabc-gray-100 pt-2 text-xs dark:border-sabc-gray-800">
                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sabc-success" />
                        <div>
                          <span className="font-medium text-sabc-gray-800 dark:text-sabc-gray-200">{formatDisplayName(evaluation.validateur)}</span>
                          {evaluation.commentaire_validation && (
                            <span className="ml-1 text-sabc-gray-500">— {evaluation.commentaire_validation}</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Droite — dates */}
                  <div className="flex w-40 shrink-0 flex-col justify-center gap-2 border-l border-sabc-gray-100 px-4 py-4 text-[11px] dark:border-sabc-gray-800">
                    <div>
                      <div className="font-semibold uppercase text-sabc-gray-400">Créée</div>
                      <div className="text-sabc-gray-600 dark:text-sabc-gray-300">{formatDate(evaluation?.created_at, true) ?? '—'}</div>
                    </div>
                    <div>
                      <div className="font-semibold uppercase text-sabc-gray-400">Soumise</div>
                      <div className="text-sabc-gray-600 dark:text-sabc-gray-300">{formatDate(evaluation?.date_soumission, true) ?? 'En attente'}</div>
                    </div>
                    <div>
                      <div className="font-semibold uppercase text-sabc-gray-400">{decisionDateLabel}</div>
                      <div className="text-sabc-gray-600 dark:text-sabc-gray-300">{formatDate(evaluation?.date_validation, true) ?? 'En cours'}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <ActiveRulesCard
              rules={evaluation?.regle ? [context.rule] : []}
              maxItems={1}
              description="Règle publiée qui a cadré la saisie et la visibilité de cette évaluation."
            />
          </div>

          <Card className="border-sabc-gray-200 dark:border-sabc-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="h-5 w-5 text-sabc-accent" />
                Détail des critères évalués
              </CardTitle>
            </CardHeader>
            <CardContent>
              {mergedCriteria.length === 0 ? (
                <Alert className="border-sabc-gray-200 bg-sabc-gray-50 text-sabc-gray-600 dark:border-sabc-gray-700 dark:bg-sabc-gray-800 dark:text-sabc-gray-300">
                  <AlertTitle>Pas de critères renseignés</AlertTitle>
                  <AlertDescription>
                    Cette évaluation ne contient pas encore de notes détaillées.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {mergedCriteria.map((critere, index) => {
                    const note = critere.note != null ? Number(critere.note) : null;
                    const noteColor =
                      note == null ? 'text-sabc-gray-400'
                      : note >= 4 ? 'text-sabc-success'
                      : note >= 3 ? 'text-sabc-accent'
                      : 'text-sabc-error';

                    return (
                      <div
                        key={String(critere.id ?? index)}
                        className="group relative flex flex-col items-center rounded-xl border border-sabc-gray-200 px-3 py-4 text-center transition hover:border-sabc-red-primary/40 hover:shadow-sm dark:border-sabc-gray-700"
                        title={[critere.description, critere.commentaire].filter(Boolean).join('\n\n')}
                      >
                        <span className="mb-2 inline-block rounded-full bg-sabc-gray-100 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-sabc-gray-500 dark:bg-sabc-gray-800">
                          {critere.section}
                        </span>
                        <div className="text-xs font-semibold leading-tight text-sabc-gray-800 dark:text-sabc-gray-200">
                          {critere.libelle}
                        </div>
                        <div className={`mt-2 text-2xl font-bold leading-none ${noteColor}`}>
                          {note != null ? note : '—'}
                          <span className="text-sm font-medium text-sabc-gray-400"> /5</span>
                        </div>
                        {critere.poids != null && (
                          <span className="mt-1.5 text-[10px] text-sabc-gray-400">
                            Poids {critere.poids}
                          </span>
                        )}
                        {critere.commentaire && (
                          <MessageSquare className="absolute right-2 top-2 h-3 w-3 text-sabc-gray-300 dark:text-sabc-gray-600" />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="border-sabc-gray-200 dark:border-sabc-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageSquare className="h-5 w-5 text-sabc-gray-500" />
              Commentaire global
            </CardTitle>
          </CardHeader>
          <CardContent>
            {hasComments ? (
              <p className="text-sm text-sabc-gray-700 dark:text-sabc-gray-200">{evaluation.commentaire_general}</p>
            ) : (
              <div className="rounded-lg border border-dashed border-sabc-gray-200 p-4 text-sm text-sabc-gray-500 dark:border-sabc-gray-700 dark:text-sabc-gray-300">
                Aucun commentaire général n'a été ajouté pour cette évaluation.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </EvaluationPageLayout>
  );
};

export default ShowEvaluation;
