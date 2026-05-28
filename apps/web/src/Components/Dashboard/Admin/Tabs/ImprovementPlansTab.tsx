import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { analyticsApi } from '@/Services/api';
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

  const queryClient = useQueryClient();

  const validateMutation = useMutation({
    mutationFn: (id: string) => analyticsApi.validateRecommandation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analytics', 'admin', 'improvement-plans'] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, motif }: { id: string; motif: string }) =>
      analyticsApi.rejectRecommandation(id, motif),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analytics', 'admin', 'improvement-plans'] });
    },
  });

  function handleReject(id: string) {
    const motif = window.prompt('Motif du rejet :');
    if (motif === null) return;
    rejectMutation.mutate({ id, motif: motif.trim() || 'Non précisé' });
  }

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
          <CardContent className="p-6 text-sm text-sabc-gray-500">Chargement de l'agrégation des plans d'amélioration…</CardContent>
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
            onValidate={(id) => validateMutation.mutate(id)}
            onReject={handleReject}
            validateLoading={validateMutation.isPending ? (validateMutation.variables ?? null) : null}
            rejectLoading={rejectMutation.isPending ? (rejectMutation.variables?.id ?? null) : null}
          />
        </>
      ) : null}
    </div>
  );
}
