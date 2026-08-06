import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { analyticsApi } from '@/Services/api';
import { useAdminImprovementPlansTabData } from '@/Hooks/queries/useAdminDashboardTabs';
import { Card, CardContent } from '@/Components/UI/Card/Card';
import { Button } from '@/Components/UI/Button/Button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/Components/UI/Dialog/Dialog';
import { useToast } from '@/Contexts/ToastContext';
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
  const { success, error } = useToast();
  const [rejectTarget, setRejectTarget] = React.useState<string | null>(null);
  const [rejectMotif, setRejectMotif] = React.useState('');

  const readError = (e: any, fallback: string) =>
    typeof e?.response?.data?.message === 'string' ? e.response.data.message : fallback;

  const validateMutation = useMutation({
    mutationFn: (id: string) => analyticsApi.validateRecommandation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analytics', 'admin', 'improvement-plans'] });
      success('Recommandation validée.');
    },
    onError: (e: any) => error(readError(e, "La recommandation n'a pas pu être validée.")),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, motif }: { id: string; motif: string }) =>
      analyticsApi.rejectRecommandation(id, motif),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analytics', 'admin', 'improvement-plans'] });
      closeReject();
      success('Recommandation rejetée.');
    },
    onError: (e: any) => error(readError(e, "La recommandation n'a pas pu être rejetée.")),
  });

  const generateMutation = useMutation({
    mutationFn: () => analyticsApi.runRecommandationsGeneration(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['analytics', 'admin', 'improvement-plans'] });
      success('Recommandations générées et plans actualisés.');
    },
    onError: (e: any) => error(readError(e, "La génération des recommandations a échoué.")),
  });

  function closeReject() {
    setRejectTarget(null);
    setRejectMotif('');
    rejectMutation.reset();
  }

  function handleReject(id: string) {
    setRejectTarget(id);
    setRejectMotif('');
  }

  function submitReject() {
    if (!rejectTarget) return;
    rejectMutation.mutate({ id: rejectTarget, motif: rejectMotif.trim() || 'Non précisé' });
  }

  return (
    <div className="space-y-5">
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
        onGenerate={() => generateMutation.mutate()}
        isGenerating={generateMutation.isPending}
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

      {/* Remplace un window.prompt: bloquant, non stylé et filtré par certains
          navigateurs. */}
      <Dialog
        open={rejectTarget !== null}
        onOpenChange={(open) => {
          if (!open && !rejectMutation.isPending) closeReject();
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rejeter cette recommandation ?</DialogTitle>
            <DialogDescription>
              Le motif est conservé dans l'historique de la recommandation.
            </DialogDescription>
          </DialogHeader>
          <textarea
            value={rejectMotif}
            onChange={(e) => setRejectMotif(e.target.value)}
            rows={4}
            autoFocus
            placeholder="Motif du rejet (facultatif)"
            className="w-full rounded-md border border-sabc-gray-200 px-3 py-2 text-sm focus:border-sabc-red-primary focus:outline-none"
          />
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={closeReject} disabled={rejectMutation.isPending}>
              Annuler
            </Button>
            <Button
              className="bg-sabc-red-primary text-white hover:bg-sabc-red-dark"
              onClick={submitReject}
              loading={rejectMutation.isPending}
              disabled={rejectMutation.isPending}
            >
              Rejeter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
