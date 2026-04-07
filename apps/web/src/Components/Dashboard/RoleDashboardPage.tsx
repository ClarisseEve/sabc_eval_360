import React from 'react';
import { useSuspenseQuery } from '@tanstack/react-query';
import { Head } from '@/lib/inertia-shim';
import AppLayout from '@/Components/Layout/app/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/UI/Card/Card';
import { Badge } from '@/Components/UI/Badge/Badge';
import { Button } from '@/Components/UI/Button/Button';
import { useAuthContext } from '@/Contexts/AuthContext';
import { analyticsApi, hierarchyApi } from '@/Services/api';
import { useMyDashboard } from '@/Hooks/queries';

type RoleDashboardPageProps = {
  fallbackRole: string;
  title: string;
  subtitle: string;
  teamTitle: string;
};

export default function RoleDashboardPage({
  fallbackRole,
  title,
  subtitle,
  teamTitle,
}: RoleDashboardPageProps) {
  const { user } = useAuthContext();
  const { data: dashboard } = useMyDashboard();

  const { data: extra } = useSuspenseQuery({
    queryKey: ['role-dashboard-extra', user?.matricule ?? fallbackRole],
    queryFn: async () => {
      const [scoresRes, subordonnesRes] = await Promise.all([
        analyticsApi.scores(),
        hierarchyApi.getSubordonnes(),
      ]);

      return {
        scores: scoresRes.data ?? {},
        subordonnes: subordonnesRes.data ?? [],
      };
    },
  });

  const userName = user ? [user.prenom, user.nom].filter(Boolean).join(' ') || 'Utilisateur SABC' : 'Utilisateur SABC';
  const userRole = user?.role_nom || user?.role || fallbackRole;
  const layoutUser = {
    name: userName,
    email: user?.email || '',
    role: userRole,
    avatar: user?.avatar,
  };

  const pending = dashboard?.evaluations_en_attente ?? 0;
  const total = dashboard?.evaluations_total ?? 0;
  const scorePersonnel = dashboard?.score_personnel;
  const scorePondere = extra.scores?.score_pondere;
  const progression = extra.scores?.progression ?? 0;
  const parType = Array.isArray(extra.scores?.par_type) ? extra.scores.par_type : [];
  const subordonnes = Array.isArray(extra.subordonnes) ? extra.subordonnes : [];
  const completionRate = total > 0 ? Math.round(((total - pending) / total) * 100) : 0;

  return (
    <AppLayout user={layoutUser} notifications={[]}>
      <Head title={`${title} - SABC Eval360`} />

      <div className="container mx-auto px-4 py-6 space-y-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-sabc-gray-900">{title}</h1>
            <p className="text-sabc-gray-500">{subtitle}</p>
          </div>
          {dashboard?.periode_active && (
            <Badge variant="outline" className="w-fit">
              Période active: {dashboard.periode_active.nom}
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="border-l-4 border-l-sabc-red-primary">
            <CardContent className="p-4">
              <p className="text-sm font-medium text-sabc-gray-500">Évaluations en attente</p>
              <h3 className="mt-1 text-3xl font-bold text-sabc-gray-900">{pending}</h3>
              <p className="mt-2 text-xs text-sabc-gray-500">Actions à traiter</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-sabc-info">
            <CardContent className="p-4">
              <p className="text-sm font-medium text-sabc-gray-500">Évaluations totales</p>
              <h3 className="mt-1 text-3xl font-bold text-sabc-gray-900">{total}</h3>
              <p className="mt-2 text-xs text-sabc-gray-500">Historique personnel</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-sabc-success">
            <CardContent className="p-4">
              <p className="text-sm font-medium text-sabc-gray-500">Score personnel</p>
              <h3 className="mt-1 text-3xl font-bold text-sabc-gray-900">
                {scorePersonnel != null ? `${scorePersonnel}/5` : '—'}
              </h3>
              <p className="mt-2 text-xs text-sabc-gray-500">
                Score pondéré: {scorePondere != null ? `${scorePondere}/5` : '—'}
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-sabc-accent">
            <CardContent className="p-4">
              <p className="text-sm font-medium text-sabc-gray-500">Progression récente</p>
              <h3 className="mt-1 text-3xl font-bold text-sabc-gray-900">{progression > 0 ? '+' : ''}{progression}</h3>
              <p className="mt-2 text-xs text-sabc-gray-500">
                Taux de complétion: {completionRate}%
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <Card className="xl:col-span-2">
            <CardHeader>
              <CardTitle>{teamTitle}</CardTitle>
              <CardDescription>Subordonnés directs récupérés depuis la hiérarchie NestJS</CardDescription>
            </CardHeader>
            <CardContent>
              {subordonnes.length === 0 ? (
                <div className="rounded-lg border border-dashed border-sabc-gray-300 p-6 text-center text-sabc-gray-500">
                  Aucun subordonné direct trouvé pour ce rôle.
                </div>
              ) : (
                <div className="space-y-3">
                  {subordonnes.map((member: any) => {
                    const memberName = [member.prenom, member.nom].filter(Boolean).join(' ') || member.matricule;
                    return (
                      <div key={member.matricule} className="flex flex-col gap-3 rounded-lg border border-sabc-gray-200 p-4 md:flex-row md:items-center md:justify-between">
                        <div>
                          <div className="font-medium text-sabc-gray-900">{memberName}</div>
                          <div className="text-sm text-sabc-gray-500">{member.role_nom || member.role || 'Rôle non renseigné'}</div>
                          <div className="text-xs text-sabc-gray-400">{member.email || member.matricule}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">Niveau {member.niveau_hierarchique ?? '—'}</Badge>
                          <Button size="sm" variant="outline" onClick={() => { window.location.href = '/common/evaluations/pending'; }}>
                            Évaluer
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Scores par type</CardTitle>
              <CardDescription>Vue analytique de vos évaluations validées</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {parType.length === 0 ? (
                <div className="rounded-lg border border-dashed border-sabc-gray-300 p-6 text-center text-sabc-gray-500">
                  Aucun score validé disponible.
                </div>
              ) : (
                parType.map((item: any) => {
                  const value = Number(item.moyenne ?? 0);
                  const width = Math.max(0, Math.min(100, (value / 5) * 100));
                  return (
                    <div key={item.type} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-sabc-gray-700 capitalize">{item.type}</span>
                        <span className="text-sabc-gray-500">{value}/5</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-sabc-gray-200">
                        <div className="h-2 rounded-full bg-sabc-red-primary" style={{ width: `${width}%` }} />
                      </div>
                      <div className="text-xs text-sabc-gray-400">{item.nb_evaluations} évaluation(s)</div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Actions rapides</CardTitle>
            <CardDescription>Navigation vers les flux réels déjà branchés</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => { window.location.href = '/common/evaluations/pending'; }}>
              Évaluations en attente
            </Button>
            <Button variant="outline" onClick={() => { window.location.href = '/common/evaluations/mine'; }}>
              Mes évaluations
            </Button>
            <Button variant="outline" onClick={() => { window.location.href = '/common/settings'; }}>
              Mon profil
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
