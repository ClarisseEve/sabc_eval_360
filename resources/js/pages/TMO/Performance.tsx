import React from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/Components/Layout/app/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/UI/Card/Card';
import { BarChart } from '@/Components/UI/Charts/BarChart';

interface PerformanceProps {
  auth: {
    user: any;
  };
}

/**
 * Page de performance pour le Trade Marketing Operator (TMO)
 */
export default function Performance({ auth }: PerformanceProps) {
  // Données d'exemple pour le graphique (format Recharts)
  const performanceData = [
    { name: 'Jan', performance: 65 },
    { name: 'Fév', performance: 72 },
    { name: 'Mar', performance: 78 },
    { name: 'Avr', performance: 75 },
    { name: 'Mai', performance: 82 },
    { name: 'Juin', performance: 88 },
  ];

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
            <BarChart 
              data={performanceData}
              xAxisDataKey="name"
              bars={[
                { dataKey: 'performance', name: 'Performance', color: '#E53E3E' }
              ]}
            />
          </div>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
