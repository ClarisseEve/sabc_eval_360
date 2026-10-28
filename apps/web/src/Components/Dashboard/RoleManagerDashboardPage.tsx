import React from 'react';
import { formatPersonName } from '@/utils/helpers';
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/UI/Card/Card';
import { Badge } from '@/Components/UI/Badge/Badge';
import { Button } from '@/Components/UI/Button/Button';
import { useQuery } from '@tanstack/react-query';
import { useRoleDashboardData } from '@/Hooks/queries/useRoleDashboards';
import { analyticsApi } from '@/Services/api';
import { TeamAxisFrequencyChartCard, TeamMemberAnalyticsTableCard } from '@/Components/Dashboard/TeamAnalyticsCards';
import { TeamHeatmapCard } from '@/Components/Dashboard/TeamHeatmapCard';
import {
  ActiveRulesCard,
  DashboardPageFrame,
  EmptyState,
  MetricCard,
  QuickActionsCard,
  formatDateLabel,
  formatEvaluationType,
  getStatusBadgeVariant,
  navigateTo,
} from './RoleDashboardShared';
import { TruncatedList } from '@/Components/UI/TruncatedList/TruncatedList';
import { hasCapability } from '@/config/rbac';

type RoleManagerDashboardPageProps = {
  fallbackRole: string;
  title: string;
  subtitle: string;
  teamTitle: string;
};

type AlertItem = {
  id: string;
  label: string;
  detail: string;
  severity: 'error' | 'warning' | 'info';
};

function buildManagerAlerts(data: ReturnType<typeof useRoleDashboardData>['data']): AlertItem[] {
  const alerts: AlertItem[] = [];

  data.teamMembers
    .filter((member) => member.scoreGlobal == null || member.totalEvaluations === 0)
    .slice(0, 4)
    .forEach((member) => {
      alerts.push({
        id: `coverage-${member.matricule}`,
        label: 'Collaborateur non couvert',
        detail: `${member.nomComplet} n’a pas encore de score consolidé`,
        severity: 'error',
      });
    });

  data.teamMembers
    .filter((member) => member.progression < 0)
    .slice(0, 4)
    .forEach((member) => {
      alerts.push({
        id: `progression-${member.matricule}`,
        label: 'Baisse de performance',
        detail: `${member.nomComplet} est à ${member.progression}`,
        severity: 'info',
      });
    });

  return alerts.slice(0, 6);
}

