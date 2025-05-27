import * as React from 'react';
import { Head } from '@inertiajs/react';
import { 
  Users, Settings, FileText, BarChart2, Calendar, Search, 
  UserPlus, RefreshCw, ChevronDown, ChevronRight, Download, Filter
} from 'lucide-react';

// Layouts
import { AppLayout } from '@/Components/Layout/AppLayout';

// Composants
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/Components/UI/Card/Card';
import { Button } from '@/Components/UI/Button/Button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/Components/UI/Tabs/Tabs';
import { StatusBadge } from '@/Components/UI/Status/StatusBadge';
import { Avatar } from '@/Components/UI/Avatar/Avatar';
import { Progress } from '@/Components/UI/Progress/Progress';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell, TableFooter } from '@/Components/UI/Table/Table';
import { AdvancedFilter } from '@/Components/UI/Filter/AdvancedFilter';
import { DataExport } from '@/Components/UI/Export/DataExport';
import { Input } from '@/Components/UI/Input/Input';

// Types
interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  region: string;
  department: string;
  avatar?: string;
  status: 'active' | 'inactive';
  lastLogin?: string;
}

interface AdminPageProps {
  user: User;
  users: User[];
}

export default function AdminIndex({
  user,
  users = [
    {
      id: '1',
      name: 'Jean Dupont',
      email: 'jean.dupont@sabc.com',
      role: 'DR',
      region: 'Littoral',
      department: 'Direction',
      status: 'active',
      lastLogin: '2025-05-22T10:30:00Z'
    },
    {
      id: '2',
      name: 'Marie Durand',
      email: 'marie.durand@sabc.com',
      role: 'CDTT',
      region: 'Centre',
      department: 'Direction',
      status: 'active',
      lastLogin: '2025-05-23T14:15:00Z'
    },
    {
      id: '3',
      name: 'Pierre Martin',
      email: 'pierre.martin@sabc.com',
      role: 'CSC',
      region: 'Littoral',
      department: 'Commercial',
      status: 'active',
      lastLogin: '2025-05-24T09:45:00Z'
    },
    {
      id: '4',
      name: 'Sophie Lefebvre',
      email: 'sophie.lefebvre@sabc.com',
      role: 'RTM',
      region: 'Centre',
      department: 'Marketing',
      status: 'active',
      lastLogin: '2025-05-21T16:20:00Z'
    },
    {
      id: '5',
      name: 'Thomas Bernard',
      email: 'thomas.bernard@sabc.com',
      role: 'CDV',
      region: 'Littoral',
      department: 'Commercial',
      status: 'inactive',
      lastLogin: '2025-05-10T11:05:00Z'
    }
  ]
}: AdminPageProps) {
  // État pour la recherche et les filtres
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedFilters, setSelectedFilters] = React.useState<Record<string, string[]>>({});
  const [activeTab, setActiveTab] = React.useState('users');
  
  // Filtres disponibles pour les utilisateurs
  const userFilterGroups = [
    {
      id: 'role',
      label: 'Rôle',
      options: [
        { id: 'dr', label: 'Directeur Régional (DR)', value: 'DR' },
        { id: 'cdtt', label: 'Chef Département (CDTT)', value: 'CDTT' },
        { id: 'csc', label: 'Chef Service Commercial (CSC)', value: 'CSC' },
        { id: 'rtm', label: 'Responsable Territorial Marketing (RTM)', value: 'RTM' },
        { id: 'cdv', label: 'Chef de Vente (CDV)', value: 'CDV' },
        { id: 'tmo', label: 'Technico-Marketing Opérationnel (TMO)', value: 'TMO' },
        { id: 'cds', label: 'Commercial (CDS)', value: 'CDS' },
        { id: 'as', label: 'Assistant (AS)', value: 'AS' }
      ],
      multiSelect: true
    },
    {
      id: 'region',
      label: 'Région',
      options: [
        { id: 'littoral', label: 'Littoral', value: 'Littoral' },
        { id: 'centre', label: 'Centre', value: 'Centre' },
        { id: 'ouest', label: 'Ouest', value: 'Ouest' },
        { id: 'nord', label: 'Nord', value: 'Nord' }
      ],
      multiSelect: true
    },
    {
      id: 'department',
      label: 'Département',
      options: [
        { id: 'direction', label: 'Direction', value: 'Direction' },
        { id: 'commercial', label: 'Commercial', value: 'Commercial' },
        { id: 'marketing', label: 'Marketing', value: 'Marketing' }
      ],
      multiSelect: true
    },
    {
      id: 'status',
      label: 'Statut',
      options: [
        { id: 'active', label: 'Actif', value: 'active' },
        { id: 'inactive', label: 'Inactif', value: 'inactive' }
      ],
      multiSelect: false
    }
  ];
  
  // Filtrer les utilisateurs en fonction de la recherche et des filtres
  const filteredUsers = React.useMemo(() => {
    return users.filter(user => {
      // Filtre par recherche
      const matchesSearch = searchQuery === '' || 
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.role.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Filtre par filtres sélectionnés
      const matchesFilters = Object.entries(selectedFilters).every(([groupId, values]) => {
        if (values.length === 0) return true;
        
        switch (groupId) {
          case 'role':
            return values.includes(user.role);
          case 'region':
            return values.includes(user.region);
          case 'department':
            return values.includes(user.department);
          case 'status':
            return values.includes(user.status);
          default:
            return true;
        }
      });
      
      return matchesSearch && matchesFilters;
    });
  }, [users, searchQuery, selectedFilters]);
  
  // Gérer le changement de filtre
  const handleFilterChange = (groupId: string, values: string[]) => {
    setSelectedFilters(prev => ({
      ...prev,
      [groupId]: values
    }));
  };
  
  // Effacer tous les filtres
  const handleClearFilters = () => {
    setSelectedFilters({});
    setSearchQuery('');
  };
  
  // Gérer l'exportation des données
  const handleExport = (format: string) => {
    console.log(`Exporting data in ${format} format`);
    // Logique d'exportation à implémenter
  };
  
  // Formater la date
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Jamais';
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  // Déterminer la variante du badge en fonction du rôle
  const getRoleBadgeVariant = (role: string): 'success' | 'info' | 'warning' | 'error' | 'draft' | 'pending' | 'validated' | 'rejected' | 'overdue' => {
    switch (role) {
      case 'DR':
      case 'CDTT':
        return 'validated'; // Remplacement de 'primary' par 'validated' (vert)
      case 'CSC':
      case 'RTM':
        return 'success';
      case 'CDV':
      case 'TMO':
        return 'info';
      case 'CDS':
      case 'AS':
        return 'pending'; // Remplacement de 'default' par 'pending' (orange)
      default:
        return 'draft'; // Remplacement de 'default' par 'draft' (gris)
    }
  };
  
  // Fonction de déconnexion
  const handleLogout = () => {
    // Implémentation de la déconnexion
    console.log('Déconnexion');
    // Redirection vers la page de connexion ou appel à une API de déconnexion
  };

  return (
    <AppLayout 
      user={{
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar
      }}
      onLogout={handleLogout}
    >
      <Head title="Administration" />
      
      <div className="space-y-6">
        {/* En-tête */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-sabc-gray-900 dark:text-white">
            Administration
          </h1>
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={() => console.log('Synchroniser')}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Synchroniser
            </Button>
            <Button onClick={() => console.log('Ajouter un utilisateur')}>
              <UserPlus className="mr-2 h-4 w-4" />
              Ajouter un utilisateur
            </Button>
          </div>
        </div>
        
        {/* Onglets */}
        <Tabs defaultValue="users" onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="users">
              <Users className="mr-2 h-4 w-4" />
              Utilisateurs
            </TabsTrigger>
            <TabsTrigger value="evaluations">
              <FileText className="mr-2 h-4 w-4" />
              Évaluations
            </TabsTrigger>
            <TabsTrigger value="reports">
              <BarChart2 className="mr-2 h-4 w-4" />
              Rapports
            </TabsTrigger>
            <TabsTrigger value="cycles">
              <Calendar className="mr-2 h-4 w-4" />
              Cycles d'évaluation
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="mr-2 h-4 w-4" />
              Paramètres
            </TabsTrigger>
          </TabsList>
          
          {/* Contenu des onglets */}
          <TabsContent value="users" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Gestion des utilisateurs</CardTitle>
                <CardDescription>
                  Gérez les utilisateurs, leurs rôles et leurs permissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Barre de recherche et filtres */}
                <div className="mb-6 flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                  <div className="relative w-full max-w-md">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sabc-gray-500" />
                    <Input
                      type="text"
                      placeholder="Rechercher un utilisateur..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <AdvancedFilter
                      groups={userFilterGroups}
                      selectedFilters={selectedFilters}
                      onFilterChange={handleFilterChange}
                      onClearFilters={handleClearFilters}
                    />
                    <DataExport onExport={handleExport} />
                  </div>
                </div>
                
                {/* Tableau des utilisateurs */}
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Utilisateur</TableHead>
                        <TableHead>Rôle</TableHead>
                        <TableHead>Région</TableHead>
                        <TableHead>Département</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Dernière connexion</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="h-24 text-center">
                            Aucun utilisateur trouvé
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredUsers.map(user => (
                          <TableRow key={user.id}>
                            <TableCell>
                              <div className="flex items-center space-x-3">
                                <Avatar name={user.name} size="sm" />
                                <div>
                                  <p className="font-medium text-sabc-gray-900 dark:text-white">
                                    {user.name}
                                  </p>
                                  <p className="text-xs text-sabc-gray-500 dark:text-sabc-gray-400">
                                    {user.email}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <StatusBadge variant={getRoleBadgeVariant(user.role)}>
                                {user.role}
                              </StatusBadge>
                            </TableCell>
                            <TableCell>{user.region}</TableCell>
                            <TableCell>{user.department}</TableCell>
                            <TableCell>
                              <StatusBadge 
                                variant={user.status === 'active' ? 'success' : 'error'}
                                withDot
                              >
                                {user.status === 'active' ? 'Actif' : 'Inactif'}
                              </StatusBadge>
                            </TableCell>
                            <TableCell>
                              {formatDate(user.lastLogin)}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm">
                                <ChevronRight className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                    <TableFooter>
                      <TableRow>
                        <TableCell colSpan={7} className="text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <span className="text-sm text-sabc-gray-500 dark:text-sabc-gray-400">
                              {filteredUsers.length} utilisateurs sur {users.length}
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    </TableFooter>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="evaluations" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Gestion des évaluations</CardTitle>
                <CardDescription>
                  Suivez et gérez toutes les évaluations 360° de l'entreprise
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex h-40 items-center justify-center">
                  <p className="text-sabc-gray-500 dark:text-sabc-gray-400">
                    Module de gestion des évaluations en cours de développement
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="reports" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Rapports et analytics</CardTitle>
                <CardDescription>
                  Générez et consultez les rapports de performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex h-40 items-center justify-center">
                  <p className="text-sabc-gray-500 dark:text-sabc-gray-400">
                    Module de rapports en cours de développement
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="cycles" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Cycles d'évaluation</CardTitle>
                <CardDescription>
                  Configurez et gérez les cycles d'évaluation 360°
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex h-40 items-center justify-center">
                  <p className="text-sabc-gray-500 dark:text-sabc-gray-400">
                    Module de gestion des cycles en cours de développement
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="settings" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Paramètres du système</CardTitle>
                <CardDescription>
                  Configurez les paramètres globaux de l'application
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex h-40 items-center justify-center">
                  <p className="text-sabc-gray-500 dark:text-sabc-gray-400">
                    Module de paramètres en cours de développement
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
