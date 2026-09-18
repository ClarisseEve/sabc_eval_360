import React, { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useSuspenseQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  Download,
  FileText,
  MessageSquare,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
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
  if (!value) return 'Non renseigné';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Non renseigné';
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link to="/admin/evaluations/history">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour à l’historique
            </Button>
          </Link>
          <Link to={`/common/evaluations/${id}`}>
            <Button variant="outline" size="sm">Vue utilisateur</Button>
          </Link>
        </div>
        <Button variant="outline" size="sm" onClick={() => window.print()}>
          <Download className="mr-2 h-4 w-4" />
          Export rapide
        </Button>
      </div>

      <Card className="border-none bg-gradient-to-br from-white via-white to-sabc-red-light/40 shadow-lg">
        <CardContent className="grid gap-6 p-6 md:grid-cols-3">
          <div className="space-y-3 md:col-span-2">
            <div className="flex flex-wrap items-center gap-3">
              <EvaluationStatusBadge statut={evaluation?.statut} />
              <span className="text-xs text-sabc-gray-500">ID {evaluation?.id_evaluation ?? evaluation?.id}</span>
              {context.rule.type_evaluation ? <Badge variant="primary">{formatEvaluationType(context.rule.type_evaluation)}</Badge> : null}
            </div>
            <h1 className="text-2xl font-semibold text-sabc-gray-900">
              {context.summary.name || 'Évaluation'}
            </h1>
            <p className="text-sm text-sabc-gray-600">{statusHelper}</p>
          </div>
          <div className="rounded-lg border border-sabc-gray-200 bg-white p-4 text-sm">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-sabc-gray-500">
              <FileText className="h-4 w-4" />
              Cycle
            </div>
            <div className="mt-1 text-base font-semibold text-sabc-gray-900">{context.periodLabel}</div>
            {context.periodRange ? (
              <div className="text-xs text-sabc-gray-500">
                {`${formatDateLabel(context.periodRange.start)} — ${formatDateLabel(context.periodRange.end)}`}
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>

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

      <div className="grid gap-6 md:grid-cols-[340px,1fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldCheck className="h-5 w-5 text-sabc-success" />
                Synthèse admin
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl bg-sabc-red-light/60 p-4 text-center">
                <div className="text-xs uppercase tracking-wide text-sabc-red-primary/80">Note globale</div>
                <div className="mt-2 text-4xl font-bold text-sabc-red-primary">
                  {overallScore != null ? overallScore.toFixed(2) : '—'}<span className="text-base font-normal">/20</span>
                </div>
              </div>

              <div className="grid gap-3">
                <div className="rounded-lg border border-sabc-gray-200 p-3 text-sm">
                  <div className="text-xs uppercase text-sabc-gray-400">Cadre</div>
                  <div className="mt-1 flex flex-wrap gap-2">
                    <Badge variant="info">{context.criteriaCount} critères</Badge>
                    <Badge variant="info">{context.sections.length} sections</Badge>
                    <Badge variant="info">{formatVisibilityLabel(context.visibilityDetail)}</Badge>
                  </div>
                </div>
                <div className="rounded-lg border border-sabc-gray-200 p-3 text-sm">
                  <div className="flex items-center gap-2 text-xs uppercase text-sabc-gray-400">
                    <CalendarClock className="h-4 w-4" />
                    Audit temporel
                  </div>
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
                  <AlertTitle>{`Décision manager: ${formatDisplayName(evaluation.validateur)}`}</AlertTitle>
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
            description="Règle publiée attachée à cette évaluation côté admin."
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-5 w-5 text-sabc-accent" />
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
                      <div className="mt-1 flex flex-wrap gap-2 text-[10px] uppercase">
                        <Badge variant="secondary">{critere.section}</Badge>
                        {critere.poids != null ? <Badge variant="secondary">Poids {critere.poids}</Badge> : null}
                      </div>
                    </div>
                    <Badge variant="secondary">Note {critere.note != null ? critere.note : '—'} / 5</Badge>
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
