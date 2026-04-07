import React, { Suspense } from 'react';
import RoleDashboardPage from '@/Components/Dashboard/RoleDashboardPage';
import { ErrorBoundary } from '@/Components/ErrorBoundary';
import { DashboardSkeleton } from '@/Components/Dashboard/DashboardSkeleton';

const CSCDashboard: React.FC = () => (
  <ErrorBoundary>
    <Suspense fallback={<DashboardSkeleton />}>
      <RoleDashboardPage
        fallbackRole="CSC"
        title="Tableau de bord Chef Service Commercial"
        subtitle="Suivi temps réel des évaluations et de la performance du service commercial."
        teamTitle="Équipe commerciale"
      />
    </Suspense>
  </ErrorBoundary>
);

export default CSCDashboard;
