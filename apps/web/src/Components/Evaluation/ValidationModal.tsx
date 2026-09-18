import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/Components/UI/Dialog/Dialog';
import { Button } from '@/Components/UI/Button/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/UI/Card/Card';
import { Alert, AlertDescription, AlertTitle } from '@/Components/UI/Alert/Alert';
import Badge from '@/Components/UI/Badge';
import { evaluationsApi } from '@/Services/api';
import { buildEvaluationContext, isCriterionCommentRequired } from '@/pages/Common/Evaluations/shared';
import {
  formatEvaluationType,
  formatDateLabel,
  formatVisibilityLabel,
} from '@/Components/Dashboard/RoleDashboardShared';
import { ArrowRight, Check, RotateCcw } from 'lucide-react';
import { getScoreTone } from '@/utils/adminUi';
import { formatPersonName } from '@/utils/helpers';

type Note = {
  id?: string;
  note: number;
  commentaire?: string;
};

type Cible = {
  matricule: string;
  prenom: string;
  nom: string;
  role_nom?: string;
};

type EvaluationAValider = {
  id_evaluation: string;
  note_globale: number | null;
  commentaire_general: string | null;
  notations_json: Note[];
  type_evaluation: string;
  evaluateur: Cible;
  evalue: Cible;
  date_soumission: string | null;
};

interface Props {
  evaluation: EvaluationAValider;
  open: boolean;
  onClose: () => void;
}

const noteLabel = (n: number) => {
  const labels: Record<number, string> = {
    1: 'Insuffisant',
    2: 'En-dessous des attentes',
    3: 'Conforme',
    4: 'Au-dessus',
    5: 'Excellent',
  };
  return labels[n] ?? '';
};

const noteColor = (n: number) => {
  if (n >= 4) return 'text-green-600 bg-green-50';
  if (n === 3) return 'text-yellow-700 bg-yellow-50';
  return 'text-red-600 bg-red-50';
};

const overallScoreColor = (score: number | null) => {
  if (score == null) return 'text-sabc-gray-500 bg-sabc-gray-100';
  return getScoreTone(score) === 'success' ? 'text-green-700 bg-green-100' : 'text-red-700 bg-red-100';
};

