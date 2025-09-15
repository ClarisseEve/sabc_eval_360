import React from 'react';
import { normalizeRole, type Role } from '@/config/rbac';

interface RoleGuardProps {
  allowed: Role[];
  userRoleName?: string | null; // e.g. user.role_nom
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function RoleGuard({ allowed, userRoleName, fallback, children }: RoleGuardProps) {
  const code = normalizeRole(userRoleName);
  const isAllowed = allowed.includes(code);
  if (!isAllowed) {
    return (
      <div className="p-6">
        {fallback ?? (
          <div className="rounded-md border border-sabc-gray-200 bg-white p-6 text-sabc-gray-800">
            <h2 className="text-lg font-semibold mb-2">Accès non autorisé</h2>
            <p className="text-sm text-sabc-gray-600">Vous n'avez pas les permissions nécessaires pour accéder à cette page.</p>
          </div>
        )}
      </div>
    );
  }
  return <>{children}</>;
}

export function withRoleGuard(allowed: Role[]) {
  return function <P extends { userRoleName?: string | null }>(Component: React.ComponentType<P>) {
    return function Guarded(props: P) {
      return (
        <RoleGuard allowed={allowed} userRoleName={props.userRoleName}>
          <Component {...props} />
        </RoleGuard>
      );
    };
  };
}
