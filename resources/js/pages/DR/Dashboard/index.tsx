import React from 'react';
import { Head, usePage } from '@inertiajs/react';
import AppLayout from '@/Components/Layout/app/AppLayout';
import { DirectorDashboard } from '@/Components/Dashboard/DirectorDashboard';
import { SharedData } from '@/types';

const DRDashboard: React.FC = () => {
  const { auth, stats } = usePage<SharedData>().props as any;

  const userName = auth?.user?.name
    || [auth?.user?.prenom, auth?.user?.nom].filter(Boolean).join(' ')
    || 'Utilisateur SABC';
  const userEmail = auth?.user?.email || 'user@sabc.cm';
  const userRole = auth?.user?.role?.nom_role || auth?.user?.role_nom || auth?.user?.role || 'DR';
  const userRegion = auth?.user?.region?.nom_region || auth?.user?.region_nom || auth?.user?.region || 'Non spécifiée';
  const userDepartment = auth?.user?.branche?.nom_branche || auth?.user?.branche_nom || auth?.user?.department || 'Direction';
  const userId = auth?.user?.id || auth?.user?.matricule || 'dr';

  const layoutUser = {
    name: userName,
    email: userEmail,
    role: userRole,
    avatar: undefined,
  };

  const dashboardUser = {
    id: userId,
    name: userName,
    email: userEmail,
    role: userRole,
    region: userRegion,
    department: userDepartment,
    avatar: undefined,
  };

  // Fonction de déconnexion qui crée et soumet un formulaire avec jeton CSRF
  const handleLogout = () => {
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = '/logout';
    form.style.display = 'none';

    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    const csrfInput = document.createElement('input');
    csrfInput.type = 'hidden';
    csrfInput.name = '_token';
    csrfInput.value = csrfToken || '';

    form.appendChild(csrfInput);
    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
  };

  const notifications = [
    {
      id: '1',
      title: 'Évaluations en attente',
      message: '5 évaluations requièrent votre attention',
      status: 'warning' as const,
      read: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: '2',
      title: 'Nouveaux rapports',
      message: 'Les rapports mensuels sont disponibles',
      status: 'info' as const,
      read: true,
      createdAt: new Date().toISOString(),
    },
  ];

  const demoMetrics = {
    globalPerformance: {
      value: 87,
      previousValue: 84,
      change: 3,
      changeType: 'positive' as const,
      label: 'Performance Globale',
    },
    commercialPerformance: {
      value: 92,
      previousValue: 88,
      change: 4,
      changeType: 'positive' as const,
      label: 'Performance Commerciale',
    },
    marketingPerformance: {
      value: 85,
      previousValue: 82,
      change: 3,
      changeType: 'positive' as const,
      label: 'Performance Marketing',
    },
    evaluationCompletion: {
      value: 80,
      previousValue: 78,
      change: 2,
      changeType: 'positive' as const,
      label: 'Évaluations Complétées',
    },
  };

  const demoDepartmentPerformance = [
    { name: 'Littoral', commercial: 88, marketing: 82 },
    { name: 'Centre', commercial: 83, marketing: 79 },
    { name: 'Ouest', commercial: 76, marketing: 73 },
    { name: 'Nord', commercial: 81, marketing: 77 },
  ];

  const demoTopPerformers = [
    {
      id: '1',
      name: 'Jean Dupont',
      role: 'CSC',
      department: 'Commercial',
      performanceIndex: 92,
      evaluationsCompleted: 12,
      evaluationsTotal: 12,
      lastEvaluation: '2025-05-12',
    },
    {
      id: '2',
      name: 'Marie Durand',
      role: 'RTM',
      department: 'Marketing',
      performanceIndex: 89,
      evaluationsCompleted: 10,
      evaluationsTotal: 12,
      lastEvaluation: '2025-05-10',
    },
    {
      id: '3',
      name: 'Pierre Martin',
      role: 'CDV',
      department: 'Commercial',
      performanceIndex: 87,
      evaluationsCompleted: 11,
      evaluationsTotal: 12,
      lastEvaluation: '2025-05-08',
    },
  ];

  const demoPendingEvaluations = [
    {
      id: '1',
      evaluatedName: 'Lucie Dubois',
      evaluatedRole: 'CSC',
      dueDate: '28 Mai 2025',
      isOverdue: false,
    },
    {
      id: '2',
      evaluatedName: 'Thomas Moreau',
      evaluatedRole: 'RTM',
      dueDate: '25 Mai 2025',
      isOverdue: true,
    },
  ];

  return (
    <AppLayout user={layoutUser} notifications={notifications} onLogout={handleLogout}>
      <Head title="Tableau de bord Directeur Régional - SABC Évaluation 360°" />

      <DirectorDashboard
        user={dashboardUser}
        stats={stats}
        metrics={demoMetrics}
        departmentPerformance={demoDepartmentPerformance}
        topPerformers={demoTopPerformers}
        pendingEvaluations={demoPendingEvaluations}
      />
    </AppLayout>
  );
};

export default DRDashboard;
