import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  LabelList,
  Line,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useCountUp } from '@/Hooks/useCountUp';
import { Button } from '@/Components/UI/Button/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/UI/Card/Card';
import { EmptyState } from '@/Components/Dashboard/RoleDashboardShared';
import { Label } from '@/Components/UI/Label/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/UI/Select/Select';
import { analyticsApi } from '@/Services/api';
import { formatPercent, formatScore } from '@/utils/helpers';
import {
  CHART_COLORS,
  CHART_SERIES,
  CHART_TICK,
  SCORE_DOMAIN,
  SCORE_TICKS,
  formatChartNumber,
  frenchTick,
} from '@/Components/UI/Charts/chartTheme';

const STATUS_COLORS = CHART_SERIES;

/** Nombre décimal au format français (« 0,25 »). */
function formatDecimal(value: number, digits = 2) {
  return value.toLocaleString('fr-FR', { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

type OverviewMetric = {
  title: string;
  /** Valeur animée; null quand la mesure n'existe pas encore. */
  count: number | null;
  format: (value: number) => string;
  caption: string;
};

type TrendEntry = {
  period: string;
  score: number;
  count: number;
};

type StatusEntry = {
  name: string;
  value: number;
  color?: string;
};

type ChannelEntry = {
  channel: string;
  average_score: number;
  count?: number;
  total?: number;
};

type RegionActivityEntry = {
  region: string;
  utilisateurs: number;
  evaluations: number;
};

type TopRoleEntry = {
  role: string;
  count?: number;
  completion?: number;
  avgScore?: number;
};

function OverviewMetricCell({ title, count, format, caption, index }: OverviewMetric & { index: number }) {
  const animated = useCountUp(count ?? 0);
  const value = count === null ? 'n.d.' : format(animated);
  return (
    <div
      className="sabc-rise -mb-px -mr-px border-b border-r border-sabc-gray-200 px-5 py-4 dark:border-sabc-gray-700"
      style={{ '--sabc-i': index } as React.CSSProperties}
    >
      <div className="text-sm text-sabc-gray-500 dark:text-sabc-gray-400">{title}</div>
      <div className="mt-1 sabc-display text-3xl tabular-nums text-sabc-gray-900 dark:text-white">
        {value}
      </div>
      <div className="mt-1 text-xs text-sabc-gray-500 dark:text-sabc-gray-400">{caption}</div>
    </div>
  );
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ color?: string; name?: string; value?: number | string }>;
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const visiblePayload = payload.filter((entry) => entry.name !== 'Tendance');
  const formatTooltipValue = (value: number | string | undefined) => {
    if (typeof value !== 'number' || !Number.isFinite(value)) return value ?? 'n.d.';
    return Number.isInteger(value) ? value.toLocaleString('fr-FR') : formatDecimal(value);
  };

  return (
    <div className="rounded-lg border border-sabc-gray-200 bg-white px-3 py-2 dark:border-sabc-gray-700 dark:bg-sabc-gray-100">
      {label ? <div className="mb-2 text-xs font-semibold text-sabc-gray-500">{label}</div> : null}
      <div className="space-y-1.5">
        {visiblePayload.map((entry) => (
          <div key={entry.name} className="flex items-center justify-between gap-4 text-sm">
            <div className="flex items-center gap-2 text-sabc-gray-600">
              <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: entry.color }} />
              <span>{entry.name}</span>
            </div>
            <span className="font-semibold text-sabc-gray-900">{formatTooltipValue(entry.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminOverviewMetricsSection({
  totalEvaluations,
  uniqueUsers,
  averageScore,
  completionRate,
  validatedEvaluations,
}: {
  totalEvaluations: number;
  uniqueUsers: number;
  averageScore: number;
  completionRate: number;
  validatedEvaluations: number;
}) {
  // Sans évaluation, une moyenne ou un taux à 0 se lirait comme une contre-performance.
  const hasData = totalEvaluations > 0;
  const metrics: OverviewMetric[] = [
    {
      title: 'Évaluations',
      count: totalEvaluations,
      format: (v) => Math.round(v).toLocaleString('fr-FR'),
      caption: 'Total sur la période',
    },
    {
      title: 'Collaborateurs évalués',
      count: uniqueUsers,
      format: (v) => Math.round(v).toLocaleString('fr-FR'),
      caption: 'Personnes ayant reçu au moins une évaluation',
    },
    {
      title: 'Score moyen',
      count: hasData ? averageScore : null,
      format: (v) => formatScore(v),
      caption: hasData ? 'Moyenne des évaluations notées' : 'Aucune évaluation notée',
    },
    {
      title: 'Taux de complétion',
      count: hasData ? completionRate : null,
      format: (v) => formatPercent(v),
      caption: hasData ? `${validatedEvaluations.toLocaleString('fr-FR')} validées sur ${totalEvaluations.toLocaleString('fr-FR')}` : 'Aucune évaluation attendue',
    },
  ];

  return (
    <div className="grid overflow-hidden rounded-lg border border-sabc-gray-200 bg-white dark:border-sabc-gray-700 dark:bg-sabc-gray-900 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric, index) => (
        <OverviewMetricCell key={metric.title} index={index} {...metric} />
      ))}
    </div>
  );
}

export function PerformanceTrendSection({ trendData }: { trendData: TrendEntry[] }) {
  const latestEntry = trendData[trendData.length - 1];
  const previousEntry = trendData[trendData.length - 2];
  const variation = latestEntry && previousEntry ? latestEntry.score - previousEntry.score : null;

  return (
    <Card className="xl:col-span-2">
      <CardHeader>
        <CardTitle>Tendance de performance</CardTitle>
        <CardDescription>Évolution du score moyen et du nombre d'évaluations par période.</CardDescription>
      </CardHeader>
      <CardContent>
        {trendData.length === 0 ? (
          <EmptyState message="Aucune tendance disponible." />
        ) : (
          <div className="space-y-5">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-lg border border-sabc-gray-200 px-4 py-3 dark:border-sabc-gray-700">
                <div className="text-sm text-sabc-gray-500">Dernière période</div>
                <div className="mt-1 text-lg font-semibold text-sabc-gray-900">{latestEntry?.period ?? 'n.d.'}</div>
              </div>
              <div className="rounded-lg border border-sabc-gray-200 px-4 py-3 dark:border-sabc-gray-700">
                <div className="text-sm text-sabc-gray-500">Dernier score</div>
                <div className="mt-1 text-lg font-semibold tabular-nums text-sabc-gray-900">{formatScore(latestEntry?.score)}</div>
              </div>
              <div className="rounded-lg border border-sabc-gray-200 px-4 py-3 dark:border-sabc-gray-700">
                <div className="text-sm text-sabc-gray-500">Variation sur la période précédente</div>
                <div className="mt-1 text-lg font-semibold tabular-nums text-sabc-gray-900">
                  {variation === null ? 'n.d.' : `${variation > 0 ? '+' : ''}${formatDecimal(variation)}`}
                </div>
              </div>
            </div>

            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={trendData} margin={{ top: 22, right: 8, left: -10, bottom: 0 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
                  <XAxis dataKey="period" tickLine={false} axisLine={false} tick={CHART_TICK} />
                  <YAxis yAxisId="left" domain={SCORE_DOMAIN} ticks={SCORE_TICKS} tickFormatter={frenchTick} tickLine={false} axisLine={false} width={34} tick={CHART_TICK} />
                  <YAxis yAxisId="right" orientation="right" tickLine={false} axisLine={false} width={40} allowDecimals={false} tickFormatter={frenchTick} tick={CHART_TICK} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <ReferenceLine yAxisId="left" y={3.5} stroke={CHART_COLORS.secondary} strokeDasharray="4 4" />
                  <Bar yAxisId="right" dataKey="count" fill={CHART_COLORS.tertiary} name="Évaluations" radius={[4, 4, 0, 0]} barSize={20}>
                    <LabelList dataKey="count" position="top" fill={CHART_COLORS.tick} fontSize={10} formatter={(value: number) => formatChartNumber(value, 0)} />
                  </Bar>
                  <Line yAxisId="left" type="monotone" dataKey="score" stroke={CHART_COLORS.primary} strokeWidth={2} dot={{ r: 3, fill: CHART_COLORS.primary }} activeDot={{ r: 5 }} name="Score moyen">
                    <LabelList dataKey="score" position="top" formatter={(value: number) => formatDecimal(value)} fill={CHART_COLORS.emphasis} fontSize={10} />
                  </Line>
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function StatusDistributionSection({ statusData }: { statusData: StatusEntry[] }) {
  const total = statusData.reduce((sum, status) => sum + Number(status.value ?? 0), 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Répartition des statuts</CardTitle>
        <CardDescription>Statut actuel des évaluations.</CardDescription>
      </CardHeader>
      <CardContent>
        {statusData.length === 0 ? (
          <EmptyState message="Aucun statut disponible." />
        ) : (
          <>
            <div className="relative h-60">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={58} outerRadius={84} paddingAngle={4}>
                    {statusData.map((status, index) => (
                      <Cell key={status.name} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-xs text-sabc-gray-500">Total</div>
                  <div className="mt-1 text-2xl font-semibold tabular-nums text-sabc-gray-900">{total.toLocaleString('fr-FR')}</div>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              {statusData.map((status) => (
                <div key={status.name} className="rounded-lg border border-sabc-gray-200 px-3 py-2">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-sabc-gray-700 dark:text-sabc-gray-200">{status.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs tabular-nums text-sabc-gray-500">
                        {total > 0 ? formatPercent((status.value / total) * 100) : 'n.d.'}
                      </span>
                      <span className="text-sm font-semibold tabular-nums text-sabc-gray-900">{Number(status.value ?? 0).toLocaleString('fr-FR')}</span>
                    </div>
                  </div>
                  <div className="mt-2 h-1.5 rounded-sm bg-sabc-gray-100">
                    <div
                      className="h-full rounded-sm"
                      style={{
                        width: `${total > 0 ? (status.value / total) * 100 : 0}%`,
                        backgroundColor: STATUS_COLORS[statusData.indexOf(status) % STATUS_COLORS.length],
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export function ChannelBreakdownSection({ channelData }: { channelData: ChannelEntry[] }) {
  const normalizedData = [...channelData]
    .map((channel) => ({
      ...channel,
      volume: Number(channel.count ?? channel.total ?? 0),
      label: channel.channel,
    }))
    .sort((left, right) => right.average_score - left.average_score);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Canaux d’évaluation</CardTitle>
        <CardDescription>Score moyen et nombre d’évaluations par type.</CardDescription>
      </CardHeader>
      <CardContent>
        {normalizedData.length === 0 ? (
          <EmptyState message="Aucun canal d’évaluation disponible." />
        ) : (
          <div className="space-y-5">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={normalizedData} layout="vertical" margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                  <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
                  <XAxis type="number" domain={SCORE_DOMAIN} ticks={SCORE_TICKS} tickFormatter={frenchTick} tickLine={false} axisLine={false} tick={CHART_TICK} />
                  <YAxis type="category" dataKey="label" width={110} tickLine={false} axisLine={false} tick={CHART_TICK} />
                  <Tooltip cursor={{ fill: 'rgba(0,0,0,0.04)' }} content={<ChartTooltip />} />
                  <Bar dataKey="average_score" fill={CHART_COLORS.primary} name="Score moyen" radius={[0, 4, 4, 0]} barSize={18} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {normalizedData.map((channel) => (
                <div key={channel.label} className="rounded-lg border border-sabc-gray-200 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium text-sabc-gray-900">{channel.label}</span>
                    <span className="text-sm tabular-nums text-sabc-gray-600">{channel.volume.toLocaleString('fr-FR')}</span>
                  </div>
                  <div className="mt-1 text-sm text-sabc-gray-500">{formatScore(channel.average_score, 2)} de moyenne</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function RegionalActivitySection({ regionData }: { regionData: RegionActivityEntry[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Activité par région</CardTitle>
        <CardDescription>Nombre d'utilisateurs et d'évaluations par région.</CardDescription>
      </CardHeader>
      <CardContent>
        {regionData.length === 0 ? (
          <EmptyState message="Aucune donnée régionale disponible." />
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={regionData} margin={{ top: 22, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
                <XAxis dataKey="region" tickLine={false} axisLine={false} tick={CHART_TICK} />
                <YAxis tickLine={false} axisLine={false} width={40} allowDecimals={false} tickFormatter={frenchTick} tick={CHART_TICK} />
                <Tooltip cursor={{ fill: 'rgba(0,0,0,0.04)' }} content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="evaluations" fill={CHART_COLORS.primary} name="Évaluations" radius={[4, 4, 0, 0]} barSize={14}>
                  <LabelList dataKey="evaluations" position="top" fill={CHART_COLORS.tick} fontSize={10} formatter={(value: number) => formatChartNumber(value, 0)} />
                </Bar>
                <Bar dataKey="utilisateurs" fill={CHART_COLORS.secondary} name="Utilisateurs" radius={[4, 4, 0, 0]} barSize={14}>
                  <LabelList dataKey="utilisateurs" position="top" fill={CHART_COLORS.tick} fontSize={10} formatter={(value: number) => formatChartNumber(value, 0)} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function TopRolesSection({
  topRoles,
  dateRange,
}: {
  topRoles: TopRoleEntry[];
  dateRange?: { start_date?: string; end_date?: string };
}) {
  const [scoreType, setScoreType] = useState<'global' | 'auto' | 'pairs' | 'descendante'>('global');
  const [topCount, setTopCount] = useState('6');

  const { data: roleAnalytics, isPending: rolesPending } = useQuery({
    queryKey: ['admin', 'dashboard', 'role-ranking', dateRange?.start_date, dateRange?.end_date, scoreType],
    queryFn: () => analyticsApi.adminRoles({
      ...dateRange,
      ...(scoreType === 'global' ? {} : { type_evaluation: scoreType }),
    }).then((response) => response.data),
  });

  const roleRows = Array.isArray(roleAnalytics?.roles)
    ? roleAnalytics.roles.slice(0, Number(topCount))
    : scoreType === 'global' ? topRoles.slice(0, Number(topCount)) : [];
  const scoreTypes = [
    { value: 'global', label: 'Score général' },
    { value: 'auto', label: 'Auto-évaluation' },
    { value: 'pairs', label: 'Évaluation par les pairs' },
    { value: 'descendante', label: 'Évaluation descendante' },
  ] as const;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rôles les plus performants</CardTitle>
        <CardDescription>Classement des rôles selon l’axe d’analyse sélectionné.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <div className="space-y-1">
            <Label htmlFor="ranking-axis">Axe d’analyse</Label>
            <Select value={scoreType} onValueChange={(value: typeof scoreType) => setScoreType(value)}>
              <SelectTrigger id="ranking-axis"><SelectValue /></SelectTrigger>
              <SelectContent>
                {scoreTypes.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="ranking-count">Nombre de résultats</Label>
            <Select value={topCount} onValueChange={setTopCount}>
              <SelectTrigger id="ranking-count"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="6">Top 6</SelectItem>
                <SelectItem value="10">Top 10</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {rolesPending ? (
          <p role="status" className="py-6 text-center text-sm text-sabc-gray-500">Chargement du classement…</p>
        ) : roleRows.length === 0 ? (
          <EmptyState message="Aucune performance disponible pour cet axe." />
        ) : (
          <div className="space-y-2">
            {roleRows.map((role: TopRoleEntry, index: number) => (
              <div key={role.role} className="flex flex-col gap-3 rounded-lg border border-sabc-gray-200 p-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-8 text-sm font-semibold text-sabc-gray-500">{index + 1}.</span>
                  <div>
                    <div className="font-medium text-sabc-gray-900 dark:text-white">{role.role}</div>
                    <div className="text-sm text-sabc-gray-500 dark:text-sabc-gray-400">
                      {role.count == null ? 'n.d.' : role.count.toLocaleString('fr-FR')} utilisateur(s) · complétion {formatPercent(role.completion)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold tabular-nums text-sabc-gray-900">{formatScore(role.avgScore, 2)}</span>
                  <Link to="/admin/analytics?tab=roles"><Button variant="outline" size="sm">Analyse par rôle</Button></Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
