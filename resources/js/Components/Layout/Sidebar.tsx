import * as React from 'react';
import { 
  Home, 
  ClipboardList, 
  BarChart2, 
  Users, 
  Settings, 
  LogOut, 
  ChevronDown,
  ChevronRight,
  Menu,
  X
} from 'lucide-react';
import { cn } from '@/utils/helpers';
import { Button } from '@/Components/UI/Button/Button';
import { Avatar } from '@/Components/UI/Avatar/Avatar';

// Types pour les éléments de navigation
export interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  isActive?: boolean;
  children?: NavItem[];
  roles?: string[];
}

// Types pour les propriétés du composant Sidebar
export interface SidebarProps {
  user: {
    name: string;
    email: string;
    role: string;
    avatar?: string;
  };
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  user,
  isOpen,
  onClose,
  onLogout,
  className,
}) => {
  // État pour suivre les éléments de navigation dépliés
  const [expandedItems, setExpandedItems] = React.useState<Record<string, boolean>>({});
  
  // Fonction pour basculer l'état déplié d'un élément
  const toggleExpand = (title: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [title]: !prev[title]
    }));
  };
  
  // Éléments de navigation en fonction du rôle de l'utilisateur
  const navItems = React.useMemo(() => {
    // Éléments de navigation communs à tous les rôles
    const commonItems: NavItem[] = [
      {
        title: 'Tableau de bord',
        href: '/dashboard',
        icon: <Home className="h-5 w-5" />,
        isActive: true,
      },
      {
        title: 'Évaluations',
        href: '/evaluations',
        icon: <ClipboardList className="h-5 w-5" />,
        children: [
          {
            title: 'Mes évaluations',
            href: '/evaluations/mine',
            icon: <ChevronRight className="h-4 w-4" />,
          },
          {
            title: 'À compléter',
            href: '/evaluations/pending',
            icon: <ChevronRight className="h-4 w-4" />,
          },
          {
            title: 'Historique',
            href: '/evaluations/history',
            icon: <ChevronRight className="h-4 w-4" />,
          },
        ],
      },
    ];
    
    // Éléments de navigation spécifiques aux rôles
    const roleSpecificItems: Record<string, NavItem[]> = {
      'DR': [ // Directeur Régional
        {
          title: 'Analytics',
          href: '/analytics',
          icon: <BarChart2 className="h-5 w-5" />,
          children: [
            {
              title: 'Vue d\'ensemble',
              href: '/analytics/overview',
              icon: <ChevronRight className="h-4 w-4" />,
            },
            {
              title: 'Performance par département',
              href: '/analytics/departments',
              icon: <ChevronRight className="h-4 w-4" />,
            },
            {
              title: 'Rapports',
              href: '/analytics/reports',
              icon: <ChevronRight className="h-4 w-4" />,
            },
          ],
        },
        {
          title: 'Équipes',
          href: '/teams',
          icon: <Users className="h-5 w-5" />,
        },
      ],
      'CDTT': [ // Chef de Département Tanière Territoriale
        {
          title: 'Analytics',
          href: '/analytics',
          icon: <BarChart2 className="h-5 w-5" />,
          children: [
            {
              title: 'Vue d\'ensemble',
              href: '/analytics/overview',
              icon: <ChevronRight className="h-4 w-4" />,
            },
            {
              title: 'Performance par équipe',
              href: '/analytics/teams',
              icon: <ChevronRight className="h-4 w-4" />,
            },
          ],
        },
        {
          title: 'Équipes',
          href: '/teams',
          icon: <Users className="h-5 w-5" />,
        },
      ],
      'CSC': [ // Chef de Service Commercial
        {
          title: 'Analytics',
          href: '/analytics/team',
          icon: <BarChart2 className="h-5 w-5" />,
        },
        {
          title: 'Mon équipe',
          href: '/team',
          icon: <Users className="h-5 w-5" />,
        },
      ],
      'RTM': [ // Responsable Territorial Marketing
        {
          title: 'Analytics',
          href: '/analytics/team',
          icon: <BarChart2 className="h-5 w-5" />,
        },
        {
          title: 'Mon équipe',
          href: '/team',
          icon: <Users className="h-5 w-5" />,
        },
      ],
    };
    
    // Déterminer les éléments de navigation en fonction du rôle
    const roleItems = roleSpecificItems[user.role] || [];
    
    // Éléments de paramètres communs à tous les rôles
    const settingsItem: NavItem = {
      title: 'Paramètres',
      href: '/settings',
      icon: <Settings className="h-5 w-5" />,
      children: [
        {
          title: 'Profil',
          href: '/settings/profile',
          icon: <ChevronRight className="h-4 w-4" />,
        },
        {
          title: 'Mot de passe',
          href: '/settings/password',
          icon: <ChevronRight className="h-4 w-4" />,
        },
        {
          title: 'Apparence',
          href: '/settings/appearance',
          icon: <ChevronRight className="h-4 w-4" />,
        },
      ],
    };
    
    return [...commonItems, ...roleItems, settingsItem];
  }, [user.role]);
  
  // Rendu d'un élément de navigation
  const renderNavItem = (item: NavItem, level = 0) => {
    const isExpanded = expandedItems[item.title] || false;
    const hasChildren = item.children && item.children.length > 0;
    
    return (
      <li key={item.title}>
        <a
          href={item.href}
          className={cn(
            "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
            item.isActive
              ? "bg-sabc-red-primary text-white"
              : "text-sabc-gray-700 hover:bg-sabc-gray-100 hover:text-sabc-gray-900 dark:text-sabc-gray-300 dark:hover:bg-sabc-gray-800 dark:hover:text-white",
            level > 0 && "ml-4"
          )}
          onClick={(e) => {
            if (hasChildren) {
              e.preventDefault();
              toggleExpand(item.title);
            }
          }}
        >
          <span className="mr-2">{item.icon}</span>
          <span className="flex-1">{item.title}</span>
          {hasChildren && (
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform",
                isExpanded && "rotate-180"
              )}
            />
          )}
        </a>
        
        {hasChildren && isExpanded && (
          <ul className="mt-1 space-y-1 pl-2">
            {item.children!.map(child => renderNavItem(child, level + 1))}
          </ul>
        )}
      </li>
    );
  };
  
  return (
    <>
      {/* Overlay pour mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-sabc-gray-200 bg-white transition-transform dark:border-sabc-gray-800 dark:bg-sabc-gray-900 lg:static lg:z-auto",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          className
        )}
      >
        {/* En-tête du sidebar */}
        <div className="flex h-16 items-center justify-between border-b border-sabc-gray-200 px-4 dark:border-sabc-gray-800">
          <div className="flex items-center">
            <div className="mr-2 h-8 w-8 rounded-md bg-sabc-red-primary"></div>
            <span className="text-lg font-bold text-sabc-gray-900 dark:text-white">
              SABC Eval360
            </span>
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onClose}
            aria-label="Fermer le menu"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        {/* Contenu du sidebar */}
        <div className="flex flex-1 flex-col overflow-y-auto">
          {/* Profil utilisateur */}
          <div className="border-b border-sabc-gray-200 p-4 dark:border-sabc-gray-800">
            <div className="flex items-center">
              <Avatar
                name={user.name}
                src={user.avatar}
                size="lg"
              />
              <div className="ml-3">
                <p className="font-medium text-sabc-gray-900 dark:text-white">
                  {user.name}
                </p>
                <p className="text-xs text-sabc-gray-500 dark:text-sabc-gray-400">
                  {user.role}
                </p>
              </div>
            </div>
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 p-4">
            <ul className="space-y-1">
              {navItems.map(item => renderNavItem(item))}
            </ul>
          </nav>
          
          {/* Pied du sidebar */}
          <div className="border-t border-sabc-gray-200 p-4 dark:border-sabc-gray-800">
            <Button
              variant="ghost"
              className="w-full justify-start text-sabc-error hover:bg-sabc-error/10"
              onClick={onLogout}
            >
              <LogOut className="mr-2 h-5 w-5" />
              Déconnexion
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
