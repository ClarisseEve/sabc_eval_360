import React, { useRef } from 'react';
import { useAdminTendancesTabData } from '@/Hooks/queries/useAdminDashboardTabs';
import { ChartExportButton } from '@/Components/Charts/ChartExportButton';
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
  taux_completion: number;
  nb_evaluations: number;
  nb_valides: number;
  delta_score: number | null;
  delta_completion: number | null;
};

function TendancesContent() {
  const [regionFilter, setRegionFilter] = React.useState('all');
  const [roleFilter, setRoleFilter] = React.useState('all');
  const chartRef = useRef<HTMLDivElement>(null);
  const { tendances, regionOptions, roleOptions, generatedAt } = useAdminTendancesTabData({
    regionFilter,
    roleFilter,
  });

  const chartData = (tendances as Tendance[]).map((t) => ({
    periode: t.code_periode || t.nom_periode,
    score: t.score_moyen != null ? Number(t.score_moyen) : null,
    completion: Number(t.taux_completion ?? 0),
    nb: Number(t.nb_evaluations ?? 0),
    delta: t.delta_score,
  }));

  return (
    <div className="space-y-6">
      {/* Filtres */}
      <div className="flex flex-wrap gap-3">
        <select
          value={regionFilter}
          onChange={(e) => setRegionFilter(e.target.value)}
          className="rounded border px-3 py-1.5 text-sm"
        >
          <option value="all">Toutes les régions</option>
          {(regionOptions as Region[]).map((r) => (
            <option key={r.id_region} value={r.id_region}>
              {r.nom_region}
            </option>
          ))}
        </select>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="rounded border px-3 py-1.5 text-sm"
        >
          <option value="all">Tous les rôles</option>
          {(roleOptions as string[]).map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>
        {generatedAt && (
          <span className="ml-auto self-center text-xs text-gray-500">
            Mis à jour : {new Date(generatedAt).toLocaleString('fr-FR')}
          </span>
        )}
      </div>

      {/* Graphique */}
      {chartData.length === 0 ? (
        <div className="rounded-lg border p-8 text-center text-gray-500">
          Aucune donnée de tendance disponible pour les filtres sélectionnés.
        </div>
      ) : (
        <div className="rounded-lg border bg-white p-4">
          <h3 className="mb-4 font-semibold text-gray-800">Évolution par période</h3>
          <div className="relative">
            <div className="absolute top-0 right-0 z-10">
              <ChartExportButton chartRef={chartRef} filename="sabc-tendances" />
            </div>
            <div ref={chartRef}>
              <ResponsiveContainer width="100%" height={320}>
                <ComposedChart data={chartData} margin={{ top: 5, right: 30, left: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="periode" tick={{ fontSize: 12 }} />
                  <YAxis
                    yAxisId="score"
                    domain={[0, 5]}
                    label={{ value: 'Score /5', angle: -90, position: 'insideLeft', fontSize: 11 }}
                  />
                  <YAxis
                    yAxisId="completion"
                    orientation="right"
                    domain={[0, 100]}
                    label={{
                      value: '% complétion',
                      angle: 90,
                      position: 'insideRight',
                      fontSize: 11,
                    }}
                  />
                  <Tooltip
                    formatter={(value: string | number | (string | number)[], name: string) => {
                      if (name === 'Score moyen') return value != null ? [`${value}/5`, name] : ['—', name];
                      if (name === 'Taux complétion') return [`${value}%`, name];
                      return [value, name];
                    }}
                  />
                  <Legend />
                  <Bar
                    yAxisId="completion"
                    dataKey="completion"
                    name="Taux complétion"
                    fill="#93C5FD"
                    opacity={0.7}
                  />
                  <Line
                    yAxisId="score"
                    type="monotone"
                    dataKey="score"
                    name="Score moyen"
                    stroke="#EF4444"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    connectNulls
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Table résumé */}
      {(tendances as Tendance[]).length > 0 && (
        <div className="overflow-x-auto rounded-lg border bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-700">Période</th>
                <th className="px-4 py-3 text-right font-medium text-gray-700">Score moyen</th>
                <th className="px-4 py-3 text-right font-medium text-gray-700">Δ Score</th>
                <th className="px-4 py-3 text-right font-medium text-gray-700">Taux complétion</th>
                <th className="px-4 py-3 text-right font-medium text-gray-700">Évaluations</th>
              </tr>
            </thead>
            <tbody>
              {(tendances as Tendance[]).map((t) => (
                <tr key={t.id_periode} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{t.nom_periode || t.code_periode}</td>
                  <td className="px-4 py-3 text-right">
                    {t.score_moyen != null ? `${Number(t.score_moyen).toFixed(2)}/5` : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {t.delta_score != null ? (
                      <span
                        className={
                          t.delta_score > 0
                            ? 'text-green-600'
                            : t.delta_score < 0
                              ? 'text-red-600'
                              : 'text-gray-500'
                        }
                      >
                        {t.delta_score > 0 ? '+' : ''}
                        {Number(t.delta_score).toFixed(2)}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {Number(t.taux_completion ?? 0).toFixed(1)}%
                  </td>
                  <td className="px-4 py-3 text-right">{t.nb_evaluations}</td>
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
