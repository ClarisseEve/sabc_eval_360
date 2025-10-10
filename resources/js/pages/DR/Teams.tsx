import React from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/Components/Layout/app/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/UI/Card/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/UI/Table/Table';
import { Badge } from '@/Components/UI/Badge/Badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/Components/UI/Avatar/Avatar';

interface TeamsProps {
  auth: {
    user: {
      name: string;
      email: string;
      role: string;
      avatar?: string;
    }
  };
}

export default function Teams({ auth }: TeamsProps) {
  // Données de démonstration pour les équipes
  const teamsData = {
    regionName: 'Littoral',
    regionType: 'Tanière',
    commercialTeam: [
      { id: 1, name: 'Jean Mbida', role: 'CDTT', department: 'Commercial', performance: 88, evaluations: 12, status: 'actif' },
      { id: 2, name: 'Paul Essomba', role: 'CSC', department: 'Commercial', performance: 85, evaluations: 10, status: 'actif' },
      { id: 3, name: 'Sophie Ngo', role: 'CSC', department: 'Commercial', performance: 82, evaluations: 8, status: 'actif' },
      { id: 4, name: 'Thomas Mbarga', role: 'CDV', department: 'Commercial', performance: 90, evaluations: 15, status: 'actif' },
    ],
    marketingTeam: [
      { id: 5, name: 'Claire Meka', role: 'RTM', department: 'Marketing', performance: 92, evaluations: 8, status: 'actif' },
      { id: 6, name: 'Marie Fouda', role: 'TMO', department: 'Marketing', performance: 87, evaluations: 6, status: 'actif' },
      { id: 7, name: 'Robert Nkodo', role: 'SS', department: 'Marketing', performance: 84, evaluations: 5, status: 'actif' },
      { id: 8, name: 'Émilie Fouda', role: 'AS', department: 'Marketing', performance: 86, evaluations: 4, status: 'actif' },
    ],
    stats: {
      totalMembers: 8,
      activeMembers: 8,
      evaluationsCompleted: 68,
      evaluationsTotal: 75
    }
  };

  // Fonction pour obtenir les initiales d'un nom
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  // Fonction pour obtenir la couleur du badge en fonction du rôle
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'CDTT':
        return 'bg-sabc-red-primary';
      case 'RTM':
        return 'bg-sabc-red-primary';
      case 'CSC':
        return 'bg-sabc-accent';
      case 'CDV':
        return 'bg-sabc-accent';
      case 'TMO':
        return 'bg-sabc-accent';
      case 'SS':
        return 'bg-sabc-accent';
      case 'CDS':
        return 'bg-sabc-info';
      case 'AS':
        return 'bg-sabc-info';
      default:
        return 'bg-sabc-gray-400';
    }
  };

  return (
    <AppLayout user={auth.user}>
      <Head title="Équipes - Directeur Régional" />
      
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold text-sabc-gray-900">Équipes</h1>
            <Badge className="bg-sabc-red-primary">
              Région {teamsData.regionName} ({teamsData.regionType})
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle>Membres d'équipe</CardTitle>
                <CardDescription>Total région</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                <div className="text-5xl font-bold text-sabc-red-primary">{teamsData.stats.totalMembers}</div>
                <div className="text-sm text-sabc-gray-400 mt-2">
                  {teamsData.stats.activeMembers} actifs
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
                  {Math.round(teamsData.stats.evaluationsCompleted / teamsData.stats.evaluationsTotal * 100)}%
                </div>
                <div className="text-sm text-sabc-gray-400 mt-2">
                  {teamsData.stats.evaluationsCompleted}/{teamsData.stats.evaluationsTotal} complétées
                </div>
                <div className="w-full mt-4 bg-sabc-gray-200 rounded-full h-2">
                  <div 
                    className="bg-sabc-accent h-2 rounded-full" 
                    style={{ width: `${teamsData.stats.evaluationsCompleted / teamsData.stats.evaluationsTotal * 100}%` }}
                  ></div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Départements</CardTitle>
                <CardDescription>Structure régionale</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                <div className="flex space-x-4">
                  <div className="flex flex-col items-center">
                    <div className="text-3xl font-bold text-sabc-red-primary">2</div>
                    <div className="text-sm text-sabc-gray-400">Départements</div>
                  </div>
                  <div className="h-12 w-px bg-sabc-gray-200"></div>
                  <div className="flex flex-col items-center">
                    <div className="text-3xl font-bold text-sabc-accent">6</div>
                    <div className="text-sm text-sabc-gray-400">Rôles</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Équipe Commerciale</CardTitle>
              <CardDescription>Branche commerciale</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Membre</TableHead>
                    <TableHead>Rôle</TableHead>
                    <TableHead>Performance</TableHead>
                    <TableHead>Évaluations</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teamsData.commercialTeam.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="flex items-center">
                        <Avatar className="h-8 w-8 mr-2">
                          <AvatarImage src={`/images/avatars/avatar-${member.id}.png`} alt={member.name} />
                          <AvatarFallback className="bg-sabc-red-light text-sabc-red-primary">
                            {getInitials(member.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{member.name}</span>
                      </TableCell>
                      <TableCell>
                        <Badge className={getRoleBadgeColor(member.role)}>
                          {member.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <span className="mr-2">{member.performance}%</span>
                          <div className="w-24 h-2 bg-sabc-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-sabc-red-primary" 
                              style={{ width: `${member.performance}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{member.evaluations}</TableCell>
                      <TableCell>
                        <Badge className="bg-sabc-success">
                          {member.status}
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
              <CardTitle>Équipe Marketing</CardTitle>
              <CardDescription>Branche marketing</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Membre</TableHead>
                    <TableHead>Rôle</TableHead>
                    <TableHead>Performance</TableHead>
                    <TableHead>Évaluations</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teamsData.marketingTeam.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="flex items-center">
                        <Avatar className="h-8 w-8 mr-2">
                          <AvatarImage src={`/images/avatars/avatar-${member.id}.png`} alt={member.name} />
                          <AvatarFallback className="bg-sabc-red-light text-sabc-red-primary">
                            {getInitials(member.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{member.name}</span>
                      </TableCell>
                      <TableCell>
                        <Badge className={getRoleBadgeColor(member.role)}>
                          {member.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <span className="mr-2">{member.performance}%</span>
                          <div className="w-24 h-2 bg-sabc-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-sabc-red-primary" 
                              style={{ width: `${member.performance}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{member.evaluations}</TableCell>
                      <TableCell>
                        <Badge className="bg-sabc-success">
                          {member.status}
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
