import React from 'react';
import {
  AreaChart as RechartsAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { cn } from '@/utils/helpers';

import { CHART_SERIES, CHART_TICK, CHART_AXIS_LINE, CHART_COLORS, CHART_TOOLTIP_STYLE, frenchTick } from './chartTheme';

const COLORS = CHART_SERIES;

export interface AreaDefinition {
  dataKey: string;
  name?: string;
  color?: string;
  stackId?: string;
  type?: 'monotone' | 'linear' | 'step' | 'stepAfter' | 'stepBefore';
  fillOpacity?: number;
}

export interface AreaChartProps {
  data: Array<Record<string, any>>;
  areas?: AreaDefinition[];
  xAxisDataKey?: string;
  height?: number;
  title?: string;
  subtitle?: string;
  className?: string;
  showLegend?: boolean;
  showGrid?: boolean;
  tooltip?: React.ReactNode;
  children?: React.ReactNode;
}

export function AreaChart({
  data,
  areas,
  xAxisDataKey = 'name',
  height = 300,
  title,
  subtitle,
  className,
  showLegend = true,
  showGrid = true,
  tooltip,
  children,
}: AreaChartProps) {
  const renderAreas = () => {
    if (!areas || areas.length === 0) {
      const sample = data[0] || {};
      const firstKey = Object.keys(sample).find((key) => key !== xAxisDataKey);
      if (!firstKey) {
        return null;
      }
      return (
        <Area
          key="default-area"
          type="monotone"
          dataKey={firstKey}
          name={firstKey}
          stroke={COLORS[0]}
          fill={COLORS[0]}
          fillOpacity={0.2}
          strokeWidth={2}
          animationDuration={500}
        />
      );
    }

    return areas.map((area, index) => {
      const color = area.color || COLORS[index % COLORS.length];
      return (
        <Area
          key={area.dataKey}
          type={area.type || 'monotone'}
          dataKey={area.dataKey}
          name={area.name || area.dataKey}
          stroke={color}
          fill={color}
          fillOpacity={area.fillOpacity ?? 0.3}
          stackId={area.stackId}
          strokeWidth={2}
          animationDuration={500}
        />
      );
    });
  };

  return (
    <div className={cn('w-full', className)}>
      {title && <h3 className="text-lg font-semibold text-sabc-gray-800">{title}</h3>}
      {subtitle && <p className="text-sm text-sabc-gray-500 mb-3">{subtitle}</p>}
      <ResponsiveContainer width="100%" height={height}>
        <RechartsAreaChart
          data={data}
          margin={{ top: 10, right: 24, left: 0, bottom: 0 }}
        >
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />}
          <XAxis
            dataKey={xAxisDataKey}
            tick={CHART_TICK}
            axisLine={CHART_AXIS_LINE}
            tickLine={CHART_AXIS_LINE}
          />
          <YAxis
            tickFormatter={frenchTick}
            tick={CHART_TICK}
            axisLine={CHART_AXIS_LINE}
            tickLine={CHART_AXIS_LINE}
          />
          {tooltip ? (
            <Tooltip content={tooltip as any} />
          ) : (
            <Tooltip
              cursor={{ strokeDasharray: '3 3' }}
              contentStyle={CHART_TOOLTIP_STYLE}
            />
          )}
          {showLegend && (
            <Legend
              verticalAlign="bottom"
              height={36}
              wrapperStyle={{ fontSize: '12px' }}
            />
          )}
          {renderAreas()}
          {children}
        </RechartsAreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export default AreaChart;
