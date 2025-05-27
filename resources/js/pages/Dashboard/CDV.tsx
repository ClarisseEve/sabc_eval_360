import React from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/Layouts/app-layout';
import { DistrictManagerDashboard } from '@/Components/Dashboard/DistrictManagerDashboard';
import { usePage } from '@inertiajs/react';
import { SharedData } from '@/types';

export default function CDVDashboard() {
  const { auth, stats } = usePage<SharedData>().props;
  
  // Données de démonstration pour le dashboard du Chef de District Vente
  const demoMetrics = {
    districtPerformance: { 
      value: 82, 
      previousValue: 78, 
      change: 4, 
      changeType: 'positive' as const,
      label: 'Performance District' 
    },
    salesPerformance: { 
      value: 85, 
      previousValue: 80, 
      change: 5, 
      changeType: 'positive' as const,
      label: 'Performance Ventes' 
    },
    evaluationCompletion: { 
      value: 75, 
      previousValue: 70, 
      change: 5, 
      changeType: 'positive' as const,
      label: 'Évaluations Complétées' 
    },
    targetAchievement: { 
      value: 88, 
      previousValue: 85, 
      change: 3, 
      changeType: 'positive' as const,
      label: 'Objectifs Atteints' 
    }
  };
  
  const demoSalesTrends = [
    { month: 'Jan', target: 100, achieved: 85 },
    { month: 'Fév', target: 100, achieved: 90 },
    { month: 'Mar', target: 100, achieved: 95 },
    { month: 'Avr', target: 100, achieved: 88 },
    { month: 'Mai', target: 100, achieved: 92 },
    { month: 'Juin', target: 100, achieved: 97 }
  ];
  
  const demoSalesTeam = [
    { 
      id: '1', 
      name: 'Jean Dupont', 
      role: 'CDS', 
      avatar: undefined, 
      performance: 88,
      salesTarget: 100000,
      salesAchieved: 92000,
      evaluationsCompleted: 8,
      evaluationsTotal: 10,
      lastEvaluation: '2025-05-10'
    },
    { 
      id: '2', 
      name: 'Marie Durand', 
      role: 'CDS', 
      avatar: undefined, 
      performance: 85,
      salesTarget: 100000,
      salesAchieved: 87000,
      evaluationsCompleted: 7,
      evaluationsTotal: 10,
      lastEvaluation: '2025-05-12'
    },
    { 
      id: '3', 
      name: 'Pierre Martin', 
      role: 'CDS', 
      avatar: undefined, 
      performance: 92,
      salesTarget: 100000,
      salesAchieved: 95000,
      evaluationsCompleted: 9,
      evaluationsTotal: 10,
      lastEvaluation: '2025-05-15'
    },
    { 
      id: '4', 
      name: 'Sophie Lefebvre', 
      role: 'CDS', 
      avatar: undefined, 
      performance: 78,
      salesTarget: 100000,
      salesAchieved: 81000,
      evaluationsCompleted: 6,
      evaluationsTotal: 10,
      lastEvaluation: '2025-05-08'
    }
  ];
  
  const demoPendingEvaluations = [
    {
      id: '1',
      evaluatedName: 'Jean Dupont',
      evaluatedRole: 'CDS',
      evaluatedAvatar: undefined,
      dueDate: '28 Mai 2025',
      isOverdue: false
    },
    {
      id: '2',
      evaluatedName: 'Marie Durand',
      evaluatedRole: 'CDS',
      evaluatedAvatar: undefined,
      dueDate: '25 Mai 2025',
      isOverdue: true
    }
  ];
  
  return (
    <AppLayout>
      <Head title="Dashboard Chef de District Vente" />
      
      <div className="py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="mb-6 text-2xl font-semibold text-sabc-gray-900 dark:text-white">
            Dashboard Chef de District Vente
          </h1>
          
          {auth.user && (
            <DistrictManagerDashboard
              user={auth.user}
              stats={stats}
              metrics={demoMetrics}
              salesTrends={demoSalesTrends}
              salesTeam={demoSalesTeam}
              pendingEvaluations={demoPendingEvaluations}
            />
          )}
          
          {!auth.user && (
            <div className="rounded-md border border-sabc-red-light bg-sabc-red-light/10 p-4 text-sabc-red-primary">
              <p>Veuillez vous connecter pour accéder à votre tableau de bord.</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
