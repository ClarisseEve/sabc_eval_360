import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/UI/Card/Card';
import { Badge } from '@/Components/UI/Badge/Badge';
import { Button } from '@/Components/UI/Button/Button';
import { useRoleDashboardData } from '@/Hooks/queries/useRoleDashboards';
import { useAuthContext } from '@/Contexts/AuthContext';
import { analyticsApi } from '@/Services/api';
import { formatPersonName } from '@/utils/helpers';
import { ScoresByTypeCard } from '@/Components/Dashboard/IndividualAnalyticsCards';
import { BenchmarksCard } from '@/Components/Dashboard/BenchmarksCard';
import { EvolutionCard } from '@/Components/Dashboard/EvolutionCard';
import {
  ActiveRulesCard,
  DashboardPageFrame,
  EmptyState,
  MetricCard,
  QuickActionsCard,
  formatDateLabel,
  formatEvaluationType,
  getPriorityBadgeVariant,
  getStatusBadgeVariant,
  navigateTo,
} from './RoleDashboardShared';

type RoleIndividualDashboardPageProps = {
  fallbackRole: string;
  title: string;
  subtitle: string;
};

function getDisplayName(person: any, fallback = 'Utilisateur') {
  return formatPersonName(person, fallback);
}

export default function RoleIndividualDashboardPage({
  fallbackRole,
  title,
  subtitle,
}: RoleIndividualDashboardPageProps) {
  const { data } = useRoleDashboardData('individual', fallbackRole);
  const { user } = useAuthContext();
  const matricule = user?.matricule ?? '';

  // Les benchmarks n'ont de sens que si l'agent est lui-même évalué: sans
  // note reçue, il n'y a rien à situer face à ses pairs.
  const benchmarksQuery = useQuery({
    queryKey: ['analytics', 'benchmarks', matricule],
    queryFn: () => analyticsApi.benchmarks(matricule).then((res) => res.data),
    enabled: Boolean(matricule) && data.canSeeSelfScore,
    staleTime: 5 * 60 * 1000,
  });

  const evolutionQuery = useQuery({
    queryKey: ['analytics', 'evolution', matricule],
    queryFn: () => analyticsApi.evolution(matricule).then((res) => res.data),
    enabled: Boolean(matricule) && data.canSeeSelfScore,
    staleTime: 5 * 60 * 1000,
  });

  const activeRules = data.rules.asEvaluatee.length > 0 ? data.rules.asEvaluatee : data.rules.relevant;
  const completionRate = data.dashboard?.evaluations_total > 0
    ? Math.round(((data.dashboard.evaluations_total - data.dashboard.evaluations_en_attente) / data.dashboard.evaluations_total) * 100)
    : 0;

  return (
    <DashboardPageFrame
      layoutUser={data.layoutUser}
      title={title}
      subtitle={subtitle}
      periodName={data.dashboard?.periode_active?.nom ?? null}
      degradedSources={data.degradedSources}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Évaluations à faire"
          value={data.pendingEvaluations.length}
          caption="Brouillons ou soumissions en attente de votre part"
          accentClassName="border-l-sabc-red-primary"
        />
        <MetricCard
          label="Évaluations reçues"
          value={data.receivedEvaluations.length}
          caption="Historique reçu sur la période active"
          accentClassName="border-l-sabc-info"
        />
        <MetricCard
          label="Score global"
          value={data.canSeeSelfScore && data.selfScores.scoreGlobal != null ? `${data.selfScores.scoreGlobal}/5` : 'Non applicable'}
          caption={
            data.canSeeSelfScore && data.selfScores.scorePondere != null
              ? `Score pondéré: ${data.selfScores.scorePondere}/5`
              : 'Score masqué pour ce rôle'
          }
          accentClassName="border-l-sabc-success"
        />
        <MetricCard
          label="Progression récente"
          value={`${data.selfScores.progression > 0 ? '+' : ''}${data.selfScores.progression}`}
          caption={`Taux de complétion personnel: ${completionRate}%`}
          accentClassName="border-l-sabc-accent"
        />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Mes évaluations reçues</CardTitle>
            <CardDescription>Dernières évaluations reçues sur le cycle courant</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.receivedEvaluations.length === 0 ? (
              <EmptyState message="Aucune évaluation reçue n’est disponible pour l’instant." />
            ) : (
              data.receivedEvaluations.slice(0, 6).map((evaluation: any) => (
                <div
                  key={String(evaluation.id_evaluation)}
                  className="flex flex-col gap-3 rounded-lg border border-sabc-gray-200 p-4 dark:border-sabc-gray-800 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <div className="font-medium text-sabc-gray-900 dark:text-white">
                      {formatEvaluationType(evaluation.type_evaluation)}
                    </div>
                    <div className="text-sm text-sabc-gray-500 dark:text-sabc-gray-400">
                      Par {getDisplayName(evaluation.evaluateur, evaluation.evaluateur_matricule)}
                    </div>
                    <div className="text-xs text-sabc-gray-400 dark:text-sabc-gray-500">
                      {evaluation.regle?.nom_regle || 'Règle non renseignée'} · {formatDateLabel(evaluation.date_soumission || evaluation.date_creation)}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={getStatusBadgeVariant(evaluation.statut)}>{evaluation.statut}</Badge>
                    {evaluation.note_globale != null ? (
                      <Badge variant="info">{evaluation.note_globale}/20</Badge>
                    ) : null}
                    <Button variant="outline" size="sm" onClick={() => navigateTo(`/common/evaluations/${evaluation.id_evaluation}`)}>
                      Consulter
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Évaluations à compléter</CardTitle>
            <CardDescription>Actions attendues de votre côté</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.pendingEvaluations.length === 0 ? (
              <EmptyState message="Aucune évaluation à finaliser." />
            ) : (
              data.pendingEvaluations.slice(0, 5).map((evaluation: any) => (
                <div key={String(evaluation.id_evaluation)} className="rounded-lg border border-sabc-gray-200 p-4 dark:border-sabc-gray-800">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="font-medium text-sabc-gray-900 dark:text-white">
                      {getDisplayName(evaluation.evalue, evaluation.evalue_matricule)}
                    </div>
                    <Badge variant={getStatusBadgeVariant(evaluation.statut)}>{evaluation.statut}</Badge>
                  </div>
                  <div className="mt-1 text-sm text-sabc-gray-500 dark:text-sabc-gray-400">
                    {formatEvaluationType(evaluation.type_evaluation)}
                  </div>
                  <div className="mt-1 text-xs text-sabc-gray-400 dark:text-sabc-gray-500">
                    Créée le {formatDateLabel(evaluation.date_creation)}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {data.canSeeSelfScore && (
        <EvolutionCard
          data={evolutionQuery.data}
          isLoading={evolutionQuery.isLoading}
        />
      )}

      {data.canSeeSelfScore && (
        <BenchmarksCard
          criteres={benchmarksQuery.data?.criteres ?? []}
          isLoading={benchmarksQuery.isLoading}
          sujetLabel="Vous"
          description="Votre position par critère face à la moyenne de votre région et aux meilleurs profils."
        />
      )}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <ScoresByTypeCard
          title="Scores par type"
          description="Répartition validée des notes reçues"
          entries={data.selfScores.parType}
          emptyMessage="Aucun score validé n’est disponible pour cette période."
          variant="chart"
        />

        <Card>
          <CardHeader>
            <CardTitle>Axes d’amélioration prioritaires</CardTitle>
            <CardDescription>Points faibles remontés par les évaluations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.selfAxes.length === 0 ? (
              <EmptyState message="Aucun axe d’amélioration n’est disponible pour le moment." />
            ) : (
              data.selfAxes.slice(0, 5).map((axis) => (
                <div key={axis.critere} className="rounded-lg border border-sabc-gray-200 p-4 dark:border-sabc-gray-800">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="font-medium text-sabc-gray-900 dark:text-white">{axis.critere}</div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getPriorityBadgeVariant(axis.priorite)}>{axis.priorite}</Badge>
                      <Badge variant="info">{axis.scoreActuel}/5</Badge>
                    </div>
                  </div>
                  {axis.suggestion ? (
                    <p className="mt-2 text-sm text-sabc-gray-500 dark:text-sabc-gray-400">{axis.suggestion}</p>
                  ) : null}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recommandations</CardTitle>
            <CardDescription>Actions proposées à partir de vos axes faibles</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.selfRecommendations.length === 0 ? (
              <EmptyState message="Aucune recommandation n’est disponible pour le moment." />
            ) : (
              data.selfRecommendations.slice(0, 5).map((recommendation) => (
                <div key={`${recommendation.type}-${recommendation.titre}`} className="rounded-lg border border-sabc-gray-200 p-4 dark:border-sabc-gray-800">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="font-medium text-sabc-gray-900 dark:text-white">{recommendation.titre}</div>
                    <Badge variant={getPriorityBadgeVariant(recommendation.priorite)}>{recommendation.priorite}</Badge>
                    <Badge variant="secondary">{recommendation.type}</Badge>
                  </div>
                  {recommendation.description ? (
                    <p className="mt-2 text-sm text-sabc-gray-500 dark:text-sabc-gray-400">{recommendation.description}</p>
                  ) : null}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <ActiveRulesCard
          rules={activeRules}
          description="Compétences, sections et règles actives qui s’appliquent à vos évaluations"
        />
      </div>

      <QuickActionsCard
        actions={[
          { label: 'Mes axes', href: '/axes-amelioration' },
          { label: 'Évaluations en attente', href: '/common/evaluations/pending' },
          { label: 'Mes évaluations', href: '/common/evaluations/mine' },
          { label: 'Mon profil', href: '/common/settings' },
        ]}
      />
    </DashboardPageFrame>
  );
}
