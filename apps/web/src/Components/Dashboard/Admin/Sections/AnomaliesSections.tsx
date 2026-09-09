import React, { useMemo, useState } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, RefreshCw, Shield, Siren, TriangleAlert, Zap } from 'lucide-react';
import { Badge } from '@/Components/UI/Badge/Badge';
import { Button } from '@/Components/UI/Button/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/UI/Card/Card';
import { Progress } from '@/Components/UI/Progress/Progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/UI/Table/Table';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/Components/UI/Pagination';
import { EmptyState } from '@/Components/Dashboard/RoleDashboardShared';
import { paginateList } from '@/utils/adminUi';
import { cn } from '@/utils/helpers';

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

const SEVERITY_CONFIG: Record<string, { icon: React.ElementType; color: string; badgeVariant: 'destructive' | 'secondary' | 'outline' }> = {
  critical: { icon: AlertTriangle, color: '#E53E3E', badgeVariant: 'destructive' },
  warning: { icon: AlertCircle, color: '#D69E2E', badgeVariant: 'secondary' },
  info: { icon: Info, color: '#3182CE', badgeVariant: 'outline' },
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
      return 'Divergence auto vs externes';
    case 'baisse_performance':
      return 'Baisse de performance';
    case 'uniformite_evaluations':
      return 'Uniformité des notations';
    case 'biais_evaluateur':
      return 'Biais évaluateur';
    default:
      return type.replace(/_/g, ' ');
  }
}

function buildSignalMetric(row: AnomalyRow) {
  const details = row.details ?? {};

  if (typeof details.ecart === 'number') {
    return `${details.ecart.toFixed(1)} pt d'écart`;
  }

  if (typeof details.progression === 'number') {
    return `${Math.abs(details.progression).toFixed(1)} pt sur 3 mois`;
  }

  if (typeof details.variance === 'number') {
    return `Variance ${details.variance.toFixed(2)}`;
  }

  if (typeof details.nb_evaluations === 'number') {
    return `${details.nb_evaluations} évaluations concernées`;
  }

  return 'Signal consolidé par analytics';
}

