import React from 'react';
import { RouteConfig } from '@/types';

/**
 * Configuration des routes pour le rôle Superviseur Régional Marketing Opérationnel (SRMO)
 * 
 * Ces routes sont accessibles uniquement pour les utilisateurs avec le rôle SRMO
 * et sont affichées dans la sidebar sous le menu "Superviseur Marketing"
 */
const srmoRoutes: RouteConfig[] = [
  {
    name: 'srmo.dashboard',
    path: '/srmo/dashboard',
    component: React.lazy(() => import('@/pages/SRMO/Dashboard')),
    meta: {
      title: 'Tableau de bord',
      icon: 'dashboard',
      roles: ['SRMO'],
      sidebar: true,
      parent: 'marketing_operationnel'
    }
  },
  {
    name: 'srmo.campaigns',
    path: '/srmo/campaigns',
    component: React.lazy(() => import('@/pages/SRMO/Campaigns')),
    meta: {
      title: 'Campagnes marketing',
      icon: 'trending-up',
      roles: ['SRMO'],
      sidebar: true,
      parent: 'marketing_operationnel'
    }
  },
  {
    name: 'srmo.operators',
    path: '/srmo/operators',
    component: React.lazy(() => import('@/pages/SRMO/Operators')),
    meta: {
      title: 'Opérateurs marketing',
      icon: 'users',
      roles: ['SRMO'],
      sidebar: true,
      parent: 'marketing_operationnel'
    }
  }
];

export default srmoRoutes;
