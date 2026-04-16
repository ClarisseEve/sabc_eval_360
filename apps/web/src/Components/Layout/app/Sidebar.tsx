import React, { useState, useEffect } from 'react';
import { Link } from '@/lib/inertia-shim';
import { LogOut, ChevronDown, ChevronRight, AlignLeft, Menu } from 'lucide-react';
import { cn } from '@/utils/helpers';
import { Button } from '@/Components/UI/Button/Button';
import { NAV_ITEMS, NAV_BOTTOM_ITEMS, resolveHref } from '@/config/nav';
import { normalizeRole, type Role } from '@/config/rbac';

// Types pour les éléments de navigation
interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  isActive?: boolean;
  children?: NavItem[];
  roles?: Role[];
}

// Types pour les propriétés du composant Sidebar
interface SidebarProps {
  user: {
    name: string;
    email: string;
    role: string;
    avatar?: string;
  };
  isCollapsed: boolean;
  onToggle: () => void;
  onLogout?: () => void;
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  user,
  isCollapsed,
  onToggle,
  onLogout,
  className,
}): React.ReactElement => {
  // État pour suivre les éléments de navigation dépliés (tous rétractés par défaut)
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  
  // État pour suivre l'élément actif
  const [activePath, setActivePath] = useState<string>("");
  
  // Détecter le chemin actif
  useEffect(() => {
    const currentPath = globalThis.location.pathname;
    setActivePath(currentPath);
  }, []);

  // Génération des menus depuis la config centrale
  const { mainMenuItems, bottomMenuItems } = React.useMemo(() => {
    const roleCode = normalizeRole(user.role);
    const filterByRole = (items: NavItem[]): NavItem[] =>
      items
        .filter((it) => !it.roles || it.roles.includes(roleCode))
        .map((it) => ({
          ...it,
          href: resolveHref(it.href, roleCode),
          children: it.children ? filterByRole(it.children) : undefined,
        }));

    return {
      mainMenuItems: filterByRole(NAV_ITEMS as NavItem[]),
      bottomMenuItems: filterByRole(NAV_BOTTOM_ITEMS as NavItem[]),
    };
  }, [user.role]);
  
  // Ouvrir automatiquement le parent si un sous-menu est actif
  useEffect(() => {
    const nextExpanded: Record<string, boolean> = {};
    const markParentsWithActiveChild = (items: NavItem[]) => {
      for (const it of items) {
        const hasChildren = it.children && it.children.length > 0;
        const childActive = !!(hasChildren && it.children!.some(
          (c) => activePath === c.href || activePath.startsWith(c.href + "/")
        ));
        // Si un enfant est actif, déplier ce parent
        if (childActive) {
          nextExpanded[it.title] = true;
        }
        // Optionnel: si l'élément lui-même est actif et a des enfants, on peut le garder replié
        if (hasChildren) {
          markParentsWithActiveChild(it.children!);
        }
      }
    };
    markParentsWithActiveChild(mainMenuItems);
    setExpandedItems(nextExpanded);
  }, [activePath, mainMenuItems]);
  
  // Fonction pour basculer l'état déplié d'un élément
  const toggleExpand = (title: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [title]: !prev[title]
    }));
  };

  const getActiveClassName = (hasActiveChild: boolean) =>
    hasActiveChild
      ? "text-sabc-red-primary/80 dark:text-sabc-red-light/80"
      : "text-sabc-gray-800 dark:text-sabc-gray-200";

  const hoverClassName = "hover:bg-sabc-gray-100/50 dark:hover:bg-sabc-gray-800/40 hover:text-sabc-red-primary dark:hover:text-sabc-red-light transition-all duration-150";

  const renderChevron = (expanded: boolean) =>
    expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />;

  const renderCollapsedParent = (item: NavItem, hasActiveChild: boolean) => (
    <button
      type="button"
      className={cn(
        "flex w-full items-center justify-center rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-200 ease-in-out",
        getActiveClassName(hasActiveChild),
        hoverClassName
      )}
      onClick={() => toggleExpand(item.title)}
    >
      {item.icon}
    </button>
  );

  const renderExpandedParent = (item: NavItem, hasActiveChild: boolean, isSectionToggle: boolean, isExpanded: boolean) => (
    <div
      className={cn(
        "flex items-center rounded-md bg-transparent px-3 py-2 text-sm font-medium transition-colors duration-200 ease-in-out",
        getActiveClassName(hasActiveChild),
        hoverClassName
      )}
    >
      {isSectionToggle ? (
        <button
          type="button"
          className="flex w-full items-center justify-between bg-transparent text-inherit focus:outline-none"
          onClick={() => toggleExpand(item.title)}
          aria-expanded={isExpanded}
        >
          <span className="flex items-center">
            {item.icon}
            <span className="ml-2 block whitespace-normal text-left leading-tight">{item.title}</span>
          </span>
          {renderChevron(isExpanded)}
        </button>
      ) : (
        <>
          <Link
            href={item.href}
            className="flex flex-1 items-center text-inherit transition-colors"
          >
            {item.icon}
            <span className="ml-2 block whitespace-normal text-left leading-tight">{item.title}</span>
          </Link>
          <button
            type="button"
            className="ml-2 text-sabc-gray-500 transition-colors hover:text-sabc-red-primary"
            onClick={(e) => {
              e.preventDefault();
              toggleExpand(item.title);
            }}
            aria-label={isExpanded ? `Replier ${item.title}` : `Déplier ${item.title}`}
          >
            {renderChevron(isExpanded)}
          </button>
        </>
      )}
    </div>
  );

  const renderLeafItem = (item: NavItem, isActive: boolean) => (
    <Link
      href={item.href}
      className={cn(
        "flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-200 ease-in-out",
        isCollapsed ? "justify-center" : "justify-start",
        isActive
          ? "text-sabc-red-primary dark:text-sabc-red-light font-semibold"
          : "text-sabc-gray-800 dark:text-sabc-gray-200",
        hoverClassName
      )}
    >
      <span className="flex items-center">
        {item.icon}
        {!isCollapsed && (
          <span className="ml-2 block whitespace-normal text-left leading-tight">{item.title}</span>
        )}
      </span>
    </Link>
  );

  // Fonction pour rendre un élément de navigation
  const renderNavItem = (item: NavItem, level: number = 0): React.ReactElement => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems[item.title] || false;
    const isSectionToggle = hasChildren && (!item.href || item.href === '#');
    const isActive = activePath === item.href || activePath.startsWith(item.href + "/");
    const hasActiveChild = hasChildren && item.children!.some(
      child => activePath === child.href || activePath.startsWith(child.href + "/")
    );

    let content: React.ReactNode;
    if (hasChildren) {
      content = isCollapsed
        ? renderCollapsedParent(item, !!hasActiveChild)
        : renderExpandedParent(item, !!hasActiveChild, !!isSectionToggle, isExpanded);
    } else {
      content = renderLeafItem(item, isActive);
    }

    return (
      <li key={item.title} className={cn(
        "rounded-xl relative",
        (isActive || hasActiveChild) && "bg-sabc-red-primary/8 dark:bg-sabc-red-primary/15"
      )}>
        {(isActive || hasActiveChild) && (
          <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-sabc-red-primary rounded-full" />
        )}
        {content}
        {hasChildren && isExpanded && !isCollapsed && (
          <ul className="ml-4 mt-1 space-y-1 border-l border-sabc-gray-200 pl-4 dark:border-sabc-gray-700">
            {item.children!.map((child) => renderNavItem(child, level + 1))}
          </ul>
        )}
      </li>
    );
  };

  return (
    <aside
      className={cn(
        // Hauteur complète et position sticky pour grands écrans
        "h-screen sticky top-0 flex flex-col bg-white dark:bg-sabc-gray-900 shadow-[1px_0_3px_rgba(0,0,0,0.04)] dark:shadow-[1px_0_3px_rgba(0,0,0,0.2)] transition-all duration-300 ease-in-out",
        isCollapsed ? "w-16" : "w-60",
        className
      )}
    >
      {/* En-tête du sidebar avec logo et bouton toggle */}
      <div className="flex h-16 items-center justify-between border-b border-sabc-gray-200 px-4 dark:border-sabc-gray-800">
        {!isCollapsed && (
          <div className="flex items-center">
            <img 
              src="/images/logos/sabc-logo.png" 
              alt="SABC Logo" 
              className="h-14 w-auto object-contain"
            />
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className={`text-sabc-gray-500 hover:text-sabc-gray-900 dark:text-sabc-gray-400 dark:hover:text-white ${isCollapsed ? 'mx-auto' : ''}`}
          aria-label={isCollapsed ? "Déployer la sidebar" : "Rétracter la sidebar"}
        >
          {isCollapsed ? <Menu className="h-5 w-5 text-sabc-gray-800" /> : <AlignLeft className="h-5 w-5 text-sabc-gray-800" />}
        </Button>
      </div>

      {/* Contenu du sidebar avec scroll */}
      <div className="flex flex-1 flex-col overflow-y-auto">
        {/* Navigation principale */}
        <nav className="flex-1 p-2">
          <ul className="space-y-1">
            {mainMenuItems.map((item) => renderNavItem(item))}
          </ul>
        </nav>

        {/* Menus du bas (Profil et Paramètres) */}
        <div className="p-2 border-t border-sabc-gray-200 dark:border-sabc-gray-800">
          <ul className="space-y-1">
            {bottomMenuItems.map((item) => renderNavItem(item))}
          </ul>
        </div>

        {/* Bouton de déconnexion */}
        <div className="p-4">
          <Button
            variant="ghost"
            className={cn(
              "transition-colors flex items-center",
              isCollapsed 
                ? "w-full justify-center p-2 bg-transparent hover:bg-transparent" 
                : "w-full justify-start p-2 text-sabc-error hover:bg-sabc-gray-100 hover:text-sabc-red-primary dark:hover:bg-transparent dark:hover:text-sabc-red-light"
            )}
            onClick={() => {
              if (onLogout) onLogout();
              localStorage.removeItem('sabc_access_token');
              globalThis.location.href = '/login';
            }}
            type="button"
            title={isCollapsed ? "Déconnexion" : undefined}
          >
            <LogOut 
              className="h-5 w-5"
              style={{
                color: isCollapsed ? "#E53E3E" : "inherit",
                stroke: isCollapsed ? "#E53E3E" : "currentColor", 
                strokeWidth: isCollapsed ? 2.5 : 2,
                filter: isCollapsed ? "drop-shadow(0 0 3px rgba(229, 62, 62, 0.7))" : "none"
              }}
            />
            {!isCollapsed && <span className="ml-2">Déconnexion</span>}
          </Button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
