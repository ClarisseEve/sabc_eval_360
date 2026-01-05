import React from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/Components/Layout/app/AppLayout';
import { Card, CardHeader, CardContent } from '@/Components/UI/Card/Card';
import useAuth from '@/Hooks/useAuth';

/**
 * Page des événements pour le rôle Assistant Superviseur Sponsoring (AS)
 */
const Events: React.FC = () => {
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
      <Head title="Événements - Assistant Sponsoring" />
      
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-sabc-gray-900">Événements</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-medium">Événements à venir</h2>
            </CardHeader>
            <CardContent>
              <p className="text-sabc-gray-600">Aucun événement programmé pour le moment.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-lg font-medium">Historique des événements</h2>
            </CardHeader>
            <CardContent>
              <p className="text-sabc-gray-600">Aucun événement passé à afficher.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default Events;
