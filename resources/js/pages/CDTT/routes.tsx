import React from 'react';
import { RouteConfig } from '@/types';

/**
 * Configuration des routes pour le rôle Chef Département Trade (CDTT)
 * 
 * Ces routes sont accessibles uniquement pour les utilisateurs avec le rôle CDTT
 * et sont affichées dans la sidebar sous le menu "Chef Département Trade"
 */
const cdttRoutes: RouteConfig[] = [
  {
    name: 'cdtt.dashboard',
    path: '/cdtt/dashboard',
    component: React.lazy(() => import('@/pages/CDTT/Dashboard')),
    meta: {
      title: 'Tableau de bord',
      icon: 'dashboard',
      roles: ['CDTT'],
      sidebar: true,
      parent: 'departement_trade'
    }
  },
  {
    name: 'cdtt.commercial',
    path: '/cdtt/commercial',
    component: React.lazy(() => import('@/Pages/CDTT/Commercial')),
    meta: {
      title: 'Branche commerciale',
      icon: 'shopping-bag',
      roles: ['CDTT'],
      sidebar: true,
      parent: 'departement_trade'
    }
  },
  {
    name: 'cdtt.marketing',
    path: '/cdtt/marketing',
    component: React.lazy(() => import('@/Pages/CDTT/Marketing')),
    meta: {
      title: 'Branche marketing',
      icon: 'trending-up',
      roles: ['CDTT'],
      sidebar: true,
      parent: 'departement_trade'
    }
  }
];

export default cdttRoutes;
