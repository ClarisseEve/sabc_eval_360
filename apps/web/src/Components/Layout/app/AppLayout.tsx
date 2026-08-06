import * as React from 'react';
import { cn, humanizeDisplayText } from '@/utils/helpers';
import { Header } from '@/Components/Layout/app/Header';
import { Sidebar } from '@/Components/Layout/app/Sidebar';
// Suppression de l'import des breadcrumbs

export interface AppLayoutProps {
  user?: {
    name?: string;
    email?: string;
    role?: string;
    avatar?: string;
  };
  notifications?: {
    id: string;
    title: string;
    message: string;
    status: 'info' | 'warning' | 'error' | 'success';
    read: boolean;
    createdAt: string;
    link?: string;
  }[];
  pageTitle?: string;
  isAdmin?: boolean;
  permissions?: string[];
  onLogout?: () => void | Promise<void>;
  children: React.ReactNode;
  className?: string;
  breadcrumbs?: Array<{ title: string; href?: string }>;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  user,
  notifications = [],
  pageTitle = 'Tableau de bord',
  onLogout,
  children,
  className,
}) => {
  const resolvedUser = {
    name: humanizeDisplayText(user?.name) || 'Utilisateur',
    email: user?.email || '',
    role: user?.role || '',
    avatar: user?.avatar,
  };

  // La réduction desktop et l'ouverture du drawer mobile sont deux états
  // distincts : fermer le menu mobile ne doit pas modifier le choix desktop.
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = React.useState(false);

  const toggleSidebar = React.useCallback(() => {
    setSidebarCollapsed((collapsed) => !collapsed);
  }, []);

  const openMobileSidebar = React.useCallback(() => {
    // Un drawer mobile doit toujours afficher ses libellés.
    setSidebarCollapsed(false);
    setMobileSidebarOpen(true);
  }, []);

  const closeMobileSidebar = React.useCallback(() => {
    setMobileSidebarOpen(false);
  }, []);

  React.useEffect(() => {
    if (!mobileSidebarOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleDrawerKeyboard = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeMobileSidebar();
        return;
      }
      if (event.key !== 'Tab') return;

      const drawer = document.getElementById('app-sidebar');
      if (!drawer) return;
      const focusable = Array.from(
        drawer.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => element.offsetParent !== null);
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const activeElement = document.activeElement;
      if (event.shiftKey && (activeElement === first || !drawer.contains(activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleDrawerKeyboard);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleDrawerKeyboard);
    };
  }, [closeMobileSidebar, mobileSidebarOpen]);

  return (
    <div className="flex h-dvh w-full max-w-full overflow-hidden bg-sabc-gray-50 dark:bg-sabc-gray-900">
      <Sidebar
        user={resolvedUser as { name: string; email: string; role: string; avatar?: string }}
        isCollapsed={sidebarCollapsed}
        onToggle={toggleSidebar}
        isMobileOpen={mobileSidebarOpen}
        onMobileClose={closeMobileSidebar}
      />

      {mobileSidebarOpen && (
        <div
          aria-hidden="true"
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px] lg:hidden"
          onClick={closeMobileSidebar}
        />
      )}
      
      {/* Contenu principal */}
      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden">
        {/* Header flottant */}
        <Header
          user={resolvedUser as { name: string; email: string; role: string; avatar?: string }}
          notifications={notifications}
          pageTitle={pageTitle}
          onMenuClick={openMobileSidebar}
          isMenuOpen={mobileSidebarOpen}
          onLogout={onLogout}
          className="sticky top-0 z-30 mx-2 mt-2 rounded-2xl shadow-md"
        />
        
        {/* Suppression de la section des breadcrumbs */}
        
        {/* Contenu de la page */}
        <main className={cn(
          "min-w-0 flex-1 p-2 md:p-4 lg:p-6",
          className
        )}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
