import React from 'react';
import { Head } from '@/lib/inertia-shim';
import AppLayout from '@/Components/Layout/app/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/UI/Card/Card';
import { Progress } from '@/Components/UI/Progress/Progress';
import { Badge } from '@/Components/UI/Badge/Badge';

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
  // Données de démonstration pour les performances
  const performanceData = {
    global: 84,
    categories: [
      { name: 'Leadership', score: 90, color: 'bg-sabc-red-primary' },
      { name: 'Communication', score: 85, color: 'bg-sabc-red-primary' },
      { name: 'Gestion d\'équipe', score: 78, color: 'bg-sabc-red-primary' },
      { name: 'Résultats commerciaux', score: 88, color: 'bg-sabc-red-primary' },
      { name: 'Innovation', score: 75, color: 'bg-sabc-red-primary' }
    ],
    evolution: [
      { month: 'Jan', score: 76 },
      { month: 'Fév', score: 78 },
      { month: 'Mar', score: 75 },
      { month: 'Avr', score: 80 },
      { month: 'Mai', score: 82 },
      { month: 'Juin', score: 84 }
    ],
    rank: 3,
    totalCDS: 18
  };

  return (
    <AppLayout user={auth.user}>
      <Head title="Ma Performance - Chef de Secteur" />
      
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-semibold text-sabc-gray-900 mb-6">Ma Performance</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle>Score global</CardTitle>
                <CardDescription>Évaluation 360°</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                <div className="relative w-32 h-32 flex items-center justify-center">
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    <circle 
                      cx="50" 
                      cy="50" 
                      r="45" 
                      fill="none" 
                      stroke="var(--sabc-gray-200)"
                      strokeWidth="10" 
                    />
                    <circle 
                      cx="50" 
                      cy="50" 
                      r="45" 
                      fill="none" 
                      stroke="#E53E3E" 
                      strokeWidth="10" 
                      strokeDasharray={`${2 * Math.PI * 45 * performanceData.global / 100} ${2 * Math.PI * 45 * (1 - performanceData.global / 100)}`}
                      strokeDashoffset={2 * Math.PI * 45 * 0.25}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute text-3xl font-bold text-sabc-gray-800">{performanceData.global}%</div>
                </div>
                <div className="text-sm text-sabc-gray-400 mt-4">
                  +2% depuis la dernière évaluation
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Classement</CardTitle>
                <CardDescription>Parmi les CDS</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                <div className="flex items-end space-x-2 mt-4">
                  <div className="text-5xl font-bold text-sabc-red-primary">{performanceData.rank}</div>
                  <div className="text-xl text-sabc-gray-400 mb-1">/ {performanceData.totalCDS}</div>
                </div>
                <Badge className="mt-4 bg-sabc-success">Top 20%</Badge>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Évaluations reçues</CardTitle>
                <CardDescription>Cycle actuel</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                <div className="text-5xl font-bold text-sabc-accent">8</div>
                <div className="text-sm text-sabc-gray-400 mt-2">
                  <span className="font-medium">100%</span> complétées
                </div>
                <div className="w-full mt-4 flex items-center space-x-2">
                  <div className="flex-1">
                    <div className="h-2 bg-sabc-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-sabc-accent w-full"></div>
                    </div>
                  </div>
                  <span className="text-xs text-sabc-gray-400">8/8</span>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance par catégorie</CardTitle>
                <CardDescription>Scores détaillés</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {performanceData.categories.map((category, index) => (
                    <div key={index}>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-sabc-gray-800">{category.name}</span>
                        <span className="text-sm text-sabc-gray-400">{category.score}%</span>
                      </div>
                      <div className="h-2 bg-sabc-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${category.color}`} 
                          style={{ width: `${category.score}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Évolution de la performance</CardTitle>
                <CardDescription>6 derniers mois</CardDescription>
              </CardHeader>
              <CardContent className="h-64 flex items-center justify-center">
                <div className="text-sabc-gray-400">
                  Graphique d'évolution de la performance (à implémenter)
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
