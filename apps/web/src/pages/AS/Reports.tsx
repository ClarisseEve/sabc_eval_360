import React from 'react';
import { Head } from '@/lib/inertia-shim';
import AppLayout from '@/Components/Layout/app/AppLayout';
import { Card, CardHeader, CardContent } from '@/Components/UI/Card/Card';
import useAuth from '@/Hooks/useAuth';

/**
 * Page des rapports pour le rôle Assistant Superviseur Sponsoring (AS)
 */
const Reports: React.FC = () => {
  const { user } = useAuth();

  // Adapter l'objet utilisateur au format attendu par AppLayout
  const adaptedUser = user ? {
    name: `${user.prenom} ${user.nom}`,
    email: user.email,
    role: user.role_nom || 'AS',
    avatar: user.avatar
  } : {
    name: 'Utilisateur',
    email: '',
    role: 'AS'
  };

  return (
    <AppLayout user={adaptedUser}>
      <Head title="Rapports - Assistant Sponsoring" />
      
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-sabc-gray-900">Rapports</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-medium">Rapports mensuels</h2>
            </CardHeader>
            <CardContent>
              <p className="text-sabc-gray-600">Aucun rapport mensuel disponible.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-lg font-medium">Rapports d'activité</h2>
            </CardHeader>
            <CardContent>
              <p className="text-sabc-gray-600">Aucun rapport d'activité disponible.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default Reports;
