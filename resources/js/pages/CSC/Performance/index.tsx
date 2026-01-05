import React from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/Components/Layout/app/AppLayout';
import { Card, CardHeader, CardContent } from '@/Components/UI/Card/Card';
import { BarChart } from '@/Components/UI/Charts/BarChart';
import useAuth from '@/Hooks/useAuth';

/**
 * Page de performance pour le Chef Service Commercial (CSC)
 * Affiche les performances de l'équipe commerciale
 */
export default function Performance() {
  // Données de démonstration pour le graphique de performance
  const performanceData = {
    labels: ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin'],
    datasets: [
      {
        label: 'Performance équipe',
        data: [65, 78, 82, 75, 90, 85],
        backgroundColor: 'var(--sabc-red-primary)',
        borderColor: 'var(--sabc-red-dark)',
        borderWidth: 1,
      },
      {
        label: 'Objectif',
        data: [70, 70, 75, 75, 80, 80],
        backgroundColor: 'var(--sabc-accent)',
        borderColor: 'var(--sabc-accent)',
        borderWidth: 1,
        type: 'line',
      }
    ]
  };

  // Récupérer les données de l'utilisateur authentifié
  const { user } = useAuth();
  
  // Adapter l'objet utilisateur au format attendu par AppLayout
  const appUser = user ? {
    name: `${user.prenom} ${user.nom}`,
    email: user.email,
    role: user.role_nom || user.role,
    avatar: user.avatar
  } : {
    name: 'Utilisateur',
    email: 'utilisateur@sabc.cm',
    role: 'CSC'
  };
  
  return (
    <AppLayout user={appUser}>
      <Head title="Performance Équipe" />
      
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-semibold text-gray-900">Performance de l'Équipe Commerciale</h1>
          
          <div className="mt-6 grid grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <h2 className="text-lg font-medium">Performance mensuelle</h2>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <BarChart data={performanceData as any} />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <h2 className="text-lg font-medium">Indicateurs clés</h2>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-4 rounded-lg shadow">
                    <h3 className="text-sm font-medium text-gray-500">Taux de réalisation</h3>
                    <p className="mt-1 text-3xl font-semibold text-sabc-red-primary">92%</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow">
                    <h3 className="text-sm font-medium text-gray-500">Progression</h3>
                    <p className="mt-1 text-3xl font-semibold text-sabc-success">+12%</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow">
                    <h3 className="text-sm font-medium text-gray-500">Score moyen</h3>
                    <p className="mt-1 text-3xl font-semibold text-sabc-accent">4.2/5</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
