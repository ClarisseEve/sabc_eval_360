import React from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/Components/Layout/app/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/UI/Card/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/UI/Table/Table';
import { Badge } from '@/Components/UI/Badge/Badge';

interface MarketingProps {
  auth: {
    user: {
      name: string;
      email: string;
      role: string;
      avatar?: string;
    }
  };
}

export default function Marketing({ auth }: MarketingProps) {
  // Données de démonstration pour la branche marketing
  const marketingData = {
    rtmList: [
      { id: 1, name: 'Claire Meka', region: 'Littoral', performance: 94, evaluations: 8, status: 'actif' },
      { id: 2, name: 'Robert Nkodo', region: 'Centre', performance: 87, evaluations: 7, status: 'actif' },
    ],
    tmoList: [
      { id: 1, name: 'Émilie Fouda', zone: 'Douala Centre', rtm: 'Claire Meka', performance: 88, status: 'actif' },
      { id: 2, name: 'Michel Ateba', zone: 'Douala Nord', rtm: 'Claire Meka', performance: 82, status: 'actif' },
      { id: 3, name: 'Julien Mbarga', zone: 'Yaoundé Centre', rtm: 'Robert Nkodo', performance: 90, status: 'actif' },
      { id: 4, name: 'Carine Essomba', zone: 'Yaoundé Nord', rtm: 'Robert Nkodo', performance: 85, status: 'actif' },
    ],
    performanceStats: {
      global: 88,
      previousPeriod: 84,
      bestRegion: 'Littoral',
      bestScore: 94,
      evaluationsCompleted: 15,
      totalEvaluations: 15
    }
  };

  return (
    <AppLayout user={auth.user}>
      <Head title="Branche Marketing - Chef Département Trade" />
      
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-semibold text-sabc-gray-900 mb-6">Branche Marketing</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance globale</CardTitle>
                <CardDescription>Branche marketing</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                <div className="text-5xl font-bold text-sabc-red-primary">{marketingData.performanceStats.global}%</div>
                <div className="text-sm text-sabc-gray-400 mt-2">
                  +{marketingData.performanceStats.global - marketingData.performanceStats.previousPeriod}% vs période précédente
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Meilleure région</CardTitle>
                <CardDescription>Performance la plus élevée</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                <div className="text-xl font-bold text-sabc-gray-800">{marketingData.performanceStats.bestRegion}</div>
                <div className="text-5xl font-bold text-sabc-success mt-2">{marketingData.performanceStats.bestScore}%</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Évaluations</CardTitle>
                <CardDescription>Progression du cycle</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                <div className="text-5xl font-bold text-sabc-accent">
                  {Math.round(marketingData.performanceStats.evaluationsCompleted / marketingData.performanceStats.totalEvaluations * 100)}%
                </div>
                <div className="text-sm text-sabc-gray-400 mt-2">
                  {marketingData.performanceStats.evaluationsCompleted}/{marketingData.performanceStats.totalEvaluations} complétées
                </div>
                <div className="w-full mt-4 bg-sabc-gray-200 rounded-full h-2">
                  <div 
                    className="bg-sabc-accent h-2 rounded-full" 
                    style={{ width: `${marketingData.performanceStats.evaluationsCompleted / marketingData.performanceStats.totalEvaluations * 100}%` }}
                  ></div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Regional Trade Marketing (RTM)</CardTitle>
              <CardDescription>Performance par région</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Région</TableHead>
                    <TableHead>Performance</TableHead>
                    <TableHead>Évaluations</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {marketingData.rtmList.map((rtm) => (
                    <TableRow key={rtm.id}>
                      <TableCell className="font-medium">{rtm.name}</TableCell>
                      <TableCell>{rtm.region}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <span className="mr-2">{rtm.performance}%</span>
                          <div className="w-24 h-2 bg-sabc-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-sabc-red-primary" 
                              style={{ width: `${rtm.performance}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{rtm.evaluations}</TableCell>
                      <TableCell>
                        <Badge className="bg-sabc-success">
                          {rtm.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Trade Marketing Operators (TMO)</CardTitle>
              <CardDescription>Performance par zone</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Zone</TableHead>
                    <TableHead>RTM</TableHead>
                    <TableHead>Performance</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {marketingData.tmoList.map((tmo) => (
                    <TableRow key={tmo.id}>
                      <TableCell className="font-medium">{tmo.name}</TableCell>
                      <TableCell>{tmo.zone}</TableCell>
                      <TableCell>{tmo.rtm}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <span className="mr-2">{tmo.performance}%</span>
                          <div className="w-24 h-2 bg-sabc-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-sabc-red-primary" 
                              style={{ width: `${tmo.performance}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-sabc-success">
                          {tmo.status}
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
