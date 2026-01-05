import React from 'react';
import { RouteConfig } from '@/types';

/**
 * Configuration des routes pour le rôle Directeur Régional (DR)
 * 
 * Ces routes sont accessibles uniquement pour les utilisateurs avec le rôle DR
 * et sont affichées dans la sidebar sous le menu "Directeur Régional"
 */
const drRoutes: RouteConfig[] = [
  {
    name: 'dr.dashboard',
    path: '/dr/dashboard',
    component: React.lazy(() => import('@/pages/DR/Dashboard')),
    meta: {
      title: 'Tableau de bord',
      icon: 'dashboard',
      roles: ['DR'],
      sidebar: true,
      parent: 'direction_regionale'
    }
  },
  {
    name: 'dr.performance',
    path: '/dr/performance',
    component: React.lazy(() => import('@/Pages/DR/Performance')),
    meta: {
      title: 'Performance régionale',
      icon: 'bar-chart',
      roles: ['DR'],
      sidebar: true,
      parent: 'direction_regionale'
    }
  },
  {
    name: 'dr.teams',
    path: '/dr/teams',
    component: React.lazy(() => import('@/Pages/DR/Teams')),
    meta: {
      title: 'Équipes',
      icon: 'users',
      roles: ['DR'],
      sidebar: true,
      parent: 'direction_regionale'
    }
  }
];

export default drRoutes;
