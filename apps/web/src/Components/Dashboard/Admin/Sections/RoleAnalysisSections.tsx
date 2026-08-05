import React from 'react';
import { Target, TrendingUp, Users } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';
import { Badge } from '@/Components/UI/Badge/Badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/UI/Card/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/UI/Table/Table';
import { TruncatedTableBody } from '@/Components/UI/TruncatedList/TruncatedList';
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
          <span className="ml-auto font-semibold text-sabc-gray-900">{typeof e.value === 'number' ? e.value.toFixed(2) : e.value}</span>
        </div>
      ))}
    </div>
  );
}

const COLORS = {
  primary: '#E53E3E',
  accent: '#FF9800',
  success: '#48BB78',
  warning: '#D69E2E',
  info: '#3182CE',
};

const ROLE_COLORS = [
  '#E53E3E', '#FF9800', '#48BB78', '#3182CE', '#D69E2E',
  '#9F7AEA', '#ED64A6', '#38B2AC', '#DD6B20', '#667EEA', '#F56565',
];

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

function SummaryCard({
  label,
  value,
  icon: Icon,
  iconClassName,
}: {
  label: string;
  value: React.ReactNode;
  icon: React.ElementType;
  iconClassName: string;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-full ${iconClassName}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm text-sabc-gray-600">{label}</div>
            <div className="text-2xl font-bold text-sabc-gray-900">{value}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function RoleAnalysisSummarySection({
  roleCount,
  globalAverage,
  channelCount,
}: {
  roleCount: number;
  globalAverage: number;
  channelCount: number;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <SummaryCard label="Roles analyses" value={roleCount} icon={Users} iconClassName="bg-red-50 text-sabc-red-primary" />
      <SummaryCard label="Score moyen global" value={`${globalAverage.toFixed(2)} / 5`} icon={Target} iconClassName="bg-blue-50 text-blue-600" />
      <SummaryCard label="Canaux d'evaluation" value={channelCount} icon={TrendingUp} iconClassName="bg-green-50 text-green-600" />
    </div>
  );
}

export function RoleScoreChartSection({ rows }: { rows: RolePerformanceEntry[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-sabc-red-primary" />
          Score moyen par role
        </CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <EmptyState message="Aucune donnee de role disponible." />
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rows} layout="vertical" margin={{ top: 10, right: 20, left: 60, bottom: 0 }}>
                <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="var(--sabc-gray-200)" />
                <XAxis type="number" domain={[0, 5]} tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                <YAxis dataKey="role" type="category" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} width={55} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="avgScore" name="Score moyen" radius={[0, 6, 6, 0]} barSize={16}>
                  {rows.map((row, i) => (
                    <Cell key={`${row.role}-${i}`} fill={ROLE_COLORS[i % ROLE_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function RoleCompletionChartSection({ rows }: { rows: RolePerformanceEntry[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-sabc-red-primary" />
          Taux de completion par role
        </CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <EmptyState message="Aucune donnee disponible." />
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rows} layout="vertical" margin={{ top: 10, right: 20, left: 60, bottom: 0 }}>
                <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="var(--sabc-gray-200)" />
                <XAxis type="number" domain={[0, 100]} tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                <YAxis dataKey="role" type="category" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} width={55} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="completion" name="Complétion %" radius={[0, 6, 6, 0]} barSize={16}>
                  {rows.map((row, i) => {
                    const completion = Number(row.completion) || 0;
                    const fill = completion >= 80 ? COLORS.success : completion >= 50 ? COLORS.warning : COLORS.primary;
                    return <Cell key={`${row.role}-${i}`} fill={fill} />;
                  })}
                </Bar>
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
        <CardDescription>Score moyen et volume par canal d'évaluation</CardDescription>
      </CardHeader>
      <CardContent>
        {channels.length === 0 ? (
          <EmptyState message="Aucune donnee de canal disponible." />
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={channels} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--sabc-gray-200)" />
                <XAxis dataKey="channel" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                <Tooltip content={<ChartTooltip />} />
                <Legend />
                <Bar dataKey="average_score" name="Score moyen" fill={COLORS.primary} radius={[6, 6, 0, 0]} barSize={18} />
                <Bar dataKey="count" name="Nombre" fill={COLORS.info} radius={[6, 6, 0, 0]} barSize={18} />
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
  globalAverage: number;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Détail par rôle</CardTitle>
        <CardDescription>Effectif, score, complétion et écart vs moyenne globale</CardDescription>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <EmptyState message="Aucune donnee disponible." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Effectif</TableHead>
                <TableHead className="text-right">Score moyen</TableHead>
                <TableHead className="text-right">Completion %</TableHead>
                <TableHead className="text-right">Delta vs moyenne</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TruncatedTableBody
                items={rows}
                previewCount={10}
                colSpan={5}
                keyExtractor={(role, i) => `${role.role}-${i}`}
                renderRow={(role, i) => {
                  const score = Number(role.avgScore) || 0;
                  const delta = score - globalAverage;
                  return (
                    <TableRow key={`${role.role}-${i}`}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: ROLE_COLORS[i % ROLE_COLORS.length] }} />
                          {role.role}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{role.count ?? 0}</TableCell>
                      <TableCell className="text-right font-semibold">{score.toFixed(2)} / 5</TableCell>
                      <TableCell className="text-right">{Math.round(Number(role.completion) || 0)}%</TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant={delta >= 0 ? 'outline' : 'secondary'}
                          className={delta >= 0 ? 'border-green-300 text-green-700' : 'text-red-700'}
                        >
                          {delta >= 0 ? '+' : ''}{delta.toFixed(2)}
                        </Badge>
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
