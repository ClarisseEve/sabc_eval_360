import React from 'react';
import {
  ScatterChart as RechartsScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { TooltipProps as RechartsTooltipProps } from 'recharts';
import { cn } from '@/utils/helpers';

import { CHART_SERIES, CHART_TICK, CHART_AXIS_LINE, CHART_COLORS, CHART_TOOLTIP_STYLE, frenchTick } from './chartTheme';

const COLORS = CHART_SERIES;

export interface ScatterSeries {
  name?: string;
  data?: Array<Record<string, any>>;
  color?: string;
  shape?: 'circle' | 'square' | 'diamond' | 'triangle' | 'wye';
  opacity?: number;
  line?: boolean;
  lineType?: 'joint' | 'fitting';
}

type ScatterTooltipProps = RechartsTooltipProps<any, any>;

export interface ScatterChartProps {
  data?: Array<Record<string, any>>;
  series?: ScatterSeries[];
  xAxisDataKey?: string;
  yAxisDataKey?: string;
  zAxisDataKey?: string;
  xAxisName?: string;
  yAxisName?: string;
  zAxisName?: string;
  xAxisUnit?: string;
  yAxisUnit?: string;
  zAxisUnit?: string;
  height?: number;
  title?: string;
  subtitle?: string;
  className?: string;
  showLegend?: boolean;
  showGrid?: boolean;
  tooltip?: React.ReactNode | ((props: ScatterTooltipProps) => React.ReactNode);
  zAxisRange?: [number, number];
  children?: React.ReactNode;
}

export function ScatterChart({
  data = [],
  series,
  xAxisDataKey = 'x',
  yAxisDataKey = 'y',
  zAxisDataKey,
  xAxisName,
  yAxisName,
  zAxisName,
  xAxisUnit,
  yAxisUnit,
  zAxisUnit,
  height = 320,
  title,
  subtitle,
  className,
  showLegend = true,
  showGrid = true,
  tooltip,
  zAxisRange = [60, 360],
  children,
}: ScatterChartProps) {
  const datasets = (series && series.length > 0 ? series : [{ name: xAxisName && yAxisName ? `${yAxisName} selon ${xAxisName}` : 'Série', data }]).map(
    (entry, index) => ({
      name: entry.name || `Série ${index + 1}`,
      data: entry.data || data,
      color: entry.color || COLORS[index % COLORS.length],
      shape: entry.shape,
      opacity: entry.opacity ?? 0.85,
      line: entry.line,
      lineType: entry.lineType,
    })
  );

  const renderTooltip = () => {
    if (!tooltip) {
      return (
        <Tooltip
          cursor={{ strokeDasharray: '3 3' }}
          contentStyle={CHART_TOOLTIP_STYLE}
          formatter={(value: number | string, name: string) => [value, name]}
        />
      );
    }

    if (typeof tooltip === 'function') {
      return (
        <Tooltip
          cursor={{ strokeDasharray: '3 3' }}
          contentStyle={CHART_TOOLTIP_STYLE}
          content={tooltip}
        />
      );
    }

    return tooltip;
  };

  return (
    <div className={cn('w-full', className)}>
      {title && <h3 className="text-lg font-semibold text-sabc-gray-800">{title}</h3>}
      {subtitle && <p className="text-sm text-sabc-gray-500 mb-3">{subtitle}</p>}
      <ResponsiveContainer width="100%" height={height}>
        <RechartsScatterChart
          margin={{ top: 20, right: 24, left: 16, bottom: 20 }}
        >
          {showGrid && <CartesianGrid stroke={CHART_COLORS.grid} strokeDasharray="3 3" />}
          <XAxis
            type="number"
            dataKey={xAxisDataKey}
            name={xAxisName || xAxisDataKey}
            unit={xAxisUnit}
            tickFormatter={frenchTick}
            tick={CHART_TICK}
            axisLine={CHART_AXIS_LINE}
            tickLine={CHART_AXIS_LINE}
          />
          <YAxis
            type="number"
            dataKey={yAxisDataKey}
            name={yAxisName || yAxisDataKey}
            unit={yAxisUnit}
            tickFormatter={frenchTick}
            tick={CHART_TICK}
            axisLine={CHART_AXIS_LINE}
            tickLine={CHART_AXIS_LINE}
          />
          {zAxisDataKey && (
            <ZAxis
              type="number"
              dataKey={zAxisDataKey}
              range={zAxisRange}
              name={zAxisName || zAxisDataKey}
              unit={zAxisUnit}
            />
          )}
          {renderTooltip()}
          {showLegend && <Legend wrapperStyle={{ fontSize: '12px' }} />}
          {datasets.map((item, index) => (
            <Scatter
              key={`scatter-${index}`}
              name={item.name}
              data={item.data}
              fill={item.color}
              opacity={item.opacity}
              shape={item.shape}
              line={item.line}
              lineType={item.lineType}
              animationDuration={500}
            />
          ))}
          {children}
        </RechartsScatterChart>
      </ResponsiveContainer>
    </div>
  );
}

export default ScatterChart;
