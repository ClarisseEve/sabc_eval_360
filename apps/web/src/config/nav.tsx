import React from 'react';
import {
  Home,
  ClipboardList,
  BarChart2,
  Users,
  UserCheck,
  Shield,
  Building,
  Target,
  FileText,
} from 'lucide-react';
import type { Role } from './rbac';

export interface NavItem {
  title: string;
  href: string;
  icon?: React.ReactNode;
  children?: NavItem[];
  roles?: Role[];
  badge?: 'notifications';
  requiresDirectReports?: boolean;
  requiresValidationAccess?: boolean;
}

// All non-admin roles
const ALL_OPERATIONAL: Role[] = ['DR', 'CDTT', 'CSC', 'RTM', 'SRMO', 'CDV', 'TMO', 'CDS', 'SS', 'AS'];
const ALL_WITH_ADMIN: Role[] = ['ADMIN', ...ALL_OPERATIONAL];
// Premier filtre d'affichage ; la sidebar confirme ensuite la présence réelle
// de subordonnés directs auprès de l'API avant d'afficher ces parcours.
const ROLES_WITH_POTENTIAL_REPORTS: Role[] = ['DR', 'CDTT', 'CSC', 'RTM', 'SRMO', 'CDV', 'TMO', 'SS'];
export const VALIDATION_QUEUE_ROLES: Role[] = [...ROLES_WITH_POTENTIAL_REPORTS, 'CDS'];

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
        roles: ALL_WITH_ADMIN,
      },
      {
        title: 'À compléter',
        href: '/evaluations/pending',
        roles: ALL_WITH_ADMIN,
        badge: 'notifications',
      },
      {
        title: 'À valider',
        href: '/evaluations/validate',
        roles: VALIDATION_QUEUE_ROLES,
        requiresValidationAccess: true,
        badge: 'notifications',
      },
      {
        title: 'Historique',
        href: '/evaluations/historique',
        roles: ALL_WITH_ADMIN,
      },
      {
        title: 'Mes fiches de notation',
        href: '/evaluations/fiches',
        roles: ALL_WITH_ADMIN,
      },
      {
        title: 'Gestion globale',
        href: '/admin/evaluations/management',
        roles: ['ADMIN'],
      },
      {
        title: 'Périodes',
        href: '/admin/evaluations/periodes',
        roles: ['ADMIN'],
      },
      {
        title: 'Fiches de notation',
        href: '/admin/evaluations/fiches',
        roles: ['ADMIN'],
      },
      {
        title: 'Règles',
        href: '/admin/evaluations/regles',
        roles: ['ADMIN'],
      },
      {
        title: 'Modèles',
        href: '/admin/evaluations/templates',
        roles: ['ADMIN'],
      },
    ],
  },

  // ── Mon équipe (affiché seulement si l'API retourne des subordonnés directs) ──
  {
    title: 'Mon équipe',
    href: '#',
    icon: <Users className="h-5 w-5" />,
    roles: ROLES_WITH_POTENTIAL_REPORTS,
    requiresDirectReports: true,
    children: [
      {
        title: 'Subordonnés',
        href: '/equipe/subordonnes',
      },
      {
        title: 'Évaluations équipe',
        href: '/equipe/evaluations',
      },
    ],
  },

  // ── Analytics (ADMIN uniquement — les managers ont leurs analyses région/équipe dans leur Tableau de bord) ──
  {
    title: 'Analyses',
    href: '#',
    icon: <BarChart2 className="h-5 w-5" />,
    roles: ['ADMIN'],
    children: [
      {
        title: "Vue d'ensemble",
        href: '/admin/analytics?tab=overview',
      },
      {
        title: 'Par région',
        href: '/admin/analytics?tab=regions',
      },
      {
        title: 'Par rôle',
        href: '/admin/analytics?tab=roles',
      },
      {
        title: 'Anomalies',
        href: '/admin/analytics?tab=anomalies',
      },
      {
        title: 'Recherche individuelle',
        href: '/admin/analytics?tab=individual',
      },
      {
        title: 'Plans d\'amélioration',
        href: '/admin/analytics?tab=improvement',
      },
      {
        title: 'Tendances',
        href: '/admin/analytics?tab=tendances',
      },
    ],
  },

  {
    title: 'Axes d’amélioration',
    href: '/axes-amelioration',
    icon: <Target className="h-5 w-5" />,
    roles: ALL_WITH_ADMIN,
  },

  {
    title: 'Rapports',
    href: '/admin/reports',
    icon: <FileText className="h-5 w-5" />,
    roles: ['ADMIN'],
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
      },
      {
        title: 'Gaps d\'évaluation',
        href: '/admin/utilisateurs/gaps',
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
    href: '/admin/roles',
    icon: <Shield className="h-5 w-5" />,
    roles: ['ADMIN'],
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
      },
      {
        title: 'Services commerciaux',
        href: '/admin/structure/services',
      },
      {
        title: 'Districts',
        href: '/admin/structure/districts',
      },
      {
        title: 'Secteurs',
        href: '/admin/structure/secteurs',
      },
    ],
  },
];

export function resolveHref(href: string, roleCode: string) {
  return href.replace(':role', roleCode.toLowerCase());
}
