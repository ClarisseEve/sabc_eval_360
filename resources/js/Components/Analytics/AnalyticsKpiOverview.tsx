import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/UI/Card/Card';
import { Badge } from '@/Components/UI/Badge/Badge';
import { TrendingUp, TrendingDown } from 'lucide-react';
import type { KpiMetric } from './types';

interface AnalyticsKpiOverviewProps {
  kpis: KpiMetric[];
}

export const AnalyticsKpiOverview: React.FC<AnalyticsKpiOverviewProps> = ({ kpis }) => {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {kpis.map(metric => {
        const trendIcon = metric.variation !== undefined && metric.variation >= 0 ? TrendingUp : TrendingDown;
        const variationAbsolute = Math.abs(metric.variation ?? 0);
        const showVariation = metric.variation !== undefined;

        return (
          <Card key={metric.id} className="h-full border-sabc-gray-100 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base text-sabc-gray-700">{metric.label}</CardTitle>
              {metric.description && (
                <CardDescription className="text-xs text-sabc-gray-500">{metric.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent className="flex items-end justify-between">
              <div className="flex flex-col items-end gap-2">
                <span className="text-3xl font-semibold text-sabc-gray-900">
                  {metric.value}
                  {metric.unit && <span className="ml-1 text-base text-sabc-gray-500">{metric.unit}</span>}
                </span>
                {metric.globalValue !== undefined && (
                  <span className="text-xs text-sabc-gray-500">
                    Global : <span className="font-semibold text-sabc-gray-700">{metric.globalValue}{metric.unit ?? ''}</span>
                  </span>
                )}
              </div>
              {showVariation && (
                <div className="flex flex-col items-end gap-1">
                  <Badge
                    variant={metric.variation! >= 0 ? 'secondary' : 'destructive'}
                    className="flex items-center gap-1 text-xs uppercase tracking-wide"
                  >
                    <span>Tendance</span>
                    {React.createElement(trendIcon, { className: 'h-3 w-3' })}
                    <span>{variationAbsolute.toFixed(1)}%</span>
                  </Badge>
                  <span className={`text-xs font-semibold ${metric.variation! >= 0 ? 'text-sabc-success' : 'text-sabc-error'}`}>
                    {metric.variation! >= 0 ? 'Amélioration' : 'Dégradation'}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
