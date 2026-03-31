import React from 'react';
import { Head } from '@/lib/inertia-shim';
import AppLayout from '@/Components/Layout/app/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/UI/Card/Card';
import { Badge } from '@/Components/UI/Badge/Badge';
import { Progress } from '@/Components/UI/Progress/Progress';

interface ObjectivesProps {
  auth: {
    user: {
      name: string;
      email: string;
      role: string;
      avatar?: string;
    }
  };
}

export default function Objectives({ auth }: ObjectivesProps) {
  // Données de démonstration pour les objectifs
  const objectives = [
    { 
      id: 1, 
      title: 'Améliorer la performance commerciale du secteur', 
      description: 'Atteindre un taux de croissance de 15% des ventes sur le secteur',
      progress: 80, 
      deadline: '2025-12-31',
      status: 'en_cours',
      category: 'commercial'
    },
    { 
      id: 2, 
      title: 'Réduire le turnover des équipes', 
      description: 'Maintenir un taux de rétention supérieur à 90% dans l\'équipe',
      progress: 100, 
      deadline: '2025-06-30',
      status: 'termine',
      category: 'management'
    },
    { 
      id: 3, 
      title: 'Développer les compétences de l\'équipe', 
      description: 'Organiser au moins 4 sessions de formation pour l\'équipe',
      progress: 50, 
      deadline: '2025-09-30',
      status: 'en_cours',
      category: 'formation'
    },
    { 
      id: 4, 
      title: 'Optimiser la couverture du secteur', 
      description: 'Augmenter le taux de visite des points de vente à 95%',
      progress: 65, 
      deadline: '2025-10-31',
      status: 'en_cours',
      category: 'commercial'
    },
  ];

  // Fonction pour obtenir la couleur du badge en fonction du statut
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'termine':
        return 'bg-sabc-success';
      case 'en_cours':
        return 'bg-sabc-accent';
      case 'a_venir':
        return 'bg-sabc-info';
      default:
        return 'bg-sabc-gray-400';
    }
  };

  // Fonction pour obtenir le libellé du statut
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'termine':
        return 'Terminé';
      case 'en_cours':
        return 'En cours';
      case 'a_venir':
        return 'À venir';
      default:
        return 'Inconnu';
    }
  };

  // Fonction pour obtenir la couleur de la catégorie
  const getCategoryBadgeColor = (category: string) => {
    switch (category) {
      case 'commercial':
        return 'bg-sabc-red-primary';
      case 'management':
        return 'bg-sabc-info';
      case 'formation':
        return 'bg-sabc-accent';
      default:
        return 'bg-sabc-gray-400';
    }
  };

  // Fonction pour obtenir le libellé de la catégorie
  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'commercial':
        return 'Commercial';
      case 'management':
        return 'Management';
      case 'formation':
        return 'Formation';
      default:
        return 'Autre';
    }
  };

  return (
    <AppLayout user={auth.user}>
      <Head title="Mes Objectifs - Chef de Secteur" />
      
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-semibold text-sabc-gray-900 mb-6">Mes Objectifs</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle>Progression globale</CardTitle>
                <CardDescription>Tous objectifs confondus</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                <div className="text-5xl font-bold text-sabc-red-primary">74%</div>
                <div className="w-full mt-4">
                  <Progress value={74} className="h-2" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Objectifs terminés</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                <div className="text-5xl font-bold text-sabc-success">1/4</div>
                <div className="text-sm text-sabc-gray-400 mt-2">25% des objectifs</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Prochaine échéance</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                <div className="text-5xl font-bold text-sabc-accent">50j</div>
                <div className="text-sm text-sabc-gray-400 mt-2">30 septembre 2025</div>
              </CardContent>
            </Card>
          </div>
          
          <div className="space-y-6">
            {objectives.map((objective) => (
              <Card key={objective.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{objective.title}</CardTitle>
                      <CardDescription className="mt-1">{objective.description}</CardDescription>
                    </div>
                    <div className="flex space-x-2">
                      <Badge className={getCategoryBadgeColor(objective.category)}>
                        {getCategoryLabel(objective.category)}
                      </Badge>
                      <Badge className={getStatusBadgeColor(objective.status)}>
                        {getStatusLabel(objective.status)}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-sabc-gray-800">Progression</span>
                    <span className="text-sm text-sabc-gray-400">{objective.progress}%</span>
                  </div>
                  <Progress value={objective.progress} className="h-2" />
                  
                  <div className="mt-4 text-sm text-sabc-gray-400">
                    Échéance: {new Date(objective.deadline).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
