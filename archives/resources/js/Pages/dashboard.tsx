import * as React from 'react';
import { Head } from '@inertiajs/react';
import { AlertCircle, CheckCircle, Clock, Users, TrendingUp } from 'lucide-react';

// Layouts
import AppLayout from '@/Components/Layout/app/AppLayout';

// Hooks
import { useAuth } from '@/hooks/useAuth';
import { route } from '@/routes';

// Dashboards spécifiques aux rôles
import { DirectorDashboard } from '@/Components/Dashboard/DirectorDashboard';
import { DepartmentHeadDashboard } from '@/Components/Dashboard/DepartmentHeadDashboard';
import { ManagerDashboard } from '@/Components/Dashboard/ManagerDashboard';
import { OperationalDashboard } from '@/Components/Dashboard/OperationalDashboard';

// Composants
import { EvaluationList } from '@/Components/Dashboard/EvaluationList';
import { EvaluationStats } from '@/Components/Dashboard/EvaluationStats';

// Types
interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  region: string;
  department: string;
  avatar?: string;
}

interface DashboardProps {
  user: User;
  pendingEvaluations: any[];
  completedEvaluations: any[];
  stats: any;
  notifications: any[];
}

export default function Dashboard({ pendingEvaluations = [], completedEvaluations = [], stats = {}, notifications = [], auth }: Omit<DashboardProps, 'user'> & { auth: { user: User } }) {
  // Utiliser l'utilisateur authentifié fourni par les props
  const user = auth.user;
  // Fonction pour déterminer le tableau de bord à afficher en fonction du rôle
  const renderDashboardByRole = () => {
    // Selon les règles métier SABC, nous avons différents niveaux hiérarchiques
    switch (user.role) {
      case 'DR': // Directeur Régional
        return <DirectorDashboard user={user} stats={stats} />;
      
      case 'CDTT': // Chef de Département Trade Taniere
        return <DepartmentHeadDashboard user={user} stats={stats} />;
      
      case 'CSC': // Chef de Service Commercial
      case 'RTM': // Regional Trade Marketing
        return <ManagerDashboard user={user} stats={stats} />;
      
      case 'CDV': // Chef de District Vente
      case 'TMO': // Trade-Marketing Opérateur
      case 'SS': // Superviseur Sponsoring
      case 'CDS': // Chef de Secteur
      case 'AS': // Assistant Sponsoring
      default:
        return <OperationalDashboard user={user} stats={stats} />;
    }
  };

  // Statistiques communes pour tous les tableaux de bord
  const commonStats = [
    {
      label: 'Évaluations en attente',
      value: pendingEvaluations.length,
      icon: <Clock className="h-5 w-5" />,
      variant: 'warning' as const,
      format: 'number' as const
    },
    {
      label: 'Évaluations complétées',
      value: completedEvaluations.length,
      icon: <CheckCircle className="h-5 w-5" />,
      variant: 'success' as const,
      format: 'number' as const
    },
    {
      label: 'Performance globale',
      value: stats.performance || 0,
      icon: <TrendingUp className="h-5 w-5" />,
      variant: 'primary' as const,
      format: 'percentage' as const,
      change: stats.performanceChange || 0,
      changeType: (stats.performanceChange > 0 ? 'positive' : stats.performanceChange < 0 ? 'negative' : 'neutral') as 'positive' | 'negative' | 'neutral'
    },
    {
      label: 'Équipe',
      value: stats.teamSize || 0,
      icon: <Users className="h-5 w-5" />,
      variant: 'info' as const,
      format: 'number' as const
    }
  ];

  // Fonction pour gérer la déconnexion
  const handleLogout = () => {
    // Logique de déconnexion à implémenter
    console.log('Déconnexion');
  };

  return (
    <AppLayout 
      user={user}
      notifications={notifications}
      onLogout={handleLogout}
    >
      <Head title="Tableau de bord" />
      
      <div className="space-y-6">
        {/* Statistiques communes */}
        <EvaluationStats 
          title="Aperçu"
          stats={commonStats}
          layout="grid"
          columns={4}
        />
        
        {/* Tableau de bord spécifique au rôle */}
        {renderDashboardByRole()}
        
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Liste des évaluations en attente */}
          <EvaluationList 
            title="Évaluations à compléter"
            description="Liste des évaluations en attente de votre action"
            evaluations={pendingEvaluations.map(e => ({
              id: e.id,
              evaluatedId: e.evaluatedId,
              evaluatedName: e.evaluatedName,
              evaluatedRole: e.evaluatedRole,
              evaluatedDepartment: e.evaluatedDepartment,
              evaluatedAvatar: e.evaluatedAvatar,
              status: e.status,
              dueDate: e.dueDate,
              progress: e.progress,
              createdAt: e.createdAt,
              updatedAt: e.updatedAt
            }))}
            emptyMessage="Aucune évaluation en attente"
            emptyIcon={<CheckCircle className="h-8 w-8 text-sabc-success" />}
            onViewEvaluation={(id) => console.log('Voir évaluation', id)}
            onEditEvaluation={(id) => console.log('Éditer évaluation', id)}
          />
          
          {/* Liste des évaluations complétées */}
          <EvaluationList 
            title="Évaluations récentes"
            description="Vos évaluations récemment complétées"
            evaluations={completedEvaluations.map(e => ({
              id: e.id,
              evaluatedId: e.evaluatedId,
              evaluatedName: e.evaluatedName,
              evaluatedRole: e.evaluatedRole,
              evaluatedDepartment: e.evaluatedDepartment,
              evaluatedAvatar: e.evaluatedAvatar,
              status: e.status,
              dueDate: e.dueDate,
              progress: 100,
              createdAt: e.createdAt,
              updatedAt: e.updatedAt
            }))}
            emptyMessage="Aucune évaluation complétée récemment"
            emptyIcon={<AlertCircle className="h-8 w-8 text-sabc-gray-400" />}
            onViewEvaluation={(id) => console.log('Voir évaluation', id)}
            showProgress={false}
          />
        </div>
      </div>
    </AppLayout>
  );
}
