import React, { useState } from 'react';
import { Head } from '@/lib/inertia-shim';
import { Card, CardContent } from '@/Components/UI/Card/Card';
import { Badge } from '@/Components/UI/Badge/Badge';
import { Button } from '@/Components/UI/Button/Button';
import ValidationModal from '@/Components/Evaluation/ValidationModal';
import { useEvaluations } from '@/Hooks/queries';
import { EvaluationPageLayout } from './shared';

type Cible = {
  matricule: string;
  prenom: string;
  nom: string;
  role_nom?: string;
  region_nom?: string;
  avatar?: string;
};

type EvaluationAValider = {
  id_evaluation: string;
  statut: string;
  date_soumission: string | null;
  date_evaluation: string | null;
  note_globale: number | null;
  commentaire_general: string | null;
  notations_json: Array<{ id?: string; note: number; commentaire?: string }>;
  type_evaluation: string;
  evaluateur: Cible;
  evalue: Cible;
};

const typeLabel: Record<string, string> = {
  auto: 'Auto-évaluation',
  descendante: 'Évaluation descendante',
  ascendante: 'Évaluation ascendante',
  pairs: 'Évaluation par pairs',
  '360': '360°',
};

export default function ToValidate() {
  const { data } = useEvaluations();
  const [selected, setSelected] = useState<EvaluationAValider | null>(null);
  const aValider = (Array.isArray(data?.a_valider) ? data.a_valider : []) as EvaluationAValider[];
  const stats = {
    total: aValider.length,
    urgents: aValider.filter((ev) =>
      ev.date_soumission
        ? Math.floor((Date.now() - new Date(ev.date_soumission).getTime()) / 86400000) > 3
        : false,
    ).length,
  };

  const daysAgo = (date: string | null) => {
    if (!date) return null;
    const diff = Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
    return diff === 0 ? "aujourd'hui" : `il y a ${diff}j`;
  };

  const noteColor = (note: number | null) => {
    if (note === null) return 'text-gray-400';
    if (note >= 4) return 'text-green-600';
    if (note >= 3) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <EvaluationPageLayout pageTitle="Évaluations à valider">
      <Head title="Évaluations à valider" />

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Évaluations à valider</h1>
          <p className="text-sm text-gray-500 mt-1">
            Évaluations soumises par vos subordonnés directs en attente de votre décision
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-sm text-gray-500">En attente</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className={`text-3xl font-bold ${stats.urgents > 0 ? 'text-sabc-red-primary' : 'text-gray-900'}`}>
                {stats.urgents}
              </div>
              <div className="text-sm text-gray-500">En retard (&gt; 3 jours)</div>
            </CardContent>
          </Card>
        </div>

        {/* Liste */}
        {aValider.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center text-gray-400">
              <div className="text-4xl mb-3">&#10003;</div>
              <div className="font-medium">Aucune évaluation en attente</div>
              <div className="text-sm mt-1">Toutes les évaluations soumises ont été traitées.</div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {aValider.map((ev) => {
              const isUrgent = ev.date_soumission &&
                Math.floor((Date.now() - new Date(ev.date_soumission).getTime()) / 86400000) > 3;

              return (
                <Card
                  key={ev.id_evaluation}
                  className={`cursor-pointer hover:shadow-md transition-shadow ${isUrgent ? 'border-l-4 border-l-sabc-red-primary' : ''}`}
                  onClick={() => setSelected(ev)}
                >
                  <CardContent className="py-4 px-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {/* Avatar */}
                        <div className="w-10 h-10 rounded-full bg-sabc-red-light flex items-center justify-center text-sabc-red-primary font-semibold text-sm flex-shrink-0">
                          {ev.evalue.prenom?.[0]}{ev.evalue.nom?.[0]}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {ev.evalue.prenom} {ev.evalue.nom}
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            {ev.evalue.role_nom} · Évalué par {ev.evaluateur.prenom} {ev.evaluateur.nom}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        {/* Type */}
                        <Badge variant="outline" className="text-xs hidden sm:block">
                          {typeLabel[ev.type_evaluation] ?? ev.type_evaluation}
                        </Badge>

                        {/* Note */}
                        {ev.note_globale !== null && (
                          <div className={`text-lg font-bold ${noteColor(ev.note_globale)}`}>
                            {ev.note_globale.toFixed(1)}<span className="text-xs font-normal text-gray-400">/5</span>
                          </div>
                        )}

                        {/* Date */}
                        <div className="text-xs text-gray-400 text-right hidden sm:block">
                          <div>Soumise</div>
                          <div className={isUrgent ? 'text-sabc-red-primary font-medium' : ''}>
                            {daysAgo(ev.date_soumission)}
                          </div>
                        </div>

                        {/* CTA */}
                        <Button
                          size="sm"
                          className="bg-sabc-red-primary text-white hover:bg-sabc-red-dark ml-2"
                          onClick={(e: React.MouseEvent) => { e.stopPropagation(); setSelected(ev); }}
                        >
                          Valider
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de validation */}
      {selected && (
        <ValidationModal
          evaluation={selected}
          open={!!selected}
          onClose={() => setSelected(null)}
        />
      )}
    </EvaluationPageLayout>
  );
}
