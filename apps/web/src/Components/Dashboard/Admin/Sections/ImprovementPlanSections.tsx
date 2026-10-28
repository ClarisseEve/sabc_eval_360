import React from 'react';
import {
  AnalyticsFiltersCard,
} from '@/Components/Dashboard/ImprovementInsightsCards';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/UI/Card/Card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/UI/Select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/UI/Table/Table';
import { Badge } from '@/Components/UI/Badge/Badge';
import { Button } from '@/Components/UI/Button/Button';
import { EmptyState, getPriorityBadgeVariant } from '@/Components/Dashboard/RoleDashboardShared';
import { TeamAxisFrequencyChartCard } from '@/Components/Dashboard/TeamAnalyticsCards';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { KpiCard, KpiGrid } from '@/Components/UI/KpiCard';
import { CHART_COLORS, CHART_TICK, CHART_TOOLTIP_STYLE, formatChartNumber, frenchTick } from '@/Components/UI/Charts/chartTheme';

export function ImprovementPlansFiltersSection({
  roleFilter,
  onRoleFilterChange,
  roleOptions,
  regionFilter,
  onRegionFilterChange,
  regionOptions,
  typeFilter,
  onTypeFilterChange,
  typeOptions,
  generatedAt,
  onGenerate,
  isGenerating,
}: Readonly<{
  roleFilter: string;
  onRoleFilterChange: (value: string) => void;
  roleOptions: string[];
  regionFilter: string;
  onRegionFilterChange: (value: string) => void;
  regionOptions: any[];
  typeFilter: string;
  onTypeFilterChange: (value: string) => void;
  typeOptions: Array<{ type: string }>;
  generatedAt?: string;
  onGenerate: () => void;
  isGenerating: boolean;
}>) {
  return (
    <AnalyticsFiltersCard
      title="Plans d’amélioration"
      description="Axes de progrès et recommandations de l’ensemble des collaborateurs correspondant aux filtres."
    >
      <div className="min-w-[140px] space-y-1">
        <div className="text-xs font-medium text-sabc-gray-500 dark:text-sabc-gray-400">Rôle</div>
        <Select value={roleFilter} onValueChange={onRoleFilterChange}>
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Tous les rôles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les rôles</SelectItem>
            {roleOptions.map((role) => (
              <SelectItem key={role} value={role}>{role}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="min-w-[140px] space-y-1">
        <div className="text-xs font-medium text-sabc-gray-500 dark:text-sabc-gray-400">Région</div>
        <Select value={regionFilter} onValueChange={onRegionFilterChange}>
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Toutes les régions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les régions</SelectItem>
            {regionOptions.map((region: any) => (
              <SelectItem key={String(region.id_region)} value={String(region.id_region)}>
                {region.nom_region}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="min-w-[140px] space-y-1">
        <div className="text-xs font-medium text-sabc-gray-500 dark:text-sabc-gray-400">Type</div>
        <Select value={typeFilter} onValueChange={onTypeFilterChange}>
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Tous les types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les types</SelectItem>
            {typeOptions.map((entry) => (
              <SelectItem key={entry.type} value={entry.type}>{entry.type}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex min-w-[140px] items-end">
        <div className="py-1.5 text-xs text-sabc-gray-500 dark:text-sabc-gray-400">
          {generatedAt
            ? `Calculé le ${new Intl.DateTimeFormat('fr-FR', {
                day: '2-digit',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              }).format(new Date(generatedAt))}`
            : 'Pas encore calculé'}
        </div>
      </div>

      <div className="flex items-end">
        <Button
          type="button"
          onClick={onGenerate}
          loading={isGenerating}
          disabled={isGenerating}
          className="whitespace-nowrap"
        >
          {isGenerating ? 'Génération…' : 'Générer les recommandations'}
        </Button>
      </div>
    </AnalyticsFiltersCard>
  );
}

export function ImprovementPlansTotalsSection({ totals }: Readonly<{ totals: any }>) {
  const count = (value: unknown) => (value === null || value === undefined ? null : formatChartNumber(value, 0));
  const cards = [
    { label: 'Collaborateurs retenus', value: count(totals?.users_filtered) },
    { label: 'Collaborateurs analysés', value: count(totals?.users_analyzed) },
    { label: 'Recommandations', value: count(totals?.recommendations_total) },
    { label: 'Priorité haute', value: count(totals?.high_priority) },
  ];

  return (
    <KpiGrid>
      {cards.map((card) => (
        <KpiCard key={card.label} label={card.label} value={card.value} />
      ))}
    </KpiGrid>
  );
}

export function RecommendationTypeBreakdownSection({ byType }: Readonly<{ byType: any[] }>) {
  return (
    <Card className="overflow-hidden border-sabc-gray-200">
      <CardHeader>
        <CardTitle>Répartition par type de recommandation</CardTitle>
        <CardDescription>Nombre d’actions proposées par famille.</CardDescription>
      </CardHeader>
      <CardContent>
        {byType.length === 0 ? (
          <EmptyState message="Aucune recommandation n’est disponible sur le périmètre analysé." />
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byType} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
                <XAxis dataKey="type" tickLine={false} axisLine={false} tick={CHART_TICK} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} tickFormatter={frenchTick} tick={CHART_TICK} />
                <Tooltip cursor={{ fill: 'rgba(0,0,0,0.04)' }} contentStyle={CHART_TOOLTIP_STYLE} formatter={(value: number) => formatChartNumber(value, 0)} />
                <Bar dataKey="total" fill={CHART_COLORS.primary} radius={[4, 4, 0, 0]} name="Recommandations" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function ImprovementTopAxesSection({ topAxes }: Readonly<{ topAxes: any[] }>) {
  return (
    <TeamAxisFrequencyChartCard
      title="Axes les plus fréquents"
      description="Critères faibles revenant le plus souvent."
      axes={topAxes}
      emptyMessage="Aucun axe consolidé n’est encore disponible."
      barColor={CHART_COLORS.primary}
      heightClassName="h-72"
    />
  );
}

export function ImprovementRowsSection({
  rows,
  usersWithRecommendations,
  usersAnalyzed,
  onValidate,
  onReject,
  validateLoading,
  rejectLoading,
}: Readonly<{
  rows: any[];
  usersWithRecommendations: number;
  usersAnalyzed: number;
  onValidate: (id: string) => void;
  onReject: (id: string) => void;
  validateLoading: string | null;
  rejectLoading: string | null;
}>) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Détail des recommandations</CardTitle>
        <CardDescription>
          {usersWithRecommendations.toLocaleString('fr-FR')} collaborateur(s) concerné(s) sur {usersAnalyzed.toLocaleString('fr-FR')} analysé(s)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <EmptyState message="Aucune recommandation ne correspond au type sélectionné." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Collaborateur</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>Région</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Priorité</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Axe dominant</TableHead>
                <TableHead>Décision</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row: any) => {
                const rowKey = `${row.matricule}-${row.type}-${row.titre}`;
                const isValidating = validateLoading !== null && row.id === validateLoading;
                const isRejecting = rejectLoading !== null && row.id === rejectLoading;
                const isPersisted = Boolean(row.id);

                return (
                  <TableRow key={rowKey}>
                    <TableCell>
                      <div className="font-medium text-sabc-gray-900 dark:text-white">{row.nomComplet}</div>
                      <div className="text-xs text-sabc-gray-500 dark:text-sabc-gray-400">{row.matricule}</div>
                    </TableCell>
                    <TableCell>{row.role}</TableCell>
                    <TableCell>{row.region}</TableCell>
                    <TableCell><Badge variant="secondary">{row.type}</Badge></TableCell>
                    <TableCell><Badge variant={getPriorityBadgeVariant(row.priorite)}>{row.priorite}</Badge></TableCell>
                    <TableCell>
                      <div className="font-medium text-sabc-gray-900 dark:text-white">{row.titre}</div>
                      <div className="text-xs text-sabc-gray-500 dark:text-sabc-gray-400">{row.description || 'Sans description'}</div>
                    </TableCell>
                    <TableCell>{row.axeDominant}</TableCell>
                    <TableCell>
                      {row.statut === 'validee' ? (
                        <Badge variant="success" className="whitespace-nowrap">Validé</Badge>
                      ) : row.statut === 'rejetee' ? (
                        <Badge variant="destructive" className="whitespace-nowrap">Rejeté</Badge>
                      ) : isPersisted ? (
                        <div className="flex items-center gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={isValidating || isRejecting}
                            onClick={() => onValidate(row.id)}
                            className="gap-1"
                          >
                            {isValidating ? 'En cours…' : 'Valider'}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={isValidating || isRejecting}
                            onClick={() => onReject(row.id)}
                            className="gap-1"
                          >
                            {isRejecting ? 'En cours…' : 'Rejeter'}
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-sabc-gray-500">À générer</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
