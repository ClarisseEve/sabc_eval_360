import React from 'react';
import { RouteConfig } from '@/types';

/**
 * Configuration des routes pour le rôle Assistant Superviseur Sponsoring (AS)
 * 
 * Ces routes sont accessibles uniquement pour les utilisateurs avec le rôle AS
 * et sont affichées dans la sidebar sous le menu "Assistant Sponsoring"
 */
const asRoutes: RouteConfig[] = [
  {
    name: 'as.dashboard',
    path: '/as/dashboard',
    component: React.lazy(() => import('../Dashboard/AS/Index')),
    meta: {
      title: 'Tableau de bord',
      icon: 'dashboard',
      roles: ['AS'],
      sidebar: true,
      parent: 'assistant_sponsoring'
    }
  },
  {
    name: 'as.events',
    path: '/as/events',
    component: React.lazy(() => import('./Events')),
    meta: {
      title: 'Événements',
      icon: 'calendar',
      roles: ['AS'],
      sidebar: true,
      parent: 'assistant_sponsoring'
    }
  },
  {
    name: 'as.reports',
    path: '/as/reports',
    component: React.lazy(() => import('./Reports')),
    meta: {
      title: 'Rapports',
      icon: 'file-text',
      roles: ['AS'],
      sidebar: true,
      parent: 'assistant_sponsoring'
    }
  }
];

export default asRoutes;
