import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/UI/Card/Card';
import { Badge } from '@/Components/UI/Badge/Badge';
import { AlertTriangle, Lightbulb, Activity } from 'lucide-react';
import type { AlertInsight } from './types';

const severityStyles: Record<AlertInsight['severity'], string> = {
  high: 'border-sabc-error/60 bg-sabc-error/10 text-sabc-error',
  medium: 'border-sabc-warning/60 bg-sabc-warning/10 text-sabc-warning',
  low: 'border-sabc-success/40 bg-sabc-success/10 text-sabc-success',
};

interface AlertsRecommendationsSectionProps {
  alerts: AlertInsight[];
}

export const AlertsRecommendationsSection: React.FC<AlertsRecommendationsSectionProps> = ({ alerts }) => {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg text-sabc-gray-900">Alertes & recommandations</CardTitle>
        <CardDescription>
          Sujets prioritaires issus des évaluations et recommandations associées
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {alerts.map(alert => (
          <div key={alert.id} className={`rounded-lg border p-4 ${severityStyles[alert.severity]}`}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <AlertTriangle className="h-4 w-4" />
                  {alert.title}
                </div>
                <Badge variant="outline" className="mt-2 text-xs uppercase tracking-wide">
                  Criticité : {alert.severity === 'high' ? 'Élevée' : alert.severity === 'medium' ? 'Modérée' : 'Faible'}
                </Badge>
                <p className="mt-2 text-sm text-sabc-gray-700">{alert.description}</p>
              </div>
              <div className="text-xs text-sabc-gray-600">
                Population impactée
                <p className="text-base font-semibold text-sabc-gray-900">{alert.impactedPopulation}</p>
              </div>
            </div>
            <div className="mt-3 space-y-2">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-sabc-gray-600">
                <Lightbulb className="h-3 w-3" />
                Actions recommandées
              </p>
              <ul className="grid gap-2 text-sm text-sabc-gray-700 md:grid-cols-2">
                {alert.suggestedActions.map(action => (
                  <li key={action} className="flex items-start gap-2">
                    <Activity className="mt-0.5 h-3.5 w-3.5 text-sabc-gray-500" />
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
        {alerts.length === 0 && (
          <p className="text-sm text-sabc-gray-500">Aucune alerte pour la sélection courante.</p>
        )}
      </CardContent>
    </Card>
  );
};