function buildActionLabel(row: AnomalyRow) {
  if (row.type === 'divergence_auto_vs_autres') {
    return 'Comparer les écarts par cycle et déclencher une revue managériale ciblée.';
  }

  if (row.type === 'baisse_performance') {
    return 'Vérifier les évaluations récentes et activer un plan d’accompagnement court terme.';
  }

  if (row.type === 'uniformite_evaluations') {
    return 'Contrôler la qualité de notation et rebriefer l’évaluateur sur les critères.';
  }

  if (row.type === 'biais_evaluateur') {
    return 'Auditer le pattern de notation puis corriger avec calibration transverse.';
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
  const criticalShare = total > 0 ? ((severityStats.critical ?? 0) / total) * 100 : 0;
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
  const summaryCards = [
    { label: 'Alertes ouvertes', value: total, color: '#111827', icon: Shield, caption: 'Flux agrégé temps réel' },
    { label: 'Critiques', value: severityStats.critical ?? 0, color: '#E53E3E', icon: AlertTriangle, caption: 'Traitement prioritaire' },
    { label: 'Avertissements', value: severityStats.warning ?? 0, color: '#D69E2E', icon: AlertCircle, caption: 'Nécessitent calibration' },
    { label: 'Surveillance', value: severityStats.info ?? 0, color: '#3182CE', icon: Info, caption: 'Signaux à suivre' },
  ];

  return (
    <div className="space-y-5">
      <Card className="overflow-hidden border-sabc-gray-200/80 bg-[radial-gradient(circle_at_top_right,_rgba(229,62,62,0.08),_transparent_35%),linear-gradient(180deg,_rgba(255,255,255,1),_rgba(248,250,252,0.92))] shadow-sm">
        <CardContent className="grid gap-5 p-6 xl:grid-cols-[1.3fr,0.7fr]">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-sabc-red-primary">
              <Siren className="h-4 w-4" />
              Centre de supervision
            </div>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-sabc-gray-900">
              Alertes et anomalies pilotées sur les données réelles
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-sabc-gray-600">
              Suivez en temps réel les anomalies et incohérences détectées sur les évaluations,
              priorisez les alertes critiques et traitez-les avant qu'elles n'impactent les résultats.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              {FILTERS.map((filter) => {
                const isActive = activeFilter === filter.value;
                const count =
                  filter.value === 'all'
                    ? total
                    : Number(severityStats[filter.value] ?? 0);

                return (
                  <button
                    key={filter.value}
                    type="button"
                    onClick={() => onFilterChange(filter.value)}
                    className={cn(
                      'inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'border-sabc-red-primary bg-sabc-red-primary text-white shadow-sm'
                        : 'border-sabc-gray-200 bg-white text-sabc-gray-700 hover:border-sabc-red-primary/30 hover:text-sabc-red-primary',
                    )}
                  >
                    <span>{filter.label}</span>
                    <span className={cn(
                      'rounded-full px-2 py-0.5 text-[11px] font-semibold',
                      isActive ? 'bg-white/20 text-white' : 'bg-sabc-gray-100 text-sabc-gray-700',
                    )}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <div className="rounded-2xl border border-sabc-gray-200/80 bg-white/85 p-4 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-sabc-gray-500">Charge critique</div>
              <div className="mt-2 text-2xl font-semibold text-sabc-gray-900">{criticalShare.toFixed(0)}%</div>
              <p className="mt-1 text-sm text-sabc-gray-500">Part des alertes qui demandent une intervention rapide.</p>
            </div>
            <div className="rounded-2xl border border-sabc-gray-200/80 bg-white/85 p-4 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-sabc-gray-500">Vue active</div>
              <div className="mt-2 text-lg font-semibold text-sabc-gray-900">
                {activeFilter === 'all' ? 'Toutes les alertes' : `Alertes ${getSeverityLabel(activeFilter)}`}
              </div>
              <p className="mt-1 text-sm text-sabc-gray-500">
                {activeFilter === 'all'
                  ? 'Surveillance globale de la plateforme.'
                  : 'Filtre utile pour traiter les lots par niveau d’urgence.'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => {
          const IconComp = card.icon;
          return (
            <Card key={card.label} className="overflow-hidden border-sabc-gray-200/80 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl" style={{ backgroundColor: `${card.color}18` }}>
                    <IconComp className="h-5 w-5" style={{ color: card.color }} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-sabc-gray-600">{card.label}</div>
                    <div className="text-2xl font-bold text-sabc-gray-900">{card.value}</div>
                    <div className="mt-1 text-xs text-sabc-gray-500">{card.caption}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.15fr,0.85fr]">
        <Card className="overflow-hidden border-sabc-gray-200/80 shadow-sm">
          <CardHeader className="border-b border-sabc-gray-100 bg-gradient-to-r from-white to-sabc-gray-50">
            <CardTitle className="flex items-center gap-2">
              <TriangleAlert className="h-5 w-5 text-sabc-red-primary" />
              Priorités immédiates
            </CardTitle>
            <CardDescription>Les alertes les plus risquées sont remontées en premier pour agir vite.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-6">
            {immediateRows.length === 0 ? (
              <EmptyState message="Aucune alerte prioritaire pour le moment." />
            ) : (
              immediateRows.map((row, index) => {
                const config = SEVERITY_CONFIG[row.severite] || SEVERITY_CONFIG.info;
                const IconComp = config.icon;

                return (
                  <div key={`${row.type}-${row.matricule ?? 'global'}-${index}`} className="rounded-2xl border border-sabc-gray-200/80 bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ backgroundColor: `${config.color}18` }}>
                            <IconComp className="h-4 w-4" style={{ color: config.color }} />
                          </span>
                          <div>
                            <div className="font-medium text-sabc-gray-900">{formatTypeLabel(row.type)}</div>
                            <div className="text-xs text-sabc-gray-500">{row.matricule ?? 'Analyse globale'}</div>
                          </div>
                        </div>
                        <p className="mt-3 text-sm leading-6 text-sabc-gray-600">{row.description}</p>
                      </div>
                      <Badge variant={config.badgeVariant}>{row.severite}</Badge>
                    </div>
                    <div className="mt-4 rounded-2xl bg-sabc-gray-50 px-3 py-2">
                      <div className="text-[11px] font-semibold uppercase tracking-wide text-sabc-gray-500">
                        Action recommandée
                      </div>
                      <p className="mt-1 text-sm leading-5 text-sabc-gray-600">{buildActionLabel(row)}</p>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-sabc-gray-200/80 shadow-sm">
          <CardHeader className="border-b border-sabc-gray-100 bg-gradient-to-r from-white to-sabc-gray-50">
            <CardTitle>Signaux récurrents</CardTitle>
            <CardDescription>Typologies qui reviennent le plus souvent dans les seeds et calculs analytics.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            {topTypes.length === 0 ? (
              <EmptyState message="Aucun signal récurrent disponible." />
            ) : (
              topTypes.map(([label, count]) => (
                <div key={label} className="rounded-2xl border border-sabc-gray-200/80 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium text-sabc-gray-900">{label}</span>
                    <Badge variant="info">{count}</Badge>
                  </div>
                  <Progress value={count} max={topTypeMax} className="mt-4 h-2.5" />
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
    <Card className="overflow-hidden border-sabc-gray-200/80 shadow-sm">
      <CardHeader className="border-b border-sabc-gray-100 bg-gradient-to-r from-white to-sabc-gray-50">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-sabc-red-primary" />
              File opérationnelle des alertes
            </CardTitle>
            <CardDescription>
              {rows.length} alerte(s) affichée(s)
              {activeFilter !== 'all' ? ` sur ${totalRows.length}` : ''} pour le filtre courant.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onRunDetection}
              disabled={isRunningDetection}
            >
              <Zap className={`mr-2 h-4 w-4 ${isRunningDetection ? 'animate-pulse' : ''}`} />
              {isRunningDetection ? 'Détection...' : 'Lancer détection'}
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
            <Shield className="mx-auto mb-3 h-12 w-12 text-sabc-gray-300" />
            <p className="font-medium">Aucune alerte détectée</p>
            <p className="text-sm">
              {activeFilter === 'all'
                ? 'Le système ne remonte pas de signal bloquant sur la fenêtre actuelle.'
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
                  const IconComp = config.icon;
                  const rowKey = `${row.type}-${row.matricule ?? 'global'}-${index}`;
                  const isAcknowledging = acknowledgeLoading !== null && row.id === acknowledgeLoading;
                  return (
                    <TableRow
                      key={rowKey}
                      className={cn(
                        row.resolue && 'opacity-60',
                        !row.resolue && row.severite === 'critical' && 'bg-red-50/40',
                        !row.resolue && row.severite === 'warning' && 'bg-amber-50/30',
                      )}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ backgroundColor: `${config.color}18` }}>
                            <IconComp className="h-4 w-4" style={{ color: config.color }} />
                          </span>
                          <div>
                            <Badge variant={config.badgeVariant}>{row.severite}</Badge>
                            <div className="mt-1 text-xs text-sabc-gray-500">
                              {row.severite === 'critical' ? 'Action < 24h' : row.severite === 'warning' ? 'Revue 48h' : 'Surveillance'}
                            </div>
                          </div>
                        </div>
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
                            className="gap-1 border-green-300 text-green-700 hover:bg-green-50"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            {isAcknowledging ? 'En cours…' : 'Marquer résolu'}
                          </Button>
                        ) : (
                          <span className="text-xs text-sabc-gray-400">—</span>
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
