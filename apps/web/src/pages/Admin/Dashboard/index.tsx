import React, { Suspense, useState } from 'react';
import { Head } from '@/lib/inertia-shim';
import AppLayout from '@/Components/Layout/app/AppLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/Components/UI/Tabs/Tabs';
import { WelcomeMessage } from '@/Components/UI/WelcomeMessage';
import { ErrorBoundary } from '@/Components/ErrorBoundary';
import { DashboardSkeleton } from '@/Components/Dashboard/DashboardSkeleton';
import { useAuthContext } from '@/Contexts/AuthContext';

// Lazy-loaded tab contents
const DashboardTab = React.lazy(() => import('@/Components/Dashboard/Admin/Tabs/DashboardTab'));
const EvaluationsTab = React.lazy(() => import('@/Components/Dashboard/Admin/Tabs/EvaluationsTab'));

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const { user } = useAuthContext();

  const layoutUser = {
    name: user ? [user.prenom, user.nom].filter(Boolean).join(' ') || 'Administrateur' : 'Administrateur',
    email: user?.email || '',
    role: user?.role_nom || 'ADMIN',
    avatar: user?.avatar,
  };

  return (
    <AppLayout
      user={layoutUser}
      pageTitle="Tableau de bord"
      notifications={[]}
    >
      <Head title="Tableau de bord Administrateur - SABC Eval360" />

      <div className="container mx-auto px-4 py-6">
        <WelcomeMessage userName={layoutUser.name} className="mb-8" />

        <Tabs defaultValue="overview" className="mb-6" onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="supervision">Supervision</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <ErrorBoundary>
              <Suspense fallback={<DashboardSkeleton />}>
                <DashboardTab />
              </Suspense>
            </ErrorBoundary>
          </TabsContent>

          <TabsContent value="supervision">
            <ErrorBoundary>
              <Suspense fallback={<DashboardSkeleton />}>
                <EvaluationsTab />
              </Suspense>
            </ErrorBoundary>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default AdminDashboard;
