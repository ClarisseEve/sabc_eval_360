import React from 'react';
import { Head, usePage } from '@inertiajs/react';
import AppLayout from '@/Components/Layout/app/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/UI/Card/Card';
import { Button } from '@/Components/UI/Button/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/Components/UI/Tabs/Tabs';

/**
 * Tableau de bord du Superviseur Sponsoring (SS)
 * 
 * Spécifications selon les règles métier SABC :
 * - Focus équipe : Table avec progressions
 * - Métriques : 4 KPIs en cards horizontales
 * - Plans d'action : Cards bordures colorées
 * - Avatars : Initiales cercles colorés
 */
const SSDashboard: React.FC = () => {
  const { auth } = usePage<any>().props;
  const mockUser = {
    name: auth?.user?.name || [auth?.user?.prenom, auth?.user?.nom].filter(Boolean).join(' ') || 'Utilisateur',
    email: auth?.user?.email || '',
    role: auth?.user?.role?.nom_role || auth?.user?.role_nom || 'SS',
    avatar: auth?.user?.avatar,
  };
  
  return (
    <AppLayout
      user={mockUser}
      notifications={[{
        id: '1',
        title: 'Évaluations à compléter',
        message: 'Vous avez 5 évaluations en attente',
        status: 'warning',
        read: false,
        createdAt: new Date().toISOString()
      }]}
    >
      <Head title="Tableau de bord Superviseur Sponsoring - SABC Évaluation 360°" />
      
      <div className="container mx-auto px-4 py-6">
        <h1 className="mb-6 text-2xl font-bold text-sabc-gray-900">Tableau de bord Superviseur Sponsoring</h1>
        
        {/* KPIs - 4 métriques en cards horizontales */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* KPI 1 - Performance Sponsoring */}
          <Card className="border-l-4 border-l-sabc-info">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-sabc-gray-500">Performance Sponsoring</p>
                  <h3 className="mt-1 text-2xl font-bold text-sabc-gray-900">82%</h3>
                </div>
                <div className="rounded-full bg-sabc-info/10 p-2 text-sabc-info">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
              <div className="mt-2 flex items-center">
                <span className="text-xs font-medium text-sabc-success">↑ 4.2%</span>
                <span className="ml-1 text-xs text-sabc-gray-500">vs période précédente</span>
              </div>
            </CardContent>
          </Card>
          
          {/* KPI 2 - Évaluations Complétées */}
          <Card className="border-l-4 border-l-sabc-red-primary">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-sabc-gray-500">Évaluations Complétées</p>
                  <h3 className="mt-1 text-2xl font-bold text-sabc-gray-900">70%</h3>
                </div>
                <div className="rounded-full bg-sabc-red-light p-2 text-sabc-red-primary">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
              </div>
              <div className="mt-2 flex items-center">
                <span className="text-xs font-medium text-sabc-success">↑ 2.5%</span>
                <span className="ml-1 text-xs text-sabc-gray-500">vs période précédente</span>
              </div>
            </CardContent>
          </Card>
          
          {/* KPI 3 - Événements Sponsorisés */}
          <Card className="border-l-4 border-l-sabc-success">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-sabc-gray-500">Événements Sponsorisés</p>
                  <h3 className="mt-1 text-2xl font-bold text-sabc-gray-900">8</h3>
                </div>
                <div className="rounded-full bg-sabc-success/10 p-2 text-sabc-success">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                  </svg>
                </div>
              </div>
              <div className="mt-2 flex items-center">
                <span className="text-xs font-medium text-sabc-success">+2 nouveaux</span>
              </div>
            </CardContent>
          </Card>
          
          {/* KPI 4 - ROI Sponsoring */}
          <Card className="border-l-4 border-l-sabc-accent">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-sabc-gray-500">ROI Sponsoring</p>
                  <h3 className="mt-1 text-2xl font-bold text-sabc-gray-900">135%</h3>
                </div>
                <div className="rounded-full bg-sabc-accent-light p-2 text-sabc-accent">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="mt-2 flex items-center">
                <span className="text-xs font-medium text-sabc-success">↑ 5.2%</span>
                <span className="ml-1 text-xs text-sabc-gray-500">vs période précédente</span>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Onglets pour les différentes sections */}
        <Tabs defaultValue="team" className="mb-6">
          <TabsList className="mb-4 grid w-full grid-cols-3">
            <TabsTrigger value="team">Équipe</TabsTrigger>
            <TabsTrigger value="events">Événements</TabsTrigger>
            <TabsTrigger value="actions">Plans d'Action</TabsTrigger>
          </TabsList>
          
          {/* Onglet Équipe */}
          <TabsContent value="team">
            <Card>
              <CardHeader>
                <CardTitle>Performance Équipe Sponsoring</CardTitle>
                <CardDescription>Suivi des performances et progression des évaluations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full table-auto">
                    <thead>
                      <tr className="border-b border-sabc-gray-200">
                        <th className="pb-3 text-left font-medium text-sabc-gray-500">Collaborateur</th>
                        <th className="pb-3 text-left font-medium text-sabc-gray-500">Poste</th>
                        <th className="pb-3 text-left font-medium text-sabc-gray-500">Performance</th>
                        <th className="pb-3 text-left font-medium text-sabc-gray-500">Évaluations</th>
                        <th className="pb-3 text-left font-medium text-sabc-gray-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-sabc-gray-100">
                      {/* Collaborateur 1 */}
                      <tr>
                        <td className="py-3">
                          <div className="flex items-center">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sabc-success text-white">
                              JN
                            </div>
                            <div className="ml-3">
                              <p className="font-medium">Jacques Nkodo</p>
                              <p className="text-xs text-sabc-gray-500">jacques.n@sabc.com</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3">AS</td>
                        <td className="py-3">
                          <span className="rounded-full bg-sabc-success/10 px-2 py-1 text-xs font-medium text-sabc-success">92%</span>
                        </td>
                        <td className="py-3 pr-4">
                          <div className="flex items-center">
                            <div className="mr-2 text-sm font-medium">9/10</div>
                            <div className="h-2 w-24 overflow-hidden rounded-full bg-sabc-gray-200">
                              <div className="h-full rounded-full bg-sabc-success" style={{ width: '90%' }}></div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3">
                          <Button size="sm" variant="outline">Évaluer</Button>
                        </td>
                      </tr>
                      
                      {/* Collaborateur 2 */}
                      <tr>
                        <td className="py-3">
                          <div className="flex items-center">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sabc-accent text-white">
                              FM
                            </div>
                            <div className="ml-3">
                              <p className="font-medium">Fatou Mbaye</p>
                              <p className="text-xs text-sabc-gray-500">fatou.m@sabc.com</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3">AS</td>
                        <td className="py-3">
                          <span className="rounded-full bg-sabc-accent/10 px-2 py-1 text-xs font-medium text-sabc-accent">78%</span>
                        </td>
                        <td className="py-3 pr-4">
                          <div className="flex items-center">
                            <div className="mr-2 text-sm font-medium">7/10</div>
                            <div className="h-2 w-24 overflow-hidden rounded-full bg-sabc-gray-200">
                              <div className="h-full rounded-full bg-sabc-accent" style={{ width: '70%' }}></div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3">
                          <Button size="sm" variant="outline">Évaluer</Button>
                        </td>
                      </tr>
                      
                      {/* Collaborateur 3 */}
                      <tr>
                        <td className="py-3">
                          <div className="flex items-center">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sabc-warning text-white">
                              PK
                            </div>
                            <div className="ml-3">
                              <p className="font-medium">Patrick Kamga</p>
                              <p className="text-xs text-sabc-gray-500">patrick.k@sabc.com</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3">AS</td>
                        <td className="py-3">
                          <span className="rounded-full bg-sabc-warning/10 px-2 py-1 text-xs font-medium text-sabc-warning">68%</span>
                        </td>
                        <td className="py-3 pr-4">
                          <div className="flex items-center">
                            <div className="mr-2 text-sm font-medium">5/10</div>
                            <div className="h-2 w-24 overflow-hidden rounded-full bg-sabc-gray-200">
                              <div className="h-full rounded-full bg-sabc-warning" style={{ width: '50%' }}></div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3">
                          <Button size="sm" variant="outline">Évaluer</Button>
                        </td>
                      </tr>
                      
                      {/* Collaborateur 4 */}
                      <tr>
                        <td className="py-3">
                          <div className="flex items-center">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sabc-error text-white">
                              SB
                            </div>
                            <div className="ml-3">
                              <p className="font-medium">Sophie Biya</p>
                              <p className="text-xs text-sabc-gray-500">sophie.b@sabc.com</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3">AS</td>
                        <td className="py-3">
                          <span className="rounded-full bg-sabc-error/10 px-2 py-1 text-xs font-medium text-sabc-error">55%</span>
                        </td>
                        <td className="py-3 pr-4">
                          <div className="flex items-center">
                            <div className="mr-2 text-sm font-medium">3/10</div>
                            <div className="h-2 w-24 overflow-hidden rounded-full bg-sabc-gray-200">
                              <div className="h-full rounded-full bg-sabc-error" style={{ width: '30%' }}></div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3">
                          <Button size="sm" variant="outline">Évaluer</Button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Onglet Événements */}
          <TabsContent value="events">
            <Card>
              <CardHeader>
                <CardTitle>Événements Sponsorisés</CardTitle>
                <CardDescription>Suivi des événements et performances</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Événement 1 */}
                  <div className="rounded-lg border border-sabc-gray-200 p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <h4 className="font-medium">Tournoi de Football Inter-Écoles</h4>
                      <span className="rounded-full bg-sabc-success/10 px-2 py-1 text-xs font-medium text-sabc-success">
                        En cours
                      </span>
                    </div>
                    <p className="mb-2 text-sm text-sabc-gray-600">Sponsoring du tournoi scolaire dans la région Centre</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="text-xs font-medium text-sabc-gray-500">Impact: 85%</span>
                        <div className="ml-2 h-2 w-24 overflow-hidden rounded-full bg-sabc-gray-200">
                          <div className="h-full rounded-full bg-sabc-success" style={{ width: '85%' }}></div>
                        </div>
                      </div>
                      <Button size="sm" variant="outline">Détails</Button>
                    </div>
                  </div>
                  
                  {/* Événement 2 */}
                  <div className="rounded-lg border border-sabc-gray-200 p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <h4 className="font-medium">Festival Culturel Yaoundé</h4>
                      <span className="rounded-full bg-sabc-accent/10 px-2 py-1 text-xs font-medium text-sabc-accent">
                        Planifié
                      </span>
                    </div>
                    <p className="mb-2 text-sm text-sabc-gray-600">Sponsoring du festival culturel annuel de Yaoundé</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="text-xs font-medium text-sabc-gray-500">Préparation: 60%</span>
                        <div className="ml-2 h-2 w-24 overflow-hidden rounded-full bg-sabc-gray-200">
                          <div className="h-full rounded-full bg-sabc-accent" style={{ width: '60%' }}></div>
                        </div>
                      </div>
                      <Button size="sm" variant="outline">Détails</Button>
                    </div>
                  </div>
                  
                  {/* Événement 3 */}
                  <div className="rounded-lg border border-sabc-gray-200 p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <h4 className="font-medium">Compétition Sportive Universitaire</h4>
                      <span className="rounded-full bg-sabc-info/10 px-2 py-1 text-xs font-medium text-sabc-info">
                        À venir
                      </span>
                    </div>
                    <p className="mb-2 text-sm text-sabc-gray-600">Sponsoring des jeux universitaires nationaux</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="text-xs font-medium text-sabc-gray-500">Préparation: 25%</span>
                        <div className="ml-2 h-2 w-24 overflow-hidden rounded-full bg-sabc-gray-200">
                          <div className="h-full rounded-full bg-sabc-info" style={{ width: '25%' }}></div>
                        </div>
                      </div>
                      <Button size="sm" variant="outline">Détails</Button>
                    </div>
                  </div>
                  
                  {/* Événement 4 */}
                  <div className="rounded-lg border border-sabc-gray-200 p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <h4 className="font-medium">Conférence Entrepreneuriat</h4>
                      <span className="rounded-full bg-sabc-success/10 px-2 py-1 text-xs font-medium text-sabc-success">
                        Terminé
                      </span>
                    </div>
                    <p className="mb-2 text-sm text-sabc-gray-600">Sponsoring de la conférence sur l'entrepreneuriat local</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="text-xs font-medium text-sabc-gray-500">Impact: 92%</span>
                        <div className="ml-2 h-2 w-24 overflow-hidden rounded-full bg-sabc-gray-200">
                          <div className="h-full rounded-full bg-sabc-success" style={{ width: '92%' }}></div>
                        </div>
                      </div>
                      <Button size="sm" variant="outline">Rapport</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Onglet Plans d'Action */}
          <TabsContent value="actions">
            <Card>
              <CardHeader>
                <CardTitle>Plans d'Action</CardTitle>
                <CardDescription>Actions prioritaires pour améliorer la performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Action 1 */}
                  <Card className="border-l-4 border-l-sabc-error bg-sabc-error/5">
                    <CardContent className="p-4">
                      <h4 className="font-medium text-sabc-error">Compléter les Évaluations</h4>
                      <p className="mt-1 text-sm text-sabc-gray-600">Finaliser les évaluations en retard de l'équipe sponsoring</p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-xs font-medium text-sabc-gray-500">Priorité haute</span>
                        <Button variant="destructive" size="sm">Commencer</Button>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Action 2 */}
                  <Card className="border-l-4 border-l-sabc-warning bg-sabc-warning/5">
                    <CardContent className="p-4">
                      <h4 className="font-medium text-sabc-warning">Analyse ROI Événements</h4>
                      <p className="mt-1 text-sm text-sabc-gray-600">Analyser le retour sur investissement des derniers événements</p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-xs font-medium text-sabc-gray-500">Priorité moyenne</span>
                        <Button variant="outline" size="sm">Voir détails</Button>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Action 3 */}
                  <Card className="border-l-4 border-l-sabc-success bg-sabc-success/5">
                    <CardContent className="p-4">
                      <h4 className="font-medium text-sabc-success">Formation Équipe</h4>
                      <p className="mt-1 text-sm text-sabc-gray-600">Organiser une formation sur les nouvelles techniques de sponsoring</p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-xs font-medium text-sabc-gray-500">Priorité normale</span>
                        <Button variant="outline" size="sm">Planifier</Button>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Action 4 */}
                  <Card className="border-l-4 border-l-sabc-info bg-sabc-info/5">
                    <CardContent className="p-4">
                      <h4 className="font-medium text-sabc-info">Planification Budget</h4>
                      <p className="mt-1 text-sm text-sabc-gray-600">Préparer le budget sponsoring pour le prochain trimestre</p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-xs font-medium text-sabc-gray-500">Priorité normale</span>
                        <Button variant="outline" size="sm">Commencer</Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default SSDashboard;
