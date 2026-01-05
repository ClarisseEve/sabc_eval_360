import React from 'react';
import { RouteConfig } from '@/types';

/**
 * Configuration des routes pour le rôle Regional Trade Marketing (RTM)
 * 
 * Ces routes sont accessibles uniquement pour les utilisateurs avec le rôle RTM
 * et sont affichées dans la sidebar sous le menu "Regional Trade Marketing"
 */
const rtmRoutes: RouteConfig[] = [
  {
    name: 'rtm.dashboard',
    path: '/rtm/dashboard',
    component: React.lazy(() => import('@/pages/RTM/Dashboard')),
    meta: {
      title: 'Tableau de bord',
      icon: 'dashboard',
      roles: ['RTM'],
      sidebar: true,
      parent: 'trade_marketing'
    }
  },
  {
    name: 'rtm.campaigns',
    path: '/rtm/campaigns',
    component: React.lazy(() => import('@/pages/RTM/Campaigns')),
    meta: {
      title: 'Campagnes marketing',
      icon: 'trending-up',
      roles: ['RTM'],
      sidebar: true,
      parent: 'trade_marketing'
    }
  },
  {
    name: 'rtm.operators',
    path: '/rtm/operators',
    component: React.lazy(() => import('@/pages/RTM/Operators')),
    meta: {
      title: 'Opérateurs marketing',
      icon: 'users',
      roles: ['RTM'],
      sidebar: true,
      parent: 'trade_marketing'
    }
  }
];

export default rtmRoutes;
