import React from 'react';

// Définition de l'interface RouteConfig pour corriger l'erreur de lint
interface RouteConfig {
  name: string;
  path: string;
  component: React.LazyExoticComponent<React.ComponentType<any>>;
  meta: {
    title: string;
    icon: string;
    roles: string[];
    sidebar: boolean;
    parent?: string;
  };
}

/**
 * Configuration des routes pour le rôle Chef Service Commercial (CSC)
 * 
 * Ces routes sont accessibles uniquement pour les utilisateurs avec le rôle CSC
 * et sont affichées dans la sidebar sous le menu "Chef Service Commercial"
 */
const cscRoutes: RouteConfig[] = [
  {
    name: 'csc.dashboard',
    path: '/csc/dashboard',
    component: React.lazy(() => import('./Dashboard')),
    meta: {
      title: 'Tableau de bord',
      icon: 'dashboard',
      roles: ['CSC'],
      sidebar: true,
      parent: 'service_commercial'
    }
  },
  {
    name: 'csc.performance',
    path: '/csc/performance',
    component: React.lazy(() => import('./Performance/index')),
    meta: {
      title: 'Performance équipe',
      icon: 'bar-chart',
      roles: ['CSC'],
      sidebar: true,
      parent: 'service_commercial'
    }
  },
  {
    name: 'csc.districts',
    path: '/csc/districts',
    component: React.lazy(() => import('./Districts/index')),
    meta: {
      title: 'Districts de vente',
      icon: 'map-pin',
      roles: ['CSC'],
      sidebar: true,
      parent: 'service_commercial'
    }
  }
];

export default cscRoutes;
