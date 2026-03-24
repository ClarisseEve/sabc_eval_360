import React, { useState } from 'react';
import { Head, usePage, Link } from '@inertiajs/react';
import AppLayout from '@/Components/Layout/app/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/UI/Card/Card';
import { Button } from '@/Components/UI/Button/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/Components/UI/Tabs/Tabs';

/**
 * Tableau de bord du Chef Département Trade (CDTT)
 * 
 * Spécifications selon les règles métier SABC :
 * - Dual view : Onglets Commercial/Marketing
 * - Cards équipe : Avatars circulaires colorés
 * - États : "En cours", "Terminé", "À évaluer"
 * - Analytics : Radar charts comparatifs
 */
const CDTTDashboard: React.FC = () => {
  const { auth } = usePage<any>().props;
  const mockUser = {
    name: auth?.user?.name || [auth?.user?.prenom, auth?.user?.nom].filter(Boolean).join(' ') || 'Utilisateur',
    email: auth?.user?.email || '',
    role: auth?.user?.role?.nom_role || auth?.user?.role_nom || 'CDTT',
    avatar: auth?.user?.avatar,
  };
  
  return (
    <AppLayout
      user={mockUser}
      notifications={[{
        id: '1',
        title: 'Validation requise',
        message: 'Nouvelles évaluations à valider',
        status: 'info',
        read: false,
        createdAt: new Date().toISOString()
      }]}
    >
      <Head title="Tableau de bord Chef Département Trade - SABC Évaluation 360°" />
      
      <div className="container mx-auto px-4 py-6">
        <h1 className="mb-6 text-2xl font-bold text-sabc-gray-900">Tableau de bord Chef Département Trade</h1>
        
        {/* Tabs Commercial/Marketing */}
        <Tabs defaultValue="commercial" className="w-full">
          <TabsList className="mb-6 grid w-full grid-cols-2">
            <TabsTrigger value="commercial">Commercial</TabsTrigger>
            <TabsTrigger value="marketing">Marketing</TabsTrigger>
          </TabsList>
          
          {/* Contenu Tab Commercial */}
          <TabsContent value="commercial">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* KPIs Commercial */}
              <Card className="border-l-4 border-l-sabc-red-primary">
                <CardHeader className="pb-2">
                  <CardTitle>Performance Commerciale</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-bold text-sabc-gray-900">82%</h3>
                    <span className="rounded-full bg-sabc-success/10 px-2 py-1 text-xs font-medium text-sabc-success">↑ 3.5%</span>
                  </div>
                  <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-sabc-gray-200">
                    <div className="h-full rounded-full bg-sabc-red-primary" style={{ width: '82%' }}></div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Évaluations en cours */}
              <Card className="border-l-4 border-l-sabc-accent">
                <CardHeader className="pb-2">
                  <CardTitle>Évaluations en cours</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-bold text-sabc-gray-900">12</h3>
                    <span className="rounded-full bg-sabc-accent/10 px-2 py-1 text-xs font-medium text-sabc-accent">En cours</span>
                  </div>
                  <Button className="mt-4" size="sm">Voir détails</Button>
                </CardContent>
              </Card>
              
              {/* Évaluations à valider */}
              <Link href="/common/evaluations/a-valider">
                <Card className="border-l-4 border-l-amber-400 cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <CardTitle>Évaluations à valider</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-sabc-gray-500 mt-0.5">Soumises par vos subordonnés</div>
                      <div className="text-2xl text-amber-500">&#8594;</div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>
            
            {/* Liste des collaborateurs commerciaux */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Équipe Commerciale</CardTitle>
                <CardDescription>Statut des évaluations par collaborateur</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Collaborateur 1 */}
                  <div className="flex items-center justify-between rounded-lg border border-sabc-gray-200 p-4">
                    <div className="flex items-center">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sabc-red-primary text-white">
                        PK
                      </div>
                      <div className="ml-3">
                        <p className="font-medium">Pierre Kamga</p>
                        <p className="text-xs text-sabc-gray-500">Chef Service Commercial</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-sabc-success/10 px-2 py-1 text-xs font-medium text-sabc-success">Terminé</span>
                      <Button size="sm" variant="outline">Voir profil</Button>
                    </div>
                  </div>
                  
                  {/* Collaborateur 2 */}
                  <div className="flex items-center justify-between rounded-lg border border-sabc-gray-200 p-4">
                    <div className="flex items-center">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sabc-accent text-white">
                        MD
                      </div>
                      <div className="ml-3">
                        <p className="font-medium">Marie Diop</p>
                        <p className="text-xs text-sabc-gray-500">Chef District Vente</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-sabc-warning/10 px-2 py-1 text-xs font-medium text-sabc-warning">En cours</span>
                      <Button size="sm" variant="outline">Voir profil</Button>
                    </div>
                  </div>
                  
                  {/* Collaborateur 3 */}
                  <div className="flex items-center justify-between rounded-lg border border-sabc-gray-200 p-4">
                    <div className="flex items-center">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sabc-info text-white">
                        JT
                      </div>
                      <div className="ml-3">
                        <p className="font-medium">Jean Tamba</p>
                        <p className="text-xs text-sabc-gray-500">Chef de Secteur</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-sabc-error/10 px-2 py-1 text-xs font-medium text-sabc-error">À évaluer</span>
                      <Button size="sm" variant="outline">Voir profil</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Contenu Tab Marketing */}
          <TabsContent value="marketing">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* KPIs Marketing */}
              <Card className="border-l-4 border-l-sabc-info">
                <CardHeader className="pb-2">
                  <CardTitle>Performance Marketing</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-bold text-sabc-gray-900">78%</h3>
                    <span className="rounded-full bg-sabc-success/10 px-2 py-1 text-xs font-medium text-sabc-success">↑ 2.1%</span>
                  </div>
                  <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-sabc-gray-200">
                    <div className="h-full rounded-full bg-sabc-info" style={{ width: '78%' }}></div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Campagnes en cours */}
              <Card className="border-l-4 border-l-sabc-accent">
                <CardHeader className="pb-2">
                  <CardTitle>Campagnes actives</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-bold text-sabc-gray-900">4</h3>
                    <span className="rounded-full bg-sabc-accent/10 px-2 py-1 text-xs font-medium text-sabc-accent">En cours</span>
                  </div>
                  <Button className="mt-4" size="sm">Voir campagnes</Button>
                </CardContent>
              </Card>
              
              {/* Budget utilisé */}
              <Card className="border-l-4 border-l-sabc-success">
                <CardHeader className="pb-2">
                  <CardTitle>Budget utilisé</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-bold text-sabc-gray-900">65%</h3>
                    <span className="rounded-full bg-sabc-success/10 px-2 py-1 text-xs font-medium text-sabc-success">Conforme</span>
                  </div>
                  <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-sabc-gray-200">
                    <div className="h-full rounded-full bg-sabc-success" style={{ width: '65%' }}></div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Liste des collaborateurs marketing */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Équipe Marketing</CardTitle>
                <CardDescription>Statut des évaluations par collaborateur</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Collaborateur 1 */}
                  <div className="flex items-center justify-between rounded-lg border border-sabc-gray-200 p-4">
                    <div className="flex items-center">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sabc-info text-white">
                        LM
                      </div>
                      <div className="ml-3">
                        <p className="font-medium">Lucie Mbarga</p>
                        <p className="text-xs text-sabc-gray-500">Regional Trade Marketing</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-sabc-success/10 px-2 py-1 text-xs font-medium text-sabc-success">Terminé</span>
                      <Button size="sm" variant="outline">Voir profil</Button>
                    </div>
                  </div>
                  
                  {/* Collaborateur 2 */}
                  <div className="flex items-center justify-between rounded-lg border border-sabc-gray-200 p-4">
                    <div className="flex items-center">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sabc-accent text-white">
                        RA
                      </div>
                      <div className="ml-3">
                        <p className="font-medium">Robert Atangana</p>
                        <p className="text-xs text-sabc-gray-500">Superviseur Sponsoring</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-sabc-warning/10 px-2 py-1 text-xs font-medium text-sabc-warning">En cours</span>
                      <Button size="sm" variant="outline">Voir profil</Button>
                    </div>
                  </div>
                  
                  {/* Collaborateur 3 */}
                  <div className="flex items-center justify-between rounded-lg border border-sabc-gray-200 p-4">
                    <div className="flex items-center">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sabc-warning text-white">
                        CN
                      </div>
                      <div className="ml-3">
                        <p className="font-medium">Claire Ngo</p>
                        <p className="text-xs text-sabc-gray-500">Trade Marketing Operator</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-sabc-error/10 px-2 py-1 text-xs font-medium text-sabc-error">À évaluer</span>
                      <Button size="sm" variant="outline">Voir profil</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default CDTTDashboard;