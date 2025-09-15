import React from 'react';
import { cn } from '@/utils/helpers';

// Utilisation des variables CSS SABC définies dans sabc-colors.css
const COLORS = {
  primary: 'var(--sabc-red-primary)',    // Rouge SABC principal
  secondary: 'var(--sabc-info)',         // Bleu secondaire
  success: 'var(--sabc-success)',        // Vert succès
  accent: 'var(--sabc-accent)',          // Orange accent
  neutral: 'var(--sabc-gray-400)',       // Gris neutre
  warning: 'var(--sabc-warning)',        // Jaune attention
};

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
}: HeatMapProps) {
  // Échelle de couleurs par défaut basée sur la palette SABC
  const defaultColorScale = [
    { min: 0, max: 1, color: 'var(--sabc-red-light)', textColor: 'var(--sabc-gray-800)' },
    { min: 1, max: 2, color: 'var(--sabc-red-primary)', textColor: 'white' },
    { min: 2, max: 3, color: 'var(--sabc-accent-light)', textColor: 'var(--sabc-gray-800)' },
    { min: 3, max: 4, color: 'var(--sabc-accent)', textColor: 'white' },
    { min: 4, max: 5, color: 'var(--sabc-success)', textColor: 'white' },
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
    <div className={cn('w-full', className)} style={{ height: height }}>
      {title && (
        <h3 className="mb-4 text-lg font-semibold text-sabc-gray-800 dark:text-sabc-gray-100">
          {title}
        </h3>
      )}
      
      <div className="flex">
        {/* Coin supérieur gauche vide */}
        <div style={{ width: cellSize, height: cellSize }} className="flex-shrink-0"></div>
        
        {/* En-têtes de colonnes (X) */}
        <div className="flex flex-1">
          {xLabels.map((label, index) => (
            <div
              key={`x-${index}`}
              className="flex items-center justify-center border-b border-sabc-gray-200 px-2 py-1 text-center text-sm font-medium text-sabc-gray-700 dark:text-sabc-gray-300"
              style={{ width: cellSize, height: cellSize }}
            >
              {label}
            </div>
          ))}
        </div>
      </div>
      
      {/* Corps de la heatmap */}
      <div className="flex flex-1 flex-col">
        {yLabels.map((yLabel, yIndex) => (
          <div key={`row-${yIndex}`} className="flex">
            {/* En-tête de ligne (Y) */}
            <div
              className="flex items-center border-r border-sabc-gray-200 px-2 py-1 text-sm font-medium text-sabc-gray-700 dark:text-sabc-gray-300"
              style={{ width: cellSize, height: cellSize }}
            >
              {yLabel}
            </div>
            
            {/* Cellules de données */}
            <div className="flex flex-1">
              {xLabels.map((xLabel, xIndex) => {
                const cellData = getCellData(xLabel, yLabel);
                const { backgroundColor, color } = getCellColor(cellData.value);
                
                return (
                  <div
                    key={`cell-${xIndex}-${yIndex}`}
                    className="flex cursor-pointer items-center justify-center border border-sabc-gray-200 text-center text-sm font-semibold transition-all hover:opacity-90"
                    style={{
                      width: cellSize,
                      height: cellSize,
                      backgroundColor,
                      color,
                    }}
                    onClick={() => handleCellClick(xLabel, yLabel, cellData.value)}
                    title={tooltip ? `${xLabel} / ${yLabel}: ${cellData.value}` : undefined}
                  >
                    {cellData.value.toFixed(1)}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      
      {/* Légende */}
      {showLegend && (
        <div className="mt-4 flex items-center justify-center space-x-4">
          {scale.map((item, index) => (
            <div key={`legend-${index}`} className="flex items-center">
              <div
                className="mr-1 h-4 w-4"
                style={{ backgroundColor: item.color }}
              ></div>
              <span className="text-xs text-sabc-gray-600 dark:text-sabc-gray-400">
                {item.min} - {item.max}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default HeatMap;
