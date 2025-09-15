import React from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/components/layout/app/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card/Card';

interface CampaignsProps {
  auth: {
    user: any;
  };
}

/**
 * Page des campagnes marketing pour le Regional Trade Marketing (RTM)
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
          <p className="text-gray-600">Liste des campagnes marketing en cours et à venir.</p>
          {/* Contenu à implémenter */}
        </CardContent>
      </Card>
    </AppLayout>
  );
}
