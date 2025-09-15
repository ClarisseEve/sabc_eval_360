import React from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/components/layout/app/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card/Card';
import { BarChart } from '@/components/ui/charts/BarChart';

interface PerformanceProps {
  auth: {
    user: any;
  };
}

/**
 * Page de performance pour le Trade Marketing Operator (TMO)
 */
export default function Performance({ auth }: PerformanceProps) {
  // Données d'exemple pour le graphique
  const performanceData = {
    labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin'],
    datasets: [
      {
        label: 'Performance',
        data: [65, 72, 78, 75, 82, 88],
        backgroundColor: '#E53E3E',
      }
    ],
  };

  return (
    <AppLayout user={auth.user}>
      <Head title="Ma Performance" />
      <Card>
        <CardHeader>
          <CardTitle>Ma Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-6">Suivi de vos performances d'évaluation.</p>
          <div className="h-80">
            <BarChart data={performanceData} />
          </div>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
