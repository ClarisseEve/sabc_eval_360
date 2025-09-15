import React from 'react';
import { Head } from '@inertiajs/react';
import { useAuth } from '@/hooks/useAuth';
import { useAuthBridge } from '@/hooks/useAuthBridge';
import AppLayout from '@/Components/Layout/app/AppLayout';
import { adaptUserForLayout } from '@/utils/userAdapter';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/UI/Card/Card';
import { Button } from '@/Components/UI/Button/Button';

/**
 * Page des paramètres commune à tous les rôles
 */
const Settings: React.FC = () => {
  const { user } = useAuth();
  const authContext = useAuthBridge();
  
  return (
    <AppLayout user={adaptUserForLayout(authContext.user || user)}>
      <Head title="Paramètres - SABC Évaluation 360°" />
      
      <div className="container mx-auto px-4 py-8">
        <h1 className="mb-8 text-3xl font-bold text-sabc-gray-900">Paramètres</h1>
        
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Sécurité</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="mb-2 text-lg font-medium text-sabc-gray-800">Mot de passe</h3>
                  <p className="mb-4 text-sm text-sabc-gray-600">
                    Modifiez votre mot de passe régulièrement pour garantir la sécurité de votre compte.
                  </p>
                  <Button>Modifier le mot de passe</Button>
                </div>
                
                <div>
                  <h3 className="mb-2 text-lg font-medium text-sabc-gray-800">Authentification à deux facteurs</h3>
                  <p className="mb-4 text-sm text-sabc-gray-600">
                    Activez l'authentification à deux facteurs pour renforcer la sécurité de votre compte.
                  </p>
                  <Button variant="outline">Configurer l'authentification à deux facteurs</Button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Préférences</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="mb-2 text-lg font-medium text-sabc-gray-800">Langue</h3>
                  <p className="mb-4 text-sm text-sabc-gray-600">
                    Sélectionnez la langue d'affichage de l'application.
                  </p>
                  <select className="w-full rounded-md border border-sabc-gray-200 p-2">
                    <option value="fr">Français</option>
                    <option value="en">English</option>
                  </select>
                </div>
                
                <div>
                  <h3 className="mb-2 text-lg font-medium text-sabc-gray-800">Notifications</h3>
                  <p className="mb-4 text-sm text-sabc-gray-600">
                    Configurez vos préférences de notification.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <input type="checkbox" id="email-notif" className="mr-2" />
                      <label htmlFor="email-notif">Notifications par email</label>
                    </div>
                    <div className="flex items-center">
                      <input type="checkbox" id="app-notif" className="mr-2" />
                      <label htmlFor="app-notif">Notifications dans l'application</label>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default Settings;
