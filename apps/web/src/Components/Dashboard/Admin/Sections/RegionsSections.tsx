import React from 'react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/UI/Card/Card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/UI/Select/Select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/UI/Table/Table';
import { EmptyState } from '@/Components/Dashboard/RoleDashboardShared';
import { KpiCard, KpiGrid } from '@/Components/UI/KpiCard';
import { CHART_COLORS, CHART_TICK, formatChartNumber, frenchTick } from '@/Components/UI/Charts/chartTheme';
import { formatScore } from '@/utils/helpers';

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-sabc-gray-200 bg-white px-3 py-2">
      {label && <div className="mb-1 text-xs font-semibold text-sabc-gray-700">{label}</div>}
      {payload.map((e: any) => (
        <div key={e.name} className="flex items-center gap-2 text-sm">
          <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: e.color }} />
          <span className="text-sabc-gray-600">{e.name}</span>
          <span className="ml-auto font-semibold tabular-nums text-sabc-gray-900">{formatChartNumber(e.value, 0)}</span>
        </div>
      ))}
    </div>
  );
}

/** Nombre entier au format français, « n.d. » si absent. */
function formatCount(value: unknown) {
  return formatChartNumber(value, 0);
}

/** « a_ameliorer » devient « A ameliorer » : libellé lisible sans transformer le texte en majuscules. */
function formatCategoryLabel(label: string) {
  const text = label.replace(/_/g, ' ').trim();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

type RegionOption = {
  id_region: string | number;
  nom_region: string;
};

type RegionStats = {
  total_evaluations?: number;
  validees?: number;
  score_moyen?: number;
};

type InterRegionEntry = {
  region: string;
  utilisateurs: number;
  evaluations: number;
};

export function RegionSelectionSection({
  selectedRegion,
  onRegionChange,
  regions,
  stats,
}: Readonly<{
  selectedRegion: string;
  onRegionChange: (value: string) => void;
  regions: RegionOption[];
  stats: RegionStats | null | undefined;
}>) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Analyse régionale</CardTitle>
        <CardDescription>Volume d'évaluations et score moyen de la région sélectionnée.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="max-w-sm">
          <Select value={selectedRegion} onValueChange={onRegionChange}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner une région" />
            </SelectTrigger>
            <SelectContent>
              {regions.map((region) => (
                <SelectItem key={region.id_region} value={String(region.id_region)}>
                  {region.nom_region}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <KpiGrid className="lg:grid-cols-3">
          <KpiCard label="Évaluations" value={stats?.total_evaluations == null ? null : formatCount(stats.total_evaluations)} />
          <KpiCard label="Validées" value={stats?.validees == null ? null : formatCount(stats.validees)} />
          <KpiCard label="Score moyen" value={stats?.score_moyen == null ? null : formatScore(stats.score_moyen)} />
        </KpiGrid>
      </CardContent>
    </Card>
  );
}

export function InterRegionComparisonSection({ data }: Readonly<{ data: InterRegionEntry[] }>) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Comparaison entre régions</CardTitle>
        <CardDescription>Nombre d'utilisateurs et d'évaluations par région.</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <EmptyState message="Aucune donnée régionale." />
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
                <XAxis dataKey="region" tickLine={false} axisLine={false} tick={CHART_TICK} />
                <YAxis tickLine={false} axisLine={false} width={40} allowDecimals={false} tickFormatter={frenchTick} tick={CHART_TICK} />
                <Tooltip cursor={{ fill: 'rgba(0,0,0,0.04)' }} content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="evaluations" fill={CHART_COLORS.primary} name="Évaluations" radius={[4, 4, 0, 0]} barSize={16} />
                <Bar dataKey="utilisateurs" fill={CHART_COLORS.secondary} name="Utilisateurs" radius={[4, 4, 0, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function RegionalRankingSection({
  totalEvaluated,
  regionAverage,
  distribution,
}: Readonly<{
  totalEvaluated: number;
  regionAverage: number | null | undefined;
  distribution: Record<string, unknown>;
}>) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Classement régional</CardTitle>
        <CardDescription>Répartition des collaborateurs de la région sélectionnée.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <KpiGrid className="lg:grid-cols-2">
          <KpiCard label="Collaborateurs évalués" value={formatCount(totalEvaluated)} />
          <KpiCard label="Moyenne de la région" value={regionAverage == null ? null : formatScore(regionAverage)} />
        </KpiGrid>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Catégorie</TableHead>
              <TableHead className="text-right">Effectif</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Object.entries(distribution).map(([label, value]) => (
              <TableRow key={label}>
                <TableCell>{formatCategoryLabel(label)}</TableCell>
                <TableCell className="text-right tabular-nums">{formatCount(value)}</TableCell>
              </TableRow>
            ))}
            {Object.keys(distribution).length === 0 ? (
              <TableRow>
                <TableCell colSpan={2} className="text-center text-sabc-gray-500">
                  Aucune répartition disponible.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
