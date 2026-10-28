import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  TooltipProps
} from 'recharts';

import { CHART_SERIES, CHART_TICK, CHART_AXIS_LINE, CHART_COLORS, CHART_TOOLTIP_STYLE, frenchTick } from './chartTheme';

export interface CategoricalChartProps {
  data: Array<Record<string, any>>;
  categories: Array<{
    name: string;
    dataKey: string;
    color?: string;
  }>;
  xAxisDataKey: string;
  height?: number;
  title?: string;
  subtitle?: string;
  className?: string;
  showGrid?: boolean;
  showLegend?: boolean;
  barSize?: number;
  tooltip?: React.ReactNode;
}

export function CategoricalChart({
  data,
  categories,
  xAxisDataKey,
  height = 300,
  title,
  subtitle,
  className = '',
  showGrid = true,
  showLegend = true,
  barSize = 20,
  tooltip,
}: CategoricalChartProps) {
  const defaultColors = CHART_SERIES;

  return (
    <div className={`w-full ${className}`}>
      {title && <h3 className="text-lg font-semibold text-sabc-gray-900 mb-1">{title}</h3>}
      {subtitle && <p className="text-sm text-sabc-gray-500 mb-4">{subtitle}</p>}
      
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
          barSize={barSize}
        >
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />}
          
          <XAxis 
            dataKey={xAxisDataKey} 
            tick={CHART_TICK}
            axisLine={CHART_AXIS_LINE}
          />
          <YAxis 
            tick={CHART_TICK}
            axisLine={CHART_AXIS_LINE}
          />
          
          <Tooltip 
            cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
            contentStyle={CHART_TOOLTIP_STYLE}
          />
          
          {showLegend && (
            <Legend 
              verticalAlign="bottom" 
              height={36} 
              wrapperStyle={{ fontSize: '12px' }}
            />
          )}
          
          {categories.map((category, index) => (
            <Bar
              key={category.dataKey}
              dataKey={category.dataKey}
              name={category.name}
              fill={category.color || defaultColors[index % defaultColors.length]}
              radius={[4, 4, 0, 0]}
              animationDuration={500}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
