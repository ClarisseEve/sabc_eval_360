import React, { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useSuspenseQuery } from '@tanstack/react-query';
import { ArrowLeft, MessageSquare, Printer } from 'lucide-react';
import { PageHeader } from '@/Components/UI/Page/PageHeader';
import { KpiCard } from '@/Components/UI/KpiCard';
import { formatScore } from '@/utils/helpers';
import { Badge } from '@/Components/UI/Badge/Badge';
import { Button } from '@/Components/UI/Button/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/UI/Card/Card';
import { Alert, AlertDescription, AlertTitle } from '@/Components/UI/Alert/Alert';
import { Avatar } from '@/Components/UI/Avatar/Avatar';
import { adminApi } from '@/Services/api';
import { AdminEvaluationsLayout, EvaluationStatusBadge } from './shared';
import {
  buildEvaluationContext,
  formatDisplayName,
  formatRole,
} from '@/pages/Common/Evaluations/shared';
import {
  ActiveRulesCard,
  formatDateLabel,
  formatEvaluationType,
  formatVisibilityLabel,
} from '@/Components/Dashboard/RoleDashboardShared';

function formatDate(value?: string | null, withTime = false) {
  if (!value) return 'n.d.';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'n.d.';
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  }).format(date);
}

const STATUS_HELPER: Record<string, string> = {
  brouillon: 'Évaluation encore modifiable par son auteur.',
  soumis: 'Soumise et en attente d’une décision manager.',
  valide: 'Évaluation validée dans le cycle courant.',
  rejete: 'Évaluation renvoyée en brouillon pour correction.',
};

