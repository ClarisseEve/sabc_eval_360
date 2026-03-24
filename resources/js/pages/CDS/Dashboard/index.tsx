import React from 'react';
import { Head, usePage } from '@inertiajs/react';
import AppLayout from '@/Components/Layout/app/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/UI/Card/Card';
import { Button } from '@/Components/UI/Button/Button';

/**
 * Tableau de bord du Chef de Secteur (CDS)
 * 
 * Spécifications selon les règles métier SABC :
 * - Profil central : Avatar large avec badges
 * - Radar personnel : Comparaison pairs
 * - Plan développement : Timeline statuts
 * - Progression : Barres pourcentages
 */
const CDSDashboard: React.FC = () => {
  const { auth } = usePage<any>().props;
  const mockUser = {
    name: auth?.user?.name || [auth?.user?.prenom, auth?.user?.nom].filter(Boolean).join(' ') || 'Utilisateur',
    email: auth?.user?.email || '',
    role: auth?.user?.role?.nom_role || auth?.user?.role_nom || 'CDS',
    avatar: auth?.user?.avatar,
  };
  
  return (
    <AppLayout
      user={mockUser}
      notifications={[{
        id: '1',
        title: 'Auto-évaluation',
        message: 'Votre auto-évaluation est à compléter avant le 30 juin',
        status: 'info',
        read: false,
        createdAt: new Date().toISOString()
      }]}
    >
      <Head title="Tableau de bord Chef de Secteur - SABC Évaluation 360°" />
      
      <div className="container mx-auto px-4 py-6">
        <h1 className="mb-6 text-2xl font-bold text-sabc-gray-900">Tableau de bord Chef de Secteur</h1>
        
        {/* Profil central avec avatar et badges */}
        <Card className="mb-8 overflow-hidden">
          <div className="flex flex-col bg-gradient-to-r from-sabc-red-primary to-sabc-red-dark p-6 text-white md:flex-row">
            <div className="flex items-center justify-center md:w-1/3">
              <div className="relative">
                <div className="flex h-32 w-32 items-center justify-center rounded-full bg-white text-4xl font-bold text-sabc-red-primary">
                  JT
                </div>
                <div className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-sabc-accent text-xs font-bold text-white">
                  4.2
                </div>
              </div>
            </div>
            <div className="mt-4 md:mt-0 md:w-2/3 md:pl-6">
              <h2 className="text-2xl font-bold">{mockUser.name}</h2>
              <p className="mb-2 text-sabc-red-light">Chef de Secteur - Douala Centre</p>
              <p className="mb-4">Membre de l'équipe SABC depuis 3 ans et 4 mois</p>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-medium">Ventes +15%</span>
                <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-medium">Leadership</span>
                <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-medium">Esprit d'équipe</span>
                <span className="rounded-full bg-sabc-accent px-3 py-1 text-xs font-medium">Talent 2025</span>
              </div>
            </div>
          </div>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <div className="rounded-lg bg-sabc-gray-50 p-4 text-center">
                <p className="text-sm text-sabc-gray-500">Performance Globale</p>
                <p className="text-2xl font-bold text-sabc-success">84%</p>
                <p className="text-xs text-sabc-success">↑ 2.3%</p>
              </div>
              <div className="rounded-lg bg-sabc-gray-50 p-4 text-center">
                <p className="text-sm text-sabc-gray-500">Objectifs Atteints</p>
                <p className="text-2xl font-bold text-sabc-accent">7/10</p>
                <p className="text-xs text-sabc-accent">En cours</p>
              </div>
              <div className="rounded-lg bg-sabc-gray-50 p-4 text-center">
                <p className="text-sm text-sabc-gray-500">Évaluations Reçues</p>
                <p className="text-2xl font-bold text-sabc-info">5</p>
                <p className="text-xs text-sabc-info">Complètes</p>
              </div>
              <div className="rounded-lg bg-sabc-gray-50 p-4 text-center">
                <p className="text-sm text-sabc-gray-500">Formations Suivies</p>
                <p className="text-2xl font-bold text-sabc-warning">3</p>
                <p className="text-xs text-sabc-warning">Ce semestre</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Comparaison avec les pairs et radar de compétences */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Radar de compétences */}
          <Card>
            <CardHeader>
              <CardTitle>Profil de Compétences</CardTitle>
              <CardDescription>Comparaison avec la moyenne des pairs</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {/* Simuler un graphique radar avec des barres de progression */}
              <div className="space-y-4">
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-sm font-medium">Leadership Commercial</span>
                    <span className="text-xs font-medium text-sabc-success">4.2/5</span>
                  </div>
                  <div className="flex h-2 w-full overflow-hidden rounded-full bg-sabc-gray-200">
                    <div className="h-full rounded-full bg-sabc-success" style={{ width: '84%' }}></div>
                    <div className="h-full w-px bg-white"></div>
                    <div className="h-full rounded-full bg-sabc-gray-400 opacity-30" style={{ width: '6%' }}></div>
                  </div>
                  <div className="mt-1 text-right text-xs text-sabc-gray-500">Moyenne: 3.9/5</div>
                </div>
                
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-sm font-medium">Gestion d'Équipe</span>
                    <span className="text-xs font-medium text-sabc-success">4.5/5</span>
                  </div>
                  <div className="flex h-2 w-full overflow-hidden rounded-full bg-sabc-gray-200">
                    <div className="h-full rounded-full bg-sabc-success" style={{ width: '90%' }}></div>
                    <div className="h-full w-px bg-white"></div>
                    <div className="h-full rounded-full bg-sabc-gray-400 opacity-30" style={{ width: '4%' }}></div>
                  </div>
                  <div className="mt-1 text-right text-xs text-sabc-gray-500">Moyenne: 4.3/5</div>
                </div>
                
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-sm font-medium">Connaissance Produits</span>
                    <span className="text-xs font-medium text-sabc-accent">3.8/5</span>
                  </div>
                  <div className="flex h-2 w-full overflow-hidden rounded-full bg-sabc-gray-200">
                    <div className="h-full rounded-full bg-sabc-accent" style={{ width: '76%' }}></div>
                    <div className="h-full w-px bg-white"></div>
                    <div className="h-full rounded-full bg-sabc-gray-400 opacity-30" style={{ width: '6%' }}></div>
                  </div>
                  <div className="mt-1 text-right text-xs text-sabc-gray-500">Moyenne: 4.1/5</div>
                </div>
                
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-sm font-medium">Orientation Résultats</span>
                    <span className="text-xs font-medium text-sabc-success">4.3/5</span>
                  </div>
                  <div className="flex h-2 w-full overflow-hidden rounded-full bg-sabc-gray-200">
                    <div className="h-full rounded-full bg-sabc-success" style={{ width: '86%' }}></div>
                    <div className="h-full w-px bg-white"></div>
                    <div className="h-full rounded-full bg-sabc-gray-400 opacity-30" style={{ width: '2%' }}></div>
                  </div>
                  <div className="mt-1 text-right text-xs text-sabc-gray-500">Moyenne: 4.2/5</div>
                </div>
                
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-sm font-medium">Innovation</span>
                    <span className="text-xs font-medium text-sabc-warning">3.5/5</span>
                  </div>
                  <div className="flex h-2 w-full overflow-hidden rounded-full bg-sabc-gray-200">
                    <div className="h-full rounded-full bg-sabc-warning" style={{ width: '70%' }}></div>
                    <div className="h-full w-px bg-white"></div>
                    <div className="h-full rounded-full bg-sabc-gray-400 opacity-30" style={{ width: '8%' }}></div>
                  </div>
                  <div className="mt-1 text-right text-xs text-sabc-gray-500">Moyenne: 3.9/5</div>
                </div>
              </div>
              
              <div className="mt-6 flex justify-center">
                <Button>Voir Rapport Complet</Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Plan de développement */}
          <Card>
            <CardHeader>
              <CardTitle>Plan de Développement</CardTitle>
              <CardDescription>Progression et prochaines étapes</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="relative space-y-6 pl-8 before:absolute before:left-3 before:top-0 before:h-full before:w-px before:bg-sabc-gray-200">
                {/* Étape 1 - Complétée */}
                <div className="relative">
                  <div className="absolute -left-8 flex h-6 w-6 items-center justify-center rounded-full bg-sabc-success text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="rounded-lg border border-sabc-gray-200 p-4">
                    <div className="mb-1 flex items-center justify-between">
                      <h4 className="font-medium text-sabc-gray-900">Formation Leadership</h4>
                      <span className="rounded-full bg-sabc-success/10 px-2 py-1 text-xs font-medium text-sabc-success">Complété</span>
                    </div>
                    <p className="text-sm text-sabc-gray-600">Formation sur les techniques de leadership commercial avancées</p>
                    <p className="mt-2 text-xs text-sabc-gray-500">Complété le 15 avril 2025</p>
                  </div>
                </div>
                
                {/* Étape 2 - En cours */}
                <div className="relative">
                  <div className="absolute -left-8 flex h-6 w-6 items-center justify-center rounded-full bg-sabc-accent text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="rounded-lg border-2 border-sabc-accent bg-sabc-accent/5 p-4">
                    <div className="mb-1 flex items-center justify-between">
                      <h4 className="font-medium text-sabc-gray-900">Mentorat Innovation</h4>
                      <span className="rounded-full bg-sabc-accent/10 px-2 py-1 text-xs font-medium text-sabc-accent">En cours</span>
                    </div>
                    <p className="text-sm text-sabc-gray-600">Programme de mentorat sur l'innovation commerciale</p>
                    <div className="mt-2 flex items-center justify-between">
                      <p className="text-xs text-sabc-gray-500">Progression: 2/5 sessions</p>
                      <Button size="sm" variant="outline">Détails</Button>
                    </div>
                  </div>
                </div>
                
                {/* Étape 3 - À venir */}
                <div className="relative">
                  <div className="absolute -left-8 flex h-6 w-6 items-center justify-center rounded-full bg-sabc-gray-400 text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <div className="rounded-lg border border-sabc-gray-200 p-4">
                    <div className="mb-1 flex items-center justify-between">
                      <h4 className="font-medium text-sabc-gray-900">Certification Vente</h4>
                      <span className="rounded-full bg-sabc-gray-200 px-2 py-1 text-xs font-medium text-sabc-gray-600">À venir</span>
                    </div>
                    <p className="text-sm text-sabc-gray-600">Certification en techniques de vente avancées</p>
                    <p className="mt-2 text-xs text-sabc-gray-500">Prévu pour août 2025</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Sections inférieures */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Pairs à évaluer */}
          <Card>
            <CardHeader>
              <CardTitle>Pairs à Évaluer</CardTitle>
              <CardDescription>Évaluations en attente de vos pairs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Pair 1 */}
                <div className="flex items-center justify-between rounded-lg border border-sabc-gray-200 p-4">
                  <div className="flex items-center">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sabc-info text-white">
                      AM
                    </div>
                    <div className="ml-3">
                      <p className="font-medium">Amadou Mbengue</p>
                      <p className="text-xs text-sabc-gray-500">Chef de Secteur • Douala Nord</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className="mr-3 rounded-full bg-sabc-error/10 px-2 py-1 text-xs font-medium text-sabc-error">
                      J-3
                    </span>
                    <Button size="sm">Évaluer</Button>
                  </div>
                </div>
                
                {/* Pair 2 */}
                <div className="flex items-center justify-between rounded-lg border border-sabc-gray-200 p-4">
                  <div className="flex items-center">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sabc-warning text-white">
                      FN
                    </div>
                    <div className="ml-3">
                      <p className="font-medium">Fatou Ndiaye</p>
                      <p className="text-xs text-sabc-gray-500">Chef de Secteur • Douala Sud</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className="mr-3 rounded-full bg-sabc-warning/10 px-2 py-1 text-xs font-medium text-sabc-warning">
                      J-5
                    </span>
                    <Button size="sm">Évaluer</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Auto-évaluation */}
          <Card>
            <CardHeader>
              <CardTitle>Auto-Évaluation</CardTitle>
              <CardDescription>Votre auto-évaluation du semestre</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-sabc-red-light bg-sabc-red-light/10 p-4 text-sabc-red-primary">
                <div className="mb-2 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h4 className="font-medium">Auto-évaluation à compléter</h4>
                </div>
                <p className="mb-4 text-sm">Vous n'avez pas encore complété votre auto-évaluation pour ce semestre. La date limite est le 30 juin 2025.</p>
                <Button>Compléter mon auto-évaluation</Button>
              </div>
              
              <div className="mt-4">
                <h4 className="mb-2 font-medium">Progression des objectifs</h4>
                <div className="space-y-3">
                  <div>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-sm">Atteindre 95% des objectifs de vente</span>
                      <span className="text-xs font-medium text-sabc-success">85%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-sabc-gray-200">
                      <div className="h-full rounded-full bg-sabc-success" style={{ width: '85%' }}></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-sm">Former 3 nouveaux vendeurs</span>
                      <span className="text-xs font-medium text-sabc-accent">67%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-sabc-gray-200">
                      <div className="h-full rounded-full bg-sabc-accent" style={{ width: '67%' }}></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-sm">Réduire les réclamations clients de 15%</span>
                      <span className="text-xs font-medium text-sabc-success">100%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-sabc-gray-200">
                      <div className="h-full rounded-full bg-sabc-success" style={{ width: '100%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default CDSDashboard;
