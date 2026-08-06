import React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/UI/Card/Card';
import { Badge } from '@/Components/UI/Badge/Badge';
import { useRoleDashboardData } from '@/Hooks/queries/useRoleDashboards';
import { DOMAINES, filterByDomaine, type Domaine } from '@/config/rbac';
import { Button } from '@/Components/UI/Button/Button';
import { HierarchyChainCard } from '@/Components/Dashboard/IndividualAnalyticsCards';
import { TeamAxisFrequencyChartCard, TeamMemberAnalyticsTableCard } from '@/Components/Dashboard/TeamAnalyticsCards';
import {
  ActiveRulesCard,
  DashboardPageFrame,
  EmptyState,
  MetricCard,
  QuickActionsCard,
  formatDateLabel,
  formatEvaluationType,
  getStatusBadgeVariant,
} from './RoleDashboardShared';

type RoleDirectorDashboardPageProps = {
  fallbackRole: string;
  title: string;
  subtitle: string;
  perimeterTitle: string;
  /**
   * Active la bascule entre domaines. Attendue pour les chefs de département,
   * dont le périmètre couvre à la fois le commercial et le marketing.
   */
  enableDomaineToggle?: boolean;
};

export default function RoleDirectorDashboardPage({
  fallbackRole,
  title,
  subtitle,
  perimeterTitle,
  enableDomaineToggle = false,
}: RoleDirectorDashboardPageProps) {
  const { data } = useRoleDashboardData('director', fallbackRole);
  const [domaine, setDomaine] = React.useState<Domaine | null>(null);

  // Le filtrage est purement local: le périmètre est déjà chargé, inutile de
  // relancer une requête à chaque bascule.
  const perimetre = enableDomaineToggle
    ? filterByDomaine(data.teamMembers, domaine)
    : data.teamMembers;

  return (
    <DashboardPageFrame
      layoutUser={data.layoutUser}
      title={title}
      subtitle={subtitle}
      periodName={data.dashboard?.periode_active?.nom ?? null}
    >
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <MetricCard
          label="Évaluations données"
          value={data.givenEvaluations.length}
          caption="Évaluations réalisées par vous"
          accentClassName="border-l-sabc-red-primary"
        />
        <MetricCard
          label="Validations en attente"
          value={data.toValidateEvaluations.length}
          caption="Soumissions à arbitrer"
          accentClassName="border-l-sabc-warning"
        />
        <MetricCard
          label="Périmètre direct"
          value={data.directMembers.length}
          caption="Responsables directs"
          accentClassName="border-l-sabc-info"
        />
        <MetricCard
          label="Couverture globale"
          value={`${data.completionRate}%`}
          caption={data.teamAverageScore > 0 ? `Score moyen ${data.teamAverageScore}/5` : 'Aucun score consolidé'}
          accentClassName="border-l-sabc-success"
        />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Performance par rôle</CardTitle>
            <CardDescription>Couverture et score moyen par rôle supervisé</CardDescription>
          </CardHeader>
          <CardContent>
            {data.roleBreakdown.length === 0 ? (
              <EmptyState message="Aucun agrégat par rôle n’est disponible sur ce périmètre." />
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.roleBreakdown} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--sabc-gray-200)" vertical={false} />
                    <XAxis dataKey="role" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="left" domain={[0, 5]} tickLine={false} axisLine={false} width={30} />
                    <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tickLine={false} axisLine={false} width={35} />
                    <Tooltip />
                    <Bar yAxisId="left" dataKey="scoreMoyen" fill="#C62828" name="Score moyen" radius={[6, 6, 0, 0]} />
                    <Bar yAxisId="right" dataKey="couverture" fill="#1D4ED8" name="Couverture %" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Répartition par niveau hiérarchique</CardTitle>
            <CardDescription>Score moyen consolidé par niveau de responsabilité</CardDescription>
          </CardHeader>
          <CardContent>
            {data.levelBreakdown.length === 0 ? (
              <EmptyState message="Aucune répartition hiérarchique n’est disponible." />
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.levelBreakdown} layout="vertical" margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--sabc-gray-200)" horizontal={false} />
                    <XAxis type="number" domain={[0, 5]} tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                    <YAxis dataKey="niveau" type="category" width={120} tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(value: number) => [`${value}/5`, 'Score moyen']} />
                    <Bar dataKey="scoreMoyen" fill="#C62828" radius={[0, 10, 10, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <HierarchyChainCard
          title="Chaîne hiérarchique"
          description="Positionnement de votre rôle dans la structure"
          nodes={data.chaine}
          emptyMessage="La chaîne hiérarchique n’est pas disponible."
        />

        <TeamAxisFrequencyChartCard
          title="Axes dominants du périmètre"
          description="Axes faibles les plus fréquents sur l’ensemble de la chaîne supervisée"
          axes={data.teamTopAxes}
          emptyMessage="Aucun axe dominant n’est encore calculable sur ce périmètre."
        />

        <Card>
          <CardHeader>
            <CardTitle>Évaluations récemment données</CardTitle>
            <CardDescription>Historique des actions que vous avez déjà menées</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.givenEvaluations.length === 0 ? (
              <EmptyState message="Aucune évaluation donnée n’est disponible dans l’historique." />
            ) : (
              data.givenEvaluations.slice(0, 5).map((evaluation: any) => (
                <div key={String(evaluation.id_evaluation)} className="rounded-lg border border-sabc-gray-200 p-4 dark:border-sabc-gray-800">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="font-medium text-sabc-gray-900 dark:text-white">
                      {evaluation.evalue?.prenom} {evaluation.evalue?.nom}
                    </div>
                    <Badge variant={getStatusBadgeVariant(evaluation.statut)}>{evaluation.statut}</Badge>
                  </div>
                  <div className="mt-1 text-sm text-sabc-gray-500 dark:text-sabc-gray-400">
                    {formatEvaluationType(evaluation.type_evaluation)}
                  </div>
                  <div className="mt-1 text-xs text-sabc-gray-400 dark:text-sabc-gray-500">
                    {evaluation.regle?.nom_regle || 'Règle non renseignée'} · {formatDateLabel(evaluation.date_soumission || evaluation.date_creation)}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {enableDomaineToggle && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-sabc-gray-600 dark:text-sabc-gray-300">
            Périmètre :
          </span>
          <Button
            size="sm"
            variant={domaine === null ? 'default' : 'outline'}
            onClick={() => setDomaine(null)}
          >
            Tout ({data.teamMembers.length})
          </Button>
          {DOMAINES.map((valeur) => {
            const effectif = filterByDomaine(data.teamMembers, valeur).length;
            return (
              <Button
                key={valeur}
                size="sm"
                variant={domaine === valeur ? 'default' : 'outline'}
                onClick={() => setDomaine(valeur)}
                // Un domaine sans effectif n'est pas pertinent pour ce périmètre.
                disabled={effectif === 0}
                className="capitalize"
              >
                {valeur} ({effectif})
              </Button>
            );
          })}
        </div>
      )}

      <TeamMemberAnalyticsTableCard
        title={perimeterTitle}
        description={
          enableDomaineToggle && domaine
            ? `Périmètre ${domaine} du département`
            : 'Vue consolidée du périmètre hiérarchique complet'
        }
        members={perimetre}
        emptyMessage="Aucun subordonné n’a été trouvé dans le périmètre complet."
        showLevelColumn
        showTotalEvaluations
        renderIdentityMeta={(member) => member.email ?? ''}
      />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Validations à arbitrer</CardTitle>
            <CardDescription>Évaluations soumises par vos subordonnés directs</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.toValidateEvaluations.length === 0 ? (
              <EmptyState message="Aucune validation n’est en attente pour l’instant." />
            ) : (
              data.toValidateEvaluations.slice(0, 6).map((evaluation: any) => (
                <div key={String(evaluation.id_evaluation)} className="rounded-lg border border-sabc-gray-200 p-4 dark:border-sabc-gray-800">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="font-medium text-sabc-gray-900 dark:text-white">
                      {evaluation.evalue?.prenom} {evaluation.evalue?.nom}
                    </div>
                    <Badge variant={getStatusBadgeVariant(evaluation.statut)}>{evaluation.statut}</Badge>
                  </div>
                  <div className="mt-1 text-sm text-sabc-gray-500 dark:text-sabc-gray-400">
                    {formatEvaluationType(evaluation.type_evaluation)}
                  </div>
                  <div className="mt-1 text-xs text-sabc-gray-400 dark:text-sabc-gray-500">
                    Soumise le {formatDateLabel(evaluation.date_soumission || evaluation.date_creation)}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <ActiveRulesCard
          rules={data.rules.relevant}
          description="Règles actives qui cadrent les évaluations visibles sur votre périmètre"
        />
      </div>

      <QuickActionsCard
        actions={[
          { label: 'Axes d’amélioration', href: '/axes-amelioration' },
          { label: 'Évaluations en attente', href: '/common/evaluations/pending' },
          { label: 'Mes évaluations', href: '/common/evaluations/mine' },
          { label: 'Vue équipe', href: '/common/team/overview' },
          { label: 'Évaluations équipe', href: '/common/team/evaluations', variant: 'secondary' },
        ]}
      />
    </DashboardPageFrame>
  );
}
