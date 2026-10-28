import React from 'react';
import { Head } from '@/lib/inertia-shim';
import AppLayout from '@/Components/Layout/app/AppLayout';
import { useAuthContext } from '@/Contexts/AuthContext';

export function AdminUsersLayout({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const { user } = useAuthContext();
  const layoutUser = {
    name: user ? [user.prenom, user.nom].filter(Boolean).join(' ') || 'Administrateur' : 'Administrateur',
    email: user?.email || '',
    role: user?.role_nom || user?.role || 'ADMIN',
    avatar: user?.avatar,
  };

  return (
    <AppLayout user={layoutUser} pageTitle={title} notifications={[]}>
      <Head title={title} />
      <div className="w-full space-y-6 px-4 py-6 sm:px-6 lg:px-8">{children}</div>
    </AppLayout>
  );
}
