import React, { Suspense } from 'react';
import RoleDirectorDashboardPage from '@/Components/Dashboard/RoleDirectorDashboardPage';
import { ErrorBoundary } from '@/Components/ErrorBoundary';
import { DashboardSkeleton } from '@/Components/Dashboard/DashboardSkeleton';

const DRDashboard: React.FC = () => (
  <ErrorBoundary>
    <Suspense fallback={<DashboardSkeleton />}>
      <RoleDirectorDashboardPage
        fallbackRole="DR"
        title="Tableau de bord Directeur Régional"
        subtitle="Pilotage régional des évaluations, de la couverture hiérarchique et des performances agrégées."
        perimeterTitle="Périmètre régional"
      />
    </Suspense>
  </ErrorBoundary>
);

export default DRDashboard;
