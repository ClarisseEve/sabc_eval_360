import React from 'react';
import { useAdminImprovementPlansTabData } from '@/Hooks/queries/useAdminDashboardTabs';
import { Card, CardContent } from '@/Components/UI/Card/Card';
import {
  ImprovementPlansFiltersSection,
  ImprovementPlansTotalsSection,
  ImprovementRowsSection,
  ImprovementTopAxesSection,
  RecommendationTypeBreakdownSection,
} from '@/Components/Dashboard/Admin/Sections/ImprovementPlanSections';

function EmptyPanel({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-dashed border-sabc-gray-300 p-6 text-center text-sabc-gray-500 dark:border-sabc-gray-700 dark:text-sabc-gray-400">
      {message}
    </div>
  );
}

export default function ImprovementPlansTab() {
  const [roleFilter, setRoleFilter] = React.useState('all');
  const [regionFilter, setRegionFilter] = React.useState('all');
  const [typeFilter, setTypeFilter] = React.useState('all');
  const {
    plansQuery,
    roleOptions,
    regionOptions,
    byType,
    topAxes,
    rows,
    totals,
  } = useAdminImprovementPlansTabData({
    roleFilter,
    regionFilter,
    typeFilter,
  });

  return (
    <div className="space-y-6">
      <ImprovementPlansFiltersSection
        roleFilter={roleFilter}
        onRoleFilterChange={setRoleFilter}
        roleOptions={roleOptions}
        regionFilter={regionFilter}
        onRegionFilterChange={setRegionFilter}
        regionOptions={regionOptions}
        typeFilter={typeFilter}
        onTypeFilterChange={setTypeFilter}
        typeOptions={byType}
        generatedAt={plansQuery.data?.generated_at}
      />

      <ImprovementPlansTotalsSection totals={totals} />

      {plansQuery.isLoading ? (
        <Card>
          <CardContent className="p-6 text-sm text-sabc-gray-500">Chargement de l’agrégation des plans d’amélioration…</CardContent>
        </Card>
      ) : null}

      {!plansQuery.isLoading && (totals.users_filtered ?? 0) === 0 ? (
        <EmptyPanel message="Aucun utilisateur actif ne correspond aux filtres sélectionnés." />
      ) : null}

      {!plansQuery.isLoading && (totals.users_filtered ?? 0) > 0 ? (
        <>
          <div className="grid gap-5 xl:grid-cols-2">
            <RecommendationTypeBreakdownSection byType={byType} />
            <ImprovementTopAxesSection topAxes={topAxes} />
          </div>

          <ImprovementRowsSection
            rows={rows}
            usersWithRecommendations={totals.users_with_recommendations ?? 0}
            usersAnalyzed={totals.users_analyzed ?? 0}
          />
        </>
      ) : null}
    </div>
  );
}
