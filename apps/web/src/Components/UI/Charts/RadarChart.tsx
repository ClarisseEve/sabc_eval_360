import React from 'react';
import {
  RadarChart as RechartsRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  Tooltip,
  ResponsiveContainer,
  TooltipProps as RechartsTooltipProps
} from 'recharts';
import { cn } from '@/utils/helpers';

type TooltipProps = RechartsTooltipProps<number, string>;

// Utilisation des variables CSS SABC définies dans sabc-colors.css
const COLORS = {
  primary: 'var(--sabc-red-primary)',    // Rouge SABC principal
  secondary: 'var(--sabc-info)',         // Bleu secondaire
  success: 'var(--sabc-success)',        // Vert succès
  accent: 'var(--sabc-accent)',          // Orange accent
  neutral: 'var(--sabc-gray-400)',       // Gris neutre
  warning: 'var(--sabc-warning)',        // Jaune attention
};

// Palette de couleurs en tableau pour l'indexation
const COLOR_ARRAY = [
  'var(--sabc-red-primary)',    // Rouge SABC principal
  'var(--sabc-accent)',         // Orange accent
  'var(--sabc-success)',        // Vert succès
  'var(--sabc-info)',           // Bleu secondaire
  'var(--sabc-warning)',        // Jaune attention
  'var(--sabc-gray-400)',       // Gris neutre
];

export interface RadarChartProps {
  data: Array<Record<string, any>>;
  dataKeys: Array<{
    key: string;
    name: string;
    color?: string;
    fillOpacity?: number;
  }>;
  angleKey: string;
  height?: number;
  title?: string;
  className?: string;
  showLegend?: boolean;
  showGrid?: boolean;
  tooltip?: React.ReactNode | ((props: TooltipProps) => React.ReactNode);
  children?: React.ReactNode;
}

/**
 * Composant RadarChart pour visualiser les profils de compétences
 * Conforme aux règles graphiques SABC
 */
export function RadarChart({
  data,
  dataKeys,
  angleKey,
  height = 300,
  title,
  className = '',
  showLegend = true,
  showGrid = true,
  tooltip,
  children,
}: RadarChartProps) {
  // Fonction pour générer les radars
  const renderRadars = () => {
    return dataKeys.map((item, index) => (
      <Radar
        key={item.key}
        name={item.name}
        dataKey={item.key}
        stroke={item.color || COLOR_ARRAY[index % COLOR_ARRAY.length]}
        fill={item.color || COLOR_ARRAY[index % COLOR_ARRAY.length]}
        fillOpacity={item.fillOpacity || 0.2}
        animationDuration={500}
      />
    ));
  };

  // Rendu du tooltip personnalisé si fourni
  const renderTooltip = (props: TooltipProps) => {
    if (typeof tooltip === 'function') {
      return tooltip(props);
    }
    return tooltip || <></>;
  };

  return (
    <div className={cn('w-full', className)}>
      {title && (
        <h3 className="mb-2 text-sm font-semibold text-sabc-gray-800 dark:text-sabc-gray-100">
          {title}
        </h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <RechartsRadarChart
          data={data}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          {showGrid && <PolarGrid stroke="var(--sabc-gray-200)" />}
          <PolarAngleAxis
            dataKey={angleKey}
            tick={{ fill: 'var(--sabc-gray-600)', fontSize: 11 }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 5]}
            tick={{ fill: 'var(--sabc-gray-400)', fontSize: 10 }}
          />
          {renderRadars()}
          {showLegend && (
            <Legend
              layout="horizontal"
              verticalAlign="bottom"
              align="center"
              wrapperStyle={{ paddingTop: '10px' }}
            />
          )}
          <Tooltip content={renderTooltip} />
          {children}
        </RechartsRadarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default RadarChart;
