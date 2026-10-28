import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/UI/Card/Card';
import { EmptyState } from '@/Components/Dashboard/RoleDashboardShared';
import HeatMap from '@/Components/UI/Charts/HeatMap';
import {
  SEUIL_COMPETENT,
  SEUIL_EXPERT,
  buildTeamHeatmapView,
  type TeamHeatmapResponse,
} from './team-heatmap-data';
import { formatScore } from '@/utils/helpers';

type TeamHeatmapCardProps = {
  data: TeamHeatmapResponse | undefined;
  /** Résout un matricule en nom lisible; le matricule sert de repli. */
  resolveName?: (matricule: string) => string;
  title?: string;
  description?: string;
  emptyMessage?: string;
  isLoading?: boolean;
};

// Bandes de la légende du cahier des charges: 1-2 à développer, 3 compétent,
// 4-5 expert.
const ECHELLE = [
  { min: 1, max: SEUIL_COMPETENT, color: 'var(--sabc-error)', textColor: '#FFFFFF' },
  { min: SEUIL_COMPETENT, max: SEUIL_EXPERT, color: 'var(--sabc-warning)', textColor: '#1F2937' },
  { min: SEUIL_EXPERT, max: 5.01, color: 'var(--sabc-success)', textColor: '#FFFFFF' },
];

/**
 * Heatmap d'équipe: matrice collaborateurs × critères, assortie des
 * enseignements attendus — force collective, axe à développer et relais
 * interne capable de faire monter l'équipe.
 */
export function TeamHeatmapCard({
  data,
  resolveName,
  title = 'Compétences de l’équipe',
  description = 'Moyenne validée de chaque membre sur chaque critère évalué.',
  emptyMessage = "Aucune évaluation validée ne permet encore de dresser la matrice de l’équipe.",
  isLoading = false,
}: Readonly<TeamHeatmapCardProps>) {
  const view = buildTeamHeatmapView(data ?? { criteres: [], membres: [] });
  const nomDe = (matricule: string) => resolveName?.(matricule) || matricule;

  // La heatmap raisonne en matricules; l'affichage montre des noms.
  const cells = view.cells.map((cell) => ({ ...cell, y: nomDe(cell.y) }));
  const yLabels = view.yLabels.map(nomDe);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-72 animate-pulse rounded-md bg-sabc-gray-100 dark:bg-sabc-gray-800" />
        ) : cells.length === 0 ? (
          <EmptyState message={emptyMessage} />
        ) : (
          <>
            <HeatMap
              data={cells}
              xLabels={view.xLabels}
              yLabels={yLabels}
              colorScale={ECHELLE}
              formatValue={(value) => value.toFixed(1)}
            />

            <div className="mt-4 space-y-2">
              {view.forceCollective && (
                <p className="rounded-md border-l-4 border-sabc-success bg-sabc-gray-50 px-3 py-2 text-sm text-sabc-gray-700 dark:bg-sabc-gray-800 dark:text-sabc-gray-200">
                  <span className="font-medium">Force collective — </span>
                  {view.forceCollective.critere} : {formatScore(view.forceCollective.moyenne, 2)} de
                  moyenne d’équipe.
                </p>
              )}
              {view.axeADevelopper && (
                <p className="rounded-md border-l-4 border-sabc-warning bg-sabc-gray-50 px-3 py-2 text-sm text-sabc-gray-700 dark:bg-sabc-gray-800 dark:text-sabc-gray-200">
                  <span className="font-medium">Axe à développer — </span>
                  {view.axeADevelopper.critere} : {formatScore(view.axeADevelopper.moyenne, 2)},
                  {' '}
                  {view.axeADevelopper.partSousLeSeuil}% de l’équipe sous le niveau compétent.
                </p>
              )}
              {view.relais && (
                <p className="rounded-md border-l-4 border-sabc-info bg-sabc-gray-50 px-3 py-2 text-sm text-sabc-gray-700 dark:bg-sabc-gray-800 dark:text-sabc-gray-200">
                  <span className="font-medium">Relais interne — </span>
                  {nomDe(view.relais.matricule)} atteint {formatScore(view.relais.note, 1)} en{' '}
                  {view.relais.critere} et peut faire monter l’équipe sur cet axe.
                </p>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default TeamHeatmapCard;
