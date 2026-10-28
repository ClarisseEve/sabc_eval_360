import React, { useEffect, useState } from 'react';
import { Head } from '@/lib/inertia-shim';
import { Card, CardContent } from '@/Components/UI/Card/Card';
import { Badge } from '@/Components/UI/Badge/Badge';
import { Button } from '@/Components/UI/Button/Button';
import ValidationModal from '@/Components/Evaluation/ValidationModal';
import { useEvaluationWorkflowData } from '@/Hooks/queries';
import { buildEvaluationContext, EvaluationPageLayout } from './shared';
import { formatEvaluationType } from '@/Components/Dashboard/RoleDashboardShared';
import { PageHeader } from '@/Components/UI/Page/PageHeader';
import { KpiCard, KpiGrid } from '@/Components/UI/KpiCard';
import { formatPersonName, formatScore } from '@/utils/helpers';
import { useSearchParams } from 'react-router-dom';

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

export default function ToValidate() {
  const { data } = useEvaluationWorkflowData();
  const [selected, setSelected] = useState<EvaluationAValider | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const aValider = data.validations as EvaluationAValider[];
  const requestedEvaluationId = searchParams.get('id');

  useEffect(() => {
    if (!requestedEvaluationId) return;
    const requested = aValider.find((evaluation) =>
      String(evaluation.id_evaluation) === requestedEvaluationId,
    );
    if (requested) setSelected(requested);
  }, [aValider, requestedEvaluationId]);

  const closeValidation = () => {
    setSelected(null);
    if (!requestedEvaluationId) return;
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('id');
    setSearchParams(nextParams, { replace: true });
  };
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
    if (diff <= 0) return 'aujourd’hui';
    return diff === 1 ? 'il y a 1 jour' : `il y a ${diff} jours`;
  };

  const activePeriodLabel = data.activePeriod?.nom_periode || data.activePeriod?.code_periode || null;

  return (
    <EvaluationPageLayout pageTitle="Évaluations à valider">
      <Head title="Évaluations à valider" />

      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <PageHeader
          title="Évaluations à valider"
          description="Évaluations soumises dans votre périmètre, en attente de votre décision."
          meta={activePeriodLabel ? `Période active : ${activePeriodLabel}` : 'Aucune période ouverte'}
        />

        <KpiGrid className="lg:grid-cols-2">
          <KpiCard label="En attente" value={stats.total} />
          <KpiCard label="En retard" value={stats.urgents} caption="Soumises depuis plus de 3 jours" />
        </KpiGrid>

        {/* Liste */}
        {aValider.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center text-sabc-gray-500">
              <div className="font-medium text-sabc-gray-700">Aucune évaluation en attente</div>
              <div className="text-sm mt-1">Toutes les évaluations soumises ont été traitées.</div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {aValider.map((ev) => {
              const isUrgent = ev.date_soumission &&
                Math.floor((Date.now() - new Date(ev.date_soumission).getTime()) / 86400000) > 3;
              const context = buildEvaluationContext(ev as any);

              const showPeriod = context.periodLabel !== activePeriodLabel && context.periodLabel !== 'Période active';
              const note = ev.note_globale == null ? null : Number(ev.note_globale);

              return (
                <Card key={ev.id_evaluation}>
                  <CardContent className="px-5 py-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium text-sabc-gray-900 dark:text-white">
                            {formatPersonName(ev.evalue)}
                          </span>
                          {isUrgent ? <Badge variant="error">En retard</Badge> : null}
                        </div>
                        <div className="mt-0.5 text-sm text-sabc-gray-600 dark:text-sabc-gray-400">
                          {[ev.evalue.role_nom, context.summary.name].filter(Boolean).join(' · ') || 'Rôle non renseigné'}
                        </div>
                        <div className="mt-0.5 text-xs text-sabc-gray-500 dark:text-sabc-gray-400">
                          {[
                            formatEvaluationType(ev.type_evaluation),
                            `Évalué par ${formatPersonName(ev.evaluateur)}`,
                            `${context.criteriaCount} critère${context.criteriaCount > 1 ? 's' : ''}`,
                            showPeriod ? context.periodLabel : null,
                          ].filter(Boolean).join(' · ')}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-3 sm:flex-nowrap sm:justify-end sm:gap-5">
                        <div className="text-right">
                          <div className="text-base font-semibold tabular-nums text-sabc-gray-900 dark:text-white">
                            {formatScore(note)}
                          </div>
                          <div className="text-xs text-sabc-gray-500 dark:text-sabc-gray-400">
                            Soumise {daysAgo(ev.date_soumission) ?? 'n.d.'}
                          </div>
                        </div>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelected(ev)}
                          aria-label={`Examiner l’évaluation de ${formatPersonName(ev.evalue)}`}
                        >
                          Examiner
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
          onClose={closeValidation}
        />
      )}
    </EvaluationPageLayout>
  );
}
