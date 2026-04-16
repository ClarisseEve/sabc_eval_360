import React from 'react';
import { Badge } from '@/Components/UI/Badge/Badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/UI/Card/Card';
import { EmptyState, getPriorityBadgeVariant } from '@/Components/Dashboard/RoleDashboardShared';

type ImprovementAxisLike = {
  critere?: string;
  scoreActuel?: number;
  score_actuel?: number;
  moyenne?: number;
  priorite?: string;
  suggestion?: string;
  description?: string;
};

type RecommendationLike = {
  type?: string;
  priorite?: string;
  titre?: string;
  description?: string;
};

type ImprovementAxesListCardProps = {
  title: string;
  description: string;
  axes: ImprovementAxisLike[];
  emptyMessage?: string;
  maxItems?: number;
};

type RecommendationsListCardProps = {
  title: string;
  description: string;
  recommendations: RecommendationLike[];
  emptyMessage?: string;
  maxItems?: number;
};

type AnalyticsFiltersCardProps = {
  title: string;
  description: string;
  children: React.ReactNode;
  contentClassName?: string;
};

export function ImprovementAxesListCard({
  title,
  description,
  axes,
  emptyMessage = 'Aucun axe d’amélioration disponible.',
  maxItems = 6,
}: ImprovementAxesListCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {axes.length === 0 ? (
          <EmptyState message={emptyMessage} />
        ) : (
          axes.slice(0, maxItems).map((axis, index) => {
            const score = axis.scoreActuel ?? axis.score_actuel ?? axis.moyenne ?? 0;
            const critere = String(axis.critere || `Critère ${index + 1}`);
            const suggestion = axis.suggestion || axis.description || '';

            return (
              <div key={`${critere}-${index}`} className="rounded-lg border border-sabc-gray-200 p-4 dark:border-sabc-gray-800">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="font-medium text-sabc-gray-900 dark:text-white">{critere}</div>
                  <Badge variant={getPriorityBadgeVariant(axis.priorite)}>{axis.priorite || 'moyenne'}</Badge>
                  <Badge variant="info">{score}/5</Badge>
                </div>
                {suggestion ? (
                  <p className="mt-2 text-sm text-sabc-gray-500 dark:text-sabc-gray-400">{suggestion}</p>
                ) : null}
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

export function RecommendationsListCard({
  title,
  description,
  recommendations,
  emptyMessage = 'Aucune recommandation n’est disponible.',
  maxItems = 6,
}: RecommendationsListCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {recommendations.length === 0 ? (
          <EmptyState message={emptyMessage} />
        ) : (
          recommendations.slice(0, maxItems).map((recommendation, index) => (
            <div key={`${recommendation.type || 'type'}-${recommendation.titre || index}`} className="rounded-lg border border-sabc-gray-200 p-4 dark:border-sabc-gray-800">
              <div className="flex flex-wrap items-center gap-2">
                <div className="font-medium text-sabc-gray-900 dark:text-white">{recommendation.titre || 'Recommandation'}</div>
                <Badge variant={getPriorityBadgeVariant(recommendation.priorite)}>{recommendation.priorite || 'moyenne'}</Badge>
                {recommendation.type ? <Badge variant="secondary">{recommendation.type}</Badge> : null}
              </div>
              {recommendation.description ? (
                <p className="mt-2 text-sm text-sabc-gray-500 dark:text-sabc-gray-400">{recommendation.description}</p>
              ) : null}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

export function AnalyticsFiltersCard({
  title,
  description,
  children,
  contentClassName = 'flex flex-wrap items-end gap-3',
}: AnalyticsFiltersCardProps) {
  return (
    <div className="rounded-xl border border-sabc-gray-200 bg-white px-4 py-3 shadow-sm dark:border-sabc-gray-700 dark:bg-sabc-gray-900">
      <div className="mb-2 flex items-baseline gap-2">
        <span className="text-sm font-semibold text-sabc-gray-900 dark:text-white">{title}</span>
        <span className="text-xs text-sabc-gray-400">{description}</span>
      </div>
      <div className={contentClassName}>{children}</div>
    </div>
  );
}
