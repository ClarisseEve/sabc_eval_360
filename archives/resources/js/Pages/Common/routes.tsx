import React from 'react';
import { RouteConfig } from '@/types';

/**
 * Configuration des routes communes à tous les rôles
 * 
 * Ces routes sont accessibles par tous les utilisateurs indépendamment de leur rôle
 */
const commonRoutes: RouteConfig[] = [
  {
    name: 'profile',
    path: '/profile',
    component: React.lazy(() => import('@/Pages/Common/Profile')),
    meta: {
      title: 'Mon profil',
      icon: 'user',
      roles: ['*'],
      sidebar: true
    }
  },
  
  {
    name: 'evaluations',
    path: '/evaluations',
    component: React.lazy(() => import('@/Pages/Common/Evaluations')),
    meta: {
      title: 'Mes évaluations',
      icon: 'clipboard',
      roles: ['*'],
      sidebar: true
    }
  },
  
  {
    name: 'settings',
    path: '/settings',
    component: React.lazy(() => import('@/Pages/Common/Settings')),
    meta: {
      title: 'Paramètres',
      icon: 'settings',
      roles: ['*'],
      sidebar: true
    }
  },
];

export default commonRoutes;
