import React from 'react';
import {
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  LabelList,
  Cell,
} from 'recharts';
import type { LabelProps } from 'recharts';
import { cn } from '@/utils/helpers';

import { CHART_COLORS, CHART_TICK, CHART_AXIS_LINE, frenchTick, formatChartNumber } from './chartTheme';

const COLORS = {
  increase: CHART_COLORS.primary,
  decrease: CHART_COLORS.secondary,
  total: CHART_COLORS.emphasis,
};

export interface WaterfallDatum {
  name: string;
  value?: number;
  isTotal?: boolean;
  color?: string;
}

interface ProcessedWaterfallDatum extends WaterfallDatum {
  previous: number;
  net: number;
  cumulative: number;
  displayValue: number;
  type: 'increase' | 'decrease' | 'total';
}

export interface WaterfallChartProps {
  data: WaterfallDatum[];
  height?: number;
  title?: string;
  subtitle?: string;
  className?: string;
  showLegend?: boolean;
  showGrid?: boolean;
  showValues?: boolean;
  formatLabel?: (item: ProcessedWaterfallDatum) => string;
  renderTooltip?: (item: ProcessedWaterfallDatum) => React.ReactNode;
  positiveColor?: string;
  negativeColor?: string;
  totalColor?: string;
}

export function WaterfallChart({
  data,
  height = 320,
  title,
  subtitle,
  className,
  showLegend = true,
  showGrid = true,
  showValues = true,
  formatLabel,
  renderTooltip,
  positiveColor = COLORS.increase,
  negativeColor = COLORS.decrease,
  totalColor = COLORS.total,
}: WaterfallChartProps) {
  let runningTotal = 0;

  const processedData: ProcessedWaterfallDatum[] = data.map((item) => {
    if (item.isTotal) {
      const totalValue = item.value ?? runningTotal;
      runningTotal = totalValue;
      return {
        ...item,
        previous: 0,
        net: totalValue,
        cumulative: totalValue,
        displayValue: totalValue,
        type: 'total',
      };
    }

    const delta = item.value ?? 0;
    const previous = runningTotal;
    runningTotal += delta;

    return {
      ...item,
      previous,
      net: delta,
      cumulative: runningTotal,
      displayValue: delta,
      type: delta >= 0 ? 'increase' : 'decrease',
    };
  });

  const getBarColor = (item: ProcessedWaterfallDatum) => {
    if (item.color) return item.color;
    if (item.type === 'total') return totalColor;
    return item.type === 'increase' ? positiveColor : negativeColor;
  };

  const defaultTooltip = (item: ProcessedWaterfallDatum) => (
    <div className="rounded-lg border border-sabc-gray-200 bg-white px-3 py-2 text-xs text-sabc-gray-700">
      <div className="font-semibold text-sabc-gray-800">{item.name}</div>
      {item.type === 'total' ? (
        <div>Total : {formatChartNumber(item.cumulative)}</div>
      ) : (
        <>
          <div>
            Variation : {item.net >= 0 ? '+' : ''}{formatChartNumber(item.net)}
          </div>
          <div>Cumul : {formatChartNumber(item.cumulative)}</div>
        </>
      )}
    </div>
  );

  const renderTooltipContent = ({ active, payload }: any) => {
    if (!active || !payload || payload.length === 0) {
      return null;
    }
    const item = payload[payload.length - 1]?.payload as ProcessedWaterfallDatum | undefined;
    if (!item) {
      return null;
    }
    return renderTooltip ? renderTooltip(item) : defaultTooltip(item);
  };

  const renderValueLabel = (props: LabelProps) => {
    const { x = 0, y = 0, width = 0, height: barHeight = 0, index = 0 } = props;
    const item = processedData[index];
    if (!item) return null;
    const safeX = Number(x);
    const safeY = Number(y);
    const safeWidth = Number(width);
    const safeBarHeight = Number(barHeight);

    const defaultLabel = item.type === 'total'
      ? item.cumulative
      : item.net;
    const labelText = formatLabel
      ? formatLabel(item)
      : `${item.type !== 'total' && item.net >= 0 ? '+' : ''}${formatChartNumber(defaultLabel)}`;

    const labelY = item.type === 'decrease'
      ? safeY + safeBarHeight + 14
      : safeY - 8;

    return (
      <text
        x={safeX + safeWidth / 2}
        y={labelY}
        fill="#4F4F4F"
        textAnchor="middle"
        fontSize={12}
      >
        {labelText}
      </text>
    );
  };

  const legendPayload = [
    { value: 'Augmentation', type: 'square' as const, color: positiveColor },
    { value: 'Diminution', type: 'square' as const, color: negativeColor },
    { value: 'Total', type: 'square' as const, color: totalColor },
  ];

  return (
    <div className={cn('w-full', className)}>
      {title && <h3 className="text-lg font-semibold text-sabc-gray-800">{title}</h3>}
      {subtitle && <p className="text-sm text-sabc-gray-500 mb-3">{subtitle}</p>}
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart
          data={processedData}
          margin={{ top: 16, right: 24, left: 16, bottom: 16 }}
        >
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />}
          <XAxis
            dataKey="name"
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
          <ReferenceLine y={0} stroke={CHART_COLORS.axis} />
          <Tooltip content={renderTooltipContent} />
          {showLegend && <Legend payload={legendPayload} wrapperStyle={{ fontSize: '12px' }} />}
          <Bar dataKey="previous" stackId="waterfall" fill="transparent" isAnimationActive={false} />
          <Bar dataKey="net" stackId="waterfall">
            {processedData.map((item, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(item)} />
            ))}
            {showValues && <LabelList content={renderValueLabel} />}
          </Bar>
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

export default WaterfallChart;
