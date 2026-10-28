import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/UI/Card/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/UI/Table/Table';
import { TruncatedTableBody } from '@/Components/UI/TruncatedList/TruncatedList';
import { EmptyState } from '@/Components/Dashboard/RoleDashboardShared';
import { KpiCard, KpiGrid } from '@/Components/UI/KpiCard';
import {
  CHART_COLORS,
  CHART_TICK,
  PERCENT_DOMAIN,
  PERCENT_TICKS,
  SCORE_DOMAIN,
  SCORE_TICKS,
  formatChartNumber,
  formatChartPercent,
  formatChartScore,
  frenchTick,
} from '@/Components/UI/Charts/chartTheme';
import { formatPercent, formatScore } from '@/utils/helpers';

type ValueKind = 'score' | 'percent' | 'count';

function formatByKind(value: unknown, kind: ValueKind) {
  if (kind === 'score') return formatChartScore(value);
  if (kind === 'percent') return formatChartPercent(value);
  return formatChartNumber(value, 0);
}

function ChartTooltip({
  active,
  payload,
  label,
  kinds,
}: {
  active?: boolean;
  payload?: any[];
  label?: string;
  kinds: Record<string, ValueKind>;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-sabc-gray-200 bg-white px-3 py-2">
      {label && <div className="mb-1 text-xs font-semibold text-sabc-gray-700">{label}</div>}
      {payload.map((e: any) => (
        <div key={e.name} className="flex items-center gap-2 text-sm">
          <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: e.color }} />
          <span className="text-sabc-gray-600">{e.name}</span>
          <span className="ml-auto font-semibold tabular-nums text-sabc-gray-900">
            {formatByKind(e.value, kinds[e.dataKey] ?? 'count')}
          </span>
        </div>
      ))}
    </div>
  );
}

type RolePerformanceEntry = {
  role: string;
  count?: number;
  completion?: number;
  avgScore?: number;
};

type ChannelPerformanceEntry = {
  channel: string;
  average_score?: number;
  count?: number;
};

