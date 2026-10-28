import React from 'react';
import { cn } from '@/utils/helpers';


export interface HeatMapProps {
  data: Array<{
    x: string;
    y: string;
    value: number;
  }>;
  xLabels: string[];
  yLabels: string[];
  height?: number;
  title?: string;
  className?: string;
  colorScale?: Array<{
    min: number;
    max: number;
    color: string;
    textColor?: string;
  }>;
  showLegend?: boolean;
  cellSize?: number;
  tooltip?: boolean;
  onCellClick?: (x: string, y: string, value: number) => void;
  formatValue?: (value: number) => string;
}

/**
 * Composant HeatMap pour visualiser les matrices d'équipes
 * Conforme aux règles graphiques SABC
 */
export function HeatMap({
  data,
  xLabels,
  yLabels,
  height = 400,
  title,
  className = '',
  colorScale,
  showLegend = true,
  cellSize = 40,
  tooltip = true,
  onCellClick,
  formatValue,
}: HeatMapProps) {
  const columnWidth = Math.max(cellSize, 96);
  const rowHeaderWidth = Math.max(cellSize * 3, 180);
  const headerHeight = 72;
  const gridWidth = rowHeaderWidth + (columnWidth * xLabels.length);
  // Échelle de couleurs par défaut basée sur la palette SABC
  // Rampe monochrome rouge : plus la note est haute, plus la teinte est soutenue.
  const defaultColorScale = [
    { min: 0, max: 1, color: '#F7F7F5', textColor: '#4F4F4F' },
    { min: 1, max: 2, color: '#F3D3D6', textColor: '#4F4F4F' },
    { min: 2, max: 3, color: '#E89AA2', textColor: '#2B2B2B' },
    { min: 3, max: 4, color: '#D01A2C', textColor: '#FFFFFF' },
    { min: 4, max: 5, color: '#A3121F', textColor: '#FFFFFF' },
  ];

  const scale = colorScale || defaultColorScale;

  // Fonction pour déterminer la couleur d'une cellule en fonction de sa valeur
  const getCellColor = (value: number) => {
    const colorInfo = scale.find(item => value >= item.min && value <= item.max);
    return {
      backgroundColor: colorInfo ? colorInfo.color : 'var(--sabc-gray-100)',
      color: colorInfo ? colorInfo.textColor || 'white' : 'var(--sabc-gray-800)',
    };
  };

  // Fonction pour obtenir les données d'une cellule
  const getCellData = (x: string, y: string) => {
    return data.find(item => item.x === x && item.y === y) || { x, y, value: 0 };
  };

  // Gestionnaire de clic sur une cellule
  const handleCellClick = (x: string, y: string, value: number) => {
    if (onCellClick) {
      onCellClick(x, y, value);
    }
  };

  return (
    <div className={cn('w-full', className)} style={{ minHeight: height }}>
      {title && (
        <h3 className="mb-4 text-lg font-semibold text-sabc-gray-800 dark:text-sabc-gray-100">
          {title}
        </h3>
      )}
      
      <div className="w-full overflow-x-auto pb-2" tabIndex={0} aria-label="Matrice de compétences défilable horizontalement">
        <div role="table" className="min-w-max" style={{ width: gridWidth }}>
          <div role="row" className="flex">
            <div
              role="columnheader"
              className="flex shrink-0 items-end border-b border-r border-sabc-gray-200 px-3 pb-2 text-xs font-medium text-sabc-gray-500 dark:border-sabc-gray-700 dark:text-sabc-gray-400"
              style={{ width: rowHeaderWidth, height: headerHeight }}
            >
              Collaborateur / critère
            </div>
            {xLabels.map((label, index) => (
              <div
                key={`x-${index}`}
                role="columnheader"
                className="flex shrink-0 items-end justify-center break-words border-b border-sabc-gray-200 px-2 pb-2 text-center text-xs font-medium leading-tight text-sabc-gray-700 dark:border-sabc-gray-700 dark:text-sabc-gray-300"
                style={{ width: columnWidth, height: headerHeight }}
                title={label}
              >
                {label}
              </div>
            ))}
          </div>

          {yLabels.map((yLabel, yIndex) => (
            <div key={`row-${yIndex}`} role="row" className="flex">
              <div
                role="rowheader"
                className="flex shrink-0 items-center border-b border-r border-sabc-gray-200 px-3 py-1 text-sm font-medium leading-tight text-sabc-gray-700 dark:border-sabc-gray-700 dark:text-sabc-gray-300"
                style={{ width: rowHeaderWidth, minHeight: cellSize }}
                title={yLabel}
              >
                <span className="line-clamp-2">{yLabel}</span>
              </div>

              {xLabels.map((xLabel, xIndex) => {
                const cellData = getCellData(xLabel, yLabel);
                const { backgroundColor, color } = getCellColor(cellData.value);
                const cellLabel = `${xLabel}, ${yLabel} : ${formatValue ? formatValue(cellData.value) : cellData.value.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}`;
                const cellStyle = {
                  width: columnWidth,
                  height: cellSize,
                  backgroundColor,
                  color,
                };

                return onCellClick ? (
                  <button
                    type="button"
                    role="cell"
                    aria-label={cellLabel}
                    key={`cell-${xIndex}-${yIndex}`}
                    className="flex shrink-0 cursor-pointer items-center justify-center border border-sabc-gray-200 text-center text-sm font-semibold transition-opacity hover:opacity-90 focus-visible:relative focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sabc-red-dark dark:border-sabc-gray-700"
                    style={cellStyle}
                    onClick={() => handleCellClick(xLabel, yLabel, cellData.value)}
                    title={tooltip ? cellLabel : undefined}
                  >
                    {formatValue ? formatValue(cellData.value) : cellData.value.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                  </button>
                ) : (
                  <div
                    key={`cell-${xIndex}-${yIndex}`}
                    role="cell"
                    aria-label={cellLabel}
                    className="flex shrink-0 items-center justify-center border border-sabc-gray-200 text-center text-sm font-semibold dark:border-sabc-gray-700"
                    style={cellStyle}
                    title={tooltip ? cellLabel : undefined}
                  >
                    {formatValue ? formatValue(cellData.value) : cellData.value.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      
      {/* Légende */}
      {showLegend && (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
          {scale.map((item, index) => (
            <div key={`legend-${index}`} className="flex items-center">
              <div
                className="mr-1 h-4 w-4"
                style={{ backgroundColor: item.color }}
              ></div>
              <span className="text-xs text-sabc-gray-600 dark:text-sabc-gray-400">
                {item.min.toLocaleString('fr-FR')} à {item.max.toLocaleString('fr-FR')}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default HeatMap;
