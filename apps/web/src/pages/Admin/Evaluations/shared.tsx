import React from 'react';
import { Head } from '@/lib/inertia-shim';
import AppLayout from '@/Components/Layout/app/AppLayout';
import { useAuthContext } from '@/Contexts/AuthContext';
import { Badge } from '@/Components/UI/Badge/Badge';

type BadgeVariant = 'success' | 'warning' | 'info' | 'error' | 'secondary' | 'primary';

// Source unique de vérité des pills de statut du module Évaluations.
export function PeriodeStatusBadge({ statut, estOuverte }: { statut?: string; estOuverte?: boolean }) {
  const key = (statut || (estOuverte ? 'ouverte' : '')).toLowerCase();
  const map: Record<string, { label: string; variant: BadgeVariant }> = {
    planifiee: { label: 'Planifiée', variant: 'warning' },
    planifiée: { label: 'Planifiée', variant: 'warning' },
    ouverte: { label: 'Ouverte', variant: 'success' },
    fermee: { label: 'Fermée', variant: 'secondary' },
    fermée: { label: 'Fermée', variant: 'secondary' },
    cloturee: { label: 'Clôturée', variant: 'secondary' },
    clôturée: { label: 'Clôturée', variant: 'secondary' },
  };
  const meta = map[key] ?? { label: statut || '—', variant: 'secondary' as BadgeVariant };
  return <Badge variant={meta.variant}>{meta.label}</Badge>;
}

export function EvaluationStatusBadge({ statut }: { statut?: string }) {
  const key = (statut || '').toLowerCase();
  const map: Record<string, { label: string; variant: BadgeVariant }> = {
    brouillon: { label: 'Brouillon', variant: 'secondary' },
    soumis: { label: 'Soumis', variant: 'info' },
    soumise: { label: 'Soumis', variant: 'info' },
    valide: { label: 'Validé', variant: 'success' },
    validé: { label: 'Validé', variant: 'success' },
    validee: { label: 'Validé', variant: 'success' },
    validée: { label: 'Validé', variant: 'success' },
    rejete: { label: 'Rejeté', variant: 'error' },
    rejeté: { label: 'Rejeté', variant: 'error' },
    rejetee: { label: 'Rejeté', variant: 'error' },
    rejetée: { label: 'Rejeté', variant: 'error' },
  };
  const meta = map[key] ?? { label: statut || '—', variant: 'secondary' as BadgeVariant };
  return <Badge variant={meta.variant}>{meta.label}</Badge>;
}

export function AdminEvaluationsLayout({
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
      <div className="space-y-6 p-6">{children}</div>
    </AppLayout>
  );
}
