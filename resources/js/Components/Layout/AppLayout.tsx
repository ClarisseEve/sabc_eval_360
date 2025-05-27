import * as React from 'react';
import { cn } from '@/utils/helpers';
import { Header } from '@/Components/Layout/Header';
import { Sidebar } from '@/Components/Layout/Sidebar';

export interface AppLayoutProps {
  user: {
    name: string;
    email: string;
    role: string;
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
  onLogout: () => void;
  children: React.ReactNode;
  className?: string;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  user,
  notifications = [],
  onLogout,
  children,
  className,
}) => {
  // État pour contrôler l'affichage du sidebar sur mobile
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  
  // Fonction pour ouvrir le sidebar
  const openSidebar = () => setSidebarOpen(true);
  
  // Fonction pour fermer le sidebar
  const closeSidebar = () => setSidebarOpen(false);
  
  return (
    <div className="flex min-h-screen flex-col bg-sabc-gray-50 dark:bg-sabc-gray-900">
      {/* Header */}
      <Header
        user={user}
        notifications={notifications}
        onToggleSidebar={openSidebar}
      />
      
      <div className="flex flex-1">
        {/* Sidebar */}
        <Sidebar
          user={user}
          isOpen={sidebarOpen}
          onClose={closeSidebar}
          onLogout={onLogout}
        />
        
        {/* Contenu principal */}
        <main className={cn(
          "flex-1 overflow-auto p-4 md:p-6 lg:p-8",
          className
        )}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
