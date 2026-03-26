import React from 'react';
import { Head } from '@/lib/inertia-shim';
import AppLayout from '@/Components/Layout/app/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/UI/Card/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/UI/Table/Table';
import { Badge } from '@/Components/UI/Badge/Badge';

interface PerformanceProps {
  auth: {
    user: {
      name: string;
      email: string;
      role: string;
      avatar?: string;
    }
  };
}

export default function Performance({ auth }: PerformanceProps) {
  // Données de démonstration pour la performance régionale
  const performanceData = {
    regionName: 'Littoral',
    regionType: 'Tanière',
    globalScore: 86,
    previousPeriod: 82,
    departments: [
      { id: 1, name: 'Commercial', manager: 'Jean Mbida', score: 88, evaluations: 45, status: 'actif' },
      { id: 2, name: 'Marketing', manager: 'Claire Meka', score: 84, evaluations: 32, status: 'actif' },
    ],
    evaluationsStats: {
      completed: 77,
      total: 85,
      onTime: 68,
      late: 9
    },
    topPerformers: [
      { id: 1, name: 'Thomas Mbarga', role: 'CDS', score: 95 },
      { id: 2, name: 'Marie Fouda', role: 'TMO', score: 93 },
      { id: 3, name: 'Jean Ekambi', role: 'CSC', score: 91 },
    ]
  };

  return (
    <AppLayout user={auth.user}>
      <Head title="Performance Régionale - Directeur Régional" />
      
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold text-sabc-gray-900">Performance Régionale</h1>
            <Badge className="bg-sabc-red-primary">
              Région {performanceData.regionName} ({performanceData.regionType})
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance globale</CardTitle>
                <CardDescription>Score moyen régional</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                <div className="text-5xl font-bold text-sabc-red-primary">{performanceData.globalScore}%</div>
                <div className="text-sm text-sabc-gray-400 mt-2">
                  +{performanceData.globalScore - performanceData.previousPeriod}% vs période précédente
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Évaluations</CardTitle>
                <CardDescription>Progression du cycle</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                <div className="text-5xl font-bold text-sabc-accent">
                  {Math.round(performanceData.evaluationsStats.completed / performanceData.evaluationsStats.total * 100)}%
                </div>
                <div className="text-sm text-sabc-gray-400 mt-2">
                  {performanceData.evaluationsStats.completed}/{performanceData.evaluationsStats.total} complétées
                </div>
                <div className="w-full mt-4 bg-sabc-gray-200 rounded-full h-2">
                  <div 
                    className="bg-sabc-accent h-2 rounded-full" 
                    style={{ width: `${performanceData.evaluationsStats.completed / performanceData.evaluationsStats.total * 100}%` }}
                  ></div>
                </div>
                <div className="flex justify-between w-full mt-2 text-xs">
                  <span className="text-sabc-success">{performanceData.evaluationsStats.onTime} à temps</span>
                  <span className="text-sabc-warning">{performanceData.evaluationsStats.late} en retard</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Top performers</CardTitle>
                <CardDescription>Meilleurs scores</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {performanceData.topPerformers.map((performer, index) => (
                    <div key={performer.id} className="flex items-center">
                      <div className="w-6 h-6 rounded-full bg-sabc-red-primary text-white flex items-center justify-center text-xs font-bold mr-3">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-sabc-gray-800">{performer.name}</div>
                        <div className="text-xs text-sabc-gray-400">{performer.role}</div>
                      </div>
                      <div className="text-sm font-bold text-sabc-red-primary">{performer.score}%</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Performance par département</CardTitle>
              <CardDescription>Scores et évaluations</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Département</TableHead>
                    <TableHead>Responsable</TableHead>
                    <TableHead>Performance</TableHead>
                    <TableHead>Évaluations</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {performanceData.departments.map((department) => (
                    <TableRow key={department.id}>
                      <TableCell className="font-medium">{department.name}</TableCell>
                      <TableCell>{department.manager}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <span className="mr-2">{department.score}%</span>
                          <div className="w-24 h-2 bg-sabc-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-sabc-red-primary" 
                              style={{ width: `${department.score}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{department.evaluations}</TableCell>
                      <TableCell>
                        <Badge className="bg-sabc-success">
                          {department.status}
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
