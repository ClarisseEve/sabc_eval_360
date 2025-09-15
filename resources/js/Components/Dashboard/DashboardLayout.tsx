import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Head } from '@inertiajs/react';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  role: string;
}

/**
 * Composant de mise en page pour les tableaux de bord
 * Conforme aux règles graphiques SABC
 */
const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, title, role }) => {
  const { user } = useAuth();
  
  return (
    <>
      <Head title={title} />
      <div className="min-h-screen bg-sabc-gray-50">
        {/* En-tête */}
        <header className="bg-white border-b border-sabc-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <div className="text-2xl font-bold text-sabc-red-primary">SABC Eval360</div>
              </div>
              <div className="flex items-center">
                {user && (
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="text-sm font-medium text-sabc-gray-900">{user.nom} {user.prenom}</div>
                      <div className="text-xs text-sabc-gray-400">{user.role_nom} - {user.region_nom}</div>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-sabc-red-primary flex items-center justify-center text-white font-medium">
                      {user.prenom?.[0]}{user.nom?.[0]}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>
        
        {/* Contenu principal */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-sabc-gray-900">{title}</h1>
            <p className="text-sm text-sabc-gray-400">
              Tableau de bord {role}
              {user?.region_nom && ` - Région ${user.region_nom}`}
              {user?.type_region && ` (${user.type_region})`}
            </p>
          </div>
          
          {children}
        </main>
      </div>
    </>
  );
};

export default DashboardLayout;
