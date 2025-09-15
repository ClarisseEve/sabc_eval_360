import React from 'react';
import { RouteConfig } from './types';

// TODO: Import des routes spécifiques à chaque rôle (sera ajouté progressivement)
// import { adminRoutes } from '@/pages/Admin/routes';
// import { drRoutes } from '@/pages/DR/routes';
// import { cdttRoutes routes';
// import { cscRoutes } from '@/pages/CSC/routes';
// import { cdvRoutes } from '@/pages/CDV/routes';
// import { cdsRoutes } from '@/pages/CDS/routes';
// import { rtmRoutes } from '@/pages/RTM/routes';
// import { srmoRoutes } from '@/pages/SRMO/routes';
// import { tmoRoutes } from '@/pages/TMO/routes';
// import { ssRoutes } from '@/pages/SS/routes';
// import { asRoutes } from '@/pages/AS/routes';

/**
 * Configuration des routes principales de l'application SABC Eval360
 * 
 * Ce fichier centralise toutes les routes de l'application et les organise
 * selon les règles métier SABC avec une structure claire par rôle
 */
const routes: RouteConfig[] = [
  // Route racine - redirige vers le tableau de bord approprié en fonction du rôle
  {
    name: 'root',
    path: '/',
    component: React.lazy(() => import('./pages/Common/RoleRedirector').catch(() => ({ default: () => <div>Chargement...</div> }))),
    meta: {
      title: 'Redirection',
      roles: ['*'],
      sidebar: false
    }
  },
  
  // Routes communes à tous les rôles
  {
    name: 'profile',
    path: '/profile',
    component: React.lazy(() => import('./pages/Common/Profile').catch(() => ({ default: () => <div>Chargement...</div> }))),
    meta: {
      title: 'Mon profil',
      icon: 'user',
      roles: ['*'],
      sidebar: true
    }
  },
  
  {
    name: 'evaluations',
    path: '/evaluations',
    component: React.lazy(() => import('./pages/Common/Evaluations').catch(() => ({ default: () => <div>Chargement...</div> }))),
    meta: {
      title: 'Mes évaluations',
      icon: 'clipboard',
      roles: ['*'],
      sidebar: true
    }
  },
  
  {
    name: 'settings',
    path: '/settings',
    component: React.lazy(() => import('./pages/Common/Settings').catch(() => ({ default: () => <div>Chargement...</div> }))),
    meta: {
      title: 'Paramètres',
      icon: 'settings',
      roles: ['*'],
      sidebar: true
    }
  }
  
  // TODO: Intégrer les routes spécifiques à chaque rôle (sera ajouté progressivement)
  // ...adminRoutes,  // Routes Admin (/admin/...)
  // ...drRoutes,     // Routes Directeur Régional (/dr/...)
  // ...cdttRoutes,   // Routes Chef Département Trade (/cdtt/...)
  // ...cscRoutes,    // Routes Chef Service Commercial (/csc/...)
  // ...cdvRoutes,    // Routes Chef District Vente (/cdv/...)
  // ...cdsRoutes,    // Routes Chef de Secteur (/cds/...)
  // ...rtmRoutes,    // Routes Regional Trade Marketing (/rtm/...)
  // ...srmoRoutes,   // Routes Superviseur Régional Marketing Opérationnel (/srmo/...)
  // ...tmoRoutes,    // Routes Trade Marketing Operator (/tmo/...)
  // ...ssRoutes,     // Routes Superviseur Sponsoring (/ss/...)
  // ...asRoutes      // Routes Assistant Superviseur Sponsoring (/as/...)
];

export default routes;
