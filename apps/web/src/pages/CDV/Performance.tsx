import React from 'react';
import { Head } from '@/lib/inertia-shim';
import AppLayout from '@/Components/Layout/app/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/UI/Card/Card';

interface PerformanceProps {
  auth: {
    user: {
      name: string;
      email: string;
      role: string;
      avatar?: string;
    }
  };
}

export default function Performance({ auth }: PerformanceProps) {
  return (
    <AppLayout user={auth.user}>
      <Head title="Performance District - Chef District Vente" />
      
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-semibold text-sabc-gray-900 mb-6">Performance du District</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance globale</CardTitle>
                <CardDescription>Score moyen du district</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                <div className="text-5xl font-bold text-sabc-red-primary">86%</div>
                <div className="text-sm text-sabc-gray-400 mt-2">+4% depuis le dernier trimestre</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Évaluations complétées</CardTitle>
                <CardDescription>Progression des évaluations</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                <div className="text-5xl font-bold text-sabc-success">92%</div>
                <div className="text-sm text-sabc-gray-400 mt-2">23/25 évaluations</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Secteurs performants</CardTitle>
                <CardDescription>Secteurs au-dessus de la moyenne</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                <div className="text-5xl font-bold text-sabc-accent">3/4</div>
                <div className="text-sm text-sabc-gray-400 mt-2">75% des secteurs</div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Évolution de la performance</CardTitle>
              <CardDescription>Tendance sur les 6 derniers mois</CardDescription>
            </CardHeader>
            <CardContent className="h-80 flex items-center justify-center">
              <div className="text-sabc-gray-400">
                Graphique d'évolution de la performance (à implémenter)
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
