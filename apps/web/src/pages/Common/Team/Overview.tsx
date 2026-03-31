import React, { Suspense } from 'react';
import { Head } from '@/lib/inertia-shim';
import AppLayout from '@/Components/Layout/app/AppLayout';
import { useAuthContext } from '@/Contexts/AuthContext';
import { Card, CardContent } from '@/Components/UI/Card/Card';
import { Users, Construction } from 'lucide-react';

function TeamOverviewContent() {
  return (
    <div className="mx-auto max-w-4xl py-12">
      <Card className="border-dashed border-2 border-sabc-gray-300 dark:border-sabc-gray-600">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 rounded-full bg-sabc-gray-100 p-4 dark:bg-sabc-gray-800">
            <Construction className="h-12 w-12 text-sabc-gray-400" />
          </div>
          <h2 className="mb-2 text-xl font-semibold text-sabc-gray-700 dark:text-sabc-gray-200">
            Vue d'équipe
          </h2>
          <p className="max-w-md text-sm text-sabc-gray-500 dark:text-sabc-gray-400">
            Cette fonctionnalité sera disponible prochainement.
            Vous pourrez consulter la liste de vos subordonnés et leur statut d'évaluation.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function TeamOverviewPage() {
  const { user } = useAuthContext();

  const layoutUser = {
    name: user ? [user.prenom, user.nom].filter(Boolean).join(' ') || 'Utilisateur' : 'Utilisateur',
    email: user?.email || '',
    role: user?.role_nom || user?.role || '',
    avatar: undefined,
  };

  const handleLogout = () => {
    localStorage.removeItem('sabc_access_token');
    window.location.href = '/login';
  };

  return (
    <AppLayout user={layoutUser} notifications={[]} pageTitle="Mon équipe" onLogout={handleLogout}>
      <Head title="Mon équipe — SABC Eval360" />
      <Suspense fallback={<div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-sabc-gray-200 border-t-sabc-red-primary" /></div>}>
        <TeamOverviewContent />
      </Suspense>
    </AppLayout>
  );
}
