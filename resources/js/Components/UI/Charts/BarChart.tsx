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
          radius={[4, 4, 0, 0]}
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
        radius={[4, 4, 0, 0]}
        barSize={barSize}
        animationDuration={500}
      />
    ));
  };

  return (
    <div className={`w-full ${className}`}>
      {title && <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>}
      {subtitle && <p className="text-sm text-gray-500 mb-4">{subtitle}</p>}
      
      <ResponsiveContainer width="100%" height={height}>
        <RechartsBarChart
          data={data}
          layout={layout}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
          barSize={barSize}
        >
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />}
          
          {layout === 'horizontal' ? (
            <>
              <XAxis 
                dataKey={xAxisDataKey} 
                tick={{ fill: '#424242', fontSize: 12 }}
                axisLine={{ stroke: '#E0E0E0' }}
              />
              <YAxis 
                tick={{ fill: '#424242', fontSize: 12 }}
                axisLine={{ stroke: '#E0E0E0' }}
              />
            </>
          ) : (
            <>
              <XAxis 
                type="number"
                tick={{ fill: '#424242', fontSize: 12 }}
                axisLine={{ stroke: '#E0E0E0' }}
              />
              <YAxis 
                dataKey={xAxisDataKey}
                type="category"
                tick={{ fill: '#424242', fontSize: 12 }}
                axisLine={{ stroke: '#E0E0E0' }}
              />
            </>
          )}
          
          {tooltip ? (
            tooltip
          ) : (
            <Tooltip 
              cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
              contentStyle={{ 
                backgroundColor: '#FFFFFF',
                border: '1px solid #E0E0E0',
                borderRadius: '4px',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
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
