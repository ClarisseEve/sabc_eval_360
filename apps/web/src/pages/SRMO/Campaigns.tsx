import React from 'react';
import { Head } from '@/lib/inertia-shim';
import AppLayout from '@/Components/Layout/app/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/UI/Card/Card';

interface CampaignsProps {
  auth: {
    user: any;
  };
}

/**
 * Page des campagnes marketing pour le Superviseur Régional Marketing Opérationnel (SRMO)
 */
export default function Campaigns({ auth }: CampaignsProps) {
  return (
    <AppLayout user={auth.user}>
      <Head title="Campagnes Marketing" />
      <Card>
        <CardHeader>
          <CardTitle>Campagnes Marketing</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">Liste des campagnes marketing en cours et à venir pour les régions non-tanières.</p>
          {/* Contenu à implémenter */}
        </CardContent>
      </Card>
    </AppLayout>
  );
}
