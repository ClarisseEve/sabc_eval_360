import React from 'react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Activity, CheckCircle2, Target } from 'lucide-react';
import { Badge } from '@/Components/UI/Badge/Badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/UI/Card/Card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/UI/Select/Select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/UI/Table/Table';
import { EmptyState } from '@/Components/Dashboard/RoleDashboardShared';

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-sabc-gray-200 bg-white px-3 py-2 shadow-lg">
      {label && <div className="mb-1.5 text-xs font-semibold text-sabc-gray-500">{label}</div>}
      {payload.map((e: any) => (
        <div key={e.name} className="flex items-center gap-2 text-sm">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: e.color }} />
          <span className="text-sabc-gray-600">{e.name}</span>
          <span className="ml-auto font-semibold text-sabc-gray-900">{e.value}</span>
        </div>
      ))}
    </div>
  );
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
        <CardDescription>Vue régionale consolidée à partir des endpoints analytics et de la structure admin</CardDescription>
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

        <div className="grid gap-4 md:grid-cols-3">
          {[
            { label: 'Total évaluations', value: stats?.total_evaluations ?? 0, icon: Activity, color: 'text-sabc-red-primary bg-sabc-red-primary/10' },
            { label: 'Validées', value: stats?.validees ?? 0, icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50' },
            { label: 'Score moyen', value: stats?.score_moyen == null ? '0.00' : Number(stats.score_moyen).toFixed(2), icon: Target, color: 'text-blue-600 bg-blue-50' },
          ].map((card) => {
            const Icon = card.icon;
            return (
              <Card key={card.label}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${card.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-medium text-sabc-gray-500">{card.label}</div>
                      <div className="text-xl font-bold text-sabc-gray-900">{card.value}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export function InterRegionComparisonSection({ data }: Readonly<{ data: InterRegionEntry[] }>) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Comparaison inter-régions</CardTitle>
        <CardDescription>Volumes utilisateurs et évaluations par région</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <EmptyState message="Aucune donnée inter-régions disponible." />
        ) : (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="region" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                <YAxis tickLine={false} axisLine={false} width={36} />
                <Tooltip content={<ChartTooltip />} />
                <Legend />
                <Bar dataKey="utilisateurs" fill="#3182CE" name="Utilisateurs" radius={[6, 6, 0, 0]} barSize={16} />
                <Bar dataKey="evaluations" fill="#E53E3E" name="Évaluations" radius={[6, 6, 0, 0]} barSize={16} />
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
        <CardDescription>Distribution des collaborateurs de la région sélectionnée</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          {[
            { label: 'Évalués', value: totalEvaluated, icon: Activity, color: 'text-sabc-red-primary bg-sabc-red-primary/10' },
            { label: 'Moyenne région', value: regionAverage == null ? '0.00' : Number(regionAverage).toFixed(2), icon: Target, color: 'text-blue-600 bg-blue-50' },
          ].map((card) => {
            const Icon = card.icon;
            return (
              <Card key={card.label}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${card.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-medium text-sabc-gray-500">{card.label}</div>
                      <div className="text-xl font-bold text-sabc-gray-900">{card.value}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Catégorie</TableHead>
              <TableHead className="text-right">Volume</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Object.entries(distribution).map(([label, value]) => (
              <TableRow key={label}>
                <TableCell className="capitalize">{label}</TableCell>
                <TableCell className="text-right">
                  <Badge variant="info">{String(value)}</Badge>
                </TableCell>
              </TableRow>
            ))}
            {Object.keys(distribution).length === 0 ? (
              <TableRow>
                <TableCell colSpan={2} className="text-center text-sabc-gray-500">
                  Aucune distribution disponible.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
