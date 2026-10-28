import * as React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/Components/UI/Card/Card';
import { CHART_COLORS, CHART_SERIES, CHART_TICK, CHART_AXIS_LINE, CHART_TOOLTIP_STYLE, PERCENT_TICKS, formatChartPercent, frenchTick } from '@/Components/UI/Charts/chartTheme';

export interface BarChartData {
  name: string;
  [key: string]: string | number;
}

export interface BarChartSeries {
  dataKey: string;
  name: string;
  color: string;
}

export interface PerformanceBarChartProps {
  title?: string;
  description?: string;
  data: BarChartData[];
  series: BarChartSeries[];
  height?: number;
  yAxisDomain?: [number, number];
  stacked?: boolean;
  formatTooltip?: (value: number, name: string) => [string, string];
  className?: string;
}

export const PerformanceBarChart: React.FC<PerformanceBarChartProps> = ({
  title = "Performance par département",
  description = "Comparaison des performances entre services",
  data,
  series,
  height = 300,
  yAxisDomain = [0, 100],
  stacked = false,
  formatTooltip = (value) => [formatChartPercent(value), ''],
  className,
}) => {
  // Vérifier si les données sont valides
  const isValidData = data && data.length > 0 && series && series.length > 0;
  
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
          {isValidData ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{ top: 12, right: 24, left: 16, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
                <XAxis dataKey="name" tick={CHART_TICK} axisLine={CHART_AXIS_LINE} />
                <YAxis domain={yAxisDomain} ticks={yAxisDomain[0] === 0 && yAxisDomain[1] === 100 ? PERCENT_TICKS : undefined} tickFormatter={frenchTick} tick={CHART_TICK} axisLine={CHART_AXIS_LINE} />
                <Tooltip
                  formatter={formatTooltip}
                  contentStyle={CHART_TOOLTIP_STYLE}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />

                {series.map((s) => (
                  <Bar
                    key={s.dataKey}
                    dataKey={s.dataKey}
                    name={s.name}
                    fill={s.color || CHART_SERIES[0]}
                    radius={[4, 4, 0, 0]}
                    stackId={stacked ? 'stack' : undefined}
                    animationDuration={500}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <p className="text-sm text-sabc-gray-500 dark:text-sabc-gray-400">
                Aucune donnée disponible
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PerformanceBarChart;
