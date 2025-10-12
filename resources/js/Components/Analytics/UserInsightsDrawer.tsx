import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/Components/UI/Dialog/Dialog';
import { Badge } from '@/Components/UI/Badge/Badge';
import { Progress } from '@/Components/UI/Progress/Progress';
import type { UserAnalyticsSummary } from './types';

interface UserInsightsDrawerProps {
  user?: UserAnalyticsSummary | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const UserInsightsDrawer: React.FC<UserInsightsDrawerProps> = ({ user, open, onOpenChange }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl overflow-y-auto">
        {user ? (
          <div className="space-y-6">
            <DialogHeader>
              <DialogTitle className="text-xl text-sabc-gray-900">
                {user.name}
                <span className="ml-2 text-sm text-sabc-gray-500">({user.matricule})</span>
              </DialogTitle>
              <div className="flex flex-wrap items-center gap-2 text-sm text-sabc-gray-600">
                <Badge variant="secondary">{user.role}</Badge>
                <Badge variant="outline">{user.region}</Badge>
                {user.sexe && <Badge variant="outline">Sexe : {user.sexe}</Badge>}
                {user.age && <Badge variant="outline">Âge : {user.age} ans</Badge>}
                {user.anciennete !== undefined && (
                  <Badge variant="outline">Ancienneté : {user.anciennete} ans</Badge>
                )}
              </div>
            </DialogHeader>

            <section className="rounded-lg border border-sabc-gray-100 p-4">
              <h3 className="text-sm font-semibold text-sabc-gray-700">Score global</h3>
              <div className="mt-2 flex items-center gap-4">
                <span className="text-3xl font-semibold text-sabc-gray-900">{user.latestScore.toFixed(2)}</span>
                <div className="flex-1">
                  <Progress value={user.latestScore * 20} className="h-2" />
                  <p className="mt-2 text-xs text-sabc-gray-500">
                    Historique ({user.scoreTrend.length} périodes) : {user.scoreTrend.map(score => score.toFixed(1)).join(' • ')}
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-lg border border-sabc-gray-100 p-4">
              <h3 className="text-sm font-semibold text-sabc-gray-700">Compétences vs cible</h3>
              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                {user.competencies.map(comp => {
                  const delta = comp.score - comp.target;
                  const trendClass = delta >= 0 ? 'text-sabc-success' : 'text-sabc-error';
                  return (
                    <div key={comp.family} className="rounded-md border border-sabc-gray-100 p-3 shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-sabc-gray-800">{comp.family}</span>
                        <span className={`text-xs font-semibold ${trendClass}`}>
                          {delta >= 0 ? '+' : ''}{delta.toFixed(1)}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center gap-2 text-xs text-sabc-gray-600">
                        <span>Score : {comp.score.toFixed(1)}</span>
                        <span>Cible : {comp.target.toFixed(1)}</span>
                      </div>
                      <Progress value={(comp.score / Math.max(comp.target, 0.1)) * 100} className="mt-2 h-2" />
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="rounded-lg border border-sabc-gray-100 p-4">
              <h3 className="text-sm font-semibold text-sabc-gray-700">Répartition par type d'évaluation</h3>
              <div className="mt-2 grid grid-cols-1 gap-2 text-sm text-sabc-gray-600 md:grid-cols-3">
                {Object.entries(user.evaluationBreakdown).map(([channel, percentage]) => (
                  <div key={channel} className="rounded-md bg-sabc-gray-50 p-3 text-center">
                    <p className="font-semibold text-sabc-gray-800">{channel}</p>
                    <p className="text-sabc-gray-600">{percentage.toFixed(1)}%</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-sabc-gray-100 p-4">
              <h3 className="text-sm font-semibold text-sabc-gray-700">Axes recommandés</h3>
              <ul className="mt-3 grid gap-2 text-sm text-sabc-gray-700 md:grid-cols-2">
                {user.recommendations.map(action => (
                  <li key={action} className="rounded-md bg-sabc-accent/10 px-3 py-2">
                    {action}
                  </li>
                ))}
              </ul>
            </section>
          </div>
        ) : (
          <p className="text-sm text-sabc-gray-500">Sélectionnez un utilisateur pour consulter ses insights.</p>
        )}
      </DialogContent>
    </Dialog>
  );
};
