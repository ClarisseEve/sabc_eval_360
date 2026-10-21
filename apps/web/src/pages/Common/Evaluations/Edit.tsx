import React, { useMemo, useRef, useState } from 'react';
import { Head } from '@/lib/inertia-shim';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/UI/Card';
import Badge from '@/Components/UI/Badge';
import { Alert, AlertDescription, AlertTitle } from '@/Components/UI/Alert';
import { Button } from '@/Components/UI/Button';
import { Textarea } from '@/Components/UI/Textarea/Textarea';
import { Avatar } from '@/Components/UI/Avatar/Avatar';
import { cn } from '@/utils/helpers';
import {
  ArrowLeft,
  ArrowRight,
  CalendarClock,
  Info,
  MessageSquare,
  Pencil,
  ShieldCheck,
  WifiOff,
} from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { evaluationsApi } from '@/Services/api';
import { useEvaluation } from '@/Hooks/queries';
import {
  buildEvaluationContext,
  EvaluationPageLayout,
  formatDisplayName,
  formatRole,
  isCriterionCommentRequired,
} from './shared';
import {
  ActiveRulesCard,
  formatDateLabel,
  formatEvaluationType,
  formatVisibilityLabel,
} from '@/Components/Dashboard/RoleDashboardShared';
import { useOfflineSync } from '@/Hooks/useOfflineSync';
import {
  buildEditableEvaluationNotes,
  getEvaluationSubmissionState,
  serializeRatedEvaluationNotes,
  type EditableEvaluationNote,
} from './workflow-ui';

const getErrorMessage = (error: unknown) => {
  const apiMessage = (error as any)?.response?.data?.message;
  if (Array.isArray(apiMessage)) return apiMessage.join('; ');
  if (typeof apiMessage === 'string') return apiMessage;
  if (error instanceof Error && error.message) return error.message;
  return "Impossible d'enregistrer l'évaluation pour le moment.";
};

