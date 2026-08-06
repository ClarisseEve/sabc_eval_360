import AppLayout from '@/Components/Layout/app/AppLayout';
import { useAuthContext } from '@/Contexts/AuthContext';
import { Head } from '@/lib/inertia-shim';
import React from 'react';

export function AdminReportsLayout({ title, children }: { title: string; children: React.ReactNode }) {
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
            {children}
        </AppLayout>
    );
}
