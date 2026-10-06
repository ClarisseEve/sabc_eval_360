import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Area,
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
import { Activity, BarChart3, MapPinned, Target, Users } from 'lucide-react';
import { Badge } from '@/Components/UI/Badge/Badge';
import { Button } from '@/Components/UI/Button/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/UI/Card/Card';
import { EmptyState } from '@/Components/Dashboard/RoleDashboardShared';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/Components/UI/Dialog/Dialog';
import { Label } from '@/Components/UI/Label/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/UI/Select/Select';
import { adminApi, analyticsApi } from '@/Services/api';
import { scoreOnTwenty } from '@/pages/Admin/Utilisateurs/evaluation-score';

const STATUS_COLORS = ['#48BB78', '#D69E2E', '#FF9800', '#3182CE'];

type OverviewMetric = {
  title: string;
  value: React.ReactNode;
  caption: string;
  icon: React.ElementType;
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

function OverviewMetricCard({ title, value, caption, icon: Icon }: OverviewMetric) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm text-sabc-gray-500 dark:text-sabc-gray-400">{title}</div>
            <div className="mt-1 text-2xl font-bold text-sabc-gray-900 dark:text-white">{value}</div>
            <div className="mt-2 text-xs text-sabc-gray-500 dark:text-sabc-gray-400">{caption}</div>
          </div>
          <div className="rounded-full bg-sabc-red-primary/10 p-3 text-sabc-red-primary">
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
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
    if (typeof value !== 'number' || !Number.isFinite(value)) return value ?? '—';
    return Number.isInteger(value) ? value.toLocaleString('fr-FR') : value.toFixed(2);
  };

  return (
    <div className="rounded-2xl border border-sabc-gray-200 bg-white px-4 py-3 shadow-lg dark:border-sabc-gray-700 dark:bg-sabc-gray-100">
      {label ? <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-sabc-gray-500">{label}</div> : null}
      <div className="space-y-1.5">
        {visiblePayload.map((entry) => (
          <div key={entry.name} className="flex items-center justify-between gap-4 text-sm">
            <div className="flex items-center gap-2 text-sabc-gray-600">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
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
  const metrics: OverviewMetric[] = [
    {
      title: 'Total évaluations',
      value: totalEvaluations,
      caption: 'Volume consolidé du cycle',
      icon: Activity,
    },
    {
      title: 'Collaborateurs évalués',
      value: uniqueUsers,
      caption: 'Utilisateurs distincts touchés par les évaluations',
      icon: Users,
    },
    {
      title: 'Score moyen',
      value: averageScore.toFixed(2),
      caption: 'Moyenne globale sur les évaluations notées',
      icon: Target,
    },
    {
      title: 'Taux de complétion',
      value: `${Math.round(completionRate)}%`,
      caption: `${validatedEvaluations} validées / ${totalEvaluations}`,
      icon: BarChart3,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric) => (
        <OverviewMetricCard key={metric.title} {...metric} />
      ))}
    </div>
  );
}

export function PerformanceTrendSection({ trendData }: { trendData: TrendEntry[] }) {
  const latestEntry = trendData[trendData.length - 1];
  const previousEntry = trendData[trendData.length - 2];
  const variation = latestEntry && previousEntry ? latestEntry.score - previousEntry.score : 0;

  return (
    <Card className="xl:col-span-2">
      <CardHeader>
        <CardTitle>Tendance de performance</CardTitle>
        <CardDescription>Évolution du score moyen et du volume sur les périodes remontées par analytics</CardDescription>
      </CardHeader>
      <CardContent>
        {trendData.length === 0 ? (
          <EmptyState message="Aucune tendance disponible." />
        ) : (
          <div className="space-y-5">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-sabc-gray-200/80 bg-sabc-gray-50/70 px-4 py-3 dark:border-sabc-gray-700 dark:bg-sabc-gray-200/30">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-sabc-gray-500">Période active</div>
                <div className="mt-1 text-lg font-semibold text-sabc-gray-900">{latestEntry?.period ?? 'N/A'}</div>
              </div>
              <div className="rounded-2xl border border-sabc-gray-200/80 bg-sabc-gray-50/70 px-4 py-3 dark:border-sabc-gray-700 dark:bg-sabc-gray-200/30">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-sabc-gray-500">Dernier score</div>
                <div className="mt-1 text-lg font-semibold text-sabc-gray-900">{latestEntry?.score?.toFixed(2) ?? '0.00'}/5</div>
              </div>
              <div className="rounded-2xl border border-sabc-gray-200/80 bg-sabc-gray-50/70 px-4 py-3 dark:border-sabc-gray-700 dark:bg-sabc-gray-200/30">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-sabc-gray-500">Variation</div>
                <div className="mt-1 text-lg font-semibold text-sabc-gray-900">
                  {variation >= 0 ? '+' : ''}
                  {variation.toFixed(2)}
                </div>
              </div>
            </div>

            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={trendData} margin={{ top: 22, right: 8, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="adminTrendArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#E53E3E" stopOpacity={0.24} />
                      <stop offset="95%" stopColor="#E53E3E" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--sabc-gray-200)" />
                  <XAxis dataKey="period" tickLine={false} axisLine={false} />
                  <YAxis yAxisId="left" domain={[0, 5]} tickLine={false} axisLine={false} width={34} />
                  <YAxis yAxisId="right" orientation="right" tickLine={false} axisLine={false} width={34} allowDecimals={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend />
                  <ReferenceLine yAxisId="left" y={3.5} stroke="#94A3B8" strokeDasharray="4 4" />
                  <Bar yAxisId="right" dataKey="count" fill="#CBD5E1" name="Volume" radius={[10, 10, 0, 0]} barSize={20}>
                    <LabelList dataKey="count" position="top" fill="#64748B" fontSize={10} />
                  </Bar>
                  <Area yAxisId="left" type="monotone" dataKey="score" fill="url(#adminTrendArea)" stroke="transparent" name="Tendance" />
                  <Line yAxisId="left" type="monotone" dataKey="score" stroke="#E53E3E" strokeWidth={3} dot={{ r: 4, fill: '#E53E3E' }} activeDot={{ r: 6 }} name="Score moyen">
                    <LabelList dataKey="score" position="top" formatter={(value: number) => value.toFixed(2)} fill="#C62828" fontSize={10} />
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
        <CardDescription>Statut courant des évaluations administrées</CardDescription>
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
                      <Cell key={status.name} fill={status.color || STATUS_COLORS[index % STATUS_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-sabc-gray-500">Total</div>
                  <div className="mt-1 text-3xl font-semibold text-sabc-gray-900">{total}</div>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              {statusData.map((status) => (
                <div key={status.name} className="rounded-2xl border border-sabc-gray-200 px-3 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-sabc-gray-700 dark:text-sabc-gray-200">{status.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-sabc-gray-500">
                        {total > 0 ? `${((status.value / total) * 100).toFixed(0)}%` : '0%'}
                      </span>
                      <Badge variant="info">{status.value}</Badge>
                    </div>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-sabc-gray-100">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${total > 0 ? (status.value / total) * 100 : 0}%`,
                        backgroundColor: status.color || STATUS_COLORS[0],
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
        <CardDescription>Répartition par type d’évaluation et score moyen associé</CardDescription>
      </CardHeader>
      <CardContent>
        {normalizedData.length === 0 ? (
          <EmptyState message="Aucun canal d’évaluation disponible." />
        ) : (
          <div className="space-y-5">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={normalizedData} layout="vertical" margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                  <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="var(--sabc-gray-200)" />
                  <XAxis type="number" domain={[0, 5]} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="label" width={92} tickLine={false} axisLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="average_score" fill="#E53E3E" name="Score moyen" radius={[0, 10, 10, 0]} barSize={18}>
                    {normalizedData.map((channel, index) => (
                      <Cell key={channel.label} fill={index === 0 ? '#E53E3E' : '#F87171'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {normalizedData.map((channel) => (
                <div key={channel.label} className="rounded-2xl border border-sabc-gray-200/80 bg-sabc-gray-50/60 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium text-sabc-gray-900">{channel.label}</span>
                    <Badge variant="info">{channel.volume}</Badge>
                  </div>
                  <div className="mt-2 text-sm text-sabc-gray-500">{Number(channel.average_score).toFixed(2)}/5 de moyenne</div>
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
        <CardDescription>Volumes structurels par région issus du dashboard admin</CardDescription>
      </CardHeader>
      <CardContent>
        {regionData.length === 0 ? (
          <EmptyState message="Aucune donnée régionale disponible." />
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={regionData} margin={{ top: 22, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--sabc-gray-200)" />
                <XAxis dataKey="region" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                <YAxis tickLine={false} axisLine={false} width={36} />
                <Tooltip content={<ChartTooltip />} />
                <Legend />
                <Bar dataKey="utilisateurs" fill="#3182CE" name="Utilisateurs" radius={[6, 6, 0, 0]} barSize={14}>
                  <LabelList dataKey="utilisateurs" position="top" fill="#1E40AF" fontSize={10} />
                </Bar>
                <Bar dataKey="evaluations" fill="#E53E3E" name="Évaluations" radius={[6, 6, 0, 0]} barSize={14}>
                  <LabelList dataKey="evaluations" position="top" fill="#C62828" fontSize={10} />
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
  const [rankingMode, setRankingMode] = useState<'roles' | 'personnel'>('roles');
  const [scoreType, setScoreType] = useState<'global' | 'auto' | 'pairs' | 'descendante'>('global');
  const [topCount, setTopCount] = useState('6');
  const [branchId, setBranchId] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const { data: branches = [] } = useQuery({
    queryKey: ['admin', 'structure', 'branches'],
    queryFn: () => adminApi.structure.branches().then((response) => response.data),
  });
  const { data: roleAnalytics, isPending: rolesPending } = useQuery({
    queryKey: ['admin', 'dashboard', 'role-ranking', dateRange?.start_date, dateRange?.end_date, scoreType],
    queryFn: () => analyticsApi.adminRoles({
      ...dateRange,
      ...(scoreType === 'global' ? {} : { type_evaluation: scoreType }),
    }).then((response) => response.data),
    enabled: rankingMode === 'roles',
  });
  const { data: usersResponse, isPending: usersPending } = useQuery({
    queryKey: ['admin', 'dashboard', 'person-ranking', branchId, topCount, scoreType],
    queryFn: () => adminApi.users.list({
      page: 1,
      limit: Number(topCount),
      id_branche: branchId,
      sort_by: 'score',
      sort_order: 'desc',
      score_type: scoreType,
    }).then((response) => response.data),
    enabled: rankingMode === 'personnel' && Boolean(branchId),
  });
  const { data: selectedScores, isPending: selectedScoresPending } = useQuery({
    queryKey: ['analytics', 'scores', selectedUser?.matricule],
    queryFn: () => analyticsApi.scores(selectedUser.matricule).then((response) => response.data),
    enabled: Boolean(selectedUser?.matricule),
  });

  const roleRows = Array.isArray(roleAnalytics?.roles)
    ? roleAnalytics.roles.slice(0, Number(topCount))
    : scoreType === 'global' ? topRoles.slice(0, Number(topCount)) : [];
  const userRows = Array.isArray(usersResponse?.data)
    ? usersResponse.data.filter((person: any) => person.score_moyen != null)
    : [];
  const scoreTypes = [
    { value: 'global', label: 'Score général' },
    { value: 'auto', label: 'Auto-évaluation' },
    { value: 'pairs', label: 'Évaluation par les pairs' },
    { value: 'descendante', label: 'Évaluation descendante' },
  ] as const;
  const scoreTypeLabel = scoreTypes.find((option) => option.value === scoreType)?.label ?? 'Score général';
  const typeScore = (type: string) => selectedScores?.par_type?.find((entry: any) => entry.type === type)?.moyenne ?? null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPinned className="h-5 w-5 text-sabc-red-primary" />
          Rôles les plus performants
        </CardTitle>
        <CardDescription>Classement des rôles ou du personnel selon l’axe sélectionné.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-1">
            <Label htmlFor="ranking-mode">Classement</Label>
            <Select value={rankingMode} onValueChange={(value: 'roles' | 'personnel') => setRankingMode(value)}>
              <SelectTrigger id="ranking-mode"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="roles">Rôles</SelectItem>
                <SelectItem value="personnel">Personnel</SelectItem>
              </SelectContent>
            </Select>
          </div>
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
          {rankingMode === 'personnel' ? (
            <div className="space-y-1">
              <Label htmlFor="ranking-branch">Branche</Label>
              <Select value={branchId} onValueChange={setBranchId}>
                <SelectTrigger id="ranking-branch"><SelectValue placeholder="Sélectionner une branche" /></SelectTrigger>
                <SelectContent>
                  {(branches as Array<{ id_branche: string; nom_branche: string }>).map((branch) => (
                    <SelectItem key={branch.id_branche} value={branch.id_branche}>{branch.nom_branche}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}
        </div>

        {rankingMode === 'roles' ? (
          rolesPending ? <p role="status" className="py-6 text-center text-sm text-sabc-gray-500">Chargement du classement…</p> :
          roleRows.length === 0 ? <EmptyState message="Aucune performance disponible pour cet axe." /> : (
            <div className="space-y-2">
              {roleRows.map((role: TopRoleEntry, index: number) => (
                <div key={role.role} className="flex flex-col gap-3 rounded-lg border border-sabc-gray-200 p-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-8 text-sm font-semibold text-sabc-gray-500">{index + 1}.</span>
                    <div>
                      <div className="font-medium text-sabc-gray-900 dark:text-white">{role.role}</div>
                      <div className="text-sm text-sabc-gray-500 dark:text-sabc-gray-400">
                        {role.count ?? 0} utilisateur(s) · complétion {Math.round(Number(role.completion ?? 0))}%
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="info">{Number(role.avgScore ?? 0).toFixed(2)}/5</Badge>
                    <Link to="/admin/analytics?tab=roles"><Button variant="outline" size="sm">Analyse par rôle</Button></Link>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : !branchId ? (
          <EmptyState message="Sélectionnez une branche pour afficher son classement." />
        ) : usersPending ? (
          <p role="status" className="py-6 text-center text-sm text-sabc-gray-500">Chargement du classement…</p>
        ) : userRows.length === 0 ? (
          <EmptyState message="Aucun résultat mesuré pour cette branche et cet axe." />
        ) : (
          <div className="divide-y divide-sabc-gray-200">
            {userRows.map((person: any, index: number) => {
              const score = scoreOnTwenty(person.score_moyen);
              return (
                <button
                  key={person.matricule}
                  type="button"
                  onClick={() => setSelectedUser(person)}
                  className="flex w-full items-center justify-between gap-4 py-3 text-left hover:bg-sabc-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sabc-red-primary"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="w-8 shrink-0 text-sm font-semibold text-sabc-gray-500">{index + 1}.</span>
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-sabc-gray-900">{[person.prenom, person.nom].filter(Boolean).join(' ')}</span>
                      <span className="block truncate text-xs text-sabc-gray-500">{person.role} · {person.matricule}</span>
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block font-semibold text-sabc-gray-900">{score != null ? `${score.toFixed(2)}/20` : '—'}</span>
                    <span className="block text-xs text-sabc-gray-500">Moyenne source /5</span>
                  </span>
                </button>
              );
            })}
          </div>
        )}
        {rankingMode === 'personnel' && branchId ? (
          <p className="text-xs text-sabc-gray-500">Axe classé : {scoreTypeLabel}. Les personnes sans note sont exclues.</p>
        ) : null}
      </CardContent>

      <Dialog open={Boolean(selectedUser)} onOpenChange={(open) => { if (!open) setSelectedUser(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedUser ? [selectedUser.prenom, selectedUser.nom].filter(Boolean).join(' ') : 'Détail du classement'}</DialogTitle>
            <DialogDescription>{selectedUser ? `${selectedUser.role} · ${selectedUser.matricule}` : ''}</DialogDescription>
          </DialogHeader>
          {selectedScoresPending ? <p className="text-sm text-sabc-gray-500">Chargement des évaluations…</p> : (
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ['auto', 'Auto-évaluation'],
                ['pairs', 'Évaluation par les pairs'],
                ['descendante', 'Évaluation descendante'],
              ].map(([type, label]) => {
                const source = typeScore(type);
                const score = scoreOnTwenty(source);
                return (
                  <div key={type} className="rounded-md border border-sabc-gray-200 p-3">
                    <div className="text-sm text-sabc-gray-500">{label}</div>
                    <div className="mt-1 font-semibold">{score != null ? `${score.toFixed(2)}/20` : 'Non évalué'}</div>
                    <div className="text-xs text-sabc-gray-500">Source : {source != null ? `${Number(source).toFixed(2)}/5` : '—'}</div>
                  </div>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
