import React from 'react';
import { useAdminTendancesTabData } from '@/Hooks/queries/useAdminDashboardTabs';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  CHART_COLORS,
  CHART_TICK,
  CHART_TOOLTIP_STYLE,
  PERCENT_DOMAIN,
  PERCENT_TICKS,
  SCORE_DOMAIN,
  SCORE_TICKS,
  formatChartPercent,
  frenchTick,
} from '@/Components/UI/Charts/chartTheme';
import { formatPercent, formatScore } from '@/utils/helpers';

type Region = {
  id_region: string;
  nom_region: string;
};

type Tendance = {
  id_periode: string;
  code_periode: string;
  nom_periode: string;
  date_debut: string;
  date_fin: string;
  score_moyen: number | null;
  taux_completion: number | null;
  nb_evaluations: number;
  nb_valides: number;
  delta_score: number | null;
  delta_completion: number | null;
};

const SELECT_CLASS =
  'h-9 w-full rounded-lg border border-sabc-gray-200 bg-white px-3 text-sm text-sabc-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-sabc-red-primary sm:w-auto dark:border-sabc-gray-700 dark:bg-sabc-gray-900 dark:text-sabc-gray-200';

function formatUpdatedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'n.d.';
  return date.toLocaleString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function TendancesContent() {
  const [regionFilter, setRegionFilter] = React.useState('all');
  const [roleFilter, setRoleFilter] = React.useState('all');
  const { tendances, regionOptions, roleOptions, generatedAt } = useAdminTendancesTabData({
    regionFilter,
    roleFilter,
  });

  const rows = tendances as Tendance[];
  const chartData = rows.map((t) => ({
    // Le nom lisible de la période prime sur son code technique (P2502).
    periode: t.nom_periode || t.code_periode,
    score: t.score_moyen != null ? Number(t.score_moyen) : null,
    completion: t.taux_completion != null ? Number(t.taux_completion) : null,
    nb: Number(t.nb_evaluations ?? 0),
    delta: t.delta_score,
  }));

  return (
    <div className="space-y-5">
      {/* Filtres */}
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
        <select
          aria-label="Région"
          value={regionFilter}
          onChange={(e) => setRegionFilter(e.target.value)}
          className={SELECT_CLASS}
        >
          <option value="all">Toutes les régions</option>
          {(regionOptions as Region[]).map((r) => (
            <option key={r.id_region} value={r.id_region}>
              {r.nom_region}
            </option>
          ))}
        </select>
        <select
          aria-label="Rôle"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className={SELECT_CLASS}
        >
          <option value="all">Tous les rôles</option>
          {(roleOptions as string[]).map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>
        {generatedAt && (
          <span className="text-xs text-sabc-gray-500 sm:ml-auto">
            Mis à jour le {formatUpdatedAt(generatedAt)}
          </span>
        )}
      </div>

      {/* Graphique */}
      {chartData.length === 0 ? (
        <div className="rounded-lg border border-dashed border-sabc-gray-300 p-8 text-center text-sabc-gray-500">
          Aucune tendance pour les filtres sélectionnés.
        </div>
      ) : (
        <div className="rounded-lg border border-sabc-gray-200 bg-white p-4 dark:border-sabc-gray-700 dark:bg-sabc-gray-900">
          <h3 className="mb-4 text-sm font-semibold text-sabc-gray-900 dark:text-white">Évolution par période</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 0, left: -10, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
                <XAxis dataKey="periode" tick={CHART_TICK} tickLine={false} axisLine={false} />
                <YAxis
                  yAxisId="score"
                  domain={SCORE_DOMAIN}
                  ticks={SCORE_TICKS}
                  tickFormatter={frenchTick}
                  tickLine={false}
                  axisLine={false}
                  tick={CHART_TICK}
                />
                <YAxis
                  yAxisId="completion"
                  orientation="right"
                  domain={PERCENT_DOMAIN}
                  ticks={PERCENT_TICKS}
                  tickFormatter={(value: number) => `${frenchTick(value)} %`}
                  tickLine={false}
                  axisLine={false}
                  tick={CHART_TICK}
                  width={48}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                  contentStyle={CHART_TOOLTIP_STYLE}
                  formatter={(value: string | number | (string | number)[], name: string) => {
                    if (name === 'Score moyen') return [formatScore(value), name];
                    if (name === 'Taux de complétion') return [formatChartPercent(value, 1), name];
                    return [value, name];
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar
                  yAxisId="completion"
                  dataKey="completion"
                  name="Taux de complétion"
                  fill={CHART_COLORS.tertiary}
                  radius={[4, 4, 0, 0]}
                />
                <Line
                  yAxisId="score"
                  type="monotone"
                  dataKey="score"
                  name="Score moyen"
                  stroke={CHART_COLORS.primary}
                  strokeWidth={2}
                  dot={{ r: 3, fill: CHART_COLORS.primary }}
                  connectNulls
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Table résumé */}
      {rows.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-sabc-gray-200 bg-white dark:border-sabc-gray-700 dark:bg-sabc-gray-900">
          <table className="w-full text-sm">
            <thead className="bg-sabc-gray-50 dark:bg-sabc-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-sabc-gray-600">Période</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-sabc-gray-600">Score moyen</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-sabc-gray-600">Évolution du score</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-sabc-gray-600">Taux de complétion</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-sabc-gray-600">Évaluations</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => (
                <tr key={t.id_periode} className="border-t border-sabc-gray-100 hover:bg-sabc-gray-50 dark:border-sabc-gray-800">
                  <td className="px-4 py-3 font-medium text-sabc-gray-900 dark:text-white">{t.nom_periode || t.code_periode}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-sabc-gray-700">{formatScore(t.score_moyen, 2)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-sabc-gray-700">
                    {t.delta_score != null
                      ? `${t.delta_score > 0 ? '+' : ''}${Number(t.delta_score).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      : 'n.d.'}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-sabc-gray-700">{formatPercent(t.taux_completion, 1)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-sabc-gray-700">
                    {Number(t.nb_evaluations ?? 0).toLocaleString('fr-FR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function TendancesTab() {
  return <TendancesContent />;
}