export default function ValidationModal({ evaluation, open, onClose }: Props) {
  const queryClient = useQueryClient();
  const [action, setAction] = useState<'valide' | 'rejete' | null>(null);
  const [commentaire, setCommentaire] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const context = buildEvaluationContext(evaluation as any);
  const overallScore = evaluation.note_globale == null ? null : Number(evaluation.note_globale);

  const handleSubmit = () => {
    if (!action) return;
    if (action === 'rejete' && commentaire.trim().length < 20) {
      setError('Le motif de rejet doit contenir au moins 20 caractères.');
      return;
    }
    if (action === 'valide' && commentaire.trim().length === 0) {
      setError('Un commentaire général est obligatoire pour valider une évaluation.');
      return;
    }
    setSubmitting(true);
    setError(null);

    evaluationsApi
      .validate(evaluation.id_evaluation, action === 'valide', commentaire)
      .then((response) => {
        if (response.data?.success === false) {
          throw new Error(response.data.message || "La validation de l'évaluation a été refusée.");
        }
        setSubmitting(false);
        onClose();
        queryClient.invalidateQueries({ queryKey: ['evaluations'] });
      })
      .catch((err: any) => {
        setSubmitting(false);
        setError(err.response?.data?.message || err.message || 'Une erreur est survenue');
      });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Validation de l'évaluation</DialogTitle>
          <DialogDescription>
            <span className="inline-flex flex-wrap items-center gap-1.5">
              <span>{formatPersonName(evaluation.evaluateur)}</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{formatPersonName(evaluation.evalue)}</span>
            </span>
            {evaluation.evalue.role_nom && (
              <span className="ml-2 text-xs bg-gray-100 px-2 py-0.5 rounded">{evaluation.evalue.role_nom}</span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-700">Cadre de validation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-gray-700">
              <div className="flex flex-wrap gap-2">
                <Badge variant="primary">{context.summary.name || formatEvaluationType(evaluation.type_evaluation)}</Badge>
                <Badge variant="info">{context.periodLabel}</Badge>
                <Badge variant="info">{context.criteriaCount} critères</Badge>
                <Badge variant="warning">{formatVisibilityLabel(context.visibilityDetail)}</Badge>
              </div>
              {context.periodRange ? (
                <div className="text-xs text-gray-500">
                  {`${formatDateLabel(context.periodRange.start)} — ${formatDateLabel(context.periodRange.end)}`}
                </div>
              ) : null}
            </CardContent>
          </Card>

          {/* Note globale */}
          {overallScore != null && Number.isFinite(overallScore) && (
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Note globale</span>
              <span className={`text-2xl font-bold px-3 py-1 rounded-lg ${overallScoreColor(overallScore)}`}>
                {overallScore.toFixed(2)}<span className="text-sm font-normal">/20</span>
              </span>
            </div>
          )}

          {/* Critères notés */}
          {context.criteria.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-600">Détail des critères ({context.criteria.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {context.criteria.map((criterion, i) => (
                  <div key={String(criterion.id ?? i)} className="flex items-start gap-3 p-2 border rounded-md">
                    <span className={`text-sm font-bold px-2 py-1 rounded flex-shrink-0 ${noteColor(criterion.note ?? 0)}`}>
                      {criterion.note ?? '—'}/5
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="text-xs font-medium text-gray-700">{criterion.libelle}</div>
                        <Badge variant="secondary" className="text-[10px]">{criterion.section}</Badge>
                        {criterion.poids != null ? <Badge variant="secondary" className="text-[10px]">Poids {criterion.poids}</Badge> : null}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">{noteLabel(criterion.note ?? 0)}</div>
                      {isCriterionCommentRequired(criterion) ? (
                        <Alert className="mt-2">
                          <AlertTitle>Seuil critique</AlertTitle>
                          <AlertDescription>
                            Note sous le seuil de justification ({criterion.commentaireRequisSiNoteLt ?? 3}).
                          </AlertDescription>
                        </Alert>
                      ) : null}
                      {criterion.commentaire && (
                        <div className="text-xs text-gray-700 mt-1 italic">"{criterion.commentaire}"</div>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Commentaire général */}
          {evaluation.commentaire_general && (
            <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-900">
              <div className="font-medium mb-1">Commentaire de l'évaluateur</div>
              <div className="italic">"{evaluation.commentaire_general}"</div>
            </div>
          )}

          {/* Décision */}
          <div className="pt-2">
            <div className="text-sm font-medium text-gray-700 mb-3">Votre décision</div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setAction('valide')}
                aria-pressed={action === 'valide'}
                className={`flex-1 py-3 rounded-lg border-2 text-sm font-medium transition-all ${
                  action === 'valide'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-200 hover:border-green-300 text-gray-600'
                }`}
              >
                <span className="inline-flex items-center justify-center gap-2">
                  <Check className="h-4 w-4" aria-hidden="true" />
                  Valider
                </span>
              </button>
              <button
                type="button"
                onClick={() => setAction('rejete')}
                aria-pressed={action === 'rejete'}
                className={`flex-1 py-3 rounded-lg border-2 text-sm font-medium transition-all ${
                  action === 'rejete'
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-gray-200 hover:border-red-300 text-gray-600'
                }`}
              >
                <span className="inline-flex items-center justify-center gap-2">
                  <RotateCcw className="h-4 w-4" aria-hidden="true" />
                  Renvoyer en brouillon
                </span>
              </button>
            </div>
          </div>

          {/* Commentaire de validation */}
          <div>
            <label htmlFor="validation-comment" className="text-sm font-medium text-gray-700">
              Commentaire
              <span className="text-red-500 ml-1">*</span>
            </label>
            <textarea
              id="validation-comment"
              aria-invalid={Boolean(error && action === 'rejete' && commentaire.trim().length < 20)}
              aria-describedby={error ? 'validation-comment-error' : undefined}
              className={`mt-1 w-full border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-sabc-red-primary ${
                error && action === 'rejete' && commentaire.trim().length < 20 ? 'border-red-400' : 'border-gray-200'
              }`}
              rows={3}
              placeholder={
                action === 'rejete'
                  ? 'Expliquez la raison du renvoi (20 caractères minimum)...'
                  : 'Expliquez votre décision de validation...'
              }
              value={commentaire}
              onChange={(e) => setCommentaire(e.target.value)}
            />
          </div>

          {error && (
            <div id="validation-comment-error" role="alert" className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded">{error}</div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2 border-t">
            <Button variant="outline" onClick={onClose} disabled={submitting}>
              Fermer
            </Button>
            <Button
              disabled={!action || submitting}
              onClick={handleSubmit}
              className={`${
                action === 'valide'
                  ? 'bg-green-600 hover:bg-green-700'
                  : action === 'rejete'
                  ? 'bg-sabc-red-primary hover:bg-sabc-red-dark'
                  : 'bg-gray-400'
              } text-white`}
            >
              {submitting
                ? 'En cours...'
                : action === 'valide'
                ? 'Confirmer la validation'
                : action === 'rejete'
                ? 'Renvoyer en brouillon'
                : 'Choisir une action'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
