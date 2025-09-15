import React from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/components/layout/app/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card/Card';

interface ActivitiesProps {
  auth: {
    user: any;
  };
}

/**
 * Page des activités pour le Trade Marketing Operator (TMO)
 */
export default function Activities({ auth }: ActivitiesProps) {
  return (
    <AppLayout user={auth.user}>
      <Head title="Mes Activités" />
      <Card>
        <CardHeader>
          <CardTitle>Mes Activités</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">Suivi des activités marketing et promotionnelles.</p>
          {/* Contenu à implémenter */}
        </CardContent>
      </Card>
    </AppLayout>
  );
}
