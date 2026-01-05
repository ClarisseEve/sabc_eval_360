import React from 'react';
import { Head, usePage } from '@inertiajs/react';
import { AppLayout } from '@/Components/Layout/app/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/UI/Card';

interface AuthDebugProps {
  auth: {
    user: any;
    debug?: {
      is_authenticated: boolean;
      session_id: string;
      session_has_user: boolean;
      cookie_has_laravel: boolean;
      cookie_has_remember: boolean;
      timestamp: string;
    }
  }
}

export default function AuthDebug() {
  const { auth } = usePage().props as AuthDebugProps;
  const { user, debug } = auth;

  return (
    <>
      <Head title="Diagnostic d'Authentification" />
      <div className="container mx-auto py-6 space-y-6">
        <h1 className="text-2xl font-bold text-sabc-gray-900">Diagnostic d'Authentification</h1>
        
        <Card>
          <CardHeader>
            <CardTitle>État de l'Authentification</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-sabc-gray-100 rounded-md">
                <h3 className="font-semibold mb-2">Utilisateur Authentifié</h3>
                {user ? (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="font-medium">Matricule:</div>
                    <div>{user.matricule}</div>
                    <div className="font-medium">Nom:</div>
                    <div>{user.nom} {user.prenom}</div>
                    <div className="font-medium">Email:</div>
                    <div>{user.email}</div>
                    <div className="font-medium">Rôle:</div>
                    <div>{user.role_nom}</div>
                    <div className="font-medium">Région:</div>
                    <div>{user.region_nom}</div>
                  </div>
                ) : (
                  <div className="text-sabc-error">Aucun utilisateur authentifié</div>
                )}
              </div>
              
              {debug && (
                <div className="p-4 bg-sabc-gray-100 rounded-md">
                  <h3 className="font-semibold mb-2">Informations de Débogage</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="font-medium">Auth::check():</div>
                    <div>{debug.is_authenticated ? '✅ Oui' : '❌ Non'}</div>
                    <div className="font-medium">ID Session:</div>
                    <div className="font-mono text-xs">{debug.session_id}</div>
                    <div className="font-medium">Session contient utilisateur:</div>
                    <div>{debug.session_has_user ? '✅ Oui' : '❌ Non'}</div>
                    <div className="font-medium">Cookie Laravel présent:</div>
                    <div>{debug.cookie_has_laravel ? '✅ Oui' : '❌ Non'}</div>
                    <div className="font-medium">Cookie Remember présent:</div>
                    <div>{debug.cookie_has_remember ? '✅ Oui' : '❌ Non'}</div>
                    <div className="font-medium">Timestamp:</div>
                    <div>{debug.timestamp}</div>
                  </div>
                </div>
              )}
              
              <div className="p-4 bg-sabc-gray-100 rounded-md">
                <h3 className="font-semibold mb-2">Tests de Navigation</h3>
                <div className="space-y-2">
                  <p>Cliquez sur les liens ci-dessous pour tester la navigation et vérifier si la session est maintenue:</p>
                  <div className="flex flex-wrap gap-2">
                    <a href="/test-auth" className="px-4 py-2 bg-sabc-gray-200 hover:bg-sabc-gray-300 rounded-md">
                      API de Test Auth (JSON)
                    </a>
                    <a href="/common/dashboard" className="px-4 py-2 bg-sabc-gray-200 hover:bg-sabc-gray-300 rounded-md">
                      Dashboard Commun
                    </a>
                    <a href="/admin/dashboard" className="px-4 py-2 bg-sabc-gray-200 hover:bg-sabc-gray-300 rounded-md">
                      Dashboard Admin
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

AuthDebug.layout = (page: React.ReactNode) => <AppLayout>{page}</AppLayout>;
