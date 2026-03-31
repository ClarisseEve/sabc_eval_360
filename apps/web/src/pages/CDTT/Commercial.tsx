import React from 'react';
import { Head } from '@/lib/inertia-shim';
import AppLayout from '@/Components/Layout/app/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/UI/Card/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/UI/Table/Table';
import { Badge } from '@/Components/UI/Badge/Badge';

interface CommercialProps {
  auth: {
    user: {
      name: string;
      email: string;
      role: string;
      avatar?: string;
    }
  };
}

export default function Commercial({ auth }: CommercialProps) {
  // Données de démonstration pour la branche commerciale
  const commercialData = {
    cscList: [
      { id: 1, name: 'Jean Mbida', district: 'Douala Centre', performance: 92, evaluations: 18, status: 'actif' },
      { id: 2, name: 'Marie Atangana', district: 'Douala Nord', performance: 88, evaluations: 15, status: 'actif' },
      { id: 3, name: 'Paul Essomba', district: 'Douala Sud', performance: 76, evaluations: 12, status: 'actif' },
      { id: 4, name: 'Sophie Ngo', district: 'Douala Est', performance: 85, evaluations: 14, status: 'actif' },
    ],
    performanceStats: {
      global: 85,
      previousPeriod: 82,
      bestDistrict: 'Douala Centre',
      bestScore: 92,
      evaluationsCompleted: 59,
      totalEvaluations: 65
    }
  };

  return (
    <AppLayout user={auth.user}>
      <Head title="Branche Commerciale - Chef Département Trade" />
      
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-semibold text-sabc-gray-900 mb-6">Branche Commerciale</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance globale</CardTitle>
                <CardDescription>Branche commerciale</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                <div className="text-5xl font-bold text-sabc-red-primary">{commercialData.performanceStats.global}%</div>
                <div className="text-sm text-sabc-gray-400 mt-2">
                  +{commercialData.performanceStats.global - commercialData.performanceStats.previousPeriod}% vs période précédente
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Meilleur district</CardTitle>
                <CardDescription>Performance la plus élevée</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                <div className="text-xl font-bold text-sabc-gray-800">{commercialData.performanceStats.bestDistrict}</div>
                <div className="text-5xl font-bold text-sabc-success mt-2">{commercialData.performanceStats.bestScore}%</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Évaluations</CardTitle>
                <CardDescription>Progression du cycle</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                <div className="text-5xl font-bold text-sabc-accent">
                  {Math.round(commercialData.performanceStats.evaluationsCompleted / commercialData.performanceStats.totalEvaluations * 100)}%
                </div>
                <div className="text-sm text-sabc-gray-400 mt-2">
                  {commercialData.performanceStats.evaluationsCompleted}/{commercialData.performanceStats.totalEvaluations} complétées
                </div>
                <div className="w-full mt-4 bg-sabc-gray-200 rounded-full h-2">
                  <div 
                    className="bg-sabc-accent h-2 rounded-full" 
                    style={{ width: `${commercialData.performanceStats.evaluationsCompleted / commercialData.performanceStats.totalEvaluations * 100}%` }}
                  ></div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Chefs Services Commerciaux (CSC)</CardTitle>
              <CardDescription>Performance par district</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>District</TableHead>
                    <TableHead>Performance</TableHead>
                    <TableHead>Évaluations</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {commercialData.cscList.map((csc) => (
                    <TableRow key={csc.id}>
                      <TableCell className="font-medium">{csc.name}</TableCell>
                      <TableCell>{csc.district}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <span className="mr-2">{csc.performance}%</span>
                          <div className="w-24 h-2 bg-sabc-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-sabc-red-primary" 
                              style={{ width: `${csc.performance}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{csc.evaluations}</TableCell>
                      <TableCell>
                        <Badge className="bg-sabc-success">
                          {csc.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
