import React from 'react';
import { Head } from '@inertiajs/react';
import { AppLayout } from '@/layouts';
import { MarketingSupervisorDashboard } from '@/Components/Dashboard/MarketingSupervisorDashboard';
import { usePage } from '@inertiajs/react';
import { SharedData } from '@/types';

export default function TMODashboard() {
  const { auth, stats } = usePage<SharedData>().props;
  
  // Données de démonstration pour le dashboard du Trade Marketing Officer/Superviseur Sponsoring
  const demoMetrics = {
    teamPerformance: { 
      value: 84, 
      previousValue: 79, 
      change: 5, 
      changeType: 'positive' as const,
      label: 'Performance Équipe' 
    },
    campaignEffectiveness: { 
      value: 88, 
      previousValue: 82, 
      change: 6, 
      changeType: 'positive' as const,
      label: 'Efficacité Campagnes' 
    },
    evaluationCompletion: { 
      value: 78, 
      previousValue: 72, 
      change: 6, 
      changeType: 'positive' as const,
      label: 'Évaluations Complétées' 
    },
    budgetUtilization: { 
      value: 92, 
      previousValue: 95, 
      change: -3, 
      changeType: 'positive' as const, // Moins de budget utilisé pour le même résultat est positif
      label: 'Utilisation Budget' 
    }
  };
  
  const demoCampaignPerformance = [
    { name: 'Campagne A', impact: 85, budget: 75, roi: 113 },
    { name: 'Campagne B', impact: 78, budget: 65, roi: 120 },
    { name: 'Campagne C', impact: 90, budget: 85, roi: 106 },
    { name: 'Campagne D', impact: 82, budget: 70, roi: 117 }
  ];
  
  const demoMarketingTeam = [
    { 
      id: '1', 
      name: 'Lucie Dubois', 
      role: 'AS', 
      avatar: undefined, 
      performance: 88,
      campaignsCompleted: 4,
      campaignsTotal: 5,
      evaluationsCompleted: 8,
      evaluationsTotal: 10,
      lastEvaluation: '2025-05-10'
    },
    { 
      id: '2', 
      name: 'Thomas Moreau', 
      role: 'AS', 
      avatar: undefined, 
      performance: 85,
      campaignsCompleted: 3,
      campaignsTotal: 4,
      evaluationsCompleted: 7,
      evaluationsTotal: 10,
      lastEvaluation: '2025-05-12'
    },
    { 
      id: '3', 
      name: 'Camille Leroy', 
      role: 'AS', 
      avatar: undefined, 
      performance: 92,
      campaignsCompleted: 5,
      campaignsTotal: 5,
      evaluationsCompleted: 9,
      evaluationsTotal: 10,
      lastEvaluation: '2025-05-15'
    },
    { 
      id: '4', 
      name: 'Antoine Girard', 
      role: 'AS', 
      avatar: undefined, 
      performance: 78,
      campaignsCompleted: 3,
      campaignsTotal: 5,
      evaluationsCompleted: 6,
      evaluationsTotal: 10,
      lastEvaluation: '2025-05-08'
    }
  ];
  
  const demoPendingEvaluations = [
    {
      id: '1',
      evaluatedName: 'Lucie Dubois',
      evaluatedRole: 'AS',
      evaluatedAvatar: undefined,
      dueDate: '28 Mai 2025',
      isOverdue: false
    },
    {
      id: '2',
      evaluatedName: 'Thomas Moreau',
      evaluatedRole: 'AS',
      evaluatedAvatar: undefined,
      dueDate: '25 Mai 2025',
      isOverdue: true
    }
  ];
  
  const demoSkillsRadar = [
    { skill: 'Créativité', value: 85, fullMark: 100 },
    { skill: 'Analyse', value: 75, fullMark: 100 },
    { skill: 'Communication', value: 90, fullMark: 100 },
    { skill: 'Planification', value: 80, fullMark: 100 },
    { skill: 'Exécution', value: 85, fullMark: 100 }
  ];
  
  return (
    <AppLayout>
      <Head title="Dashboard Trade Marketing Officer" />
      
      <div className="py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="mb-6 text-2xl font-semibold text-sabc-gray-900 dark:text-white">
            Dashboard Trade Marketing Officer
          </h1>
          
          {auth.user && (
            <MarketingSupervisorDashboard
              user={auth.user}
              stats={stats}
              metrics={demoMetrics}
              campaignPerformance={demoCampaignPerformance}
              marketingTeam={demoMarketingTeam}
              pendingEvaluations={demoPendingEvaluations}
              skillsRadar={demoSkillsRadar}
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
