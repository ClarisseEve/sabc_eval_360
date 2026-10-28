import * as React from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/Components/UI/Card/Card';
import { CHART_COLORS, CHART_SERIES, CHART_TICK, CHART_AXIS_LINE, CHART_TOOLTIP_STYLE, PERCENT_TICKS, formatChartPercent, frenchTick } from '@/Components/UI/Charts/chartTheme';

export interface LineChartData {
  date: string;
  [key: string]: string | number;
}

export interface LineChartSeries {
  dataKey: string;
  name: string;
  color: string;
  strokeWidth?: number;
  type?: 'monotone' | 'linear' | 'step' | 'stepBefore' | 'stepAfter';
}

export interface PerformanceLineChartProps {
  title?: string;
  description?: string;
  data: LineChartData[];
  series: LineChartSeries[];
  height?: number;
  yAxisDomain?: [number, number];
  chartType?: 'line' | 'area';
  formatTooltip?: (value: number, name: string) => [string, string];
  className?: string;
}

export const PerformanceLineChart: React.FC<PerformanceLineChartProps> = ({
  title = "Évolution de la performance",
  description = "Progression de la performance sur la période",
  data,
  series,
  height = 300,
  yAxisDomain = [0, 100],
  chartType = 'line',
  formatTooltip = (value) => [formatChartPercent(value), ''],
  className,
}) => {
  // Vérifier si les données sont valides
  const isValidData = data && data.length > 0 && series && series.length > 0;
  
  // Rendu du graphique en fonction du type
  const renderChart = () => {
    if (!isValidData) {
      return (
        <div className="flex h-full w-full items-center justify-center">
          <p className="text-sm text-sabc-gray-500 dark:text-sabc-gray-400">
            Aucune donnée disponible
          </p>
        </div>
      );
    }
    
    if (chartType === 'area') {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
            <XAxis dataKey="date" tick={CHART_TICK} axisLine={CHART_AXIS_LINE} />
            <YAxis domain={yAxisDomain} ticks={yAxisDomain[0] === 0 && yAxisDomain[1] === 100 ? PERCENT_TICKS : undefined} tickFormatter={frenchTick} tick={CHART_TICK} axisLine={CHART_AXIS_LINE} />
            <Tooltip formatter={formatTooltip} contentStyle={CHART_TOOLTIP_STYLE} />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            
            {series.map((s) => (
              <Area 
                key={s.dataKey}
                type={s.type || 'monotone'}
                dataKey={s.dataKey}
                name={s.name}
                stroke={s.color || CHART_SERIES[0]}
                fill={s.color || CHART_SERIES[0]}
                strokeWidth={s.strokeWidth || 2}
                fillOpacity={0.2}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      );
    }
    
    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 12, right: 24, left: 16, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
          <XAxis dataKey="date" tick={CHART_TICK} axisLine={CHART_AXIS_LINE} />
          <YAxis domain={yAxisDomain} ticks={yAxisDomain[0] === 0 && yAxisDomain[1] === 100 ? PERCENT_TICKS : undefined} tickFormatter={frenchTick} tick={CHART_TICK} axisLine={CHART_AXIS_LINE} />
          <Tooltip
            formatter={formatTooltip}
            contentStyle={CHART_TOOLTIP_STYLE}
          />
          <Legend wrapperStyle={{ fontSize: '12px' }} />

          {series.map((s) => (
            <Line
              key={s.dataKey}
              type={s.type || 'monotone'}
              dataKey={s.dataKey}
              name={s.name}
              stroke={s.color || CHART_SERIES[0]}
              strokeWidth={s.strokeWidth || 2}
              activeDot={{ r: 6 }}
              dot={{ r: 3 }}
              animationDuration={500}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    );
  };
  
  return (
    <Card className={className}>
      {(title || description) && (
        <CardHeader>
          {title && <CardTitle>{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent>
        <div style={{ width: '100%', height }}>
          {renderChart()}
        </div>
      </CardContent>
    </Card>
  );
};

export default PerformanceLineChart;
