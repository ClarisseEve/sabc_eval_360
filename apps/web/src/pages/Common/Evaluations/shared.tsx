import React from 'react';
import AppLayout from '@/Components/Layout/app/AppLayout';
import { useAuthContext } from '@/Contexts/AuthContext';

export function useEvaluationLayoutUser(fallbackRole = 'Utilisateur') {
  const { user } = useAuthContext();

  return {
    authUser: user,
    layoutUser: {
      name: user ? [user.prenom, user.nom].filter(Boolean).join(' ') || 'Utilisateur' : 'Utilisateur',
      email: user?.email || '',
      role: user?.role_nom || user?.role || fallbackRole,
      avatar: user?.avatar,
    },
  };
}

export function EvaluationPageLayout({
  children,
  pageTitle,
}: {
  children: React.ReactNode;
  pageTitle?: string;
}) {
  const { layoutUser } = useEvaluationLayoutUser();

  return (
    <AppLayout user={layoutUser} pageTitle={pageTitle} notifications={[]}>
      {children}
    </AppLayout>
  );
}

export const formatDisplayName = (userLike: Record<string, any>) => {
  if (userLike?.prenom || userLike?.nom) {
    return `${userLike?.prenom ?? ''} ${userLike?.nom ?? ''}`.trim();
  }
  if (userLike?.name) return userLike.name;
  return userLike?.matricule ?? 'Utilisateur';
};

export const formatRole = (userLike: Record<string, any>) =>
  userLike?.role_nom || userLike?.role || 'Rôle non renseigné';