export default function AdminEvaluationShowPage() {
  const { id = '' } = useParams();
  const { data: evaluation } = useSuspenseQuery({
    queryKey: ['admin', 'evaluations', id],
    queryFn: () => adminApi.evaluations.get(id).then((response) => response.data),
  });

  const context = useMemo(() => buildEvaluationContext(evaluation), [evaluation]);
  const statusHelper = STATUS_HELPER[evaluation?.statut] ?? STATUS_HELPER.brouillon;
  const overallScore = evaluation?.note_globale != null ? Number(evaluation.note_globale) : null;
  const decisionDateLabel = evaluation?.statut === 'valide' ? 'Validée le' : 'Dernière décision';

  return (
    <AdminEvaluationsLayout title="Détail d’une évaluation">
      <PageHeader
        title={context.summary.name || 'Évaluation'}
        description={statusHelper}
        breadcrumbs={[
          { label: 'Administration' },
          { label: 'Historique des évaluations', to: '/admin/evaluations/history' },
          { label: 'Détail' },
        ]}
        meta={context.periodRange
          ? `${context.periodLabel} · ${formatDateLabel(context.periodRange.start)} – ${formatDateLabel(context.periodRange.end)}`
          : context.periodLabel}
        actions={(
          <>
            <Link to="/admin/evaluations/history">
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour à l’historique
              </Button>
            </Link>
            <Link to={`/common/evaluations/${id}`}>
              <Button variant="outline" size="sm">Vue de l’évalué</Button>
            </Link>
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="mr-2 h-4 w-4" />
              Imprimer
            </Button>
          </>
        )}
      />

      <div className="flex flex-wrap items-center gap-2">
        <EvaluationStatusBadge statut={evaluation?.statut} />
        {context.rule.type_evaluation ? <Badge variant="outline">{formatEvaluationType(context.rule.type_evaluation)}</Badge> : null}
        <span className="text-xs text-sabc-gray-500">Référence {evaluation?.id_evaluation ?? evaluation?.id ?? 'n.d.'}</span>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Évaluateur</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-4">
            <Avatar size="lg" name={formatDisplayName(evaluation?.evaluateur ?? {})} src={evaluation?.evaluateur?.avatar ?? undefined} />
            <div>
              <div className="font-semibold text-sabc-gray-900">{formatDisplayName(evaluation?.evaluateur ?? {})}</div>
              <div className="text-xs text-sabc-gray-500">{formatRole(evaluation?.evaluateur ?? {})}</div>
              {evaluation?.evaluateur?.region_nom ? <div className="text-xs text-sabc-gray-400">{evaluation.evaluateur.region_nom}</div> : null}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Évalué</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-4">
            <Avatar size="lg" name={formatDisplayName(evaluation?.evalue ?? {})} src={evaluation?.evalue?.avatar ?? undefined} variant="warning" />
            <div>
              <div className="font-semibold text-sabc-gray-900">{formatDisplayName(evaluation?.evalue ?? {})}</div>
              <div className="text-xs text-sabc-gray-500">{formatRole(evaluation?.evalue ?? {})}</div>
              {evaluation?.evalue?.region_nom ? <div className="text-xs text-sabc-gray-400">{evaluation.evalue.region_nom}</div> : null}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-[340px_1fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Synthèse</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <KpiCard label="Note globale" value={overallScore != null ? formatScore(overallScore) : null} />

              <div className="grid gap-3">
                <div className="rounded-lg border border-sabc-gray-200 p-3 text-sm">
                  <div className="text-xs font-medium text-sabc-gray-500">Cadre</div>
                  <div className="mt-1 flex flex-wrap gap-2">
                    <Badge variant="info">{context.criteriaCount} critères</Badge>
                    <Badge variant="info">{context.sections.length} sections</Badge>
                    <Badge variant="info">{formatVisibilityLabel(context.visibilityDetail)}</Badge>
                  </div>
                </div>
                <div className="rounded-lg border border-sabc-gray-200 p-3 text-sm">
                  <div className="text-xs font-medium text-sabc-gray-500">Chronologie</div>
                  <div className="mt-2 space-y-1 text-sabc-gray-700">
                    <div>Créée le {formatDate(evaluation?.created_at, true)}</div>
                    <div>Soumise le {formatDate(evaluation?.date_soumission, true)}</div>
                    <div>{decisionDateLabel} {formatDate(evaluation?.date_validation, true)}</div>
                    <div>Mise à jour le {formatDate(evaluation?.updated_at, true)}</div>
                  </div>
                </div>
              </div>

              {evaluation?.commentaire_general ? (
                <Alert>
                  <AlertTitle>Commentaire général</AlertTitle>
                  <AlertDescription>{evaluation.commentaire_general}</AlertDescription>
                </Alert>
              ) : null}

              {evaluation?.validateur ? (
                <Alert>
                  <AlertTitle>{`Décision du manager : ${formatDisplayName(evaluation.validateur)}`}</AlertTitle>
                  <AlertDescription>
                    {evaluation?.commentaire_validation || 'Aucun commentaire de validation renseigné.'}
                  </AlertDescription>
                </Alert>
              ) : null}
            </CardContent>
          </Card>

          <ActiveRulesCard
            rules={evaluation?.regle ? [context.rule] : []}
            maxItems={1}
            description="Règle d’évaluation appliquée à cette évaluation."
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              Critères évalués
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {context.criteria.length === 0 ? (
              <Alert>
                <AlertTitle>Pas de critères renseignés</AlertTitle>
                <AlertDescription>Aucune notation détaillée n’est attachée à cette évaluation.</AlertDescription>
              </Alert>
            ) : (
              context.criteria.map((critere, index) => (
                <div key={String(critere.id ?? index)} className="rounded-lg border border-sabc-gray-200 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="font-semibold text-sabc-gray-900">{critere.libelle}</div>
                      <div className="mt-1 flex flex-wrap gap-2">
                        <Badge variant="secondary">{critere.section}</Badge>
                        {critere.poids != null ? <Badge variant="secondary">Poids {critere.poids}</Badge> : null}
                      </div>
                    </div>
                    <Badge variant="secondary">Note {formatScore(critere.note, 0)}</Badge>
                  </div>
                  {critere.description ? <p className="mt-2 text-xs text-sabc-gray-500">{critere.description}</p> : null}
                  {critere.commentaire ? (
                    <div className="mt-3 rounded-md bg-sabc-gray-50 p-3 text-xs text-sabc-gray-700">
                      <div className="mb-1 flex items-center gap-2 font-semibold text-sabc-gray-500">
                        <MessageSquare className="h-3.5 w-3.5" />
                        Commentaire
                      </div>
                      {critere.commentaire}
                    </div>
                  ) : (
                    <div className="mt-3 text-xs italic text-sabc-gray-400">Aucun commentaire renseigné.</div>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </AdminEvaluationsLayout>
  );
}
