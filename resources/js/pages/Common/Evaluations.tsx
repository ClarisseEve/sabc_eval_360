import React from 'react';
import { Head } from '@inertiajs/react';
import { useAuth } from '@/hooks/useAuth';
import { useAuthBridge } from '@/hooks/useAuthBridge';
import AppLayout from '@/Components/Layout/app/AppLayout';
import { adaptUserForLayout } from '@/utils/userAdapter';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/UI/Card/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/UI/Table/Table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/Components/UI/DropdownMenu/DropdownMenu';
import { Button } from '@/Components/UI/Button/Button';

/**
 * Page des évaluations commune à tous les rôles
 * Affiche les évaluations de l'utilisateur courant
 */
const Evaluations: React.FC = () => {
  const { user } = useAuth();
  const authContext = useAuthBridge();
  
  // Données factices pour la démonstration
  const evaluations = [
    {
      id: 1,
      titre: 'Évaluation trimestrielle Q1 2025',
      statut: 'En cours',
      date_debut: '2025-01-01',
      date_fin: '2025-03-31',
      progression: 75
    },
    {
      id: 2,
      titre: 'Auto-évaluation annuelle 2024',
      statut: 'Terminée',
      date_debut: '2024-12-01',
      date_fin: '2024-12-31',
      progression: 100
    },
    {
      id: 3,
      titre: 'Évaluation par les pairs',
      statut: 'À faire',
      date_debut: '2025-04-01',
      date_fin: '2025-04-15',
      progression: 0
    }
  ];
  
  // Fonction pour obtenir la classe de couleur en fonction du statut
  const getStatusColor = (statut: string) => {
    switch (statut) {
      case 'En cours':
        return 'bg-sabc-warning text-white';
      case 'Terminée':
        return 'bg-sabc-success text-white';
      case 'À faire':
        return 'bg-sabc-gray-200 text-sabc-gray-800';
      default:
        return 'bg-sabc-gray-200 text-sabc-gray-800';
    }
  };
  
  return (
    <AppLayout user={adaptUserForLayout(authContext.user || user)}>
      <Head title="Mes évaluations - SABC Évaluation 360°" />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-sabc-gray-900">Mes évaluations</h1>
          
          <Button>
            Nouvelle évaluation
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Liste de mes évaluations</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Titre</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Période</TableHead>
                  <TableHead>Progression</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {evaluations.map((evaluation) => (
                  <TableRow key={evaluation.id}>
                    <TableCell className="font-medium">{evaluation.titre}</TableCell>
                    <TableCell>
                      <span className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(evaluation.statut)}`}>
                        {evaluation.statut}
                      </span>
                    </TableCell>
                    <TableCell>{`${evaluation.date_debut} - ${evaluation.date_fin}`}</TableCell>
                    <TableCell>
                      <div className="w-full bg-sabc-gray-200 rounded-full h-2.5">
                        <div 
                          className="bg-sabc-red-primary h-2.5 rounded-full" 
                          style={{ width: `${evaluation.progression}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-sabc-gray-600">{`${evaluation.progression}%`}</span>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-more-horizontal">
                              <circle cx="12" cy="12" r="1" />
                              <circle cx="19" cy="12" r="1" />
                              <circle cx="5" cy="12" r="1" />
                            </svg>
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Voir détails</DropdownMenuItem>
                          <DropdownMenuItem>Continuer</DropdownMenuItem>
                          <DropdownMenuItem>Télécharger PDF</DropdownMenuItem>
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
    </AppLayout>
  );
};

export default Evaluations;
