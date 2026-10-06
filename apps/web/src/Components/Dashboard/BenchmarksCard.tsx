import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/UI/Card/Card';
import { EmptyState } from '@/Components/Dashboard/RoleDashboardShared';
import { buildBenchmarkView } from './benchmarks-data';
import type { BenchmarkCritere } from '@/Services/api';

type BenchmarksCardProps = {
  criteres: BenchmarkCritere[];
  title?: string;
  description?: string;
  /** Libellé de la série du sujet: « Vous » en individuel, « Votre équipe » en manager. */
  sujetLabel?: string;
  emptyMessage?: string;
  isLoading?: boolean;
};

const COULEUR_SUJET = '#C62828';
const COULEUR_REGION = '#78909C';
const COULEUR_TOP = '#F9A825';

/**
 * Benchmarks comparatifs: positionne le sujet face à la moyenne de sa région
 * et aux meilleurs profils, critère par critère.
 *
 * Les critères affichés sont ceux réellement évalués pour la personne (chaque
 * métier a son propre jeu), et non une liste figée.
 */
export function BenchmarksCard({
  criteres,
  title = 'Benchmarks comparatifs',
  description = 'Position par critère face à la moyenne régionale et aux meilleurs profils.',
  sujetLabel = 'Vous',
  emptyMessage = "Aucune évaluation validée ne permet encore de situer ce périmètre.",
  isLoading = false,
}: Readonly<BenchmarksCardProps>) {
  const { rows, force, opportunite } = buildBenchmarkView(criteres ?? []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-72 animate-pulse rounded-md bg-sabc-gray-100 dark:bg-sabc-gray-800" />
        ) : rows.length === 0 ? (
          <EmptyState message={emptyMessage} />
        ) : (
          <>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rows} margin={{ top: 22, right: 16, left: 0, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--sabc-gray-200)" />
                  <XAxis
                    dataKey="critere"
                    tick={{ fill: 'var(--sabc-gray-600)', fontSize: 11 }}
                  />
                  {/* L'échelle d'évaluation est bornée à 1-5: la fixer évite de
                      faire paraître spectaculaire un écart de quelques dixièmes. */}
                  <YAxis
                    domain={[0, 5]}
                    tickCount={6}
                    tick={{ fill: 'var(--sabc-gray-400)', fontSize: 10 }}
                  />
                  <Tooltip
                    formatter={(value) =>
                      typeof value === 'number' ? value.toFixed(2) : 'Non mesuré'
                    }
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="sujet" name={sujetLabel} fill={COULEUR_SUJET} radius={[3, 3, 0, 0]}>
                    <LabelList dataKey="sujet" position="top" formatter={(value: number | null) => value == null ? '' : value.toFixed(1)} fill={COULEUR_SUJET} fontSize={9} />
                  </Bar>
                  <Bar dataKey="region" name="Moyenne région" fill={COULEUR_REGION} radius={[3, 3, 0, 0]}>
                    <LabelList dataKey="region" position="top" formatter={(value: number | null) => value == null ? '' : value.toFixed(1)} fill={COULEUR_REGION} fontSize={9} />
                  </Bar>
                  <Bar dataKey="top" name="Top performers" fill={COULEUR_TOP} radius={[3, 3, 0, 0]}>
                    <LabelList dataKey="top" position="top" formatter={(value: number | null) => value == null ? '' : value.toFixed(1)} fill="#8A5A00" fontSize={9} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {(force || opportunite) && (
              <div className="mt-4 space-y-2">
                {force && (
                  <p className="rounded-md border-l-4 border-sabc-success bg-sabc-gray-50 px-3 py-2 text-sm text-sabc-gray-700 dark:bg-sabc-gray-800 dark:text-sabc-gray-200">
                    <span className="font-medium">Performance notable — </span>
                    {force.critere} : {force.ecart > 0 ? '+' : ''}
                    {force.ecart.toFixed(2)} point(s) au-dessus de la moyenne régionale.
                  </p>
                )}
                {opportunite && (
                  <p className="rounded-md border-l-4 border-sabc-warning bg-sabc-gray-50 px-3 py-2 text-sm text-sabc-gray-700 dark:bg-sabc-gray-800 dark:text-sabc-gray-200">
                    <span className="font-medium">Opportunité d’apprentissage — </span>
                    {opportunite.critere} : {opportunite.ecart.toFixed(2)} point(s) sous la moyenne
                    régionale.
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default BenchmarksCard;
