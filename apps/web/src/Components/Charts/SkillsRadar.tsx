import * as React from 'react';
import { 
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip, Legend
} from 'recharts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/Components/UI/Card/Card';
import { CHART_COLORS, CHART_TOOLTIP_STYLE, formatChartPercent } from '@/Components/UI/Charts/chartTheme';

export interface SkillRadarData {
  skill: string;
  value: number;
  fullMark?: number;
  average?: number;
}

export interface SkillsRadarProps {
  title?: string;
  description?: string;
  data: SkillRadarData[];
  showAverage?: boolean;
  height?: number;
  colors?: {
    primary: string;
    secondary?: string;
    primaryFill?: string;
    secondaryFill?: string;
  };
  className?: string;
}

export const SkillsRadar: React.FC<SkillsRadarProps> = ({
  title = "Profil de compétences",
  description = "Analyse des compétences par catégorie",
  data,
  showAverage = false,
  height = 300,
  colors = {
    primary: CHART_COLORS.primary,
    secondary: CHART_COLORS.secondary,
    primaryFill: CHART_COLORS.primary,
    secondaryFill: CHART_COLORS.secondary
  },
  className,
}) => {
  // Vérifier si les données sont valides
  const isValidData = data && data.length > 0;
  
  // Normaliser les données pour s'assurer que fullMark est défini
  const normalizedData = React.useMemo(() => {
    if (!isValidData) return [];
    
    return data.map(item => ({
      ...item,
      fullMark: item.fullMark || 100
    }));
  }, [data, isValidData]);
  
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
              <RadarChart outerRadius={90} data={normalizedData}>
                <PolarGrid stroke={CHART_COLORS.grid} />
                <PolarAngleAxis dataKey="skill" tick={{ fill: CHART_COLORS.tick, fontSize: 11 }} />
                <PolarRadiusAxis domain={[0, 100]} tickCount={5} tick={{ fill: CHART_COLORS.secondary, fontSize: 10 }} />
                
                <Radar
                  name="Compétences"
                  dataKey="value"
                  stroke={colors.primary}
                  fill={colors.primaryFill || colors.primary}
                  fillOpacity={0.25}
                />
                
                {showAverage && (
                  <Radar
                    name="Moyenne"
                    dataKey="average"
                    stroke={colors.secondary}
                    fill={colors.secondaryFill || colors.secondary}
                    fillOpacity={0.15}
                  />
                )}
                
                <Tooltip formatter={(value) => [formatChartPercent(value), '']} contentStyle={CHART_TOOLTIP_STYLE} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
              </RadarChart>
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

export default SkillsRadar;
