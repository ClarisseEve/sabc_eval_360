import React from 'react';
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  TooltipProps as RechartsTooltipProps
} from 'recharts';
import { cn } from '@/utils/helpers';

type TooltipProps = RechartsTooltipProps<number, string>;

import { CHART_SERIES, CHART_TICK, CHART_AXIS_LINE, CHART_COLORS, frenchTick } from './chartTheme';

const COLOR_ARRAY = CHART_SERIES;

export interface LineChartProps {
  data: Array<Record<string, any>>;
  lines?: Array<{
    dataKey: string;
    name: string;
    color?: string;
    strokeWidth?: number;
    type?: 'monotone' | 'linear' | 'step' | 'stepAfter' | 'stepBefore';
    dot?: boolean;
  }>;
  xAxisDataKey?: string;
  height?: number;
  title?: string;
  className?: string;
  showLegend?: boolean;
  showGrid?: boolean;
  tooltip?: React.ReactNode | ((props: TooltipProps) => React.ReactNode);
  children?: React.ReactNode;
}

/**
 * Composant LineChart pour visualiser les évolutions temporelles
 * Conforme aux règles graphiques SABC
 */
export function LineChart({
  data,
  lines,
  xAxisDataKey = 'name',
  height = 300,
  title,
  className = '',
  showLegend = true,
  showGrid = true,
  tooltip,
  children,
}: LineChartProps) {
  const defaultColors = CHART_SERIES;
  
  // Rendu des lignes du graphique
  const renderLines = () => {
    if (!lines || lines.length === 0) {
      // Si aucune ligne n'est spécifiée, créer une ligne par défaut basée sur la première propriété non-xAxis
      const firstDataItem = data[0] || {};
      const firstDataKey = Object.keys(firstDataItem).find(key => key !== xAxisDataKey) || '';
      
      return (
        <Line
          key="default-line"
          type="monotone"
          dataKey={firstDataKey}
          name={firstDataKey}
          stroke={defaultColors[0]}
          strokeWidth={2}
          dot={{ r: 4, strokeWidth: 2 }}
          activeDot={{ r: 6, strokeWidth: 2 }}
          animationDuration={500}
        />
      );
    }
    
    // Sinon, rendre les lignes spécifiées
    return lines.map((line, index) => (
      <Line
        key={line.dataKey}
        type={line.type || 'monotone'}
        dataKey={line.dataKey}
        name={line.name}
        stroke={line.color || COLOR_ARRAY[index % COLOR_ARRAY.length]}
        strokeWidth={line.strokeWidth || 2}
        dot={line.dot !== false ? { r: 4, strokeWidth: 2 } : false}
        activeDot={{ r: 6, strokeWidth: 2 }}
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
        <h3 className="mb-2 text-lg font-semibold text-sabc-gray-800 dark:text-sabc-gray-100">
          {title}
        </h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <RechartsLineChart
          data={data}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />}
          <XAxis 
            dataKey={xAxisDataKey} 
            tick={CHART_TICK}
            tickLine={CHART_AXIS_LINE}
            axisLine={CHART_AXIS_LINE}
          />
          <YAxis 
            tick={CHART_TICK}
            tickLine={CHART_AXIS_LINE}
            axisLine={CHART_AXIS_LINE}
          />
          {renderLines()}
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
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default LineChart;
