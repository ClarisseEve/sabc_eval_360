import React, { useEffect, useState } from 'react';
import { usePage } from '@/lib/inertia-shim';

/**
 * Interface pour les propriétés de page Inertia
 */
interface PageProps {
  auth: {
    user: {
      id: number;
      name: string;
      email: string;
      role: string;
    } | null;
  };
  [key: string]: any;
}

/**
 * Composant utilitaire pour tester la redirection basée sur les rôles
 * Ce composant affiche les informations de l'utilisateur authentifié et le tableau de bord correspondant
 */
const AuthRedirector: React.FC = () => {
  const { auth } = usePage<PageProps>().props;
  const [dashboardInfo, setDashboardInfo] = useState<{
    role: string;
    dashboardRoute: string;
    description: string;
  } | null>(null);

  useEffect(() => {
    if (auth && auth.user) {
      // Mapper les rôles aux routes de tableau de bord et descriptions
      const roleMap: Record<string, { route: string; description: string }> = {
        'DR': { 
          route: 'dashboard.dr', 
          description: 'Directeur Régional - Vue stratégique de la région, comparaisons entre services' 
        },
        'CDTT': { 
          route: 'dashboard.cdtt', 
          description: 'Chef Département Trade - Performance du département, comparaison commercial vs marketing' 
        },
        'CSC': { 
          route: 'dashboard.csc', 
          description: 'Chef Service Commercial - Métriques d\'équipe, développement des talents' 
        },
        'CDV': { 
          route: 'dashboard.cdv', 
          description: 'Chef District Vente - Suivi des performances de vente et des équipes' 
        },
        'CDS': { 
          route: 'dashboard.cds', 
          description: 'Chef de Secteur - Performance individuelle et progression' 
        },
        'RTM': { 
          route: 'dashboard.rtm', 
          description: 'Regional Trade Marketing - Gestion des campagnes marketing régionales' 
        },
        'TMO': { 
          route: 'dashboard.tmo', 
          description: 'Trade Marketing Operator - Opérations marketing terrain' 
        },
        'SRMO': { 
          route: 'dashboard.srmo', 
          description: 'Superviseur Regional Marketing Operation - Supervision des opérations marketing régionales' 
        },
        'SS': { 
          route: 'dashboard.ss', 
          description: 'Superviseur Sponsoring - Gestion des événements sponsorisés' 
        },
        'AS': { 
          route: 'dashboard.as', 
          description: 'Assistant Superviseur Sponsoring - Support aux activités de sponsoring' 
        }
      };

      const userRole = auth.user.role.toUpperCase();
      if (roleMap[userRole]) {
        setDashboardInfo({
          role: userRole,
          dashboardRoute: roleMap[userRole].route,
          description: roleMap[userRole].description
        });
      }
    }
  }, [auth]);

  if (!auth || !auth.user) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-xl font-bold text-sabc-red-primary mb-4">Non Authentifié</h2>
        <p className="text-sabc-gray-600">Vous n'êtes pas connecté. Veuillez vous connecter pour accéder à votre tableau de bord.</p>
        <div className="mt-4">
          <a 
            href="/login" 
            className="px-4 py-2 bg-sabc-red-primary text-white rounded-md hover:bg-sabc-red-dark transition-colors"
          >
            Se Connecter
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold text-sabc-red-primary mb-4">
        Informations d'Authentification
      </h2>
      
      <div className="mb-6">
        <h3 className="font-semibold text-sabc-gray-800 mb-2">Utilisateur</h3>
        <div className="grid grid-cols-2 gap-2 bg-sabc-gray-50 p-4 rounded-md">
          <div className="text-sabc-gray-600">Nom:</div>
          <div className="font-medium">{auth.user.name}</div>
          
          <div className="text-sabc-gray-600">Email:</div>
          <div className="font-medium">{auth.user.email}</div>
          
          <div className="text-sabc-gray-600">Rôle:</div>
          <div className="font-medium">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-sabc-red-light text-sabc-red-primary">
              {auth.user.role}
            </span>
          </div>
        </div>
      </div>
      
      {dashboardInfo && (
        <div className="mb-6">
          <h3 className="font-semibold text-sabc-gray-800 mb-2">Tableau de Bord</h3>
          <div className="bg-sabc-gray-50 p-4 rounded-md">
            <p className="mb-2">
              <span className="text-sabc-gray-600">Route: </span>
              <span className="font-medium">{dashboardInfo.dashboardRoute}</span>
            </p>
            <p className="text-sabc-gray-600">{dashboardInfo.description}</p>
          </div>
        </div>
      )}
      
      <div className="flex space-x-4">
        <a 
          href={dashboardInfo ? `/dashboard/${dashboardInfo.role.toLowerCase()}` : '/dashboard'} 
          className="px-4 py-2 bg-sabc-red-primary text-white rounded-md hover:bg-sabc-red-dark transition-colors"
        >
          Accéder au Tableau de Bord
        </a>
        
        <a 
          href="/logout"
          className="px-4 py-2 bg-sabc-gray-200 text-sabc-gray-800 rounded-md hover:bg-sabc-gray-300 transition-colors"
          onClick={(e) => {
            e.preventDefault();
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = '/logout';
            
            // Ajouter le token CSRF
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            if (csrfToken) {
              const csrfInput = document.createElement('input');
              csrfInput.type = 'hidden';
              csrfInput.name = '_token';
              csrfInput.value = csrfToken;
              form.appendChild(csrfInput);
            }
            
            document.body.appendChild(form);
            form.submit();
          }}
        >
          Se Déconnecter
        </a>
      </div>
    </div>
  );
};

export default AuthRedirector;
