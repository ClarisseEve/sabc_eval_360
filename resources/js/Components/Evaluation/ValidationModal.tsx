import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/Components/UI/Dialog/Dialog';
import { Button } from '@/Components/UI/Button/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/UI/Card/Card';

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

export default function ValidationModal({ evaluation, open, onClose }: Props) {
  const [action, setAction] = useState<'valide' | 'rejete' | null>(null);
  const [commentaire, setCommentaire] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const notes: Note[] = evaluation.notations_json ?? [];

  const handleSubmit = () => {
    if (!action) return;
    if (action === 'rejete' && !commentaire.trim()) {
      setError('Un commentaire est obligatoire pour le rejet.');
      return;
    }
    setSubmitting(true);
    setError(null);

    router.post(
      `/common/evaluations/${evaluation.id_evaluation}/valider`,
      { action, commentaire_validation: commentaire },
      {
        onSuccess: () => { setSubmitting(false); onClose(); },
        onError: (errors) => {
          setSubmitting(false);
          const first = Object.values(errors)[0];
          setError(typeof first === 'string' ? first : 'Une erreur est survenue');
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Validation de l'évaluation</DialogTitle>
          <DialogDescription>
            {evaluation.evaluateur.prenom} {evaluation.evaluateur.nom} &rarr; {evaluation.evalue.prenom} {evaluation.evalue.nom}
            {evaluation.evalue.role_nom && (
              <span className="ml-2 text-xs bg-gray-100 px-2 py-0.5 rounded">{evaluation.evalue.role_nom}</span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Note globale */}
          {evaluation.note_globale !== null && (
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Note globale</span>
              <span className={`text-2xl font-bold px-3 py-1 rounded-lg ${noteColor(Math.round(evaluation.note_globale))}`}>
                {evaluation.note_globale.toFixed(2)}<span className="text-sm font-normal">/5</span>
              </span>
            </div>
          )}

          {/* Critères notés */}
          {notes.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-600">Détail des critères ({notes.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {notes.map((n, i) => (
                  <div key={n.id ?? i} className="flex items-start gap-3 p-2 border rounded-md">
                    <span className={`text-sm font-bold px-2 py-1 rounded flex-shrink-0 ${noteColor(n.note)}`}>
                      {n.note}/5
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-gray-500">{noteLabel(n.note)}</div>
                      {n.commentaire && (
                        <div className="text-xs text-gray-700 mt-1 italic">"{n.commentaire}"</div>
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
                onClick={() => setAction('valide')}
                className={`flex-1 py-3 rounded-lg border-2 text-sm font-medium transition-all ${
                  action === 'valide'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-200 hover:border-green-300 text-gray-600'
                }`}
              >
                &#10003; Valider
              </button>
              <button
                onClick={() => setAction('rejete')}
                className={`flex-1 py-3 rounded-lg border-2 text-sm font-medium transition-all ${
                  action === 'rejete'
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-gray-200 hover:border-red-300 text-gray-600'
                }`}
              >
                &#10007; Renvoyer en brouillon
              </button>
            </div>
          </div>

          {/* Commentaire de validation */}
          <div>
            <label className="text-sm font-medium text-gray-700">
              Commentaire
              {action === 'rejete' && <span className="text-red-500 ml-1">*</span>}
            </label>
            <textarea
              className={`mt-1 w-full border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-sabc-red-primary ${
                error && action === 'rejete' && !commentaire.trim() ? 'border-red-400' : 'border-gray-200'
              }`}
              rows={3}
              placeholder={
                action === 'rejete'
                  ? 'Expliquez la raison du renvoi (obligatoire)...'
                  : 'Commentaire facultatif...'
              }
              value={commentaire}
              onChange={(e) => setCommentaire(e.target.value)}
            />
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded">{error}</div>
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
