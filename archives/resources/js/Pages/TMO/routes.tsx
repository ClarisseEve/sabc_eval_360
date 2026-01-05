import React from 'react';
import { RouteConfig } from '@/types';

/**
 * Configuration des routes pour le rôle Trade Marketing Operator (TMO)
 * 
 * Ces routes sont accessibles uniquement pour les utilisateurs avec le rôle TMO
 * et sont affichées dans la sidebar sous le menu "Trade Marketing Operator"
 */
const tmoRoutes: RouteConfig[] = [
  {
    name: 'tmo.dashboard',
    path: '/tmo/dashboard',
    component: React.lazy(() => import('@/pages/TMO/Dashboard')),
    meta: {
      title: 'Tableau de bord',
      icon: 'dashboard',
      roles: ['TMO'],
      sidebar: true,
      parent: 'trade_marketing_operator'
    }
  },
  {
    name: 'tmo.activities',
    path: '/tmo/activities',
    component: React.lazy(() => import('@/pages/TMO/Activities')),
    meta: {
      title: 'Mes activités',
      icon: 'activity',
      roles: ['TMO'],
      sidebar: true,
      parent: 'trade_marketing_operator'
    }
  },
  {
    name: 'tmo.performance',
    path: '/tmo/performance',
    component: React.lazy(() => import('@/pages/TMO/Performance')),
    meta: {
      title: 'Ma performance',
      icon: 'bar-chart',
      roles: ['TMO'],
      sidebar: true,
      parent: 'trade_marketing_operator'
    }
  }
];

export default tmoRoutes;
