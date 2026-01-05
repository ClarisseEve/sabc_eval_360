import React from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/Components/Layout/app/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/UI/Card/Card';
import { Button } from '@/Components/UI/Button/Button';
import { Progress } from '@/Components/UI/Progress/Progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/Components/UI/Avatar/Avatar';
import { Badge } from '@/Components/UI/Badge/Badge';

/**
 * Tableau de bord de l'Assistant Superviseur Sponsoring (AS)
 * 
 * Spécifications selon les règles métier SABC :
 * - Profil central : Avatar large avec badges
 * - Radar personnel : Comparaison pairs
 * - Plan développement : Timeline statuts
 * - Progression : Barres pourcentages
 */
const ASDashboard: React.FC = () => {
  // Simuler un utilisateur pour la démo
  const mockUser = {
    name: 'Carine Fouda',
    email: 'carine.fouda@sabc.com',
    role: 'AS',
    avatar: undefined
  };
  
  // Données de démonstration pour les compétences
  const skills = [
    { name: 'Communication', value: 85, maxValue: 100 },
    { name: 'Planification', value: 70, maxValue: 100 },
    { name: 'Analyse', value: 65, maxValue: 100 },
    { name: 'Créativité', value: 90, maxValue: 100 },
    { name: 'Travail d\'équipe', value: 80, maxValue: 100 }
  ];
  
  // Données de démonstration pour les objectifs
  const objectives = [
    { name: 'Compléter les évaluations', progress: 70, status: 'en cours' },
    { name: 'Formation marketing digital', progress: 100, status: 'terminé' },
    { name: 'Suivi événements sponsorisés', progress: 60, status: 'en cours' },
    { name: 'Rapport mensuel', progress: 30, status: 'en cours' }
  ];
  
  // Données de démonstration pour les pairs à évaluer
  const peersToEvaluate = [
    { id: '1', name: 'Thomas Mbarga', role: 'AS', avatar: undefined, dueDate: '28 Mai 2025' },
    { id: '2', name: 'Lucie Kamga', role: 'AS', avatar: undefined, dueDate: '30 Mai 2025' }
  ];
  
  // Données de démonstration pour les événements
  const events = [
    { 
      id: '1', 
      name: 'Tournoi de Football Inter-Écoles', 
      date: '15-20 Mai 2025',
      location: 'Yaoundé',
      status: 'en cours',
      tasks: [
        { name: 'Installation banderoles', completed: true },
        { name: 'Distribution produits', completed: true },
        { name: 'Photos événement', completed: false },
        { name: 'Rapport final', completed: false }
      ]
    },
    { 
      id: '2', 
      name: 'Festival Culturel', 
      date: '5-10 Juin 2025',
      location: 'Douala',
      status: 'à venir',
      tasks: [
        { name: 'Préparation matériel', completed: true },
        { name: 'Coordination équipe', completed: false },
        { name: 'Installation stand', completed: false },
        { name: 'Animation', completed: false }
      ]
    }
  ];
  
  return (
    <AppLayout
      user={mockUser}
      notifications={[{
        id: '1',
        title: 'Auto-évaluation à compléter',
        message: 'Votre auto-évaluation est en attente',
        status: 'warning',
        read: false,
        createdAt: new Date().toISOString()
      }]}
    >
      <Head title="Tableau de bord Assistant Superviseur Sponsoring - SABC Évaluation 360°" />
      
      <div className="container mx-auto px-4 py-6">
        <h1 className="mb-6 text-2xl font-bold text-sabc-gray-900">Tableau de bord Assistant Superviseur Sponsoring</h1>
        
        {/* Section profil utilisateur */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col items-center md:flex-row md:items-start">
              {/* Avatar large */}
              <div className="mb-4 flex flex-col items-center md:mb-0 md:mr-6">
                <Avatar className="h-24 w-24">
                  <AvatarFallback className="bg-sabc-red-primary text-xl text-white">CF</AvatarFallback>
                </Avatar>
                <div className="mt-4 flex space-x-2">
                  <Badge variant="outline" className="bg-sabc-red-light text-sabc-red-primary">AS</Badge>
                  <Badge variant="outline" className="bg-sabc-success/10 text-sabc-success">Région Ouest</Badge>
                </div>
              </div>
              
              {/* Informations profil */}
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-xl font-bold text-sabc-gray-900">{mockUser.name}</h2>
                <p className="text-sabc-gray-500">{mockUser.email}</p>
                
                <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div className="rounded-lg bg-sabc-gray-50 p-3">
                    <p className="text-sm text-sabc-gray-500">Performance</p>
                    <p className="text-lg font-bold text-sabc-success">78%</p>
                  </div>
                  <div className="rounded-lg bg-sabc-gray-50 p-3">
                    <p className="text-sm text-sabc-gray-500">Évaluations</p>
                    <p className="text-lg font-bold text-sabc-red-primary">2/5</p>
                  </div>
                  <div className="rounded-lg bg-sabc-gray-50 p-3">
                    <p className="text-sm text-sabc-gray-500">Événements</p>
                    <p className="text-lg font-bold text-sabc-accent">4</p>
                  </div>
                  <div className="rounded-lg bg-sabc-gray-50 p-3">
                    <p className="text-sm text-sabc-gray-500">Objectifs</p>
                    <p className="text-lg font-bold text-sabc-info">65%</p>
                  </div>
                </div>
                
                <div className="mt-4">
                  <Button className="mr-2" variant="default">Compléter Auto-évaluation</Button>
                  <Button variant="outline">Voir Profil Complet</Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Grille principale */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Compétences */}
          <Card>
            <CardHeader>
              <CardTitle>Mes Compétences</CardTitle>
              <CardDescription>Évaluation de vos compétences et comparaison avec vos pairs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {skills.map((skill, index) => (
                  <div key={index}>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-sm font-medium">{skill.name}</span>
                      <span className="text-sm font-medium">{skill.value}%</span>
                    </div>
                    <div className="flex items-center">
                      <Progress value={skill.value} max={skill.maxValue} className="h-2 flex-1" />
                      <div className="ml-2 h-2 w-2 rounded-full bg-sabc-gray-400" title="Moyenne des pairs"></div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 rounded-lg border border-sabc-gray-200 bg-sabc-gray-50 p-3">
                <p className="text-sm font-medium text-sabc-gray-900">Points forts</p>
                <p className="text-sm text-sabc-gray-600">Créativité et communication sont vos atouts majeurs. Continuez à les développer.</p>
              </div>
              
              <div className="mt-2 rounded-lg border border-sabc-gray-200 bg-sabc-gray-50 p-3">
                <p className="text-sm font-medium text-sabc-gray-900">Axes d'amélioration</p>
                <p className="text-sm text-sabc-gray-600">Concentrez-vous sur l'analyse et la planification pour progresser.</p>
              </div>
            </CardContent>
          </Card>
          
          {/* Objectifs et progression */}
          <Card>
            <CardHeader>
              <CardTitle>Progression Objectifs</CardTitle>
              <CardDescription>Suivi de vos objectifs personnels et professionnels</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {objectives.map((objective, index) => (
                  <div key={index} className="rounded-lg border border-sabc-gray-200 p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="font-medium">{objective.name}</span>
                      <Badge 
                        variant="outline" 
                        className={
                          objective.status === 'terminé' 
                            ? 'bg-sabc-success/10 text-sabc-success' 
                            : 'bg-sabc-accent/10 text-sabc-accent'
                        }
                      >
                        {objective.status}
                      </Badge>
                    </div>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-xs text-sabc-gray-500">Progression</span>
                      <span className="text-xs font-medium">{objective.progress}%</span>
                    </div>
                    <Progress value={objective.progress} max={100} className="h-2" />
                  </div>
                ))}
              </div>
              
              <div className="mt-4">
                <Button variant="outline" className="w-full">Ajouter un Objectif</Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Évaluations en attente */}
          <Card>
            <CardHeader>
              <CardTitle>Évaluations à Compléter</CardTitle>
              <CardDescription>Vos pairs à évaluer et auto-évaluation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 rounded-lg border-l-4 border-l-sabc-red-primary bg-sabc-red-light/10 p-4">
                <h4 className="font-medium text-sabc-red-primary">Auto-évaluation</h4>
                <p className="mt-1 text-sm text-sabc-gray-600">Votre auto-évaluation est en attente de complétion</p>
                <div className="mt-2">
                  <Button variant="destructive" size="sm">Compléter Maintenant</Button>
                </div>
              </div>
              
              <div className="space-y-4">
                {peersToEvaluate.map((peer) => (
                  <div key={peer.id} className="flex items-center justify-between rounded-lg border border-sabc-gray-200 p-3">
                    <div className="flex items-center">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-sabc-accent text-white">
                          {peer.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="ml-3">
                        <p className="font-medium">{peer.name}</p>
                        <p className="text-xs text-sabc-gray-500">{peer.role} • Échéance: {peer.dueDate}</p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline">Évaluer</Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          {/* Événements sponsorisés */}
          <Card>
            <CardHeader>
              <CardTitle>Événements Sponsorisés</CardTitle>
              <CardDescription>Événements en cours et tâches associées</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {events.map((event) => (
                  <div key={event.id} className="rounded-lg border border-sabc-gray-200 p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <h4 className="font-medium">{event.name}</h4>
                      <Badge 
                        variant="outline" 
                        className={
                          event.status === 'en cours' 
                            ? 'bg-sabc-accent/10 text-sabc-accent' 
                            : 'bg-sabc-info/10 text-sabc-info'
                        }
                      >
                        {event.status}
                      </Badge>
                    </div>
                    <div className="mb-2 text-sm text-sabc-gray-600">
                      <p>{event.date} • {event.location}</p>
                    </div>
                    <div className="space-y-2">
                      {event.tasks.map((task, taskIndex) => (
                        <div key={taskIndex} className="flex items-center">
                          <div className={`mr-2 h-4 w-4 rounded-full ${task.completed ? 'bg-sabc-success' : 'bg-sabc-gray-200'}`}></div>
                          <span className={`text-sm ${task.completed ? 'text-sabc-gray-500 line-through' : 'text-sabc-gray-800'}`}>
                            {task.name}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3">
                      <Button size="sm" variant="outline">Voir Détails</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default ASDashboard;
