import * as React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/Components/UI/Card/Card';
import { cn } from '@/utils/helpers';
import { error } from 'console';

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
  title = "Performance par Département",
  description = "Comparaison des performances entre services",
  data,
  series,
  height = 300,
  yAxisDomain = [0, 100],
  stacked = false,
  formatTooltip = (value) => [`${value}%`, ''],
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
                <CartesianGrid strokeDasharray="3 3" stroke="var(--sabc-gray-200)" />
                <XAxis dataKey="name" tick={{ fill: 'var(--sabc-gray-600)', fontSize: 11 }} axisLine={{ stroke: '#E0E0E0' }} />
                <YAxis domain={yAxisDomain} tick={{ fill: 'var(--sabc-gray-600)', fontSize: 11 }} axisLine={{ stroke: '#E0E0E0' }} />
                <Tooltip
                  formatter={formatTooltip}
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E0E0E0',
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    fontSize: '12px',
                    padding: '8px 12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />

                {series.map((s) => (
                  <Bar
                    key={s.dataKey}
                    dataKey={s.dataKey}
                    name={s.name}
                    fill={s.color}
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
