import React from 'react';
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
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

// Palette de couleurs en tableau pour l'indexation
const COLOR_ARRAY = [
  'var(--sabc-red-primary)',    // Rouge SABC principal
  'var(--sabc-accent)',         // Orange accent
  'var(--sabc-success)',        // Vert succès
  'var(--sabc-info)',           // Bleu secondaire
  'var(--sabc-warning)',        // Jaune attention
  'var(--sabc-gray-400)',       // Gris neutre
];

// Default color array for pie slices
const DEFAULT_COLORS = [
  COLORS.primary,
  COLORS.secondary, 
  COLORS.success,
  COLORS.accent,
  COLORS.warning,
  COLORS.neutral,
];

export interface PieChartProps {
  data: Array<{
    name: string;
    value: number;
    color?: string;
  }>;
  height?: number;
  title?: string;
  subtitle?: string;
  className?: string;
  showLegend?: boolean;
  innerRadius?: number;
  outerRadius?: number;
  dataKey?: string;
  nameKey?: string;
  tooltip?: React.ReactNode;
  customLabel?: ((props: any) => React.ReactNode) | null;
  children?: React.ReactNode;
  categories?: string[];
}

export function PieChart({
  data,
  height = 300,
  title,
  subtitle,
  className = '',
  showLegend = true,
  innerRadius = 0,
  outerRadius = 80,
  dataKey = 'value',
  nameKey = 'name',
  tooltip,
  customLabel,
  children,
  categories = [],
  ...props
}: PieChartProps) {
  // Convertir les données si elles ne sont pas au format attendu
  const processedData = React.useMemo(() => {
    // Si les données ont déjà le bon format (name et value), les utiliser directement
    if (data.length > 0 && 'name' in data[0] && 'value' in data[0]) {
      return data;
    }
    
    // Si les données sont au format evaluationCompletionByRegion avec region
    if (data.length > 0 && 'region' in data[0] && 'completed' in data[0]) {
      return data.map((item: any) => ({
        name: item.region as string,
        value: item.completed as number,
        color: COLOR_ARRAY[0] // Rouge SABC principal
      }));
    }
    
    // Si les données sont au format evaluationCompletionByRegion avec name
    if (data.length > 0 && 'name' in data[0] && 'completed' in data[0]) {
      return data.map((item: any) => ({
        name: item.name as string,
        value: item.completed as number,
        color: COLOR_ARRAY[0] // Rouge SABC principal
      }));
    }
    
    // Si les données sont au format performanceByRegion
    if (data.length > 0 && 'name' in data[0] && 'commercial' in data[0] && 'marketing' in data[0]) {
      // Utiliser les catégories pour déterminer quelle propriété afficher
      const property = categories && categories.length > 0 ? categories[0].toLowerCase() : 'commercial';
      return data.map((item: any) => ({
        name: item.name as string,
        value: item[property] as number,
        color: property === 'commercial' ? COLOR_ARRAY[0] : COLOR_ARRAY[1]
      }));
    }
    
    // Retourner les données telles quelles si aucun format spécial n'est détecté
    return data;
  }, [data, categories]);

  // Custom render label function
  const renderCustomizedLabel = (props: any) => {
    if (customLabel) return customLabel(props);
    
    const { cx, cy, midAngle, innerRadius, outerRadius, percent, index, name } = props;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
    const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);
    
    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={12}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className={`w-full ${className}`}>
      {title && <h3 className="text-lg font-semibold mb-2">{title}</h3>}
      {subtitle && <p className="text-sm text-gray-500 mb-4">{subtitle}</p>}
      <ResponsiveContainer width="100%" height={height}>
        <RechartsPieChart>
          <Pie
            data={processedData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomizedLabel}
            outerRadius={outerRadius}
            innerRadius={innerRadius}
            fill="#8884d8"
            dataKey={dataKey}
            nameKey={nameKey}
          >
            {processedData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.color || COLOR_ARRAY[index % COLOR_ARRAY.length]} 
              />
            ))}
          </Pie>
          {tooltip ? tooltip : (
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
              layout="horizontal"
              verticalAlign="bottom" 
              align="center"
              height={36} 
              wrapperStyle={{ 
                fontSize: '12px',
                paddingTop: '8px',
                color: '#424242'
              }}
            />
          )}
          {children}
        </RechartsPieChart>
      </ResponsiveContainer>
    </div>
  );
}
