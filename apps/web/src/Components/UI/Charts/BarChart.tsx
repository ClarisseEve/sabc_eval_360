import React from 'react';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  TooltipProps
} from 'recharts';

// Utilisation des variables CSS SABC définies dans sabc-colors.css
const COLORS = {
  primary: 'var(--sabc-red-primary)',    // Rouge SABC principal
  secondary: 'var(--sabc-info)',         // Bleu secondaire
  success: 'var(--sabc-success)',        // Vert succès
  accent: 'var(--sabc-accent)',          // Orange accent
  neutral: 'var(--sabc-gray-400)',       // Gris neutre
  warning: 'var(--sabc-warning)',        // Jaune attention
};

export interface BarChartProps {
  children?: React.ReactNode;
  data: Array<Record<string, any>>;
  xAxisDataKey?: string;
  bars?: Array<{
    dataKey: string;
    name: string;
    color?: string;
    stackId?: string;
  }>;
  height?: number;
  layout?: 'horizontal' | 'vertical';
  title?: string;
  subtitle?: string;
  className?: string;
  showLegend?: boolean;
  showGrid?: boolean;
  barSize?: number;
  tooltip?: React.ReactNode;
  categories?: string[];
}

export function BarChart({
  data,
  xAxisDataKey = 'name',
  bars = [],
  height = 300,
  layout = 'horizontal',
  title,
  subtitle,
  className = '',
  showLegend = true,
  showGrid = true,
  barSize = 20,
  tooltip,
  children,
  categories = []
}: BarChartProps) {
  // Default colors from SABC palette if not specified
  const defaultColors = [
    COLORS.primary,    // Rouge SABC principal
    COLORS.accent,     // Orange accent
    COLORS.success,    // Vert succès
    COLORS.secondary,  // Bleu secondaire
    COLORS.warning,    // Jaune attention
    COLORS.neutral,    // Gris neutre
  ];
  
  // Rendu des barres du graphique
  const renderBars = () => {
    const radius: [number, number, number, number] = layout === 'vertical' ? [0, 4, 4, 0] : [4, 4, 0, 0];

    if (!bars || bars.length === 0) {
      // Si aucune barre n'est spécifiée, créer une barre par défaut basée sur la première propriété non-xAxis
      const firstDataItem = data[0] || {};
      const firstDataKey = Object.keys(firstDataItem).find(key => key !== xAxisDataKey) || '';
      
      return (
        <Bar
          key="default-bar"
          dataKey={firstDataKey}
          name={firstDataKey}
          fill={defaultColors[0]}
          radius={radius}
          barSize={barSize}
          animationDuration={500}
        />
      );
    }
    
    return bars.map((bar, index) => (
      <Bar
        key={`bar-${index}`}
        dataKey={bar.dataKey}
        name={bar.name || bar.dataKey}
        fill={bar.color || defaultColors[index % defaultColors.length]}
        stackId={bar.stackId}
        radius={radius}
        barSize={barSize}
        animationDuration={500}
      />
    ));
  };

  return (
    <div className={`w-full ${className}`}>
      {title && <h3 className="text-sm font-semibold text-sabc-gray-800 dark:text-sabc-gray-100 mb-1">{title}</h3>}
      {subtitle && <p className="text-xs text-sabc-gray-500 mb-3">{subtitle}</p>}
      
      <ResponsiveContainer width="100%" height={height}>
        <RechartsBarChart
          data={data}
          layout={layout}
          margin={{
            top: 12,
            right: 24,
            left: layout === 'vertical' ? 48 : 16,
            bottom: 24,
          }}
          barSize={barSize}
        >
          {showGrid && (
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#E0E0E0"
              horizontal={true}
              vertical={layout !== 'vertical'}
            />
          )}
          
          {layout === 'horizontal' ? (
            <>
              <XAxis 
                dataKey={xAxisDataKey} 
                tick={{ fill: '#616161', fontSize: 11 }}
                axisLine={{ stroke: '#E0E0E0' }}
              />
              <YAxis 
                tick={{ fill: '#616161', fontSize: 11 }}
                axisLine={{ stroke: '#E0E0E0' }}
              />
            </>
          ) : (
            <>
              <XAxis 
                type="number"
                tick={{ fill: '#616161', fontSize: 11 }}
                axisLine={{ stroke: '#E0E0E0' }}
              />
              <YAxis 
                dataKey={xAxisDataKey}
                type="category"
                tick={{ fill: '#616161', fontSize: 11 }}
                width={140}
                axisLine={{ stroke: '#E0E0E0' }}
              />
            </>
          )}
          
          {tooltip ? (
            tooltip
          ) : (
            <Tooltip
              cursor={{ fill: 'rgba(0, 0, 0, 0.04)' }}
              contentStyle={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E0E0E0',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                fontSize: '12px',
                padding: '8px 12px',
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
          
          {renderBars()}
          {children}
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}
