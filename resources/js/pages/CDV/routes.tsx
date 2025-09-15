import React from 'react';
import { RouteConfig } from '@/types';

/**
 * Configuration des routes pour le rôle Chef District Vente (CDV)
 * 
 * Ces routes sont accessibles uniquement pour les utilisateurs avec le rôle CDV
 * et sont affichées dans la sidebar sous le menu "Chef District Vente"
 */
const cdvRoutes: RouteConfig[] = [
  {
    name: 'cdv.dashboard',
    path: '/cdv/dashboard',
    component: React.lazy(() => import('@/pages/CDV/Dashboard')),
    meta: {
      title: 'Tableau de bord',
      icon: 'dashboard',
      roles: ['CDV'],
      sidebar: true,
      parent: 'district_vente'
    }
  },
  {
    name: 'cdv.performance',
    path: '/cdv/performance',
    component: React.lazy(() => import('@/Pages/CDV/Performance')),
    meta: {
      title: 'Performance district',
      icon: 'bar-chart',
      roles: ['CDV'],
      sidebar: true,
      parent: 'district_vente'
    }
  },
  {
    name: 'cdv.sectors',
    path: '/cdv/sectors',
    component: React.lazy(() => import('@/Pages/CDV/Sectors')),
    meta: {
      title: 'Secteurs',
      icon: 'map',
      roles: ['CDV'],
      sidebar: true,
      parent: 'district_vente'
    }
  }
];

export default cdvRoutes;