const EditEvaluation: React.FC = () => {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { data: evaluation } = useEvaluation(id);
  const queryClient = useQueryClient();
  const context = useMemo(() => buildEvaluationContext(evaluation), [evaluation]);
  const criteria = context.criteria;
  const evaluationId = evaluation?.id_evaluation ?? evaluation?.id;
  const [notes, setNotes] = useState<EditableEvaluationNote[]>(() =>
    buildEditableEvaluationNotes(criteria),
  );
  const [commentaireGeneral, setCommentaireGeneral] = useState(evaluation?.commentaire_general ?? '');
  const [lastAction, setLastAction] = useState<'draft' | 'submit' | null>(null);
  const [pendingAction, setPendingAction] = useState<'draft' | 'submit' | null>(null);
  const [savedLocallyOnly, setSavedLocallyOnly] = useState(false);
  const [localSaveError, setLocalSaveError] = useState<string | null>(null);
  const [draftRestorationComplete, setDraftRestorationComplete] = useState(false);

  const { saveDraft, getDraft, deleteDraft, syncAll, isOnline, pendingCount, isSyncing } = useOfflineSync();
  const draftRestoredRef = useRef(false);
  const onlineSyncAttemptedRef = useRef(false);
  const latestDraftRef = useRef({ notes, commentaireGeneral });

  React.useEffect(() => {
    latestDraftRef.current = { notes, commentaireGeneral };
  }, [notes, commentaireGeneral]);

  React.useEffect(() => {
    setNotes(buildEditableEvaluationNotes(criteria));
    setCommentaireGeneral(evaluation?.commentaire_general ?? '');
    draftRestoredRef.current = false;
    setDraftRestorationComplete(false);
  }, [criteria, evaluation?.commentaire_general]);

  // Restore local draft once after evaluation data loads
  React.useEffect(() => {
    if (!id || !evaluation || draftRestoredRef.current) return;
    draftRestoredRef.current = true;
    getDraft(id).then((draft) => {
      if (!draft || draft.saved_at < new Date(evaluation.updated_at ?? 0).getTime()) return;
      setNotes(buildEditableEvaluationNotes(criteria, draft.notes));
      setCommentaireGeneral(draft.commentaire_general ?? '');
    }).catch(() => {}).finally(() => setDraftRestorationComplete(true));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [evaluation]);

  // Synchroniser seulement après la restauration évite qu'un brouillon soit
  // marqué « synchronisé » avant d'avoir été réinjecté dans le formulaire.
  React.useEffect(() => {
    if (!isOnline) {
      onlineSyncAttemptedRef.current = false;
      return;
    }
    if (!draftRestorationComplete || pendingCount === 0 || isSyncing || onlineSyncAttemptedRef.current) return;
    onlineSyncAttemptedRef.current = true;
    void syncAll().then(async ({ synced }) => {
      if (synced === 0) return;
      await queryClient.invalidateQueries({ queryKey: ['evaluations'] });
      await queryClient.invalidateQueries({ queryKey: ['evaluations', String(evaluationId)] });
    });
  }, [draftRestorationComplete, evaluationId, isOnline, isSyncing, pendingCount, queryClient, syncAll]);

  // Auto-save to IndexedDB every 30 seconds
  React.useEffect(() => {
    if (!evaluationId || isOnline) return;
    const interval = setInterval(() => {
      const currentDraft = latestDraftRef.current;
      saveDraft(
        String(evaluationId),
        currentDraft.notes,
        currentDraft.commentaireGeneral,
      ).catch(() => {});
    }, 30_000);
    return () => clearInterval(interval);
  }, [evaluationId, isOnline, saveDraft]);

  const submissionState = useMemo(
    () => getEvaluationSubmissionState(notes, criteria),
    [criteria, notes],
  );
  const requiresJustification = submissionState.missingComments > 0;

  const saveMutation = useMutation({
    mutationFn: async (submit: boolean) => {
      await evaluationsApi.update(String(evaluationId), {
        notes: serializeRatedEvaluationNotes(notes),
        commentaire_general: commentaireGeneral,
      });
      if (submit) {
        const response = await evaluationsApi.submit(String(evaluationId));
        if (response.data?.success === false) {
          throw new Error(response.data.message || "La soumission de l'évaluation a été refusée.");
        }
      }
    },
    onSuccess: async (_, submit) => {
      setPendingAction(null);
      setLastAction(submit ? 'submit' : 'draft');
      setSavedLocallyOnly(false);
      await deleteDraft(String(evaluationId)).catch(() => {});
      await queryClient.invalidateQueries({ queryKey: ['evaluations'] });
      await queryClient.invalidateQueries({ queryKey: ['evaluations', String(evaluationId)] });
      if (submit) {
        setTimeout(() => {
          navigate(`/evaluations/${evaluationId}`);
        }, 1200);
      }
    },
    onError: () => setPendingAction(null),
  });

  const handleScoreChange = (index: number, value: number) => {
    const updated = [...notes];
    updated[index] = {
      ...updated[index],
      note: value,
    };
    setNotes(updated);
  };

  const handleCommentChange = (index: number, value: string) => {
    const updated = [...notes];
    updated[index] = {
      ...updated[index],
      commentaire: value,
    };
    setNotes(updated);
  };

  const handleSave = async (submit: boolean) => {
    if (!evaluationId || (submit && (!submissionState.canSubmit || !isOnline))) return;

    const action = submit ? 'submit' : 'draft';
    saveMutation.reset();
    setPendingAction(action);
    setLastAction(null);
    setSavedLocallyOnly(false);
    setLocalSaveError(null);

    try {
      await saveDraft(String(evaluationId), notes, commentaireGeneral);
    } catch (error) {
      if (!isOnline) {
        setPendingAction(null);
        setLocalSaveError(getErrorMessage(error));
        return;
      }
    }

    if (!isOnline) {
      setPendingAction(null);
      setLastAction('draft');
      setSavedLocallyOnly(true);
      return;
    }

    saveMutation.mutate(submit);
  };

  return (
    <EvaluationPageLayout pageTitle="Éditer une évaluation">
      <Head title="Éditer une évaluation" />
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        {(!isOnline || pendingCount > 0) && (
          <Alert className="border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
            <WifiOff className="h-4 w-4" />
            <AlertTitle>{isOnline ? 'Envoi en attente' : 'Hors ligne'}</AlertTitle>
            <AlertDescription className="flex flex-wrap items-center gap-2 text-xs">
              <span>
                {isOnline
                  ? isSyncing
                    ? 'Synchronisation en cours…'
                    : `${pendingCount} brouillons locaux sur cet appareil restent à synchroniser. Cela ne signifie pas que cette évaluation est terminée.`
                  : 'Vous êtes hors ligne. Les modifications sont sauvegardées localement et envoyées à la reconnexion.'}
              </span>
              {isOnline && pendingCount > 0 && !isSyncing ? (
                <Button type="button" variant="outline" size="sm" onClick={() => void syncAll()}>
                  Réessayer maintenant
                </Button>
              ) : null}
            </AlertDescription>
          </Alert>
        )}

        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Button asChild={false} variant="ghost" size="sm" className="-ml-2 text-sabc-gray-500 hover:text-sabc-gray-800" onClick={() => navigate(`/evaluations/${evaluationId}`)}>
              <span className="inline-flex items-center">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour au détail
              </span>
            </Button>
            <h1 className="mt-2 text-2xl font-semibold text-sabc-gray-900 dark:text-white">
              Éditer une évaluation
            </h1>
            <p className="mt-1 text-sm text-sabc-gray-600 dark:text-sabc-gray-300">
              Notez chaque critère, justifiez les scores faibles, puis soumettez le formulaire complet.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleSave(false)}
              disabled={!evaluationId || pendingAction !== null}
              loading={pendingAction === 'draft'}
            >
              Enregistrer le brouillon
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-[320px,1fr]">
          <Card className="border-sabc-gray-200 dark:border-sabc-gray-700">
            <CardHeader>
              <CardTitle className="text-base">Informations clés</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-sabc-gray-600 dark:text-sabc-gray-300">
              <div>
                <div className="text-xs uppercase text-sabc-gray-400">Template</div>
                <div className="font-semibold text-sabc-gray-900 dark:text-white">
                  {context.summary.name || 'Non défini'}
                </div>
                {context.rule.type_evaluation && (
                  <Badge variant="secondary" className="mt-1 text-[10px] uppercase">
                    {formatEvaluationType(context.rule.type_evaluation)}
                  </Badge>
                )}
              </div>

              <div className="h-px w-full bg-sabc-gray-200 dark:bg-sabc-gray-700" />

              <div className="flex items-center gap-3">
                <Avatar
                  size="sm"
                  name={formatDisplayName(evaluation?.evalue ?? {})}
                  src={evaluation?.evalue?.avatar ?? undefined}
                />
                <div>
                  <div className="text-xs uppercase text-sabc-gray-400">Évalué</div>
                  <div className="font-medium text-sabc-gray-900 dark:text-white">{formatDisplayName(evaluation?.evalue ?? {})}</div>
                  <div className="text-xs text-sabc-gray-500">{formatRole(evaluation?.evalue ?? {})}</div>
                </div>
              </div>

              <div className="h-px w-full bg-sabc-gray-200 dark:bg-sabc-gray-700" />

              <div>
                <div className="text-xs uppercase text-sabc-gray-400">Progression</div>
                <div className="mt-2 flex items-baseline gap-2 text-2xl font-semibold text-sabc-gray-900 dark:text-white">
                  {submissionState.completion}%
                  <span className="text-xs text-sabc-gray-500">complété</span>
                </div>
                <div className="mt-1 text-xs text-sabc-gray-500">
                  {submissionState.ratedCount} critère(s) noté(s) sur {submissionState.totalCount}
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-sabc-gray-200 dark:bg-sabc-gray-800">
                  <div
                    className="h-full rounded-full bg-sabc-red-primary transition-all"
                    style={{ width: `${submissionState.completion}%` }}
                  />
                </div>
              </div>

              {!submissionState.canSubmit && (
                <Alert className="border-sabc-warning bg-sabc-warning/10 text-xs text-sabc-warning">
                  <AlertTitle>Avant de soumettre</AlertTitle>
                  <AlertDescription className="space-y-1">
                    {submissionState.missingRatings > 0 && (
                      <div>
                        Notez encore {submissionState.missingRatings} critère(s).
                      </div>
                    )}
                    {requiresJustification && (
                      <div>
                        Ajoutez {submissionState.missingComments} commentaire(s) obligatoire(s) sous le seuil défini.
                      </div>
                    )}
                    {submissionState.invalidCriteria > 0 && (
                      <div>
                        Le cadre contient un critère invalide. Contactez l’administrateur.
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              {!isOnline && (
                <Alert className="border-sabc-gray-300 bg-sabc-gray-50 text-xs text-sabc-gray-600">
                  <AlertTitle>Soumission indisponible hors ligne</AlertTitle>
                  <AlertDescription>
                    Enregistrez le brouillon. Vous pourrez le soumettre après le retour de la connexion.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border-sabc-gray-200 dark:border-sabc-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <CalendarClock className="h-5 w-5 text-sabc-info" />
                  Cycle actif
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-sabc-gray-200 p-4">
                  <div className="text-xs uppercase text-sabc-gray-400">Période</div>
                  <div className="mt-1 font-semibold text-sabc-gray-900 dark:text-white">{context.periodLabel}</div>
                  <div className="mt-1 text-xs text-sabc-gray-500">
                    {context.periodRange
                      ? `${formatDateLabel(context.periodRange.start)} — ${formatDateLabel(context.periodRange.end)}`
                      : 'Période non renseignée'}
                  </div>
                </div>
                <div className="rounded-lg border border-sabc-gray-200 p-4">
                  <div className="text-xs uppercase text-sabc-gray-400">Cadre</div>
                  <div className="mt-1 flex flex-wrap gap-2">
                    <Badge variant="info">{context.criteriaCount} critères</Badge>
                    <Badge variant="info">{context.sections.length} sections</Badge>
                    <Badge variant="warning">{formatVisibilityLabel(context.visibilityDetail)}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {evaluation?.commentaire_validation ? (
              <Alert className="border-sabc-warning bg-sabc-warning/10">
                <AlertTitle>Retour manager</AlertTitle>
                <AlertDescription className="space-y-1">
                  {evaluation?.validateur ? (
                    <div className="text-xs text-sabc-gray-500">
                      {`Dernière décision par ${formatDisplayName(evaluation.validateur)}`}
                    </div>
                  ) : null}
                  <div>{evaluation.commentaire_validation}</div>
                </AlertDescription>
              </Alert>
            ) : null}

            <ActiveRulesCard
              rules={evaluation?.regle ? [context.rule] : []}
              maxItems={1}
              description="La saisie suit exactement la règle publiée attachée à cette évaluation."
            />

            <Card className="border-sabc-gray-200 dark:border-sabc-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Pencil className="h-5 w-5 text-sabc-red-primary" />
                  Saisie des critères
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {criteria.map((critere, index) => (
                  <div
                    key={String(critere.id ?? index)}
                    className="rounded-lg border border-sabc-gray-200 p-4 transition hover:border-sabc-red-primary/40 dark:border-sabc-gray-700"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="font-semibold text-sabc-gray-900 dark:text-white">{critere.libelle}</div>
                        <div className="mt-1 flex flex-wrap gap-2 text-[10px] uppercase">
                          <Badge variant="secondary">{critere.section}</Badge>
                          {critere.poids != null ? <Badge variant="secondary">Poids {critere.poids}</Badge> : null}
                          <Badge variant="secondary">Critère {index + 1}</Badge>
                          {notes[index]?.note == null && <Badge variant="warning">Non noté</Badge>}
                        </div>
                        {critere.description && (
                          <div className="mt-2 text-xs text-sabc-gray-500">{critere.description}</div>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-5 gap-2">
                      {[1, 2, 3, 4, 5].map((value) => {
                        const description = critere.niveaux.find((level) => level.niveau === value)?.description
                          || `Description du score ${value}`;

                        return (
                          <div key={value} className="min-w-0 space-y-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleScoreChange(index, value)}
                              aria-label={`Attribuer la note ${value} sur 5 au critère ${index + 1} : ${description}`}
                              title={description}
                              aria-pressed={notes[index]?.note === value}
                              className={cn(
                                'h-9 w-9 rounded-full border text-sm font-semibold transition',
                                notes[index]?.note === value
                                  ? 'border-sabc-red-primary bg-sabc-red-primary text-white'
                                  : 'border-sabc-gray-200 bg-white text-sabc-gray-600 hover:border-sabc-red-primary/60 hover:text-sabc-red-primary dark:border-sabc-gray-700 dark:bg-sabc-gray-900 dark:text-sabc-gray-300'
                              )}
                            >
                              {value}
                            </button>
                            <p className="break-words text-[10px] leading-tight text-sabc-gray-500" title={description}>
                              {description}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                    {(critere.commentaireRequisSiNoteLt ?? 0) > 0 && (
                      <div className="mt-2 flex items-center gap-1.5 text-xs text-sabc-gray-500">
                        <Info className="h-3.5 w-3.5 shrink-0" />
                        <span>Un commentaire sera requis si votre note est inférieure à {critere.commentaireRequisSiNoteLt}/5</span>
                      </div>
                    )}

                    <div className="mt-4 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-semibold uppercase text-sabc-gray-400">
                        <MessageSquare className="h-3.5 w-3.5" />
                        Commentaire
                        {(notes[index]?.note != null && notes[index].note < (critere.commentaireRequisSiNoteLt ?? 3)) && (
                          <span className="rounded bg-sabc-red-light px-1.5 py-0.5 text-[10px] text-sabc-red-primary">
                            Obligatoire sous {critere.commentaireRequisSiNoteLt ?? 3}
                          </span>
                        )}
                      </div>
                      <Textarea
                        rows={3}
                        value={notes[index]?.commentaire ?? ''}
                        onChange={(event) => handleCommentChange(index, event.target.value)}
                        placeholder="Partagez vos observations ou un plan d'action."
                        className={cn(
                          'text-sm',
                          isCriterionCommentRequired({
                            note: notes[index]?.note,
                            commentaire: notes[index]?.commentaire,
                            commentaireRequisSiNoteLt: critere.commentaireRequisSiNoteLt,
                          })
                            ? 'border-sabc-red-primary'
                            : ''
                        )}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>

        <Card className="border-sabc-gray-200 dark:border-sabc-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="h-5 w-5 text-sabc-success" />
              Commentaire global
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              rows={4}
              value={commentaireGeneral ?? ''}
              onChange={(event) => setCommentaireGeneral(event.target.value)}
              placeholder="Faites une synthèse des points forts et des axes d'amélioration."
              className="text-sm"
            />
            <Alert className="border-sabc-gray-200 bg-sabc-gray-50 text-xs text-sabc-gray-600 dark:border-sabc-gray-700 dark:bg-sabc-gray-800 dark:text-sabc-gray-300">
              <AlertTitle>Conseil</AlertTitle>
              <AlertDescription>
                Une synthèse claire facilite la validation et la compréhension par l'évalué.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        <Card className="border-sabc-red-primary/30 bg-sabc-red-light/20 dark:border-sabc-red-primary/40 dark:bg-sabc-red-primary/10">
          <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="font-semibold text-sabc-gray-900 dark:text-white">Prêt à soumettre ?</div>
              <div className="mt-1 text-sm text-sabc-gray-600 dark:text-sabc-gray-300">
                {submissionState.canSubmit
                  ? 'Toutes les notes et justifications obligatoires sont complètes.'
                  : 'Complétez les critères obligatoires et les commentaires demandés pour continuer.'}
              </div>
            </div>
            <Button
              size="sm"
              className="w-full bg-sabc-red-primary text-white hover:bg-sabc-red-dark sm:w-auto"
              onClick={() => handleSave(true)}
              disabled={!evaluationId || !isOnline || !submissionState.canSubmit || pendingAction !== null}
              loading={pendingAction === 'submit'}
            >
              Soumettre l'évaluation
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        {lastAction && !saveMutation.isPending && !saveMutation.isError && (
          <Alert className="border-sabc-success bg-sabc-success/10 text-sabc-success">
            <AlertTitle>Enregistré</AlertTitle>
            <AlertDescription className="space-y-1">
              <div>
                {lastAction === 'submit'
                  ? 'Votre évaluation a été soumise pour validation.'
                  : savedLocallyOnly
                    ? 'Votre brouillon a été enregistré sur cet appareil.'
                    : 'Votre évaluation a été enregistrée en brouillon.'}
              </div>
              {savedLocallyOnly && (
                <div className="text-xs opacity-80">
                  Il sera synchronisé automatiquement au retour de la connexion.
                </div>
              )}
              {lastAction === 'submit' && (
                <div className="text-xs opacity-80">
                  Elle ne pourra être corrigée qu'après un éventuel rejet par le validateur.
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {(saveMutation.isError || localSaveError) && (
          <Alert className="border-red-300 bg-red-50 text-red-700">
            <AlertTitle>Erreur</AlertTitle>
            <AlertDescription>
              {localSaveError || getErrorMessage(saveMutation.error)}
            </AlertDescription>
          </Alert>
        )}
      </div>
    </EvaluationPageLayout>
  );
};

export default EditEvaluation;
