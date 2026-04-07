import React, { useMemo } from 'react';
import { Head } from '@/lib/inertia-shim';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/UI/Card';
import Badge from '@/Components/UI/Badge';
import { Alert, AlertDescription, AlertTitle } from '@/Components/UI/Alert';
import { Button } from '@/Components/UI/Button';
import { Avatar } from '@/Components/UI/Avatar/Avatar';
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  Edit3,
  FileText,
  MessageSquare,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useParams } from 'react-router-dom';
import { useEvaluation } from '@/Hooks/queries';
import { EvaluationPageLayout, formatDisplayName, formatRole, useEvaluationLayoutUser } from './shared';

interface NoteEntry {
  id?: string | number | null;
  note?: number;
  commentaire?: string | null;
  critere_nom?: string;
}

interface CritereEntry {
  id?: string | number | null;
  libelle?: string;
  description?: string | null;
  poids?: number | null;
  section_label?: string | null;
  section_order?: number | null;
}

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

const parseJson = <T,>(payload: unknown): T | null => {
  if (!payload) return null;
  if (Array.isArray(payload)) return payload as unknown as T;
  if (typeof payload === 'object') return payload as unknown as T;
  if (typeof payload === 'string') {
    try {
      return JSON.parse(payload) as T;
    } catch (error) {
      console.warn('Impossible de parser le JSON d\'évaluation', error);
      return null;
    }
  }
  return null;
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

const computeMergedCriteria = (evaluation: Record<string, any>) => {
  const rawCriteres = parseJson<CritereEntry[]>(evaluation?.regle?.criteres_evaluation_json);
  const rawNotes = parseJson<NoteEntry[]>(evaluation?.notations_json) ?? [];

  if (!rawCriteres || rawCriteres.length === 0) {
    return rawNotes.map((note, index) => ({
      id: note.id ?? index,
      libelle: note.critere_nom ?? `Critère ${index + 1}`,
      description: null,
      note: note.note ?? null,
      commentaire: note.commentaire ?? '',
    }));
  }

  return rawCriteres.map((critere, index) => {
    const matched = rawNotes.find((note) => {
      if (!note) return false;
      if (note.id != null && critere.id != null) {
        return String(note.id) === String(critere.id);
      }
      return index === rawNotes.indexOf(note);
    });

    return {
      id: critere.id ?? index,
      libelle: critere.libelle ?? `Critère ${index + 1}`,
      description: critere.description ?? null,
      note: matched?.note ?? null,
      commentaire: matched?.commentaire ?? '',
      section: critere.section_label ?? 'Compétences',
      poids: critere.poids ?? null,
    };
  });
};

const ShowEvaluation: React.FC = () => {
  const { id = '' } = useParams();
  const { data: evaluation } = useEvaluation(id);
  const { authUser: rawUser } = useEvaluationLayoutUser();
  const statusMeta = STATUS_VARIANTS[evaluation?.statut] ?? STATUS_VARIANTS.brouillon;
  const mergedCriteria = useMemo(() => computeMergedCriteria(evaluation), [evaluation]);
  const isEvaluator = evaluation?.evaluateur?.matricule && evaluation.evaluateur.matricule === rawUser?.matricule;
  const canEdit = isEvaluator && evaluation?.statut === 'brouillon';
  const evaluationId = evaluation?.id_evaluation ?? evaluation?.id;
  const overallScore = evaluation?.note_globale ? Number(evaluation.note_globale) : null;
  const hasComments = Boolean(evaluation?.commentaire_general);

  const periodLabel = evaluation?.periode?.nom_periode ?? evaluation?.periode?.code_periode ?? 'Période active';
  const periodRange = evaluation?.periode?.date_debut && evaluation?.periode?.date_fin
    ? `${formatDate(evaluation.periode.date_debut)} — ${formatDate(evaluation.periode.date_fin)}`
    : null;

  return (
    <EvaluationPageLayout pageTitle="Détail de l'évaluation">
      <Head title="Détail de l'évaluation" />
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button asChild={false} variant="ghost" size="sm" className="text-sabc-gray-500 hover:text-sabc-gray-800" onClick={() => { window.location.href = '/evaluations/pending'; }}>
            <span className="inline-flex items-center">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour
            </span>
          </Button>
          <div className="flex flex-wrap gap-2">
            {canEdit && evaluationId && (
              <Button asChild={false} size="sm" className="bg-sabc-red-primary text-white hover:bg-sabc-red-dark" onClick={() => { window.location.href = `/evaluations/${evaluationId}/edit`; }}>
                <span className="inline-flex items-center">
                  <Edit3 className="mr-2 h-4 w-4" />
                  Continuer la saisie
                </span>
              </Button>
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
              </div>
              <h1 className="text-2xl font-semibold text-sabc-gray-900 dark:text-white">
                Évaluation 360° {evaluation?.regle?.nom_regle ? `— ${evaluation.regle.nom_regle}` : ''}
              </h1>
              <p className="text-sm text-sabc-gray-600 dark:text-sabc-gray-300">{statusMeta.helper}</p>
            </div>
            <div className="flex flex-col items-start gap-3 rounded-lg border border-sabc-gray-200 bg-white p-4 text-sm dark:border-sabc-gray-700 dark:bg-sabc-gray-900">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-sabc-gray-500">
                <FileText className="h-4 w-4" />
                Période d'évaluation
              </div>
              <div className="text-base font-semibold text-sabc-gray-900 dark:text-white">{periodLabel}</div>
              {periodRange && <div className="text-xs text-sabc-gray-500">{periodRange}</div>}
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
          <Card className="border-sabc-gray-200 dark:border-sabc-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldCheck className="h-5 w-5 text-sabc-success" />
                Synthèse générale
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl bg-sabc-red-light/60 p-4 text-center">
                <div className="text-xs uppercase tracking-wide text-sabc-red-primary/80">Note globale</div>
                <div className="mt-2 text-4xl font-bold text-sabc-red-primary">
                  {overallScore != null ? overallScore.toFixed(2) : '—'}
                </div>
              </div>

              <div className="space-y-3 text-sm text-sabc-gray-600 dark:text-sabc-gray-300">
                <div>
                  <div className="text-xs font-semibold uppercase text-sabc-gray-400">Créée le</div>
                  <div>{formatDate(evaluation?.created_at, true) ?? 'Non renseigné'}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase text-sabc-gray-400">Soumise le</div>
                  <div>{formatDate(evaluation?.date_soumission, true) ?? 'En attente'}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase text-sabc-gray-400">Validée le</div>
                  <div>{formatDate(evaluation?.date_validation, true) ?? 'En cours'}</div>
                </div>
              </div>

              {evaluation?.validateur && (
                <div className="rounded-lg border border-sabc-gray-200 bg-sabc-gray-50 p-3 text-xs text-sabc-gray-600 dark:border-sabc-gray-700 dark:bg-sabc-gray-800 dark:text-sabc-gray-300">
                  <div className="flex items-center gap-2 text-sabc-gray-500">
                    <CheckCircle2 className="h-4 w-4 text-sabc-success" />
                    Validation manager
                  </div>
                  <div className="mt-1 font-medium text-sabc-gray-900 dark:text-white">
                    {formatDisplayName(evaluation.validateur)}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-sabc-gray-200 dark:border-sabc-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="h-5 w-5 text-sabc-accent" />
                Détail des critères évalués
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {mergedCriteria.length === 0 ? (
                <Alert className="border-sabc-gray-200 bg-sabc-gray-50 text-sabc-gray-600 dark:border-sabc-gray-700 dark:bg-sabc-gray-800 dark:text-sabc-gray-300">
                  <AlertTitle>Pas de critères renseignés</AlertTitle>
                  <AlertDescription>
                    Cette évaluation ne contient pas encore de notes détaillées.
                  </AlertDescription>
                </Alert>
              ) : (
                mergedCriteria.map((critere, index) => (
                  <div
                    key={String(critere.id ?? index)}
                    className="rounded-lg border border-sabc-gray-200 p-4 transition hover:border-sabc-red-primary/40 dark:border-sabc-gray-700"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="font-semibold text-sabc-gray-900 dark:text-white">{critere.libelle}</div>
                      <Badge variant="secondary" className="text-[10px] uppercase">
                        Note {critere.note != null ? critere.note : '—'} / 5
                      </Badge>
                    </div>
                    {critere.description && (
                      <p className="mt-2 text-xs text-sabc-gray-500">{critere.description}</p>
                    )}
                    {critere.commentaire ? (
                      <div className="mt-3 rounded-md bg-sabc-gray-50 p-3 text-xs text-sabc-gray-600 dark:bg-sabc-gray-800 dark:text-sabc-gray-300">
                        <div className="mb-1 flex items-center gap-2 font-semibold text-sabc-gray-500">
                          <MessageSquare className="h-3.5 w-3.5" /> Commentaire
                        </div>
                        {critere.commentaire}
                      </div>
                    ) : (
                      <div className="mt-3 text-xs italic text-sabc-gray-400">
                        Aucun commentaire renseigné pour ce critère.
                      </div>
                    )}
                  </div>
                ))
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
