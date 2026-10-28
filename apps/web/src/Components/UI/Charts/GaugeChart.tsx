import React from 'react';
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { cn } from '@/utils/helpers';

import { CHART_COLORS, CHART_TOOLTIP_STYLE } from './chartTheme';

const DEFAULT_COLOR = CHART_COLORS.primary;
const TRACK_COLOR = CHART_COLORS.track;

export interface GaugeChartProps {
  value: number;
  max?: number;
  min?: number;
  height?: number;
  title?: string;
  subtitle?: string;
  label?: string;
  className?: string;
  color?: string;
  trackColor?: string;
  showTooltip?: boolean;
  formatValue?: (value: number, percentage: number) => string;
  formatTooltip?: (value: number, percentage: number) => string;
  innerRadius?: number | string;
  outerRadius?: number | string;
}

export function GaugeChart({
  value,
  max = 100,
  min = 0,
  height = 240,
  title,
  subtitle,
  label,
  className,
  color = DEFAULT_COLOR,
  trackColor = TRACK_COLOR,
  showTooltip = true,
  formatValue,
  formatTooltip,
  innerRadius = '65%',
  outerRadius = '85%',
}: GaugeChartProps) {
  const safeMax = Math.max(max, min + 1);
  const clamped = Math.min(Math.max(value, min), safeMax);
  const totalRange = safeMax - min;
  const progress = (clamped - min) / totalRange;
  const completion = Math.max(0, Math.min(1, progress));
  const remainder = 1 - completion;

  const chartData = remainder > 0
    ? [
        { name: 'progress', value: completion, color },
        { name: 'remainder', value: remainder, color: trackColor },
      ]
    : [{ name: 'progress', value: completion, color }];

  const displayedValue = formatValue
    ? formatValue(clamped, completion)
    : `${Math.round(completion * 100)} %`;

  return (
    <div className={cn('w-full', className)}>
      {title && <h3 className="text-lg font-semibold text-sabc-gray-800">{title}</h3>}
      <div className="relative" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <RechartsPieChart>
            <Pie
              data={chartData}
              dataKey="value"
              startAngle={90}
              endAngle={-270}
              innerRadius={innerRadius}
              outerRadius={outerRadius}
              stroke="none"
            >
              {chartData.map((segment, index) => (
                <Cell key={`cell-${index}`} fill={segment.color} />
              ))}
            </Pie>
            {showTooltip && (
              <Tooltip
                formatter={(segValue: number, segmentName: string) => {
                  const percent = Math.max(0, Math.min(1, segValue));
                  const actual = segmentName === 'progress'
                    ? clamped
                    : safeMax - clamped;
                  const labelKey = segmentName === 'progress' ? 'Réalisé' : 'Reste';
                  const text = formatTooltip
                    ? formatTooltip(actual, percent)
                    : `${Math.round(percent * 100)} %`;
                  return [text, labelKey];
                }}
                contentStyle={CHART_TOOLTIP_STYLE}
              />
            )}
          </RechartsPieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-semibold text-sabc-gray-900">{displayedValue}</span>
          {label && <span className="text-sm text-sabc-gray-500">{label}</span>}
        </div>
      </div>
      {subtitle && <p className="mt-2 text-sm text-sabc-gray-500">{subtitle}</p>}
    </div>
  );
}

export default GaugeChart;
