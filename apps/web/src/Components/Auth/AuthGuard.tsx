import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '@/Contexts/AuthContext';

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRoles?: string[];
}

/**
 * Route guard that redirects unauthenticated users to /login.
 * Optionally restricts access to specific roles.
 */
export const AuthGuard: React.FC<AuthGuardProps> = ({ children, requiredRoles }) => {
  const { user, isAuthenticated, isLoading } = useAuthContext();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-sabc-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-sabc-gray-200 border-t-sabc-red-primary" />
          <span className="text-sm text-sabc-gray-400">Vérification…</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user.password_change_required && location.pathname !== '/settings/password') {
    return <Navigate to="/settings/password" replace />;
  }

  if (requiredRoles && requiredRoles.length > 0) {
    const userRole = (user.role_nom || user.role || '').toUpperCase();
    if (!requiredRoles.includes(userRole) && !user.est_admin) {
      return <Navigate to="/403" replace />;
    }
  }

  return <>{children}</>;
};

export default AuthGuard;
