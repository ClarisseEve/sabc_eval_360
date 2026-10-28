import React, { useRef } from 'react';
import { Link } from '@/lib/inertia-shim';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/UI/Card/Card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from 'recharts';
import { useAdminDashboard } from '@/Hooks/queries';
import { ChartExportButton } from '@/Components/Charts/ChartExportButton';
import { KpiCard } from '@/Components/UI/KpiCard';
import {
  CHART_COLORS,
  CHART_TICK,
  CHART_TOOLTIP_STYLE,
  PERCENT_DOMAIN,
  PERCENT_TICKS,
  SCORE_DOMAIN,
  formatChartNumber,
  formatChartPercent,
  formatChartScore,
  frenchTick,
} from '@/Components/UI/Charts/chartTheme';
import { formatPercent } from '@/utils/helpers';

/** Entier au format français ; null si la mesure est absente (affiché « n.d. »). */
function count(value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n.toLocaleString('fr-FR') : null;
}

function ratioCaption(value: unknown, total: unknown): string | undefined {
  const v = Number(value);
  const t = Number(total);
  if (!Number.isFinite(v) || !Number.isFinite(t) || t <= 0) return undefined;
  return `Sur ${t.toLocaleString('fr-FR')} (${formatPercent((v / t) * 100)})`;
}

