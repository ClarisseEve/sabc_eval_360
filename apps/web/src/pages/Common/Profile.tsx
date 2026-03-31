import React from 'react';
import { Head } from '@/lib/inertia-shim';
import { useAuth } from '@/Hooks/useAuth';
import { useAuthBridge } from '@/Hooks/useAuthBridge';
import AppLayout from '@/Components/Layout/app/AppLayout';
import { adaptUserForLayout } from '@/utils/userAdapter';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/UI/Card/Card';

/**
 * Page de profil utilisateur commune à tous les rôles
 */
const Profile: React.FC = () => {
  const { user } = useAuth();
  const authContext = useAuthBridge();
  
  return (
    <AppLayout user={adaptUserForLayout(authContext.user || user)}>
      <Head title="Mon profil - SABC Évaluation 360°" />
      
      <div className="container mx-auto px-4 py-8">
        <h1 className="mb-8 text-3xl font-bold text-sabc-gray-900">Mon profil</h1>
        
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Informations personnelles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-sabc-gray-400">Nom complet</h3>
                  <p className="text-sabc-gray-800">{user?.name || 'Non renseigné'}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-sabc-gray-400">Email</h3>
                  <p className="text-sabc-gray-800">{user?.email || 'Non renseigné'}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-sabc-gray-400">Rôle</h3>
                  <p className="text-sabc-gray-800">{user?.role || 'Non renseigné'}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-sabc-gray-400">Matricule</h3>
                  <p className="text-sabc-gray-800">{user?.matricule || 'Non renseigné'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Informations professionnelles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-sabc-gray-400">Région</h3>
                  <p className="text-sabc-gray-800">{(user as any)?.region_nom || 'Non renseigné'}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-sabc-gray-400">Branche</h3>
                  <p className="text-sabc-gray-800">{(user as any)?.branche_nom || 'Non renseigné'}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-sabc-gray-400">Manager</h3>
                  <p className="text-sabc-gray-800">{(user as any)?.manager_nom || 'Non renseigné'}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-sabc-gray-400">Date de prise de poste</h3>
                  <p className="text-sabc-gray-800">{(user as any)?.date_prise_poste || 'Non renseigné'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default Profile;
