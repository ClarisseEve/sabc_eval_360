import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/UI/Card/Card';
import { LineChart } from '@/Components/UI/Charts/LineChart';
import type { PerformanceTrendPoint } from './types';

interface PerformanceInsightsSectionProps {
  performanceTrend: PerformanceTrendPoint[];
  cohortTrend: PerformanceTrendPoint[];
}

const toLineChartData = (trend: PerformanceTrendPoint[]) =>
  trend.map(point => ({
    period: point.period,
    score: Number(point.score.toFixed(2)),
  }));

const TrendCard: React.FC<{ title: string; description: string; trend: PerformanceTrendPoint[] }> = ({ title, description, trend }) => {
  const chartData = toLineChartData(trend);
  const latest = trend.at(-1);

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-base text-sabc-gray-800">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <LineChart
          data={chartData}
          xAxisDataKey="period"
          lines={[{ dataKey: 'score', name: 'Score moyen', color: 'var(--sabc-red-primary)' }]}
          height={240}
          showLegend={false}
        />
        {latest && (
          <div className="text-xs text-sabc-gray-500">
            Dernière période ({latest.period}) : score {latest.score.toFixed(2)}
            {latest.participation !== undefined && (
              <span> • participation {latest.participation.toFixed(0)}%</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export const PerformanceInsightsSection: React.FC<PerformanceInsightsSectionProps> = ({ performanceTrend, cohortTrend }) => {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <TrendCard title="Tendance globale" description="Évolution des scores consolidés" trend={performanceTrend} />
      <TrendCard title="Cohorte nouveaux entrants" description="Progression sur les 9 premiers mois" trend={cohortTrend} />
    </div>
  );
};
