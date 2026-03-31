import React from 'react';
import { Head } from '@/lib/inertia-shim';
import AppLayout from '@/Components/Layout/app/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/UI/Card/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/UI/Table/Table';
import { Badge } from '@/Components/UI/Badge/Badge';

interface SectorsProps {
  auth: {
    user: {
      name: string;
      email: string;
      role: string;
      avatar?: string;
    }
  };
}

export default function Sectors({ auth }: SectorsProps) {
  // Données de démonstration pour les secteurs
  const sectors = [
    { id: 1, name: 'Secteur Nord', cds: 'Thomas Mbarga', performance: 87, status: 'actif' },
    { id: 2, name: 'Secteur Sud', cds: 'Marie Fouda', performance: 92, status: 'actif' },
    { id: 3, name: 'Secteur Est', cds: 'Jean Ekambi', performance: 78, status: 'actif' },
    { id: 4, name: 'Secteur Ouest', cds: 'Sophie Ndongo', performance: 85, status: 'actif' },
  ];

  return (
    <AppLayout user={auth.user}>
      <Head title="Secteurs - Chef District Vente" />
      
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-semibold text-sabc-gray-900 mb-6">Gestion des Secteurs</h1>
          
          <Card>
            <CardHeader>
              <CardTitle>Liste des secteurs</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom du secteur</TableHead>
                    <TableHead>Chef de Secteur</TableHead>
                    <TableHead>Performance</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sectors.map((sector) => (
                    <TableRow key={sector.id}>
                      <TableCell className="font-medium">{sector.name}</TableCell>
                      <TableCell>{sector.cds}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <span className="mr-2">{sector.performance}%</span>
                          <div className="w-24 h-2 bg-sabc-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-sabc-red-primary" 
                              style={{ width: `${sector.performance}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-sabc-success">
                          {sector.status}
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
