import React from 'react';
import { normalizeRole, type Role } from '@/config/rbac';
import AccessDenied from '@/Components/Errors/AccessDenied';

interface RoleGuardProps {
  allowed?: Role[];
  /**
   * @deprecated Utiliser `allowed`.
   */
  allowedRoles?: Role[];
  userRoleName?: string | null; // e.g. user.role_nom
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function RoleGuard({ allowed, allowedRoles, userRoleName, fallback, children }: RoleGuardProps) {
  const activeAllowed = React.useMemo<Role[]>(() => {
    const roles = allowed ?? allowedRoles ?? [];
    return roles.filter(Boolean);
  }, [allowed, allowedRoles]);

  const hasWarnedLegacy = React.useRef(false);
  const hasWarnedEmpty = React.useRef(false);

  if (!allowed && allowedRoles && !hasWarnedLegacy.current) {
    console.warn('[RoleGuard] La prop `allowedRoles` est obsolète. Merci d\'utiliser `allowed`.');
    hasWarnedLegacy.current = true;
  }

  if (activeAllowed.length === 0) {
    if (!hasWarnedEmpty.current) {
      console.warn('[RoleGuard] Aucun rôle autorisé fourni, rendu complet autorisé par défaut.');
      hasWarnedEmpty.current = true;
    }
    return <>{children}</>;
  }

  const code = normalizeRole(userRoleName);
  const isAllowed = activeAllowed.includes(code);
  if (!isAllowed) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return <AccessDenied />;
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
