import React from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/components/layout/app/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card/Card';

interface EventsProps {
  auth: {
    user: any;
  };
}

/**
 * Page des événements pour le Superviseur Sponsoring (SS)
 */
export default function Events({ auth }: EventsProps) {
  return (
    <AppLayout user={auth.user}>
      <Head title="Événements Sponsoring" />
      <Card>
        <CardHeader>
          <CardTitle>Événements Sponsoring</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">Gestion des événements et activités de sponsoring.</p>
          {/* Contenu à implémenter */}
        </CardContent>
      </Card>
    </AppLayout>
  );
}
