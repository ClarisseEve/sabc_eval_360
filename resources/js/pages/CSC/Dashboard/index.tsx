import React from 'react';
import { Head, usePage, Link } from '@inertiajs/react';
import AppLayout from '@/Components/Layout/app/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/UI/Card/Card';
import { Button } from '@/Components/UI/Button/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/Components/UI/Tabs/Tabs';

/**
 * Tableau de bord du Chef Service Commercial (CSC)
 * 
 * Spécifications selon les règles métier SABC :
 * - Focus équipe : Table avec progressions
 * - Métriques : 4 KPIs en cards horizontales
 * - Plans d'action : Cards bordures colorées
 * - Avatars : Initiales cercles colorés
 */
const CSCDashboard: React.FC = () => {
  const { auth } = usePage<any>().props;
  const mockUser = {
    name: auth?.user?.name || [auth?.user?.prenom, auth?.user?.nom].filter(Boolean).join(' ') || 'Utilisateur',
    email: auth?.user?.email || '',
    role: auth?.user?.role?.nom_role || auth?.user?.role_nom || 'CSC',
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
      <Head title="Tableau de bord Chef Service Commercial - SABC Évaluation 360°" />
      
      <div className="container mx-auto px-4 py-6">
        <h1 className="mb-6 text-2xl font-bold text-sabc-gray-900">Tableau de bord Chef Service Commercial</h1>
        
        {/* KPIs - 4 métriques en cards horizontales */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* KPI 1 - Performance Service */}
          <Card className="border-l-4 border-l-sabc-info">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-sabc-gray-500">Performance Service</p>
                  <h3 className="mt-1 text-2xl font-bold text-sabc-gray-900">82%</h3>
                </div>
                <div className="rounded-full bg-sabc-info/10 p-2 text-sabc-info">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
              <div className="mt-2 flex items-center">
                <span className="text-xs font-medium text-sabc-success">↑ 2.5%</span>
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
                  <h3 className="mt-1 text-2xl font-bold text-sabc-gray-900">72%</h3>
                </div>
                <div className="rounded-full bg-sabc-red-light p-2 text-sabc-red-primary">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
              </div>
              <div className="mt-2 flex items-center">
                <span className="text-xs font-medium text-sabc-success">↑ 3.2%</span>
                <span className="ml-1 text-xs text-sabc-gray-500">vs période précédente</span>
              </div>
            </CardContent>
          </Card>
          
          {/* KPI 3 - Talents Identifiés */}
          <Card className="border-l-4 border-l-sabc-success">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-sabc-gray-500">Talents Identifiés</p>
                  <h3 className="mt-1 text-2xl font-bold text-sabc-gray-900">5</h3>
                </div>
                <div className="rounded-full bg-sabc-success/10 p-2 text-sabc-success">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </div>
              </div>
              <div className="mt-2 flex items-center">
                <span className="text-xs font-medium text-sabc-success">+2 nouveaux</span>
              </div>
            </CardContent>
          </Card>
          
          {/* KPI 4 - Objectifs Atteints */}
          <Card className="border-l-4 border-l-sabc-accent">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-sabc-gray-500">Objectifs Atteints</p>
                  <h3 className="mt-1 text-2xl font-bold text-sabc-gray-900">85%</h3>
                </div>
                <div className="rounded-full bg-sabc-accent-light p-2 text-sabc-accent">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="mt-2 flex items-center">
                <span className="text-xs font-medium text-sabc-warning">↓ 1.5%</span>
                <span className="ml-1 text-xs text-sabc-gray-500">vs période précédente</span>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Table équipe avec progressions */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Performance Équipe</CardTitle>
            <CardDescription>Suivi des performances et progression des évaluations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="border-b border-sabc-gray-200">
                    <th className="pb-3 text-left font-medium text-sabc-gray-500">Chef District</th>
                    <th className="pb-3 text-left font-medium text-sabc-gray-500">District</th>
                    <th className="pb-3 text-left font-medium text-sabc-gray-500">Performance</th>
                    <th className="pb-3 text-left font-medium text-sabc-gray-500">Évaluations</th>
                    <th className="pb-3 text-left font-medium text-sabc-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sabc-gray-100">
                  {/* Chef District 1 */}
                  <tr>
                    <td className="py-3">
                      <div className="flex items-center">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sabc-success text-white">
                          MD
                        </div>
                        <div className="ml-3">
                          <p className="font-medium">Marie Diop</p>
                          <p className="text-xs text-sabc-gray-500">marie.diop@sabc.com</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3">Littoral Centre</td>
                    <td className="py-3">
                      <span className="rounded-full bg-sabc-success/10 px-2 py-1 text-xs font-medium text-sabc-success">92%</span>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center">
                        <div className="mr-2 text-sm font-medium">8/10</div>
                        <div className="h-2 w-24 overflow-hidden rounded-full bg-sabc-gray-200">
                          <div className="h-full rounded-full bg-sabc-success" style={{ width: '80%' }}></div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3">
                      <Button size="sm" variant="outline">Évaluer</Button>
                    </td>
                  </tr>
                  
                  {/* Chef District 2 */}
                  <tr>
                    <td className="py-3">
                      <div className="flex items-center">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sabc-accent text-white">
                          PK
                        </div>
                        <div className="ml-3">
                          <p className="font-medium">Pierre Kamdem</p>
                          <p className="text-xs text-sabc-gray-500">pierre.k@sabc.com</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3">Littoral Nord</td>
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
                  
                  {/* Chef District 3 */}
                  <tr>
                    <td className="py-3">
                      <div className="flex items-center">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sabc-warning text-white">
                          JN
                        </div>
                        <div className="ml-3">
                          <p className="font-medium">Jean Nkoulou</p>
                          <p className="text-xs text-sabc-gray-500">jean.n@sabc.com</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3">Littoral Sud</td>
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
                  
                  {/* Chef District 4 */}
                  <tr>
                    <td className="py-3">
                      <div className="flex items-center">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sabc-error text-white">
                          SF
                        </div>
                        <div className="ml-3">
                          <p className="font-medium">Sophie Foka</p>
                          <p className="text-xs text-sabc-gray-500">sophie.f@sabc.com</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3">Littoral Est</td>
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
        
        {/* Validations en attente */}
        <div className="mb-6">
          <Link href="/common/evaluations/a-valider">
            <Card className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-amber-400">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-600">Évaluations à valider</div>
                    <div className="text-xs text-gray-400 mt-0.5">Soumises par vos subordonnés</div>
                  </div>
                  <div className="text-2xl text-amber-500">&#8594;</div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Sections inférieures */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Évaluations en attente */}
          <Card>
            <CardHeader>
              <CardTitle>Évaluations en Attente</CardTitle>
              <CardDescription>Évaluations à compléter dans les prochains jours</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Évaluation 1 */}
                <div className="flex items-center justify-between rounded-lg border border-sabc-gray-200 p-4">
                  <div className="flex items-center">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sabc-accent text-white">
                      PK
                    </div>
                    <div className="ml-3">
                      <p className="font-medium">Pierre Kamdem</p>
                      <p className="text-xs text-sabc-gray-500">Chef District Vente • Littoral Nord</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className="mr-3 rounded-full bg-sabc-error/10 px-2 py-1 text-xs font-medium text-sabc-error">
                      J-2
                    </span>
                    <Button size="sm">Évaluer</Button>
                  </div>
                </div>
                
                {/* Évaluation 2 */}
                <div className="flex items-center justify-between rounded-lg border border-sabc-gray-200 p-4">
                  <div className="flex items-center">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sabc-warning text-white">
                      JN
                    </div>
                    <div className="ml-3">
                      <p className="font-medium">Jean Nkoulou</p>
                      <p className="text-xs text-sabc-gray-500">Chef District Vente • Littoral Sud</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className="mr-3 rounded-full bg-sabc-warning/10 px-2 py-1 text-xs font-medium text-sabc-warning">
                      J-5
                    </span>
                    <Button size="sm">Évaluer</Button>
                  </div>
                </div>
                
                {/* Évaluation 3 */}
                <div className="flex items-center justify-between rounded-lg border border-sabc-gray-200 p-4">
                  <div className="flex items-center">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sabc-error text-white">
                      SF
                    </div>
                    <div className="ml-3">
                      <p className="font-medium">Sophie Foka</p>
                      <p className="text-xs text-sabc-gray-500">Chef District Vente • Littoral Est</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className="mr-3 rounded-full bg-sabc-info/10 px-2 py-1 text-xs font-medium text-sabc-info">
                      J-7
                    </span>
                    <Button size="sm">Évaluer</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Plans d'action */}
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
                    <h4 className="font-medium text-sabc-error">Suivi District Est</h4>
                    <p className="mt-1 text-sm text-sabc-gray-600">Planifier une réunion d'urgence avec l'équipe du district Est</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs font-medium text-sabc-gray-500">Priorité haute</span>
                      <Button variant="destructive" size="sm">Planifier</Button>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Action 2 */}
                <Card className="border-l-4 border-l-sabc-warning bg-sabc-warning/5">
                  <CardContent className="p-4">
                    <h4 className="font-medium text-sabc-warning">Formation Évaluation</h4>
                    <p className="mt-1 text-sm text-sabc-gray-600">Organiser une formation sur les techniques d'évaluation</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs font-medium text-sabc-gray-500">Priorité moyenne</span>
                      <Button variant="outline" size="sm">Voir détails</Button>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Action 3 */}
                <Card className="border-l-4 border-l-sabc-success bg-sabc-success/5">
                  <CardContent className="p-4">
                    <h4 className="font-medium text-sabc-success">Reconnaissance Talents</h4>
                    <p className="mt-1 text-sm text-sabc-gray-600">Mettre en place un programme de reconnaissance des talents</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs font-medium text-sabc-gray-500">Priorité normale</span>
                      <Button variant="outline" size="sm">Voir détails</Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default CSCDashboard;
