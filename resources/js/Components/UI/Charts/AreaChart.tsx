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

const COLORS = [
  'var(--sabc-red-primary)',
  'var(--sabc-accent)',
  'var(--sabc-success)',
  'var(--sabc-info)',
  'var(--sabc-warning)',
  'var(--sabc-gray-400)',
];

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
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="var(--sabc-gray-200)" />}
          <XAxis
            dataKey={xAxisDataKey}
            tick={{ fill: 'var(--sabc-gray-500)', fontSize: 12 }}
            axisLine={{ stroke: 'var(--sabc-gray-200)' }}
            tickLine={{ stroke: 'var(--sabc-gray-200)' }}
          />
          <YAxis
            tick={{ fill: 'var(--sabc-gray-500)', fontSize: 12 }}
            axisLine={{ stroke: 'var(--sabc-gray-200)' }}
            tickLine={{ stroke: 'var(--sabc-gray-200)' }}
          />
          {tooltip ? (
            <Tooltip content={tooltip} />
          ) : (
            <Tooltip
              cursor={{ strokeDasharray: '3 3' }}
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid var(--sabc-gray-200)',
                borderRadius: 4,
                boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
              }}
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