export default function RoleManagerDashboardPage({
  fallbackRole,
  title,
  subtitle,
  teamTitle,
}: RoleManagerDashboardPageProps) {
  const { data } = useRoleDashboardData('manager', fallbackRole);
  const alerts = buildManagerAlerts(data);
  const canUseTeamJourneys = data.directMembers.length > 0 && hasCapability(data.userRole, 'canEvaluateSubs');

  // Une seule requête agrégée pour toute l'équipe, plutôt qu'un appel par membre.
  const teamMatricules = data.teamMembers.map((member) => member.matricule).filter(Boolean);
  const heatmapQuery = useQuery({
    queryKey: ['analytics', 'team-heatmap', ...teamMatricules],
    queryFn: () => analyticsApi.teamHeatmap(teamMatricules).then((res) => res.data),
    enabled: teamMatricules.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  return (
    <DashboardPageFrame
      layoutUser={data.layoutUser}
      title={title}
      subtitle={subtitle}
      periodName={data.dashboard?.periode_active?.nom ?? null}
      degradedSources={data.degradedSources}
    >
      <div data-dashboard-export-section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Actions à traiter"
          value={data.pendingEvaluations.length + data.toValidateEvaluations.length}
          caption={`${data.pendingEvaluations.length} brouillon(s), ${data.toValidateEvaluations.length} validation(s)`}
          accentClassName="border-l-sabc-red-primary"
        />
        <MetricCard
          label={data.canSeeSelfScore ? 'Mon score global' : 'Évaluations données'}
          value={data.canSeeSelfScore && data.selfScores.scoreGlobal != null ? `${data.selfScores.scoreGlobal}/5` : data.givenEvaluations.length}
          caption={
            data.canSeeSelfScore && data.selfScores.scorePondere != null
              ? `Score pondéré: ${data.selfScores.scorePondere}/5`
              : 'Historique de vos évaluations soumises'
          }
          accentClassName="border-l-sabc-info"
        />
        <MetricCard
          label="Score moyen équipe"
          value={data.teamAverageScore > 0 ? `${data.teamAverageScore}/5` : '—'}
          caption={`${data.teamMembers.length} collaborateur(s) dans le périmètre direct`}
          accentClassName="border-l-sabc-success"
        />
        <MetricCard
          label="Taux de couverture"
          value={`${data.completionRate}%`}
          caption="Part de l’équipe avec score consolidé"
          accentClassName="border-l-sabc-accent"
        />
      </div>

      <div data-dashboard-export-section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Score moyen par type</CardTitle>
            <CardDescription>Vue agrégée de l’équipe, sans détail nominatif des notateurs</CardDescription>
          </CardHeader>
          <CardContent>
            {data.teamTypeAverages.length === 0 ? (
              <EmptyState message="Aucun score agrégé n’est disponible pour l’équipe." />
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.teamTypeAverages} margin={{ top: 22, right: 20, left: -10, bottom: 0 }}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--sabc-gray-200)" />
                    <XAxis dataKey="type" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 5]} tickLine={false} axisLine={false} width={30} />
                    <Tooltip
                      content={({ active, payload, label }: any) => {
                        if (!active || !payload?.length) return null;
                        return (
                          <div className="rounded-lg border border-sabc-gray-200 bg-white px-3 py-2 shadow-lg dark:border-sabc-gray-700 dark:bg-sabc-gray-100">
                            <div className="mb-1 text-xs font-semibold text-sabc-gray-500">{label}</div>
                            <div className="text-sm font-semibold text-sabc-gray-900">{Number(payload[0].value).toFixed(2)}/5</div>
                          </div>
                        );
                      }}
                    />
                    <Bar dataKey="moyenne" fill="#C62828" radius={[6, 6, 0, 0]} barSize={20}>
                      <LabelList dataKey="moyenne" position="top" formatter={(value: number) => value.toFixed(1)} fill="#7F1D1D" fontSize={10} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <TeamAxisFrequencyChartCard
          title="Axes dominants de l’équipe"
          description="Fréquence de remontée des critères faibles sur le périmètre direct"
          axes={data.teamTopAxes}
          emptyMessage="Aucun axe dominant n’est encore calculable sur l’équipe."
        />
      </div>

      <div data-dashboard-export-section>
      <TeamHeatmapCard
        data={heatmapQuery.data}
        isLoading={heatmapQuery.isLoading}
        resolveName={(matricule) =>
          data.teamMembers.find((member) => member.matricule === matricule)?.nomComplet ?? matricule
        }
      />
      </div>

      <div data-dashboard-export-section>
      <TeamMemberAnalyticsTableCard
        title={teamTitle}
        description="Suivi consolidé des subordonnés directs"
        members={data.teamMembers}
        emptyMessage="Aucun collaborateur direct n’a été trouvé pour ce périmètre."
        showTotalEvaluations
        renderIdentityMeta={(member) => member.email ?? ''}
        renderRoleMeta={(member) => `Niveau ${member.niveauHierarchique ?? '—'}`}
      />
      </div>

      <div data-dashboard-export-section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Alertes équipe</CardTitle>
            <CardDescription>Couvertures manquantes et baisses de performance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {alerts.length === 0 ? (
              <EmptyState message="Aucune alerte n’est remontée sur l’équipe." />
            ) : (
              <TruncatedList
                items={alerts}
                previewCount={4}
                keyExtractor={(alert) => alert.id}
                modalTitle="Alertes équipe"
                modalDescription={`${alerts.length} alerte(s) détectée(s)`}
                className="space-y-3"
                modalClassName="space-y-3"
                renderItem={(alert) => (
                  <div className="rounded-lg border border-sabc-gray-200 p-4 dark:border-sabc-gray-800">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="font-medium text-sabc-gray-900 dark:text-white">{alert.label}</div>
                      <Badge variant={alert.severity}>{alert.severity}</Badge>
                    </div>
                    <div className="mt-2 text-sm text-sabc-gray-500 dark:text-sabc-gray-400">{alert.detail}</div>
                  </div>
                )}
              />
            )}

            {data.toValidateEvaluations.length > 0 ? (
              <div className="rounded-lg border border-sabc-gray-200 p-4 dark:border-sabc-gray-800">
                <div className="font-medium text-sabc-gray-900 dark:text-white">Validations reçues</div>
                <div className="mt-3 space-y-2">
                  {data.toValidateEvaluations.slice(0, 3).map((evaluation: any) => (
                    <div key={String(evaluation.id_evaluation)} className="flex flex-wrap items-center justify-between gap-3 text-sm">
                      <div className="min-w-0 text-sabc-gray-600 dark:text-sabc-gray-300">
                        {formatPersonName(evaluation.evalue, evaluation.evalue_matricule || 'Collaborateur')}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={getStatusBadgeVariant(evaluation.statut)}>{evaluation.statut}</Badge>
                        <span className="text-xs text-sabc-gray-500 dark:text-sabc-gray-400">
                          {formatDateLabel(evaluation.date_soumission || evaluation.date_creation)}
                        </span>
                        <Button
                          size="sm"
                          onClick={() => navigateTo(`/evaluations/validate?id=${encodeURIComponent(String(evaluation.id_evaluation))}`)}
                          aria-label={`Examiner l'évaluation de ${formatPersonName(evaluation.evalue, evaluation.evalue_matricule || 'Collaborateur')}`}
                        >
                          Examiner
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <ActiveRulesCard
          rules={data.rules.relevant}
          description="Règles applicables à vos évaluations et à celles de votre équipe"
        />
      </div>

      <div data-dashboard-export-section>
      <QuickActionsCard
        actions={[
          ...(data.toValidateEvaluations.length > 0
            ? [{ label: `À valider (${data.toValidateEvaluations.length})`, href: '/evaluations/validate' }]
            : []),
          { label: 'Axes d’amélioration', href: '/axes-amelioration' },
          { label: 'Évaluations à faire', href: '/common/evaluations/pending' },
          { label: 'Démarrer une évaluation', href: '/common/evaluations/mine' },
          ...(canUseTeamJourneys
            ? [
                { label: 'Vue équipe', href: '/common/team/overview' },
                { label: 'Évaluations équipe', href: '/common/team/evaluations', variant: 'secondary' as const },
              ]
            : []),
        ]}
      />
      </div>
    </DashboardPageFrame>
  );
}
