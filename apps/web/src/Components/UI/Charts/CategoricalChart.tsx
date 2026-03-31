import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  TooltipProps
} from 'recharts';

// Following SABC design system color palette
const COLORS = {
  primary: '#E53E3E',    // Rouge SABC principal
  secondary: '#3182CE',  // Bleu secondaire
  success: '#48BB78',    // Vert succès
  accent: '#FF9800',     // Orange accent
  neutral: '#9E9E9E',    // Gris neutre
  warning: '#D69E2E',    // Jaune attention
};

export interface CategoricalChartProps {
  data: Array<Record<string, any>>;
  categories: Array<{
    name: string;
    dataKey: string;
    color?: string;
  }>;
  xAxisDataKey: string;
  height?: number;
  title?: string;
  subtitle?: string;
  className?: string;
  showGrid?: boolean;
  showLegend?: boolean;
  barSize?: number;
  tooltip?: React.ReactNode;
}

export function CategoricalChart({
  data,
  categories,
  xAxisDataKey,
  height = 300,
  title,
  subtitle,
  className = '',
  showGrid = true,
  showLegend = true,
  barSize = 20,
  tooltip,
}: CategoricalChartProps) {
  // Default colors from SABC palette if not specified
  const defaultColors = [
    COLORS.primary,
    COLORS.secondary,
    COLORS.success,
    COLORS.accent,
    COLORS.warning,
    COLORS.neutral,
  ];

  return (
    <div className={`w-full ${className}`}>
      {title && <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>}
      {subtitle && <p className="text-sm text-gray-500 mb-4">{subtitle}</p>}
      
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
          barSize={barSize}
        >
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />}
          
          <XAxis 
            dataKey={xAxisDataKey} 
            tick={{ fill: '#424242', fontSize: 12 }}
            axisLine={{ stroke: '#E0E0E0' }}
          />
          <YAxis 
            tick={{ fill: '#424242', fontSize: 12 }}
            axisLine={{ stroke: '#E0E0E0' }}
          />
          
          <Tooltip 
            cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
            contentStyle={{ 
              backgroundColor: '#FFFFFF',
              border: '1px solid #E0E0E0',
              borderRadius: '4px',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            }}
          />
          
          {showLegend && (
            <Legend 
              verticalAlign="bottom" 
              height={36} 
              wrapperStyle={{ fontSize: '12px' }}
            />
          )}
          
          {categories.map((category, index) => (
            <Bar
              key={category.dataKey}
              dataKey={category.dataKey}
              name={category.name}
              fill={category.color || defaultColors[index % defaultColors.length]}
              radius={[4, 4, 0, 0]}
              animationDuration={500}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
