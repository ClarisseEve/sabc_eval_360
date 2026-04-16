import * as React from 'react';
import { cn } from '@/utils/helpers';
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
  }[];
  pageTitle?: string;
  isAdmin?: boolean;
  permissions?: string[];
  onLogout?: () => void;
  children: React.ReactNode;
  className?: string;
  breadcrumbs?: Array<{ title: string; href?: string }>;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  user,
  notifications = [],
  pageTitle = 'Tableau de bord',
  onLogout = () => console.log('Déconnexion'),
  children,
  className,
}) => {
  const resolvedUser = user ?? {
    name: 'Utilisateur',
    email: '',
    role: '',
    avatar: undefined,
  };

  // État pour contrôler l'affichage du sidebar sur mobile
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  
  // Fonction pour basculer l'état du sidebar
  const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);
  
  // Le titre de la page est maintenant passé directement en prop

  return (
    <div className="flex h-screen max-w-full overflow-hidden bg-sabc-gray-50 dark:bg-sabc-gray-900">
      {/* Sidebar */}
      <Sidebar
        user={resolvedUser as { name: string; email: string; role: string; avatar?: string }}
        isCollapsed={sidebarCollapsed}
        onToggle={toggleSidebar}
        onLogout={onLogout}
      />
      
      {/* Contenu principal */}
      <div className="flex flex-1 flex-col max-w-full overflow-y-auto overflow-x-hidden">
        {/* Header flottant */}
        <Header
          user={resolvedUser as { name: string; email: string; role: string; avatar?: string }}
          notifications={notifications}
          pageTitle={pageTitle}
          className="sticky top-0 z-10 mx-2 mt-2 rounded-2xl shadow-md"
        />
        
        {/* Suppression de la section des breadcrumbs */}
        
        {/* Contenu de la page */}
        <main className={cn(
          "flex-1 p-2 md:p-4 lg:p-6",
          className
        )}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
