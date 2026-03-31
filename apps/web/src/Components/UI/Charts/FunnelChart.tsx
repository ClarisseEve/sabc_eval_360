import React, { useMemo } from 'react';
import {
  FunnelChart as RechartsFunnelChart,
  Funnel,
  Tooltip,
  LabelList,
  ResponsiveContainer,
} from 'recharts';
import { cn } from '@/utils/helpers';

const COLORS = [
  'var(--sabc-red-primary)',
  'var(--sabc-accent)',
  'var(--sabc-success)',
  'var(--sabc-info)',
  'var(--sabc-warning)',
  'var(--sabc-gray-400)',
];

export interface FunnelDatum {
  name: string;
  value: number;
  color?: string;
}

export interface FunnelChartProps {
  data: FunnelDatum[];
  height?: number;
  title?: string;
  subtitle?: string;
  className?: string;
  showTooltip?: boolean;
  showValues?: boolean;
  formatValue?: (item: FunnelDatum, percentage: number) => string;
}

export function FunnelChart({
  data,
  height = 360,
  title,
  subtitle,
  className,
  showTooltip = true,
  showValues = true,
  formatValue,
}: FunnelChartProps) {
  const total = data[0]?.value ?? 0;

  const chartData = useMemo(
    () =>
      data.map((item, index) => {
        const ratio = total > 0 ? item.value / total : 0;
        return {
          ...item,
          fill: item.color || COLORS[index % COLORS.length],
          ratio,
          label: formatValue
            ? formatValue(item, ratio)
            : `${Math.round(ratio * 100)}%`,
        };
      }),
    [data, total, formatValue]
  );

  return (
    <div className={cn('w-full', className)}>
      {title && <h3 className="text-lg font-semibold text-sabc-gray-800">{title}</h3>}
      {subtitle && <p className="text-sm text-sabc-gray-500 mb-3">{subtitle}</p>}
      <ResponsiveContainer width="100%" height={height}>
        <RechartsFunnelChart>
          {showTooltip && (
            <Tooltip
              formatter={(_value: number, _name: string, entry: any) => {
                const datum = entry.payload as (FunnelDatum & { ratio: number; label: string });
                const labelValue = datum.label;
                return [`${datum.value.toLocaleString()} (${labelValue})`, datum.name];
              }}
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid var(--sabc-gray-200)',
                borderRadius: 4,
                boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
              }}
            />
          )}
          <Funnel
            dataKey="value"
            data={chartData}
            isAnimationActive
            stroke="none"
          >
            {showValues && <LabelList dataKey="label" position="right" fill="var(--sabc-gray-700)" />}
          </Funnel>
        </RechartsFunnelChart>
      </ResponsiveContainer>
    </div>
  );
}

export default FunnelChart;