function ChartPanel({
  title,
  chartRef,
  filename,
  children,
}: {
  title: string;
  chartRef: React.RefObject<HTMLDivElement | null>;
  filename: string;
  children: React.ReactElement;
}) {
  return (
    <div className="rounded-lg border border-sabc-gray-200 bg-white p-4 dark:border-sabc-gray-700 dark:bg-sabc-gray-900">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-sabc-gray-900 dark:text-white">{title}</h3>
        <ChartExportButton chartRef={chartRef} filename={filename} />
      </div>
      <div ref={chartRef} className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

const SHORTCUTS = [
  { href: '/admin/evaluations/management', title: 'En attente', key: 'en_attente' as const, unit: 'évaluation(s) à valider' },
  { href: '/admin/evaluations/management', title: 'En cours', key: 'en_cours' as const, unit: 'évaluation(s) à terminer' },
  { href: '/admin/evaluations/history', title: 'Historique', key: null, unit: 'Rapports des périodes passées' },
  { href: '/admin/analytics?tab=overview', title: 'Analyses détaillées', key: null, unit: 'Vue d’ensemble des résultats' },
];

const EvaluationsTab: React.FC = () => {
  const { data } = useAdminDashboard();
  const chartRefCompetences = useRef<HTMLDivElement>(null);
  const chartRefTypes = useRef<HTMLDivElement>(null);
  const chartRefAnalytics = useRef<HTMLDivElement>(null);
  const chartRefSuperviseurs = useRef<HTMLDivElement>(null);
  const chartRefQualite = useRef<HTMLDivElement>(null);

  const globalCompetencyMatrix = data.competences_globales ?? [];
  const evaluationTypeData = data.types_evaluation ?? [];
  const userAnalytics = data.analytics_utilisateurs ?? [];
  const supervisorPerformance = data.performance_superviseurs ?? [];
  const qualityMetrics = data.metriques_qualite ?? [];

  const shortcutValues = {
    en_attente: count(data.evaluations_en_attente),
    en_cours: count(data.evaluations_en_cours),
  };

  return (
    <div className="space-y-6">
      {/* Supervision des évaluations */}
      <Card className="border border-sabc-gray-200">
        <CardHeader className="pb-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle>Supervision des évaluations 360°</CardTitle>
            <Link href="/admin/evaluations/management" className="text-sm font-medium text-sabc-red-primary hover:text-sabc-red-dark">
              Voir les évaluations en attente
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-3">
            <KpiCard label="Évaluations en attente" value={count(data.evaluations_en_attente)} caption={ratioCaption(data.evaluations_en_attente, data.total_evaluations)} />
            <KpiCard label="Évaluations validées" value={count(data.evaluations_validees)} caption={ratioCaption(data.evaluations_validees, data.total_evaluations)} />
            <KpiCard label="Évaluations en cours" value={count(data.evaluations_en_cours)} caption={ratioCaption(data.evaluations_en_cours, data.total_evaluations)} />
            <KpiCard label="Taux de complétion" value={data.taux_completion == null ? null : formatPercent(data.taux_completion)} />
            <KpiCard label="Utilisateurs actifs" value={count(data.utilisateurs_actifs)} caption={ratioCaption(data.utilisateurs_actifs, data.total_utilisateurs)} />
            <KpiCard label="Remplacements actifs" value={count(data.remplacements_actifs)} />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {globalCompetencyMatrix.length > 0 && (
              <ChartPanel title="Matrice des compétences" chartRef={chartRefCompetences} filename="sabc-competences">
                <RadarChart data={globalCompetencyMatrix}>
                  <PolarGrid stroke={CHART_COLORS.grid} />
                  <PolarAngleAxis dataKey="competence" tick={{ ...CHART_TICK, fontSize: 10 }} />
                  <PolarRadiusAxis angle={90} domain={SCORE_DOMAIN} tickCount={6} tickFormatter={frenchTick} tick={{ fill: CHART_COLORS.secondary, fontSize: 10 }} />
                  <Radar name="Score moyen" dataKey="score" stroke={CHART_COLORS.primary} fill={CHART_COLORS.primary} fillOpacity={0.15} strokeWidth={2} />
                  <Tooltip contentStyle={CHART_TOOLTIP_STYLE} formatter={(value: number) => formatChartScore(value)} />
                </RadarChart>
              </ChartPanel>
            )}

            {evaluationTypeData.length > 0 && (
              <ChartPanel title="Types d’évaluation" chartRef={chartRefTypes} filename="sabc-types-evaluation">
                <BarChart data={evaluationTypeData} layout="vertical" margin={{ left: 0, right: 12 }}>
                  <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
                  <XAxis type="number" allowDecimals={false} tickFormatter={frenchTick} tick={CHART_TICK} />
                  <YAxis dataKey="type" type="category" tick={{ ...CHART_TICK, fontSize: 10 }} width={90} />
                  <Tooltip cursor={{ fill: 'rgba(0,0,0,0.04)' }} contentStyle={CHART_TOOLTIP_STYLE} formatter={(value: number) => formatChartNumber(value, 0)} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="completed" fill={CHART_COLORS.primary} name="Terminées" />
                  <Bar dataKey="target" fill={CHART_COLORS.tertiary} name="Objectif" />
                </BarChart>
              </ChartPanel>
            )}

            {userAnalytics.length > 0 && (
              <ChartPanel title="Évaluations données et reçues" chartRef={chartRefAnalytics} filename="sabc-evaluations-utilisateurs">
                <LineChart data={userAnalytics}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
                  <XAxis dataKey="periode" tick={CHART_TICK} />
                  <YAxis allowDecimals={false} tickFormatter={frenchTick} tick={CHART_TICK} />
                  <Tooltip contentStyle={CHART_TOOLTIP_STYLE} formatter={(value: number) => formatChartNumber(value, 0)} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="evaluations_donnees" stroke={CHART_COLORS.primary} strokeWidth={2} name="Données" />
                  <Line type="monotone" dataKey="evaluations_recues" stroke={CHART_COLORS.secondary} strokeWidth={2} name="Reçues" />
                </LineChart>
              </ChartPanel>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Performance des superviseurs */}
      {(supervisorPerformance.length > 0 || qualityMetrics.length > 0) && (
        <Card className="border border-sabc-gray-200">
          <CardHeader className="pb-4">
            <CardTitle>Performance des superviseurs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {supervisorPerformance.length > 0 && (
                <ChartPanel title="Taux de validation par rôle" chartRef={chartRefSuperviseurs} filename="sabc-performance-superviseurs">
                  <AreaChart data={supervisorPerformance}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
                    <XAxis dataKey="role" tick={CHART_TICK} />
                    <YAxis domain={PERCENT_DOMAIN} ticks={PERCENT_TICKS} tickFormatter={frenchTick} tick={CHART_TICK} />
                    <Tooltip contentStyle={CHART_TOOLTIP_STYLE} formatter={(value: number) => formatChartPercent(value)} />
                    <Area type="monotone" dataKey="taux_validation" stroke={CHART_COLORS.primary} fill={CHART_COLORS.primary} fillOpacity={0.12} strokeWidth={2} name="Taux de validation" />
                  </AreaChart>
                </ChartPanel>
              )}

              {qualityMetrics.length > 0 && (
                <ChartPanel title="Qualité des évaluations" chartRef={chartRefQualite} filename="sabc-qualite">
                  <RadarChart data={qualityMetrics}>
                    <PolarGrid stroke={CHART_COLORS.grid} />
                    <PolarAngleAxis dataKey="critere" tick={{ ...CHART_TICK, fontSize: 10 }} />
                    <PolarRadiusAxis angle={90} domain={PERCENT_DOMAIN} tickCount={5} tickFormatter={frenchTick} tick={{ fill: CHART_COLORS.secondary, fontSize: 10 }} />
                    <Radar name="Score" dataKey="score" stroke={CHART_COLORS.primary} fill={CHART_COLORS.primary} fillOpacity={0.15} strokeWidth={2} />
                    <Tooltip contentStyle={CHART_TOOLTIP_STYLE} formatter={(value: number) => formatChartPercent(value)} />
                  </RadarChart>
                </ChartPanel>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Accès rapides */}
      <Card className="border border-sabc-gray-200">
        <CardHeader>
          <CardTitle>Accès rapides</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {SHORTCUTS.map((shortcut) => (
              <Link key={shortcut.title} href={shortcut.href} className="group">
                <div className="h-full rounded-lg border border-sabc-gray-200 p-4 transition-colors hover:border-sabc-red-primary dark:border-sabc-gray-700">
                  <div className="font-medium text-sabc-gray-900 dark:text-white">{shortcut.title}</div>
                  <div className="text-sm text-sabc-gray-600 dark:text-sabc-gray-400">
                    {shortcut.key ? `${shortcutValues[shortcut.key] ?? 'n.d.'} ${shortcut.unit}` : shortcut.unit}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EvaluationsTab;
