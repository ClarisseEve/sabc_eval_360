import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/UI/Card/Card';
import { BarChart } from '@/Components/UI/Charts/BarChart';
import type { DemographicBreakdown } from './types';

interface DemographicInsightsSectionProps {
  sexe: DemographicBreakdown[];
  age: DemographicBreakdown[];
  anciennete: DemographicBreakdown[];
}

export const DemographicInsightsSection: React.FC<DemographicInsightsSectionProps> = ({ sexe, age, anciennete }) => {
  const formatData = (dataset: DemographicBreakdown[]) => dataset.map(item => ({
    label: item.label,
    value: Number(item.value.toFixed(2)),
    comparison: item.comparison,
  }));

  const barConfig = [
    { dataKey: 'value', name: 'Population filtrée (%)', color: 'var(--sabc-red-primary)' },
    { dataKey: 'comparison', name: 'Global SABC (%)', color: 'var(--sabc-gray-300)' },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base text-sabc-gray-800">Répartition par sexe</CardTitle>
        </CardHeader>
        <CardContent>
          <BarChart
            data={formatData(sexe)}
            xAxisDataKey="label"
            bars={barConfig}
            layout="vertical"
            height={260}
            showLegend
            className="mt-2"
          />
        </CardContent>
      </Card>
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base text-sabc-gray-800">Répartition par tranche d'âge</CardTitle>
        </CardHeader>
        <CardContent>
          <BarChart
            data={formatData(age)}
            xAxisDataKey="label"
            bars={barConfig}
            layout="vertical"
            height={260}
            showLegend
            className="mt-2"
          />
        </CardContent>
      </Card>
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base text-sabc-gray-800">Répartition par ancienneté</CardTitle>
        </CardHeader>
        <CardContent>
          <BarChart
            data={formatData(anciennete)}
            xAxisDataKey="label"
            bars={barConfig}
            layout="vertical"
            height={260}
            showLegend
            className="mt-2"
          />
        </CardContent>
      </Card>
    </div>
  );
};
