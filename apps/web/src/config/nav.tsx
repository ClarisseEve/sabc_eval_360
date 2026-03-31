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
  Bell,
  User,
} from 'lucide-react';
import type { Role } from './rbac';

export interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  children?: NavItem[];
  roles?: Role[];
  badge?: 'notifications';
}

// Roles that have subordinates (can see "Mon équipe") — NOT CDS/AS
const ROLES_WITH_SUBS: Role[] = ['DR', 'CDTT', 'CSC', 'RTM', 'SRMO', 'CDV', 'TMO', 'SS'];
// Roles that can see analytics
const ROLES_WITH_ANALYTICS: Role[] = ['ADMIN', 'DR', 'CDTT'];
// All non-admin roles
const ALL_OPERATIONAL: Role[] = ['DR', 'CDTT', 'CSC', 'RTM', 'SRMO', 'CDV', 'TMO', 'CDS', 'SS', 'AS'];

export const NAV_ITEMS: NavItem[] = [
  {
    title: 'Tableau de bord',
    href: '/:role/dashboard',
    icon: <Home className="h-5 w-5" />,
  },

  // ── Évaluations ──
  {
    title: 'Évaluations',
    href: '#',
    icon: <ClipboardList className="h-5 w-5" />,
    children: [
      {
        title: 'Mes évaluations',
        href: '/evaluations/mine',
        icon: <ChevronRight className="h-4 w-4" />,
        roles: ALL_OPERATIONAL,
      },
      {
        title: 'À compléter',
        href: '/evaluations/pending',
        icon: <ChevronRight className="h-4 w-4" />,
        roles: ALL_OPERATIONAL,
        badge: 'notifications',
      },
      {
        title: 'À valider',
        href: '/evaluations/validate',
        icon: <ChevronRight className="h-4 w-4" />,
        roles: ROLES_WITH_SUBS,
        badge: 'notifications',
      },
      {
        title: 'Historique',
        href: '/evaluations/history',
        icon: <ChevronRight className="h-4 w-4" />,
        roles: ALL_OPERATIONAL,
      },
      {
        title: 'Gestion globale',
        href: '/admin/evaluations/management',
        icon: <ChevronRight className="h-4 w-4" />,
        roles: ['ADMIN'],
      },
      {
        title: 'Périodes',
        href: '/admin/evaluations/periodes',
        icon: <ChevronRight className="h-4 w-4" />,
        roles: ['ADMIN'],
      },
      {
        title: 'Règles',
        href: '/admin/evaluations/regles',
        icon: <ChevronRight className="h-4 w-4" />,
        roles: ['ADMIN'],
      },
    ],
  },

  // ── Mon équipe (only roles with subordinates — NOT CDS/AS) ──
  {
    title: 'Mon équipe',
    href: '#',
    icon: <Users className="h-5 w-5" />,
    roles: ROLES_WITH_SUBS,
    children: [
      {
        title: 'Subordonnés',
        href: '/equipe/subordonnes',
        icon: <ChevronRight className="h-4 w-4" />,
      },
      {
        title: 'Évaluations équipe',
        href: '/equipe/evaluations',
        icon: <ChevronRight className="h-4 w-4" />,
      },
    ],
  },

  // ── Analytics (ADMIN + DR + CDTT) ──
  {
    title: 'Analytics',
    href: '#',
    icon: <BarChart2 className="h-5 w-5" />,
    roles: ROLES_WITH_ANALYTICS,
    children: [
      {
        title: 'Vue d\'ensemble',
        href: '/analytics/dashboard',
        icon: <ChevronRight className="h-4 w-4" />,
      },
      {
        title: 'Par région',
        href: '/analytics/regions',
        icon: <ChevronRight className="h-4 w-4" />,
        roles: ['ADMIN', 'DR'],
      },
      {
        title: 'Anomalies',
        href: '/analytics/anomalies',
        icon: <ChevronRight className="h-4 w-4" />,
        roles: ['ADMIN'],
      },
    ],
  },

  // ── Admin: Utilisateurs ──
  {
    title: 'Utilisateurs',
    href: '#',
    icon: <Users className="h-5 w-5" />,
    roles: ['ADMIN'],
    children: [
      {
        title: 'Liste',
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

  // ── Admin: Notifications ──
  {
    title: 'Notifications',
    href: '#',
    icon: <Bell className="h-5 w-5" />,
    roles: ['ADMIN'],
    children: [
      {
        title: 'Envoyer',
        href: '/admin/notifications/send',
        icon: <ChevronRight className="h-4 w-4" />,
      },
      {
        title: 'Historique',
        href: '/admin/notifications/history',
        icon: <ChevronRight className="h-4 w-4" />,
      },
    ],
  },

  // ── Admin: Remplacements ──
  {
    title: 'Remplacements',
    href: '/admin/remplacements',
    icon: <UserCheck className="h-5 w-5" />,
    roles: ['ADMIN'],
  },

  // ── Admin: Rôles ──
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

  // ── Admin: Structure ──
  {
    title: 'Structure',
    href: '#',
    icon: <Building className="h-5 w-5" />,
    roles: ['ADMIN'],
    children: [
      {
        title: 'Régions',
        href: '/admin/structure/regions',
        icon: <MapPin className="h-4 w-4" />,
      },
      {
        title: 'Services',
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
];

export const NAV_BOTTOM_ITEMS: NavItem[] = [
  {
    title: 'Mon profil',
    href: '/settings/profile',
    icon: <User className="h-5 w-5" />,
  },
  {
    title: 'Paramètres',
    href: '/settings/password',
    icon: <Settings className="h-5 w-5" />,
  },
];

export function resolveHref(href: string, roleCode: string) {
  return href.replace(':role', roleCode.toLowerCase());
}
