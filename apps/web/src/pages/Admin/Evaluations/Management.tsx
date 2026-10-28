import React from 'react';
import { Link } from 'react-router-dom';
import { useSuspenseQuery } from '@tanstack/react-query';
import { buttonVariants } from '@/Components/UI/Button/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/UI/Card/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/UI/Table/Table';
import { analyticsApi, reglesApi } from '@/Services/api';
import { useEvaluationTargets, usePeriodes } from '@/Hooks/queries/useEvaluationsQuery';
import { EmptyState } from '@/Components/UI/EmptyState';
import { AdminEvaluationsLayout, PeriodeStatusBadge } from './shared';
import { useAuthContext } from '@/Contexts/AuthContext';
import { filterAdminApplicableRules, filterApplicableRules } from '@/utils/rules';
import { formatDateFr, formatPercent, formatScore } from '@/utils/helpers';
import { PageHeader } from '@/Components/UI/Page/PageHeader';
import { KpiCard, KpiGrid } from '@/Components/UI/KpiCard';
import { Badge } from '@/Components/UI/Badge/Badge';

function normalizeLabel(value: unknown) {
  return String(value ?? '').trim().toLowerCase();
}

function formatChannelLabel(value: unknown) {
  const channel = normalizeLabel(value);
  if (channel === 'auto') return 'Auto-évaluation';
  if (channel === 'descendante') return 'Manager → collaborateur';
  if (channel === 'pairs') return 'Pairs';
  return String(value ?? 'Canal non défini');
}

function getStatusPresentation(value: unknown) {
  const status = normalizeLabel(value);
  if (status === 'valide') return { label: 'Validées', badgeVariant: 'success' as const };
  if (status === 'soumis') return { label: 'Soumises', badgeVariant: 'outline' as const };
  if (status === 'brouillon') return { label: 'Brouillons', badgeVariant: 'secondary' as const };
  if (status === 'rejete' || status === 'rejeté') return { label: 'Rejetées', badgeVariant: 'error' as const };
  const raw = String(value ?? '').trim();
  return {
    label: raw ? raw.charAt(0).toUpperCase() + raw.slice(1) : 'Statut non renseigné',
    badgeVariant: 'secondary' as const,
  };
}

/** Barre de proportion neutre (gris acier) : la couleur reste réservée aux statuts. */
function NeutralBar({ value, max = 100 }: { value: number; max?: number }) {
  const width = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return (
    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-sabc-gray-100 dark:bg-sabc-gray-800" aria-hidden="true">
      <div className="h-full rounded-full bg-sabc-gray-500" style={{ width: `${width}%` }} />
    </div>
  );
}

