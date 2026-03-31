import React from 'react';
import { Head } from '@/lib/inertia-shim';
import AppLayout from '@/Components/Layout/app/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/UI/Card/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/UI/Table/Table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/Components/UI/DropdownMenu/DropdownMenu';
import { Badge } from '@/Components/UI/Badge/Badge';

/**
 * Page des districts de vente pour le Chef Service Commercial (CSC)
 * Affiche la liste des districts de vente sous sa supervision
 */
interface DistrictsProps {
  auth: {
    user: {
      name: string;
      email: string;
      role: string;
      avatar?: string;
    }
  };
}

export default function Districts({ auth }: DistrictsProps) {
  // Données de démonstration pour les districts
  const districts = [
    { id: 1, nom: 'District Centre', chef: 'Jean Dupont', performance: 92, statut: 'actif' },
    { id: 2, nom: 'District Nord', chef: 'Marie Martin', performance: 87, statut: 'actif' },
    { id: 3, nom: 'District Sud', chef: 'Paul Dubois', performance: 78, statut: 'actif' },
    { id: 4, nom: 'District Est', chef: 'Sophie Leroy', performance: 85, statut: 'actif' },
    { id: 5, nom: 'District Ouest', chef: 'Thomas Bernard', performance: 90, statut: 'actif' },
  ];

  return (
    <AppLayout user={auth.user}>
      <Head title="Districts de Vente" />
      
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-semibold text-sabc-gray-900">Districts de Vente</h1>
          
          <div className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Liste des districts</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom du district</TableHead>
                      <TableHead>Chef de district</TableHead>
                      <TableHead>Performance</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {districts.map((district) => (
                      <TableRow key={district.id}>
                        <TableCell>{district.nom}</TableCell>
                        <TableCell>{district.chef}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <span className="mr-2">{district.performance}%</span>
                            <div className="w-24 h-2 bg-sabc-gray-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-sabc-red-primary" 
                                style={{ width: `${district.performance}%` }}
                              ></div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-sabc-success">
                            {district.statut}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger>
                              <button className="p-1 text-sabc-gray-400 hover:text-sabc-gray-500">
                                <span className="sr-only">Actions</span>
                                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                </svg>
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem>
                                <a href="#" className="block px-4 py-2 text-sm text-sabc-gray-800 hover:bg-sabc-gray-100">
                                  Voir détails
                                </a>
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <a href="#" className="block px-4 py-2 text-sm text-sabc-gray-800 hover:bg-sabc-gray-100">
                                  Modifier
                                </a>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
