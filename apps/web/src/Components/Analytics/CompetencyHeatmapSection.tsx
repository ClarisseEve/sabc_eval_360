import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/UI/Card/Card';
import HeatMap from '@/Components/UI/Charts/HeatMap';
import type { CompetencyHeatmapCell } from './types';

interface CompetencyHeatmapSectionProps {
  cells: CompetencyHeatmapCell[];
  roles: string[];
  families: string[];
  onSelect?: (role: string) => void;
}

const COLOR_SCALE = [
  { min: -5, max: -1, color: 'var(--sabc-error)', textColor: 'white' },
  { min: -1, max: -0.1, color: 'var(--sabc-error-light, #FEE2E2)', textColor: 'var(--sabc-gray-800)' },
  { min: -0.1, max: 0.1, color: 'var(--sabc-gray-200)', textColor: 'var(--sabc-gray-800)' },
  { min: 0.1, max: 1, color: 'var(--sabc-success-light, #BBF7D0)', textColor: 'var(--sabc-gray-800)' },
  { min: 1, max: 5, color: 'var(--sabc-success)', textColor: 'white' },
];

export const CompetencyHeatmapSection: React.FC<CompetencyHeatmapSectionProps> = ({
  cells,
  roles,
  families,
  onSelect,
}) => {
  const matrix = React.useMemo(() => {
    const map = new Map<string, CompetencyHeatmapCell>();
    cells.forEach(cell => {
      map.set(`${cell.role}-${cell.family}`, cell);
    });
    return map;
  }, [cells]);

  const heatmapData = React.useMemo(() => {
    if (roles.length === 0 || families.length === 0) {
      return [];
    }

    return families.flatMap((family) =>
      roles.map((role) => {
        const cell = matrix.get(`${role}-${family}`);
        const delta = cell ? cell.score - cell.target : 0;
        return {
          x: family,
          y: role,
          value: Number(delta.toFixed(2)),
        };
      })
    );
  }, [families, matrix, roles]);

  const heatmapHeight = React.useMemo(() => {
    if (roles.length === 0) {
      return 320;
    }
    const computed = roles.length * 44 + 160;
    return Math.max(280, Math.min(520, computed));
  }, [roles.length]);

  const handleCellClick = React.useCallback(
    (_family: string, role: string) => {
      onSelect?.(role);
    },
    [onSelect]
  );

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg text-sabc-gray-900">Gaps de compétences</CardTitle>
        <CardDescription>
          Visualisation des écarts vs cibles par rôle et famille de compétences (valeurs positives = au-dessus de la cible).
        </CardDescription>
      </CardHeader>
      <CardContent>
        {heatmapData.length === 0 ? (
          <p className="rounded border border-dashed border-sabc-gray-200 px-4 py-6 text-center text-sm text-sabc-gray-500">
            Aucune donnée de compétence disponible avec les filtres sélectionnés.
          </p>
        ) : (
          <HeatMap
            data={heatmapData}
            xLabels={families}
            yLabels={roles}
            height={heatmapHeight}
            colorScale={COLOR_SCALE}
            tooltip
            onCellClick={handleCellClick}
            formatValue={(value) => `${value >= 0 ? '+' : ''}${value.toFixed(1)}`}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default CompetencyHeatmapSection;
