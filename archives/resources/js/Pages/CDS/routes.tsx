import React from 'react';
import { RouteConfig } from '@/types';

/**
 * Configuration des routes pour le rôle Chef de Secteur (CDS)
 * 
 * Ces routes sont accessibles uniquement pour les utilisateurs avec le rôle CDS
 * et sont affichées dans la sidebar sous le menu "Chef de Secteur"
 */
const cdsRoutes: RouteConfig[] = [
  {
    name: 'cds.dashboard',
    path: '/cds/dashboard',
    component: React.lazy(() => import('@/pages/CDS/Dashboard')),
    meta: {
      title: 'Tableau de bord',
      icon: 'dashboard',
      roles: ['CDS'],
      sidebar: true,
      parent: 'secteur_vente'
    }
  },
  {
    name: 'cds.performance',
    path: '/cds/performance',
    component: React.lazy(() => import('@/pages/CDS/Performance')),
    meta: {
      title: 'Ma performance',
      icon: 'bar-chart',
      roles: ['CDS'],
      sidebar: true,
      parent: 'secteur_vente'
    }
  },
  {
    name: 'cds.objectives',
    path: '/cds/objectives',
    component: React.lazy(() => import('@/pages/CDS/Objectives')),
    meta: {
      title: 'Mes objectifs',
      icon: 'target',
      roles: ['CDS'],
      sidebar: true,
      parent: 'secteur_vente'
    }
  }
];

export default cdsRoutes;
