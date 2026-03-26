import React from 'react';
import { Head, usePage } from '@/lib/inertia-shim';
import AppLayout from '@/Components/Layout/app/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/UI/Card/Card';
import { Button } from '@/Components/UI/Button/Button';

/**
 * Tableau de bord de l'Assistant Superviseur Sponsoring (AS)
 *
 * Focus : Mes évaluations, événements sponsoring, mon auto-évaluation
 */
const ASDashboard: React.FC = () => {
  const { auth, dashboardStats } = usePage<any>().props;

  const currentUser = {
    name: auth?.user?.name || [auth?.user?.prenom, auth?.user?.nom].filter(Boolean).join(' ') || 'Utilisateur',
    email: auth?.user?.email || '',
    role: auth?.user?.role?.nom_role || auth?.user?.role_nom || 'AS',
    avatar: auth?.user?.avatar,
  };

  const stats = dashboardStats || {};
  const evaluationsEnAttente = stats.evaluations_en_attente ?? 0;
  const evaluationsTotal = stats.evaluations_total ?? 0;
  const scorePersonnel = stats.score_personnel ?? null;

  return (
    <AppLayout
      user={currentUser}
      notifications={[]}
    >
      <Head title="Tableau de bord Assistant Sponsoring - SABC Évaluation 360°" />

      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-sabc-gray-900">
            Bonjour, {currentUser.name}
          </h1>
          <p className="mt-1 text-sabc-gray-500">Assistant Superviseur Sponsoring</p>
        </div>

        {/* KPIs */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="border-l-4 border-l-sabc-red-primary">
            <CardContent className="p-4">
              <p className="text-sm font-medium text-sabc-gray-500">Évaluations en attente</p>
              <h3 className="mt-1 text-3xl font-bold text-sabc-gray-900">{evaluationsEnAttente}</h3>
              <p className="mt-2 text-xs text-sabc-gray-500">À compléter cette période</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-sabc-success">
            <CardContent className="p-4">
              <p className="text-sm font-medium text-sabc-gray-500">Évaluations complétées</p>
              <h3 className="mt-1 text-3xl font-bold text-sabc-gray-900">{evaluationsTotal}</h3>
              <p className="mt-2 text-xs text-sabc-gray-500">Cette période</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-sabc-info">
            <CardContent className="p-4">
              <p className="text-sm font-medium text-sabc-gray-500">Mon score</p>
              <h3 className="mt-1 text-3xl font-bold text-sabc-gray-900">
                {scorePersonnel !== null ? `${scorePersonnel}%` : '—'}
              </h3>
              <p className="mt-2 text-xs text-sabc-gray-500">Dernière évaluation reçue</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Mes évaluations à compléter */}
          <Card>
            <CardHeader>
              <CardTitle>Mes évaluations à compléter</CardTitle>
              <CardDescription>Auto-évaluations et évaluations par les pairs</CardDescription>
            </CardHeader>
            <CardContent>
              {evaluationsEnAttente === 0 ? (
                <p className="py-4 text-center text-sabc-gray-500">
                  Aucune évaluation en attente. Bien joué !
                </p>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-lg border border-sabc-gray-200 p-3">
                    <div>
                      <p className="font-medium">Auto-évaluation</p>
                      <p className="text-xs text-sabc-gray-500">Période en cours</p>
                    </div>
                    <Button size="sm" variant="outline">Compléter</Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Événements Sponsoring */}
          <Card>
            <CardHeader>
              <CardTitle>Événements Sponsoring</CardTitle>
              <CardDescription>Activités en cours et à venir</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="py-4 text-center text-sabc-gray-500">
                  Consultez la page{' '}
                  <a href="/as/events" className="text-sabc-red-primary hover:underline">Événements</a>
                  {' '}pour le détail.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions rapides */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Actions rapides</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={() => window.location.href = '/common/evaluations/mine'}>
                Mes évaluations reçues
              </Button>
              <Button variant="outline" onClick={() => window.location.href = '/common/evaluations/pending'}>
                Évaluations en attente
              </Button>
              <Button variant="outline" onClick={() => window.location.href = '/common/settings'}>
                Mon profil
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default ASDashboard;
