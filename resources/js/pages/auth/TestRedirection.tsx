import React from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/Components/Layout/app/AppLayout';
import AuthRedirector from '@/Components/Auth/AuthRedirector';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/UI/Card/Card';

/**
 * Page de test pour vérifier la redirection basée sur les rôles
 * Cette page affiche les informations de l'utilisateur authentifié et le tableau de bord correspondant
 */
const TestRedirectionPage: React.FC = () => {
  return (
    <AppLayout
      user={{
        name: 'Test User',
        email: 'test@sabc.com',
        role: 'TEST',
        avatar: undefined
      }}
      notifications={[]}
    >
      <Head title="Test Redirection - SABC Évaluation 360°" />
      
      <div className="container mx-auto px-4 py-6">
        <h1 className="mb-6 text-2xl font-bold text-sabc-gray-900">Test de Redirection Basée sur les Rôles</h1>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Vérification de l'Authentification et Redirection</CardTitle>
            <CardDescription>
              Cette page permet de vérifier que le système de redirection basée sur les rôles fonctionne correctement.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AuthRedirector />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Guide de Test</CardTitle>
            <CardDescription>
              Comment tester le système de redirection basée sur les rôles
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-sabc-gray-900 mb-2">Étapes de Test</h3>
                <ol className="list-decimal list-inside space-y-2 text-sabc-gray-700">
                  <li>Connectez-vous avec différents rôles d'utilisateur</li>
                  <li>Vérifiez que vous êtes redirigé vers le tableau de bord correspondant à votre rôle</li>
                  <li>Essayez d'accéder à des tableaux de bord qui ne correspondent pas à votre rôle</li>
                  <li>Vérifiez que vous êtes redirigé vers votre tableau de bord approprié</li>
                </ol>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-sabc-gray-900 mb-2">Rôles à Tester</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-sabc-gray-50 p-4 rounded-md">
                    <h4 className="font-medium text-sabc-red-primary mb-2">Hiérarchie Commerciale</h4>
                    <ul className="list-disc list-inside space-y-1 text-sabc-gray-700">
                      <li>DR - Directeur Régional</li>
                      <li>CDTT - Chef Département Trade</li>
                      <li>CSC - Chef Service Commercial</li>
                      <li>CDV - Chef District Vente</li>
                      <li>CDS - Chef de Secteur</li>
                    </ul>
                  </div>
                  
                  <div className="bg-sabc-gray-50 p-4 rounded-md">
                    <h4 className="font-medium text-sabc-red-primary mb-2">Hiérarchie Marketing</h4>
                    <ul className="list-disc list-inside space-y-1 text-sabc-gray-700">
                      <li>DR - Directeur Régional</li>
                      <li>CDTT - Chef Département Trade</li>
                      <li>RTM - Regional Trade Marketing</li>
                      <li>TMO - Trade Marketing Operator</li>
                      <li>SRMO - Superviseur Regional Marketing Operation</li>
                      <li>SS - Superviseur Sponsoring</li>
                      <li>AS - Assistant Superviseur Sponsoring</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="bg-sabc-red-light/10 border-l-4 border-sabc-red-primary p-4 rounded-r-md">
                <h4 className="font-medium text-sabc-red-primary mb-2">Note Importante</h4>
                <p className="text-sabc-gray-700">
                  Selon les règles métier SABC, seuls les rôles DR et CDTT peuvent superviser les deux branches 
                  (commerciale et marketing). Les autres rôles sont limités à leur branche respective.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default TestRedirectionPage;