/** Valeur numérique exploitable, ou null si la mesure est absente. */
function toMeasure(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/** Les rôles sans mesure restent visibles (barre vide) mais ne valent pas 0 dans le tooltip. */
function withNullMeasures(rows: RolePerformanceEntry[], key: 'avgScore' | 'completion') {
  return rows.map((row) => ({ ...row, [key]: toMeasure(row[key]) }));
}

export function RoleAnalysisSummarySection({
  roleCount,
  globalAverage,
  channelCount,
}: {
  roleCount: number;
  globalAverage: number | null;
  channelCount: number;
}) {
  const average = roleCount > 0 ? toMeasure(globalAverage) : null;
  return (
    <KpiGrid className="lg:grid-cols-3">
      <KpiCard label="Rôles analysés" value={roleCount.toLocaleString('fr-FR')} />
      <KpiCard label="Score moyen global" value={average === null ? null : formatScore(average)} />
      <KpiCard label="Canaux d'évaluation" value={channelCount.toLocaleString('fr-FR')} />
    </KpiGrid>
  );
}

export function RoleScoreChartSection({ rows }: { rows: RolePerformanceEntry[] }) {
  const data = withNullMeasures(rows, 'avgScore');
  return (
    <Card>
      <CardHeader>
        <CardTitle>Score moyen par rôle</CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <EmptyState message="Aucune donnée de rôle." />
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} layout="vertical" margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
                <XAxis type="number" domain={SCORE_DOMAIN} ticks={SCORE_TICKS} tickFormatter={frenchTick} tickLine={false} axisLine={false} tick={CHART_TICK} />
                <YAxis dataKey="role" type="category" tickLine={false} axisLine={false} tick={CHART_TICK} width={120} />
                <Tooltip cursor={{ fill: 'rgba(0,0,0,0.04)' }} content={<ChartTooltip kinds={{ avgScore: 'score' }} />} />
                <Bar dataKey="avgScore" name="Score moyen" fill={CHART_COLORS.primary} radius={[0, 4, 4, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function RoleCompletionChartSection({ rows }: { rows: RolePerformanceEntry[] }) {
  const data = withNullMeasures(rows, 'completion');
  return (
    <Card>
      <CardHeader>
        <CardTitle>Taux de complétion par rôle</CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <EmptyState message="Aucune donnée de rôle." />
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} layout="vertical" margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
                <XAxis type="number" domain={PERCENT_DOMAIN} ticks={PERCENT_TICKS} tickFormatter={frenchTick} tickLine={false} axisLine={false} tick={CHART_TICK} />
                <YAxis dataKey="role" type="category" tickLine={false} axisLine={false} tick={CHART_TICK} width={120} />
                <Tooltip cursor={{ fill: 'rgba(0,0,0,0.04)' }} content={<ChartTooltip kinds={{ completion: 'percent' }} />} />
                <Bar dataKey="completion" name="Complétion" fill={CHART_COLORS.secondary} radius={[0, 4, 4, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function ChannelPerformanceSection({ channels }: { channels: ChannelPerformanceEntry[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance par type d'évaluation</CardTitle>
        <CardDescription>Score moyen (axe de gauche) et nombre d'évaluations (axe de droite) par canal.</CardDescription>
      </CardHeader>
      <CardContent>
        {channels.length === 0 ? (
          <EmptyState message="Aucune donnée de canal." />
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={channels} margin={{ top: 10, right: 0, left: -10, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
                <XAxis dataKey="channel" tickLine={false} axisLine={false} tick={CHART_TICK} />
                <YAxis yAxisId="score" domain={SCORE_DOMAIN} ticks={SCORE_TICKS} tickFormatter={frenchTick} tickLine={false} axisLine={false} tick={CHART_TICK} />
                <YAxis yAxisId="count" orientation="right" allowDecimals={false} tickFormatter={frenchTick} tickLine={false} axisLine={false} tick={CHART_TICK} />
                <Tooltip cursor={{ fill: 'rgba(0,0,0,0.04)' }} content={<ChartTooltip kinds={{ average_score: 'score', count: 'count' }} />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar yAxisId="score" dataKey="average_score" name="Score moyen" fill={CHART_COLORS.primary} radius={[4, 4, 0, 0]} barSize={18} />
                <Bar yAxisId="count" dataKey="count" name="Nombre d'évaluations" fill={CHART_COLORS.tertiary} radius={[4, 4, 0, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function RoleDetailsTableSection({
  rows,
  globalAverage,
}: {
  rows: RolePerformanceEntry[];
  globalAverage: number | null;
}) {
  const average = toMeasure(globalAverage);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Détail par rôle</CardTitle>
        <CardDescription>Effectif, score, complétion et écart à la moyenne globale.</CardDescription>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <EmptyState message="Aucune donnée de rôle." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rôle</TableHead>
                <TableHead className="text-right">Effectif</TableHead>
                <TableHead className="text-right">Score moyen</TableHead>
                <TableHead className="text-right">Complétion</TableHead>
                <TableHead className="text-right">Écart à la moyenne</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TruncatedTableBody
                items={rows}
                previewCount={10}
                colSpan={5}
                keyExtractor={(role, i) => `${role.role}-${i}`}
                renderRow={(role, i) => {
                  const score = toMeasure(role.avgScore);
                  const delta = score !== null && average !== null ? score - average : null;
                  return (
                    <TableRow key={`${role.role}-${i}`}>
                      <TableCell className="font-medium">{role.role}</TableCell>
                      <TableCell className="text-right tabular-nums">{toMeasure(role.count)?.toLocaleString('fr-FR') ?? 'n.d.'}</TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">{formatScore(score)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatPercent(toMeasure(role.completion))}</TableCell>
                      <TableCell className="text-right tabular-nums text-sabc-gray-700">
                        {delta === null
                          ? 'n.d.'
                          : `${delta > 0 ? '+' : ''}${delta.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                      </TableCell>
                    </TableRow>
                  );
                }}
              />
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
