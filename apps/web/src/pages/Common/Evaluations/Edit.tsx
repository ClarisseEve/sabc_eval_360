import React, { useMemo } from 'react';
import { Head, Link, useForm } from '@/lib/inertia-shim';
import AppLayout from '@/Components/Layout/app/AppLayout';
import { adaptUserForLayout } from '@/utils/userAdapter';
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
  CheckCircle2,
  MessageSquare,
  Pencil,
  ShieldCheck,
} from 'lucide-react';

interface CritereEntry {
  id?: string | number | null;
  libelle?: string;
  description?: string | null;
  section_label?: string | null;
  section_order?: number | null;
}

interface NoteEntry {
  id?: string | number | null;
  note?: number;
  commentaire?: string | null;
  critere_nom?: string;
}

interface EvaluationProps {
  user: any;
  evaluation: Record<string, any>;
}

const parseJson = <T,>(payload: unknown): T | null => {
  if (!payload) return null;
  if (Array.isArray(payload)) return payload as unknown as T;
  if (typeof payload === 'object') return payload as unknown as T;
  if (typeof payload === 'string') {
    try {
      return JSON.parse(payload) as T;
    } catch (error) {
      console.warn('Impossible de parser le JSON', error);
    }
  }
  return null;
};

const computeInitialCriteria = (evaluation: Record<string, any>) => {
  const rawCriteres = parseJson<CritereEntry[]>(evaluation?.regle?.criteres_evaluation_json);
  const rawNotes = parseJson<NoteEntry[]>(evaluation?.notations_json) ?? [];

  if (!rawCriteres || rawCriteres.length === 0) {
    return rawNotes.map((note, index) => ({
      id: note.id ?? index,
      libelle: note.critere_nom ?? `Critère ${index + 1}`,
      description: null,
      note: note.note ?? 3,
      commentaire: note.commentaire ?? '',
      section: 'Compétences',
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
      note: matched?.note ?? 3,
      commentaire: matched?.commentaire ?? '',
      section: critere.section_label ?? 'Compétences',
    };
  });
};

const EditEvaluation: React.FC<EvaluationProps> = ({ user, evaluation }) => {
  const layoutUser = adaptUserForLayout(user);
  const criteria = useMemo(() => computeInitialCriteria(evaluation), [evaluation]);
  const evaluationId = evaluation?.id_evaluation ?? evaluation?.id;

  const form = useForm({
    notes: criteria.map((critere) => ({
      id: critere.id ?? '',
      note: critere.note ?? 3,
      commentaire: critere.commentaire ?? '',
    })),
    commentaire_general: evaluation?.commentaire_general ?? '',
    submit: false,
  });

  const completion = useMemo(() => {
    if (form.data.notes.length === 0) return 0;
    const completed = form.data.notes.filter((note) => note.note != null).length;
    return Math.round((completed / form.data.notes.length) * 100);
  }, [form.data.notes]);

  const requiresJustification = form.data.notes.some(
    (note) => (note.note ?? 0) < 3 && (!note.commentaire || note.commentaire.trim().length === 0)
  );

  const handleScoreChange = (index: number, value: number) => {
    const updated = [...form.data.notes];
    updated[index] = {
      ...updated[index],
      note: value,
    };
    form.setData('notes', updated);
  };

  const handleCommentChange = (index: number, value: string) => {
    const updated = [...form.data.notes];
    updated[index] = {
      ...updated[index],
      commentaire: value,
    };
    form.setData('notes', updated);
  };

  const handleSave = (submit: boolean) => {
    form.setData('submit', submit);
    form.put(`/common/evaluations/${evaluationId}`, {
      preserveScroll: true,
    });
  };

  return (
    <AppLayout user={layoutUser} pageTitle="Éditer une évaluation" notifications={[]}> 
      <Head title="Éditer une évaluation" />
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button asChild variant="ghost" size="sm" className="text-sabc-gray-500 hover:text-sabc-gray-800">
            <Link href={`/common/evaluations/${evaluationId}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour au détail
            </Link>
          </Button>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleSave(false)}
              loading={form.processing && !form.data.submit}
            >
              Enregistrer le brouillon
            </Button>
            <Button
              size="sm"
              className="bg-sabc-red-primary text-white hover:bg-sabc-red-dark"
              onClick={() => handleSave(true)}
              disabled={requiresJustification}
              loading={form.processing && form.data.submit}
            >
              Soumettre l'évaluation
              <ArrowRight className="ml-2 h-4 w-4" />
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
                  {evaluation?.regle?.nom_regle ?? 'Non défini'}
                </div>
                {evaluation?.regle?.type_evaluation && (
                  <Badge variant="secondary" className="mt-1 text-[10px] uppercase">
                    {evaluation.regle.type_evaluation}
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
                  {completion}%
                  <span className="text-xs text-sabc-gray-500">complété</span>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-sabc-gray-200 dark:bg-sabc-gray-800">
                  <div
                    className="h-full rounded-full bg-sabc-red-primary transition-all"
                    style={{ width: `${completion}%` }}
                  />
                </div>
              </div>

              {requiresJustification && (
                <Alert className="border-sabc-warning bg-sabc-warning/10 text-xs text-sabc-warning">
                  <AlertTitle>Commentaires requis</AlertTitle>
                  <AlertDescription>
                    Toute note inférieure à 3 doit obligatoirement être accompagnée d'un commentaire.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

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
                      {critere.description && (
                        <div className="mt-1 text-xs text-sabc-gray-500">{critere.description}</div>
                      )}
                    </div>
                    <Badge variant="secondary" className="text-[10px] uppercase">
                      Critère {index + 1}
                    </Badge>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => handleScoreChange(index, value)}
                        className={cn(
                          'h-9 w-9 rounded-full border text-sm font-semibold transition',
                          form.data.notes[index]?.note === value
                            ? 'border-sabc-red-primary bg-sabc-red-primary text-white'
                            : 'border-sabc-gray-200 bg-white text-sabc-gray-600 hover:border-sabc-red-primary/60 hover:text-sabc-red-primary dark:border-sabc-gray-700 dark:bg-sabc-gray-900 dark:text-sabc-gray-300'
                        )}
                      >
                        {value}
                      </button>
                    ))}
                  </div>

                  <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase text-sabc-gray-400">
                      <MessageSquare className="h-3.5 w-3.5" />
                      Commentaire
                      {(form.data.notes[index]?.note ?? 0) < 3 && (
                        <span className="rounded bg-sabc-red-light px-1.5 py-0.5 text-[10px] text-sabc-red-primary">
                          Obligatoire
                        </span>
                      )}
                    </div>
                    <Textarea
                      rows={3}
                      value={form.data.notes[index]?.commentaire ?? ''}
                      onChange={(event) => handleCommentChange(index, event.target.value)}
                      placeholder="Partagez vos observations ou un plan d'action."
                      className={cn(
                        'text-sm',
                        (form.data.notes[index]?.note ?? 0) < 3 && (!form.data.notes[index]?.commentaire?.trim())
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
              value={form.data.commentaire_general ?? ''}
              onChange={(event) => form.setData('commentaire_general', event.target.value)}
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

        {form.recentlySuccessful && (
          <Alert className="border-sabc-success bg-sabc-success/10 text-sabc-success">
            <AlertTitle>Enregistré</AlertTitle>
            <AlertDescription>
              Votre évaluation a été {form.data.submit ? 'soumise pour validation.' : 'enregistrée en brouillon.'}
            </AlertDescription>
          </Alert>
        )}
      </div>
    </AppLayout>
  );
};

const formatDisplayName = (userLike: Record<string, any>) => {
  if (userLike?.prenom || userLike?.nom) {
    return `${userLike?.prenom ?? ''} ${userLike?.nom ?? ''}`.trim();
  }
  if (userLike?.name) {
    return userLike.name;
  }
  return userLike?.matricule ?? 'Utilisateur';
};

const formatRole = (userLike: Record<string, any>) => userLike?.role_nom || userLike?.role || 'Rôle non renseigné';

export default EditEvaluation;
