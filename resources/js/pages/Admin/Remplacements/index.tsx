import React from 'react';
import { Head } from '@inertiajs/react';
import { Link } from '@inertiajs/react';
import AppLayout from '@/Components/Layout/app/AppLayout';
import { Card, CardHeader, CardContent, CardFooter } from '@/Components/UI/Card/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/UI/Table/Table';
import { Button } from '@/Components/UI/Button/Button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/Components/UI/DropdownMenu/DropdownMenu';
import { route } from 'ziggy-js';

/**
 * Page d'administration des remplacements temporaires
 * Affiche la liste des remplacements temporaires et permet de les gérer
 */
interface Remplacement {
  id: number;
  remplacant: string;
  remplace: string;
  role: string;
  date_debut: string;
  date_fin: string;
  statut: string;
}

interface RemplacementsProps {
  remplacements?: Remplacement[];
  auth: {
    user: {
      name: string;
      email: string;
      role: string;
      avatar?: string;
    }
  };
}

export default function Remplacements({ remplacements = [], auth }: RemplacementsProps) {
  // Données de démonstration pour les remplacements
  const replacementsData = remplacements.length > 0 ? remplacements : [
    { 
      id: 1, 
      remplacant: 'Jean Dupont', 
      remplace: 'Marie Martin', 
      role: 'CDV', 
      date_debut: '2025-06-01', 
      date_fin: '2025-06-30',
      statut: 'actif'
    },
    { 
      id: 2, 
      remplacant: 'Paul Dubois', 
      remplace: 'Sophie Leroy', 
      role: 'CDS', 
      date_debut: '2025-06-15', 
      date_fin: '2025-07-15',
      statut: 'actif'
    },
    { 
      id: 3, 
      remplacant: 'Thomas Bernard', 
      remplace: 'Julie Petit', 
      role: 'TMO', 
      date_debut: '2025-05-01', 
      date_fin: '2025-06-01',
      statut: 'terminé'
    },
  ];

  return (
    <AppLayout user={auth.user}>
      <Head title="Gestion des Remplacements" />
      
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-semibold text-gray-900">Gestion des Remplacements Temporaires</h1>
            <Link href={route('admin.remplacements.create')}>
              <Button 
                variant="default"
                type="button"
              >
                Nouveau remplacement
              </Button>
            </Link>
          </div>
          
          <div className="mt-6">
            <Card>
              <CardHeader>
                <h2 className="text-lg font-medium">Liste des remplacements</h2>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Remplaçant</TableHead>
                      <TableHead>Remplacé</TableHead>
                      <TableHead>Rôle</TableHead>
                      <TableHead>Date début</TableHead>
                      <TableHead>Date fin</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {replacementsData.map((remplacement) => (
                      <TableRow key={remplacement.id}>
                        <TableCell>{remplacement.remplacant}</TableCell>
                        <TableCell>{remplacement.remplace}</TableCell>
                        <TableCell>{remplacement.role}</TableCell>
                        <TableCell>{remplacement.date_debut}</TableCell>
                        <TableCell>{remplacement.date_fin}</TableCell>
                        <TableCell>
                          <span 
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              remplacement.statut === 'actif' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {remplacement.statut}
                          </span>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger className="cursor-pointer">Actions</DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <Link href={route('admin.remplacements.show', { id: String(remplacement.id) })}>
                                <DropdownMenuItem>
                                  Voir détails
                                </DropdownMenuItem>
                              </Link>
                              <Link href={route('admin.remplacements.edit', { id: String(remplacement.id) })}>
                                <DropdownMenuItem>
                                  Modifier
                                </DropdownMenuItem>
                              </Link>
                              {remplacement.statut === 'actif' && (
                                <DropdownMenuItem 
                                  onClick={() => {
                                    if (confirm('Êtes-vous sûr de vouloir terminer ce remplacement ?')) {
                                      // Logique pour terminer le remplacement
                                    }
                                  }}
                                >
                                  Terminer
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem 
                                onClick={() => {
                                  if (confirm('Êtes-vous sûr de vouloir supprimer ce remplacement ?')) {
                                    // Logique pour supprimer le remplacement
                                  }
                                }}
                                className="text-red-600"
                              >
                                Supprimer
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
