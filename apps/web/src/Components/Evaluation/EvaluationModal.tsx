import React, { useEffect, useState } from 'react';
import { router } from '@/lib/inertia-shim';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/Components/UI/Dialog/Dialog';
import { Button } from '@/Components/UI/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/UI/Card';
import { Alert, AlertDescription, AlertTitle } from '@/Components/UI/Alert';
import Slider from '@/Components/UI/Slider/Slider';

type Critere = {
  id: string;
  libelle: string;
  description?: string;
  poids?: number;
  echelle?: string; // "1-5"
  section_label?: string;
  section_order?: number;
};

interface EvaluationModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  templateId: string | null;
  targetMatricule: string | null;
}

export default function EvaluationModal({ open, onOpenChange, templateId, targetMatricule }: EvaluationModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [template, setTemplate] = useState<{ id_regle: string | null; nom_regle: string; criteres_evaluation_json: Critere[] } | null>(null);
  const [periode, setPeriode] = useState<any>(null);
  const [target, setTarget] = useState<any>(null);
  const [started, setStarted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [notes, setNotes] = useState<{ id: string; note: number; commentaire: string }[]>([]);

  useEffect(() => {
    if (!open || !templateId || !targetMatricule) return;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const params = new URLSearchParams({ template: templateId, target: targetMatricule });
        const resp = await fetch(`/common/evaluations/details?${params.toString()}`);
        const data = await resp.json();
        if (!resp.ok) throw new Error(data?.error || 'Erreur de chargement');
        setTemplate(data.template);
        setPeriode(data.periode);
        setTarget(data.target);
        const cs: Critere[] = (data.template?.criteres_evaluation_json || []) as any;
        setNotes(cs.map(c => ({ id: String((c as any).id || ''), note: 3, commentaire: '' })));
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [open, templateId, targetMatricule]);

  const onChangeNote = (idx: number, value: number) => {
    const next = [...notes];
    next[idx] = { ...next[idx], note: value };
    setNotes(next);
  };
  const onChangeComment = (idx: number, value: string) => {
    const next = [...notes];
    next[idx] = { ...next[idx], commentaire: value };
    setNotes(next);
  };

  // Validation: commentaire obligatoire si note < 3
  const invalidComments = () => {
    return notes.some(n => (n.note < 3) && (!n.commentaire || n.commentaire.trim().length === 0));
  };

  const handleSaveDraft = () => {
    if (!targetMatricule || !template || invalidComments()) return;
    setSubmitting(true);
    router.post('/common/evaluations', {
      id_regle: template.id_regle ?? null,
      target_matricule: targetMatricule,
      notes: notes,
      commentaire_general: '',
    }, {
      onSuccess: () => {
        setSubmitting(false);
        onOpenChange(false);
      },
      onError: (errors) => {
        setSubmitting(false);
        const first = Object.values(errors)[0];
        setError(typeof first === 'string' ? first : 'Erreur lors de la sauvegarde');
      },
    });
  };

  // Group by section for a nicer structure
  const groupedBySection = () => {
    const groups: Record<string, { title: string; items: Critere[] }> = {};
    const list = (template?.criteres_evaluation_json || []) as any as Critere[];
    list.forEach((c) => {
      const key = c.section_label || 'Général';
      if (!groups[key]) groups[key] = { title: key, items: [] };
      groups[key].items.push(c);
    });
    return groups;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-[1200px] h-[90vh]">
        <DialogHeader>
          <DialogTitle>Évaluation</DialogTitle>
          <DialogDescription>
            {periode ? (<span>Période: {periode?.nom || 'Active'}</span>) : 'Contexte indisponible'}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-6 text-center">Chargement…</div>
        ) : error ? (
          <Alert className="mb-4 bg-sabc-red-light border-sabc-red-primary">
            <AlertTitle>Erreur</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4 h-[calc(90vh-6rem)] overflow-hidden">
            {/* Intro */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{target ? `${target?.prenom ?? ''} ${target?.nom ?? ''}`.trim() : 'Cible'}</span>
                  <span className="text-sm font-normal text-sabc-gray-500">{template?.nom_regle}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-sabc-gray-600">Merci de justifier toute note &lt; 3.</div>
                {!started && (
                  <div className="mt-3">
                    <Button onClick={() => setStarted(true)} className="bg-sabc-red-primary text-white">Démarrer</Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Fiche */}
            {started && (
              <div className="space-y-4 h-[calc(100%-180px)] overflow-y-auto pr-2">
                {Object.values(groupedBySection()).map((section, sIdx) => (
                  <Card key={`sec-${sIdx}`}>
                    <CardHeader>
                      <CardTitle className="text-sm text-sabc-gray-500">{section.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {section.items.map((c, idxAll) => {
                        const idx = (template?.criteres_evaluation_json as any as Critere[]).findIndex(ci => String((ci as any).id||'') === String((c as any).id||''));
                        const n = notes[idx];
                        return (
                          <div key={String((c as any).id || idxAll)} className="p-3 border rounded-md">
                            <div className="mb-2">
                              <div className="font-medium">{c.libelle}</div>
                              {c.description && <div className="text-xs text-sabc-gray-500">{c.description}</div>}
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="flex-1">
                                <Slider min={1} max={5} step={1} value={n?.note ?? 3} onChange={(v) => onChangeNote(idx, v)} marks={[{value:1,label:'1'},{value:2,label:'2'},{value:3,label:'3'},{value:4,label:'4'},{value:5,label:'5'}]} tooltip />
                              </div>
                              <div className="w-8 text-center text-sm font-semibold">{n?.note ?? 3}</div>
                            </div>
                            <textarea className={`mt-2 w-full border rounded px-3 py-2 text-sm ${n && n.note < 3 && (!n.commentaire || !n.commentaire.trim()) ? 'border-sabc-red-primary' : ''}`} placeholder="Commentaire (obligatoire si note < 3)" value={n?.commentaire ?? ''} onChange={(e) => onChangeComment(idx, e.target.value)} />
                            {n && n.note < 3 && (!n.commentaire || !n.commentaire.trim()) && (
                              <div className="mt-1 text-xs text-sabc-red-primary">Le commentaire est obligatoire pour une note &lt; 3.</div>
                            )}
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Actions */}
            {started && (
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => onOpenChange(false)}>Fermer</Button>
                <Button
                  disabled={invalidComments() || submitting}
                  onClick={handleSaveDraft}
                  className="bg-sabc-red-primary text-white"
                >
                  {submitting ? 'Enregistrement…' : 'Enregistrer le brouillon'}
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
