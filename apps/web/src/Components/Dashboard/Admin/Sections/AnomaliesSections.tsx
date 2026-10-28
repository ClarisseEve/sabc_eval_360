import React, { useMemo, useState } from 'react';
import { CheckCircle2, RefreshCw, Zap } from 'lucide-react';
import { Badge } from '@/Components/UI/Badge/Badge';
import { Button } from '@/Components/UI/Button/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/UI/Card/Card';
import { Progress } from '@/Components/UI/Progress/Progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/UI/Table/Table';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/Components/UI/Pagination';
import { EmptyState } from '@/Components/Dashboard/RoleDashboardShared';
import { paginateList } from '@/utils/adminUi';
import { KpiCard, KpiGrid } from '@/Components/UI/KpiCard';
import { cn, formatPercent } from '@/utils/helpers';

type AlertFilter = 'all' | 'critical' | 'warning' | 'info';

type AnomalyRow = {
  id?: string;
  type: string;
  description: string;
  severite: 'critical' | 'warning' | 'info';
  resolue?: boolean;
  matricule?: string;
  details?: Record<string, unknown>;
};

const SEVERITY_CONFIG: Record<string, { label: string; delay: string; badgeVariant: 'destructive' | 'secondary' | 'outline' }> = {
  critical: { label: 'Critique', delay: 'À traiter sous 24 h', badgeVariant: 'destructive' },
  warning: { label: 'Avertissement', delay: 'Revue sous 48 h', badgeVariant: 'secondary' },
  info: { label: 'Surveillance', delay: 'À suivre', badgeVariant: 'outline' },
};

const FILTERS: Array<{ value: AlertFilter; label: string }> = [
  { value: 'all', label: 'Toutes' },
  { value: 'critical', label: 'Critiques' },
  { value: 'warning', label: 'Avertissements' },
  { value: 'info', label: 'Surveillance' },
];

function formatTypeLabel(type: string) {
  switch (type) {
    case 'divergence_auto_vs_autres':
      return 'Écart auto-évaluation / évaluations externes';
    case 'baisse_performance':
      return 'Baisse de performance';
    case 'uniformite_evaluations':
      return 'Uniformité des notations';
    case 'biais_evaluateur':
      return 'Biais évaluateur';
    default:
      {
        const label = type.replace(/_/g, ' ');
        return label.charAt(0).toUpperCase() + label.slice(1);
      }
  }
}

