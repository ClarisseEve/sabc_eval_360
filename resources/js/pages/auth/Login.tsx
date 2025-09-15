import React, { useState, useEffect } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { Button } from '@/Components/UI/Button/Button';
import { Input } from '@/Components/UI/Input/Input';
import { Label } from '@/Components/UI/Label/Label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/Components/UI/Card/Card';
import { Badge } from '@/Components/UI/Badge/Badge';
import { Eye, EyeOff, User, Lock, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/Components/UI/Alert/Alert';

interface LoginProps {
  errors: {
    identifier?: string;
    password?: string;
  };
  status?: string;
}

type TestAccount = {
  label: string;
  description: string;
  email: string;
  username: string;
  badge?: string;
  badgeColor?: string;
};

const Login: React.FC<LoginProps> = ({ errors, status }) => {
  const { data, setData, post, processing } = useForm({
    identifier: '',
    password: 'admin123', // Mot de passe par défaut pour les tests
    remember: false as const,
  });

  // Inertia gère automatiquement le CSRF

  // Un seul compte administrateur pour la gestion initiale
  const testAccounts: TestAccount[] = [
    { 
      label: 'Admin', 
      description: 'Accès administrateur pour la création des utilisateurs', 
      email: 'admin@sabc.cm',
      username: 'US-01',
      badge: 'Admin',
      badgeColor: 'bg-sabc-red-primary'
    },
    { 
      label: 'DR Littoral', 
      description: 'Directeur Régional - Région Littoral (Tanière)', 
      email: 'jean.mbarga@sabc.cm',
      username: 'US-02',
      badge: 'DR',
      badgeColor: 'bg-sabc-red-dark'
    },
    { 
      label: 'DR Centre', 
      description: 'Directeur Régional - Région Centre (Tanière)', 
      email: 'marie.nkomo@sabc.cm',
      username: 'US-03',
      badge: 'DR',
      badgeColor: 'bg-sabc-red-dark'
    }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Tentative de connexion...');
    
    // Utiliser la méthode post d'Inertia (le token CSRF est géré automatiquement)
    post('/login', {
      preserveScroll: true,
      onError: (errors: Record<string, string>) => {
        console.error('Erreurs de connexion:', errors);
        // Focus sur le champ en erreur pour améliorer l'expérience utilisateur
        if (errors.identifier) {
          document.getElementById('identifier')?.focus();
        } else if (errors.password) {
          document.getElementById('password')?.focus();
        }
      },
      onSuccess: () => {
        console.log('Connexion réussie! Laissons le serveur gérer la redirection...');
        // Ne pas faire de redirection côté client
        // Le serveur va gérer la redirection via redirect()->route('dashboard.admin')
      }
    });
  };

  return (
    <div className="bg-sabc-gray-50 flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
      <Head title="Connexion - SABC Évaluation 360°" />
      
      <div className="flex flex-col items-center mb-8">
        <div className="w-40 h-20 mb-4">
          <img 
            src="/images/logos/sabc-logo.png" 
            alt="SABC Logo" 
            className="w-full h-full object-contain"
          />
        </div>
      </div>
      
      <Card className="w-full max-w-lg shadow-lg border-0">
        <CardHeader className="text-center border-b border-sabc-gray-200 bg-white rounded-t-xl">
          <CardTitle className="text-2xl font-semibold text-[#424242]">Connexion</CardTitle>
          <CardDescription className="text-[#9E9E9E]">Connectez-vous pour accéder à votre tableau de bord</CardDescription>
        </CardHeader>
        
        <CardContent className="p-6">
          {status && (
            <Alert className="mb-6">
              <AlertDescription>{status}</AlertDescription>
            </Alert>
          )}
          
          <div className="mb-6">
            <p className="text-sm text-sabc-gray-800 mb-2 font-medium">Compte administrateur :</p>
            <div className="border border-sabc-gray-200 rounded-md p-2 bg-white">
              {testAccounts.map((account, index) => (
                <div 
                  key={index} 
                  className="flex flex-col p-2 hover:bg-sabc-gray-50 cursor-pointer rounded-md mb-1 transition-colors"
                  onClick={() => setData('identifier', account.username)}
                >
                  <div className="flex items-center">
                    <span className="font-medium text-sabc-gray-800">{account.label}</span>
                    {account.badge && (
                      <span className={`ml-2 text-xs text-white px-2 py-0.5 rounded-full ${account.badgeColor}`}>
                        {account.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-sabc-gray-400">{account.description}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-sabc-gray-400 mt-1">Cliquez sur un compte pour remplir le matricule automatiquement</p>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="identifier" className="text-sabc-gray-800 font-medium">Matricule ou Email</Label>
                <Input
                  id="identifier"
                  type="text"
                  value={data.identifier}
                  onChange={(e) => setData('identifier', e.target.value)}
                  required
                  autoFocus
                  className={`h-11 rounded-lg ${errors.identifier ? 'border-sabc-error' : 'border-sabc-gray-200'}`}
                  placeholder="US-XX ou email@sabc.cm"
                />
                {errors.identifier && (
                  <p className="text-sm text-sabc-error font-medium">{errors.identifier}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sabc-gray-800 font-medium">Mot de passe</Label>
                  <Link
                    href="/forgot-password"
                    className="text-sm text-sabc-red-primary hover:underline font-medium"
                  >
                    Mot de passe oublié ?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={data.password}
                  onChange={(e) => setData('password', e.target.value)}
                  required
                  className={`h-11 rounded-lg ${errors.password ? 'border-sabc-error' : 'border-sabc-gray-200'}`}
                />
                {errors.password && (
                  <p className="text-sm text-sabc-error font-medium">{errors.password}</p>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  id="remember"
                  type="checkbox"
                  checked={data.remember}
                  onChange={(e) => setData('remember', e.target.checked as false)}
                  className="h-5 w-5 rounded border-sabc-gray-300 text-sabc-red-primary focus:ring-sabc-red-primary"
                />
                <Label htmlFor="remember" className="text-sm font-medium text-sabc-gray-700">
                  Se souvenir de moi
                </Label>
              </div>
            </div>
            
            <Button
              type="submit"
              className="mt-8 w-full h-12 text-base font-semibold"
              disabled={processing}
              loading={processing}
              size="lg"
            >
              {processing ? 'Connexion en cours...' : 'Se connecter'}
            </Button>
          </form>
        </CardContent>
        
        <CardFooter className="flex justify-center border-t border-sabc-gray-200 p-6 bg-white rounded-b-xl">
          <p className="text-sm text-sabc-gray-700">
            Pas encore de compte ?{' '}
            <Link href="/register" className="text-sabc-red-primary hover:underline font-medium">
              Créer un compte
            </Link>
          </p>
        </CardFooter>
      </Card>
      
      <div className="mt-6 text-center text-sm text-[#9E9E9E]">
        &copy; {new Date().getFullYear()} SABC - Tous droits réservés
      </div>
    </div>
  );
};

export default Login;
