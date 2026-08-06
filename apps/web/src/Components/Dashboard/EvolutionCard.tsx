import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/UI/Card/Card';
import { EmptyState } from '@/Components/Dashboard/RoleDashboardShared';
import { buildEvolutionView, type EvolutionResponse } from './evolution-data';

type EvolutionCardProps = {
  data: EvolutionResponse | undefined;
  title?: string;
  description?: string;
  emptyMessage?: string;
  isLoading?: boolean;
};

// Palette distincte pour rester lisible jusqu'à cinq critères, soit la taille
// d'un jeu de critères métier.
const COULEURS = ['#C62828', '#1565C0', '#F9A825', '#2E7D32', '#6A1B9A'];

/**
 * Courbes d'évolution temporelle: progression période après période, avec une
 * série par critère évalué.
 */
export function EvolutionCard({
  data,
  title = 'Évolution de vos compétences',
  description = 'Progression par critère au fil des périodes d’évaluation.',
  emptyMessage = "Au moins une période évaluée est nécessaire pour tracer une évolution.",
  isLoading = false,
}: Readonly<EvolutionCardProps>) {
  const { points, series, progression, pointDAttention } = buildEvolutionView(
    data ?? { criteres: [], periodes: [] },
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-72 animate-pulse rounded-md bg-sabc-gray-100 dark:bg-sabc-gray-800" />
        ) : points.length === 0 ? (
          <EmptyState message={emptyMessage} />
        ) : (
          <>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={points} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--sabc-gray-200)" />
                  <XAxis dataKey="periode" tick={{ fill: 'var(--sabc-gray-600)', fontSize: 11 }} />
                  {/* Échelle bornée à 1-5 comme la grille de notation. */}
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
                  {series.map((critere, index) => (
                    <Line
                      key={critere}
                      type="monotone"
                      dataKey={critere}
                      name={critere}
                      stroke={COULEURS[index % COULEURS.length]}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      // Une période non mesurée ne doit pas casser la courbe.
                      connectNulls
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>

            {(progression || pointDAttention) && (
              <div className="mt-4 space-y-2">
                {progression && (
                  <p className="rounded-md border-l-4 border-sabc-success bg-sabc-gray-50 px-3 py-2 text-sm text-sabc-gray-700 dark:bg-sabc-gray-800 dark:text-sabc-gray-200">
                    <span className="font-medium">Progression — </span>
                    {progression.critere} : +{progression.delta.toFixed(2)} point(s) depuis la
                    première période mesurée.
                  </p>
                )}
                {pointDAttention && (
                  <p className="rounded-md border-l-4 border-sabc-warning bg-sabc-gray-50 px-3 py-2 text-sm text-sabc-gray-700 dark:bg-sabc-gray-800 dark:text-sabc-gray-200">
                    <span className="font-medium">Point d’attention — </span>
                    {pointDAttention.critere} : {pointDAttention.delta.toFixed(2)} point(s) sur la
                    même période.
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

export default EvolutionCard;