function buildSignalMetric(row: AnomalyRow) {
  const details = row.details ?? {};

  if (typeof details.ecart === 'number') {
    return `Écart de ${details.ecart.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} pt`;
  }

  if (typeof details.progression === 'number') {
    return `${Math.abs(details.progression).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} pt sur 3 mois`;
  }

  if (typeof details.variance === 'number') {
    return `Variance ${details.variance.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  if (typeof details.nb_evaluations === 'number') {
    return `${details.nb_evaluations.toLocaleString('fr-FR')} évaluations concernées`;
  }

  return 'n.d.';
}

function buildActionLabel(row: AnomalyRow) {
  if (row.type === 'divergence_auto_vs_autres') {
    return 'Comparer les écarts par période et organiser un entretien avec le responsable.';
  }

  if (row.type === 'baisse_performance') {
    return 'Vérifier les évaluations récentes et mettre en place un accompagnement à court terme.';
  }

  if (row.type === 'uniformite_evaluations') {
    return 'Contrôler la qualité de notation et rebriefer l’évaluateur sur les critères.';
  }

  if (row.type === 'biais_evaluateur') {
    return 'Examiner les notes attribuées par cet évaluateur puis organiser une séance d’harmonisation.';
  }

  return 'Analyser le signal puis affecter une action corrective.';
}

function getSeverityLabel(severity: AlertFilter) {
  if (severity === 'critical') return 'critiques';
  if (severity === 'warning') return 'en avertissement';
  if (severity === 'info') return 'en surveillance';
  return 'actives';
}

export function AnomalySummarySection({
  total,
  severityStats,
  rows,
  activeFilter,
  onFilterChange,
}: {
  total: number;
  severityStats: Record<string, number>;
  rows: AnomalyRow[];
  activeFilter: AlertFilter;
  onFilterChange: (filter: AlertFilter) => void;
}) {
  const rankedRows = [...rows].sort((left, right) => {
    const order = { critical: 0, warning: 1, info: 2 };
    return order[left.severite] - order[right.severite];
  });
  const criticalShare = total > 0 ? ((severityStats.critical ?? 0) / total) * 100 : null;
  const immediateRows = rankedRows.filter((row) => row.severite !== 'info').slice(0, 4);
  const topTypes = Object.entries(
    rows.reduce<Record<string, number>>((accumulator, row) => {
      const label = formatTypeLabel(row.type);
      accumulator[label] = (accumulator[label] ?? 0) + 1;
      return accumulator;
    }, {}),
  )
    .sort((left, right) => right[1] - left[1])
    .slice(0, 4);
  const topTypeMax = Math.max(...topTypes.map(([, count]) => count), 1);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-sabc-gray-900 dark:text-white">Alertes et anomalies</h2>
          <p className="text-sm text-sabc-gray-600 dark:text-sabc-gray-400">
            Incohérences détectées dans les évaluations, classées par niveau d'urgence.
          </p>
        </div>
        <div
          role="group"
          aria-label="Filtrer par niveau d'urgence"
          className="inline-flex w-full overflow-x-auto rounded-lg border border-sabc-gray-200 bg-white p-0.5 sm:w-auto dark:border-sabc-gray-700 dark:bg-sabc-gray-900"
        >
          {FILTERS.map((filter) => {
            const isActive = activeFilter === filter.value;
            const count = filter.value === 'all' ? total : Number(severityStats[filter.value] ?? 0);
            return (
              <button
                key={filter.value}
                type="button"
                aria-pressed={isActive}
                onClick={() => onFilterChange(filter.value)}
                className={cn(
                  'inline-flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors',
                  isActive
                    ? 'bg-sabc-gray-100 font-semibold text-sabc-gray-900 dark:bg-sabc-gray-800 dark:text-white'
                    : 'text-sabc-gray-600 hover:text-sabc-gray-900 dark:text-sabc-gray-400',
                )}
              >
                <span>{filter.label}</span>
                <span className="tabular-nums text-sabc-gray-500">{count.toLocaleString('fr-FR')}</span>
              </button>
            );
          })}
        </div>
      </div>

      <KpiGrid>
        <KpiCard label="Alertes ouvertes" value={total.toLocaleString('fr-FR')} />
        <KpiCard
          label="Critiques"
          value={(severityStats.critical ?? 0).toLocaleString('fr-FR')}
          caption={criticalShare === null ? undefined : `${formatPercent(criticalShare)} du total`}
        />
        <KpiCard label="Avertissements" value={(severityStats.warning ?? 0).toLocaleString('fr-FR')} />
        <KpiCard label="Surveillance" value={(severityStats.info ?? 0).toLocaleString('fr-FR')} />
      </KpiGrid>

      <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="overflow-hidden border-sabc-gray-200">
          <CardHeader className="border-b border-sabc-gray-100">
            <CardTitle>Priorités immédiates</CardTitle>
            <CardDescription>Alertes critiques et avertissements, les plus urgents en premier.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-6">
            {immediateRows.length === 0 ? (
              <EmptyState message="Aucune alerte prioritaire pour le moment." />
            ) : (
              immediateRows.map((row, index) => {
                const config = SEVERITY_CONFIG[row.severite] || SEVERITY_CONFIG.info;
                return (
                  <div key={`${row.type}-${row.matricule ?? 'global'}-${index}`} className="rounded-lg border border-sabc-gray-200 bg-white p-4 dark:border-sabc-gray-700 dark:bg-sabc-gray-900">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-medium text-sabc-gray-900 dark:text-white">{formatTypeLabel(row.type)}</div>
                        <div className="text-xs text-sabc-gray-500">{row.matricule ?? 'Analyse globale'}</div>
                        <p className="mt-2 text-sm leading-6 text-sabc-gray-600 dark:text-sabc-gray-400">{row.description}</p>
                      </div>
                      <Badge variant={config.badgeVariant}>{config.label}</Badge>
                    </div>
                    <p className="mt-3 border-t border-sabc-gray-100 pt-3 text-sm leading-5 text-sabc-gray-600 dark:border-sabc-gray-800 dark:text-sabc-gray-400">
                      <span className="font-medium text-sabc-gray-700 dark:text-sabc-gray-300">Action recommandée : </span>
                      {buildActionLabel(row)}
                    </p>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-sabc-gray-200">
          <CardHeader className="border-b border-sabc-gray-100">
            <CardTitle>Signaux récurrents</CardTitle>
            <CardDescription>Types d'anomalies les plus fréquents.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            {topTypes.length === 0 ? (
              <EmptyState message="Aucun signal récurrent." />
            ) : (
              topTypes.map(([label, count]) => (
                <div key={label}>
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-medium text-sabc-gray-900 dark:text-white">{label}</span>
                    <span className="tabular-nums text-sabc-gray-600">{count.toLocaleString('fr-FR')}</span>
                  </div>
                  <Progress value={count} max={topTypeMax} className="mt-2 h-2" />
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function AnomaliesTableSection({
  rows,
  totalRows,
  activeFilter,
  onRefresh,
  isFetching,
  onAcknowledge,
  acknowledgeLoading,
  onRunDetection,
  isRunningDetection,
}: {
  rows: AnomalyRow[];
  totalRows: AnomalyRow[];
  activeFilter: AlertFilter;
  onRefresh: () => void;
  isFetching: boolean;
  onAcknowledge: (id: string) => void;
  acknowledgeLoading: string | null;
  onRunDetection: () => void;
  isRunningDetection: boolean;
}) {
  const [page, setPage] = useState(1);
  const pageSize = 8;
  const paginatedRows = useMemo(() => paginateList(rows, { page, pageSize }), [rows, page]);

  React.useEffect(() => {
    setPage(1);
  }, [rows.length]);

  return (
    <Card className="overflow-hidden border-sabc-gray-200">
      <CardHeader className="border-b border-sabc-gray-100">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle>Liste des alertes</CardTitle>
            <CardDescription>
              {rows.length.toLocaleString('fr-FR')} alerte(s) affichée(s)
              {activeFilter !== 'all' ? ` sur ${totalRows.length.toLocaleString('fr-FR')}` : ''}.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onRunDetection}
              disabled={isRunningDetection}
            >
              <Zap className={`mr-2 h-4 w-4 ${isRunningDetection ? 'animate-pulse' : ''}`} />
              {isRunningDetection ? 'Détection en cours…' : 'Lancer la détection'}
            </Button>
            <Button variant="outline" size="sm" onClick={onRefresh} disabled={isFetching}>
              <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
              Rafraîchir
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {rows.length === 0 ? (
          <div className="py-10 text-center text-sabc-gray-500">
            <p className="font-medium">Aucune alerte détectée</p>
            <p className="text-sm">
              {activeFilter === 'all'
                ? 'Aucune anomalie bloquante sur la période.'
                : `Aucune alerte ${getSeverityLabel(activeFilter)} pour la sélection courante.`}
            </p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Priorité</TableHead>
                  <TableHead>Signal</TableHead>
                  <TableHead>Collaborateur</TableHead>
                  <TableHead>Indicateur</TableHead>
                  <TableHead>Action recommandée</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedRows.items.map((row, index) => {
                  const config = SEVERITY_CONFIG[row.severite] || SEVERITY_CONFIG.info;
                  const rowKey = `${row.type}-${row.matricule ?? 'global'}-${index}`;
                  const isAcknowledging = acknowledgeLoading !== null && row.id === acknowledgeLoading;
                  return (
                    <TableRow
                      key={rowKey}
                      className={cn(
                        row.resolue && 'opacity-60',
                      )}
                    >
                      <TableCell>
                        <Badge variant={config.badgeVariant}>{config.label}</Badge>
                        <div className="mt-1 text-xs text-sabc-gray-500">{config.delay}</div>
                      </TableCell>
                      <TableCell className="min-w-[220px]">
                        <div className="font-medium text-sabc-gray-900">{formatTypeLabel(row.type)}</div>
                        <div className="mt-1 text-xs leading-5 text-sabc-gray-500">{row.description}</div>
                      </TableCell>
                      <TableCell>{row.matricule || 'Analyse globale'}</TableCell>
                      <TableCell className="font-medium text-sabc-gray-700">{buildSignalMetric(row)}</TableCell>
                      <TableCell className="max-w-md text-sabc-gray-600">{buildActionLabel(row)}</TableCell>
                      <TableCell>
                        {row.resolue === true ? (
                          <Badge variant="secondary" className="gap-1 bg-sabc-gray-100 text-sabc-gray-500">
                            <CheckCircle2 className="h-3 w-3" />
                            Résolu
                          </Badge>
                        ) : row.id ? (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={isAcknowledging}
                            onClick={() => onAcknowledge(row.id!)}
                            className="gap-1"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            {isAcknowledging ? 'En cours…' : 'Marquer résolu'}
                          </Button>
                        ) : (
                          <span className="text-xs text-sabc-gray-400">n.d.</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {rows.length > pageSize && (
              <div className="border-t border-sabc-gray-100 px-4 py-3">
                <Pagination className="justify-end">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => setPage((current) => Math.max(1, current - 1))}
                        aria-disabled={page === 1}
                        className={page === 1 ? 'pointer-events-none opacity-50' : ''}
                      />
                    </PaginationItem>
                    {Array.from({ length: paginatedRows.pageCount }, (_, index) => index + 1).map((pageNumber) => (
                      <PaginationItem key={pageNumber}>
                        <PaginationLink isActive={page === pageNumber} onClick={() => setPage(pageNumber)}>{pageNumber}</PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext
                        onClick={() => setPage((current) => Math.min(paginatedRows.pageCount, current + 1))}
                        aria-disabled={page === paginatedRows.pageCount}
                        className={page === paginatedRows.pageCount ? 'pointer-events-none opacity-50' : ''}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
