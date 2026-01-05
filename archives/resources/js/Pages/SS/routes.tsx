import React from 'react';
import { RouteConfig } from '@/types';

/**
 * Configuration des routes pour le rôle Superviseur Sponsoring (SS)
 * 
 * Ces routes sont accessibles uniquement pour les utilisateurs avec le rôle SS
 * et sont affichées dans la sidebar sous le menu "Superviseur Sponsoring"
 */
const ssRoutes: RouteConfig[] = [
  {
    name: 'ss.dashboard',
    path: '/ss/dashboard',
    component: React.lazy(() => import('@/pages/SS/Dashboard')),
    meta: {
      title: 'Tableau de bord',
      icon: 'dashboard',
      roles: ['SS'],
      sidebar: true,
      parent: 'sponsoring'
    }
  },
  {
    name: 'ss.events',
    path: '/ss/events',
    component: React.lazy(() => import('@/pages/SS/Events')),
    meta: {
      title: 'Événements',
      icon: 'calendar',
      roles: ['SS'],
      sidebar: true,
      parent: 'sponsoring'
    }
  },
  {
    name: 'ss.assistants',
    path: '/ss/assistants',
    component: React.lazy(() => import('@/pages/SS/Assistants')),
    meta: {
      title: 'Assistants',
      icon: 'users',
      roles: ['SS'],
      sidebar: true,
      parent: 'sponsoring'
    }
  }
];

export default ssRoutes;
