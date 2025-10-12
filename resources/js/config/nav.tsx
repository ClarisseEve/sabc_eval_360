import React from 'react';
import {
  Home,
  ClipboardList,
  BarChart2,
  ChevronRight,
  Users,
  Settings,
  UserCheck,
  Shield,
  Building,
  MapPin,
  Briefcase,
  Map,
  Target,
} from 'lucide-react';
import type { Role } from './rbac';

export interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  children?: NavItem[];
  roles?: Role[]; // undefined => visible à tous
}

export const NAV_ITEMS: NavItem[] = [
  {
    title: 'Tableau de bord',
    href: '/:role/dashboard', // placeholder :role remplacé au rendu
    icon: <Home className="h-5 w-5" />,
  },
  {
    title: 'Évaluations',
    href: '#',
    icon: <ClipboardList className="h-5 w-5" />,
    children: [
      {
        title: 'Mes évaluations',
        href: '/common/evaluations/mine',
        icon: <ChevronRight className="h-4 w-4" />,
        roles: ['DR', 'CDTT', 'CSC', 'RTM', 'SRMO', 'CDV', 'TMO', 'CDS', 'SS', 'AS'],
      },
      {
        title: 'À compléter',
        href: '/common/evaluations/pending',
        icon: <ChevronRight className="h-4 w-4" />,
        roles: ['DR', 'CDTT', 'CSC', 'RTM', 'SRMO', 'CDV', 'TMO', 'CDS', 'SS', 'AS'],
      },
      {
        title: 'Gestion globale',
        href: '/admin/evaluations/management',
        icon: <ChevronRight className="h-4 w-4" />,
        roles: ['ADMIN'],
      },
      {
        title: 'Templates',
        href: '/admin/evaluations/templates',
        icon: <ChevronRight className="h-4 w-4" />,
        roles: ['ADMIN'],
      },
      {
        title: 'Périodes d\'évaluation',
        href: '/admin/evaluations/periodes',
        icon: <ChevronRight className="h-4 w-4" />,
        roles: ['ADMIN'],
      },
      {
        title: 'Historique',
        href: '/admin/evaluations/history',
        icon: <ChevronRight className="h-4 w-4" />,
        roles: ['ADMIN'],
      },
    ],
  },
  {
    title: 'Utilisateurs',
    href: '#',
    icon: <Users className="h-5 w-5" />,
    roles: ['ADMIN'],
    children: [
      {
        title: 'Gestion des utilisateurs',
        href: '/admin/utilisateurs',
        icon: <ChevronRight className="h-4 w-4" />,
      },
      {
        title: 'Gaps d\'évaluation',
        href: '/admin/utilisateurs/gaps',
        icon: <ChevronRight className="h-4 w-4" />,
      },
    ],
  },
  {
    title: 'Remplacements',
    href: '#',
    icon: <UserCheck className="h-5 w-5" />,
    roles: ['ADMIN'],
    children: [
      {
        title: 'Gestion des remplacements',
        href: '/admin/remplacements',
        icon: <ChevronRight className="h-4 w-4" />,
      },
      {
        title: 'Créer un remplacement',
        href: '/admin/remplacements/create',
        icon: <ChevronRight className="h-4 w-4" />,
      },
    ],
  },
  {
    title: 'Rôles',
    href: '#',
    icon: <Shield className="h-5 w-5" />,
    roles: ['ADMIN'],
    children: [
      {
        title: 'Gestion des rôles',
        href: '/admin/roles',
        icon: <ChevronRight className="h-4 w-4" />,
      },
      {
        title: 'Permissions',
        href: '/admin/roles/permissions',
        icon: <ChevronRight className="h-4 w-4" />,
      },
    ],
  },
  {
    title: 'Structure Organisationnelle',
    href: '/admin/structure',
    icon: <Building className="h-5 w-5" />,
    roles: ['ADMIN'],
    children: [
      {
        title: 'Vue globale',
        href: '/admin/structure',
        icon: <ChevronRight className="h-4 w-4" />,
      },
      {
        title: 'Régions',
        href: '/admin/structure/regions',
        icon: <MapPin className="h-4 w-4" />,
      },
      {
        title: 'Services Commerciaux',
        href: '/admin/structure/services',
        icon: <Briefcase className="h-4 w-4" />,
      },
      {
        title: 'Districts',
        href: '/admin/structure/districts',
        icon: <Map className="h-4 w-4" />,
      },
      {
        title: 'Secteurs',
        href: '/admin/structure/secteurs',
        icon: <Target className="h-4 w-4" />,
      },
    ],
  },
  {
    title: 'Mon équipe',
    href: '/common/team',
    icon: <Users className="h-5 w-5" />,
    roles: ['DR', 'CDTT', 'CSC', 'RTM', 'SRMO', 'CDV', 'TMO', 'CDS', 'SS', 'AS'],
    children: [
      {
        title: 'Vue d\'équipe',
        href: '/common/team/overview',
        icon: <ChevronRight className="h-4 w-4" />,
      },
      {
        title: 'Évaluations équipe',
        href: '/common/team/evaluations',
        icon: <ChevronRight className="h-4 w-4" />,
      },
    ],
  },
  {
    title: 'Analytics',
    href: '/admin/analytics',
    icon: <BarChart2 className="h-5 w-5" />,
    roles: ['ADMIN'],
  },
];

export const NAV_BOTTOM_ITEMS: NavItem[] = [
  { title: 'Profil', href: '/common/profile', icon: <Users className="h-5 w-5" /> },
  {
    title: 'Paramètres',
    href: '/common/settings',
    icon: <Settings className="h-5 w-5" />,
    roles: ['ADMIN'],
    children: [
      { title: 'Utilisateurs', href: '/admin/users', icon: <ChevronRight className="h-4 w-4" /> },
      { title: 'Régions', href: '/admin/regions', icon: <ChevronRight className="h-4 w-4" /> },
      { title: 'Rôles', href: '/admin/roles', icon: <ChevronRight className="h-4 w-4" /> },
      { title: 'Remplacements', href: '/admin/remplacements', icon: <ChevronRight className="h-4 w-4" /> },
    ],
  },
];

export function resolveHref(href: string, roleCode: string) {
  return href.replace(':role', roleCode.toLowerCase());
}
