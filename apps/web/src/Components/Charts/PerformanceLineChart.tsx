import * as React from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/Components/UI/Card/Card';
import { cn } from '@/utils/helpers';

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
  title = "Évolution de Performance",
  description = "Progression de la performance sur la période",
  data,
  series,
  height = 300,
  yAxisDomain = [0, 100],
  chartType = 'line',
  formatTooltip = (value) => [`${value}%`, ''],
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
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis domain={yAxisDomain} />
            <Tooltip formatter={formatTooltip} />
            <Legend />
            
            {series.map((s) => (
              <Area 
                key={s.dataKey}
                type={s.type || 'monotone'}
                dataKey={s.dataKey}
                name={s.name}
                stroke={s.color}
                fill={s.color}
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
          <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
          <XAxis dataKey="date" tick={{ fill: '#616161', fontSize: 11 }} axisLine={{ stroke: '#E0E0E0' }} />
          <YAxis domain={yAxisDomain} tick={{ fill: '#616161', fontSize: 11 }} axisLine={{ stroke: '#E0E0E0' }} />
          <Tooltip
            formatter={formatTooltip}
            contentStyle={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E0E0E0',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              fontSize: '12px',
            }}
          />
          <Legend wrapperStyle={{ fontSize: '12px' }} />

          {series.map((s) => (
            <Line
              key={s.dataKey}
              type={s.type || 'monotone'}
              dataKey={s.dataKey}
              name={s.name}
              stroke={s.color}
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
