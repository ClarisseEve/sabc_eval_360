import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/Components/UI/Dialog/Dialog';
import { Button } from '@/Components/UI/Button';
import { Alert, AlertDescription, AlertTitle } from '@/Components/UI/Alert';
import { reglesApi, evaluationsApi } from '@/Services/api';
import { useAuthContext } from '@/Contexts/AuthContext';
import { usePeriodesActives } from '@/Hooks/queries';

interface EvaluationModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  templateId: string | null;
  targetMatricule: string | null;
}

export default function EvaluationModal({
  open,
  onOpenChange,
  templateId,
  targetMatricule,
}: EvaluationModalProps) {
  const { user } = useAuthContext();
  const { data: periodes } = usePeriodesActives();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const shouldLoadTemplate = open && !!templateId;
  const { data: template } = useQuery({
    queryKey: ['regles', templateId],
    queryFn: () => reglesApi.get(String(templateId)).then((r) => r.data),
    enabled: shouldLoadTemplate,
  });

  useEffect(() => {
    if (!open) {
      setSubmitting(false);
      setError(null);
    }
  }, [open]);

  const activePeriode = Array.isArray(periodes) ? periodes[0] : null;

  const handleCreate = async () => {
    if (!user?.matricule || !targetMatricule || !activePeriode?.id_periode) return;
    try {
      setSubmitting(true);
      setError(null);
      const created = await evaluationsApi.create({
        evaluateur_matricule: user.matricule,
        evalue_matricule: targetMatricule,
        id_periode: activePeriode.id_periode,
        id_regle: template?.id_regle,
      });
      const evaluationId = created.data?.id_evaluation || created.data?.id;
      onOpenChange(false);
      if (evaluationId) {
        window.location.href = `/evaluations/${evaluationId}/edit`;
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Impossible de créer le brouillon');
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Démarrer une évaluation</DialogTitle>
          <DialogDescription>
            Création d’un brouillon d’évaluation à partir du template sélectionné.
          </DialogDescription>
        </DialogHeader>

        {!templateId || !targetMatricule ? (
          <Alert>
            <AlertTitle>Sélection incomplète</AlertTitle>
            <AlertDescription>
              Choisissez un template et une cible avant de démarrer.
            </AlertDescription>
          </Alert>
        ) : !activePeriode ? (
          <Alert>
            <AlertTitle>Aucune période active</AlertTitle>
            <AlertDescription>
              Impossible de créer une évaluation tant qu’aucune période n’est ouverte.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border border-sabc-gray-200 p-4 text-sm text-sabc-gray-700">
              <div className="font-medium text-sabc-gray-900">{template?.nom_regle || 'Template sélectionné'}</div>
              <div className="mt-1 text-sabc-gray-500">{template?.description || 'Aucune description.'}</div>
              <div className="mt-3 text-xs text-sabc-gray-500">
                Période active: {activePeriode?.nom_periode || activePeriode?.nom || activePeriode?.code_periode || activePeriode?.id_periode}
              </div>
            </div>

            {error && (
              <Alert className="border-red-300 bg-red-50 text-red-700">
                <AlertTitle>Erreur</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
                Annuler
              </Button>
              <Button
                className="bg-sabc-red-primary text-white hover:bg-sabc-red-dark"
                onClick={handleCreate}
                disabled={submitting}
              >
                {submitting ? 'Création…' : 'Créer le brouillon'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