export default function EvaluationManagementPage() {
  const { user } = useAuthContext();
  const isAdmin = Boolean(user?.est_admin) || String(user?.role ?? '').toUpperCase() === 'ADMIN';
  const { data: periodesData } = usePeriodes();
  const { data: eligiblesData } = useEvaluationTargets(isAdmin);
  const { data: reglesData } = useSuspenseQuery({
    queryKey: ['regles', 'actives'],
    queryFn: () => reglesApi.list().then((r) => r.data),
  });
  const { data: dashboard } = useSuspenseQuery({
    queryKey: ['analytics', 'dashboard'],
    queryFn: () => analyticsApi.dashboard().then((r) => r.data),
  });
  const { data: evaluations } = useSuspenseQuery({
    queryKey: ['analytics', 'evaluations'],
    queryFn: () => analyticsApi.evaluations().then((r) => r.data),
  });
  const { data: performances } = useSuspenseQuery({
    queryKey: ['analytics', 'performances'],
    queryFn: () => analyticsApi.performances().then((r) => r.data),
  });

  const periodes = Array.isArray(periodesData) ? periodesData : [];
  const statuses = Array.isArray(evaluations) ? evaluations : [];
  const channels = Array.isArray(performances) ? performances : [];
  const activeRules = Array.isArray(reglesData) ? reglesData : [];
  const activePeriodes = periodes.filter((periode: any) => periode.est_ouverte || String(periode.statut).toLowerCase() === 'ouverte');
  const eligibleRuleTargets = isAdmin
    ? (Array.isArray(eligiblesData) ? eligiblesData : []).map((target: any) => ({
        role: target.role_nom || target.role,
        type: '360',
      }))
    : [
        ...(eligiblesData?.auto ? [{ role: eligiblesData.auto.role_nom || eligiblesData.auto.role, type: 'auto' }] : []),
        ...(Array.isArray(eligiblesData?.subordonnes)
          ? eligiblesData.subordonnes.map((target: any) => ({ role: target.role_nom || target.role, type: 'descendante' }))
          : []),
        ...(Array.isArray(eligiblesData?.pairs)
          ? eligiblesData.pairs.map((target: any) => ({ role: target.role_nom || target.role, type: 'pairs' }))
          : []),
      ];
  const hasEligibleTargets = eligibleRuleTargets.length > 0;
  const hasApplicableRule = eligibleRuleTargets.some((target) =>
    isAdmin
      ? filterAdminApplicableRules(activeRules, target.role).length > 0
      : filterApplicableRules(activeRules, user?.role_nom || user?.role, target.role, target.type).length > 0,
  );
  const canCreateEvaluation = activePeriodes.length > 0 && hasEligibleTargets && hasApplicableRule;
  const statusTotal = statuses.reduce((sum: number, row: any) => sum + Number(row.count ?? 0), 0);

  return (
    <AdminEvaluationsLayout title="Pilotage des évaluations">
      <PageHeader
        title="Pilotage des évaluations"
        description="Avancement des périodes et des évaluations, tous rôles confondus."
        breadcrumbs={[{ label: 'Administration' }, { label: 'Évaluations' }, { label: 'Pilotage' }]}
        actions={canCreateEvaluation ? (
          <Link to="/admin/evaluations/form" className={buttonVariants()}>Nouvelle évaluation</Link>
        ) : undefined}
      />

      {!canCreateEvaluation ? (
        <div role="status" className="flex flex-col gap-4 rounded-lg border border-amber-200 bg-amber-50 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-amber-900">Création d’évaluation indisponible</p>
            <p className="text-sm text-amber-800">Complétez les prérequis manquants avant de démarrer une évaluation.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {activePeriodes.length === 0 ? (
              <Link to="/admin/evaluations/periodes" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                Ouvrir une période
              </Link>
            ) : null}
            {!hasApplicableRule ? (
              <Link to="/admin/evaluations/regles" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                {activeRules.length === 0 ? 'Configurer les règles' : 'Ajouter une règle applicable'}
              </Link>
            ) : null}
            {!isAdmin && !hasEligibleTargets ? (
              <Link to="/admin/utilisateurs/gaps" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                Corriger la hiérarchie
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}

      <KpiGrid>
        <KpiCard label="Total évaluations" value={dashboard?.kpis?.total_evaluations} />
        <KpiCard label="Utilisateurs évalués" value={dashboard?.kpis?.unique_users} />
        <KpiCard
          label="Score moyen"
          value={dashboard?.kpis?.average_score != null ? formatScore(dashboard.kpis.average_score) : null}
        />
        <KpiCard label="Périodes ouvertes" value={activePeriodes.length} />
      </KpiGrid>

      <Card className="overflow-hidden border-sabc-gray-200/80 shadow-sm">
        <CardHeader className="border-b border-sabc-gray-100">
          <CardTitle>Périodes ouvertes</CardTitle>
          <CardDescription>Périodes actuellement ouvertes et taux de complétion des évaluations.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {activePeriodes.length === 0 ? (
            <EmptyState title="Aucune période ouverte" description="Ouvrez une période depuis la page Périodes pour démarrer une campagne." />
          ) : (
            <Table className="min-w-[560px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Période</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Taux de complétion</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activePeriodes.map((periode: any) => (
                  <TableRow key={periode.id_periode}>
                    <TableCell>
                      <div className="font-medium text-sabc-gray-900">{periode.nom_periode}</div>
                      <div className="text-xs text-sabc-gray-500">{periode.code_periode}</div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{formatDateFr(periode.date_debut)} – {formatDateFr(periode.date_fin)}</TableCell>
                    <TableCell><PeriodeStatusBadge statut={periode.statut} estOuverte={periode.est_ouverte} /></TableCell>
                    <TableCell className="whitespace-nowrap tabular-nums">{formatPercent(periode.taux_completion)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-sabc-gray-200/80 shadow-sm">
          <CardContent className="p-4">
            <div className="mb-3 flex items-center gap-2">
              <span className="text-sm font-semibold text-sabc-gray-900">Statuts</span>
            </div>
            <div className="space-y-2">
              {statuses.length === 0 ? (
                <p className="text-xs text-sabc-gray-500">Aucune évaluation enregistrée pour le moment.</p>
              ) : statuses.map((row: any, index: number) => {
                const count = Number(row.count ?? 0);
                const ratio = statusTotal > 0 ? (count / statusTotal) * 100 : 0;
                const presentation = getStatusPresentation(row.statut);
                return (
                  <div key={`${row.statut}-${index}`} className="flex items-center gap-2">
                    <Badge variant={presentation.badgeVariant} className="min-w-[88px] justify-center">
                      {presentation.label}
                    </Badge>
                    <NeutralBar value={ratio} />
                    <span className="min-w-[28px] text-right text-xs font-medium text-sabc-gray-700">{count}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="border-sabc-gray-200/80 shadow-sm">
          <CardContent className="p-4">
            <div className="mb-3 flex items-center gap-2">
              <span className="text-sm font-semibold text-sabc-gray-900">Canaux</span>
            </div>
            <div className="space-y-2">
              {channels.length === 0 ? (
                <p className="text-xs text-sabc-gray-500">Aucune évaluation enregistrée pour le moment.</p>
              ) : channels.slice(0, 4).map((row: any, index: number) => {
                const rawScore = row.average_score ?? row.moyenne;
                const score = rawScore != null ? Number(rawScore) : null;
                return (
                  <div key={`${row.channel}-${index}`} className="flex items-center gap-2">
                    <span className="min-w-[120px] truncate text-xs font-medium text-sabc-gray-700">{formatChannelLabel(row.channel)}</span>
                    <NeutralBar value={score ?? 0} max={5} />
                    <span className="min-w-[60px] whitespace-nowrap text-right text-xs font-medium tabular-nums text-sabc-gray-700">{formatScore(score, 1)}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

      </div>
    </AdminEvaluationsLayout>
  );
}
