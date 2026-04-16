import React, { Suspense } from 'react';
import RoleManagerDashboardPage from '@/Components/Dashboard/RoleManagerDashboardPage';
import { ErrorBoundary } from '@/Components/ErrorBoundary';
import { DashboardSkeleton } from '@/Components/Dashboard/DashboardSkeleton';

const CDSDashboard: React.FC = () => (
  <ErrorBoundary>
    <Suspense fallback={<DashboardSkeleton />}>
      <RoleManagerDashboardPage
        fallbackRole="CDS"
        title="Tableau de bord Chef de Secteur"
        subtitle="Vue consolidée des évaluations et de l'activité terrain du secteur."
        teamTitle="Équipe du secteur"
      />
    </Suspense>
  </ErrorBoundary>
);

export default CDSDashboard;
