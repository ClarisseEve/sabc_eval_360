import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import { Button } from '@/Components/UI/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/UI/Card';
import { Badge } from '@/Components/UI/Badge';
import { Input } from '@/Components/UI/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/UI/Select';
import { 
  Users, 
  Search, 
  Filter, 
  UserPlus, 
  TreePine, 
  List, 
  Eye,
  Edit,
  AlertTriangle,
  CheckCircle,
  Clock,
  Building,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import AppLayout from '@/Components/Layout/app/AppLayout';

interface Utilisateur {
  matricule: string;
  nom: string;
  prenom: string;
  email: string;
  role: string;
  region_nom: string;
  branche_nom: string;
  manager_matricule?: string;
  manager_nom?: string;
  statut: 'actif' | 'inactif' | 'suspendu';
  niveau_hierarchique: number;
  date_creation: string;
  derniere_connexion?: string;
}

interface UtilisateurHierarchique extends Utilisateur {
  subordonnes?: UtilisateurHierarchique[];
  gap_analysis?: {
    evaluations_manquantes: number;
    pairs_non_evalues: number;
    superieurs_non_evalues: number;
  };
}

interface PageProps {
  utilisateurs: Utilisateur[];
  hierarchie: UtilisateurHierarchique[];
  regions: Array<{ id: string; nom: string }>;
  roles: Array<{ nom: string; libelle: string }>;
  branches: Array<{ id: string; nom: string }>;
  statistiques: {
    total_utilisateurs: number;
    actifs: number;
    inactifs: number;
    avec_gaps: number;
  };
  user: any;
}

const AdminUsersPage = ({ 
  utilisateurs, 
  hierarchie, 
  regions, 
  roles, 
  branches, 
  statistiques, 
  user 
}: PageProps) => {
  const [viewMode, setViewMode] = useState<'list' | 'hierarchy'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedBranche, setSelectedBranche] = useState('');
  const [selectedStatut, setSelectedStatut] = useState('');

  // Filtrage des utilisateurs
  const filteredUsers = utilisateurs.filter(utilisateur => {
    const matchesSearch = !searchTerm || 
      `${utilisateur.prenom} ${utilisateur.nom}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      utilisateur.matricule.toLowerCase().includes(searchTerm.toLowerCase()) ||
      utilisateur.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRegion = !selectedRegion || selectedRegion === 'all' || utilisateur.region_nom === selectedRegion;
    const matchesRole = !selectedRole || selectedRole === 'all' || utilisateur.role === selectedRole;
    const matchesBranche = !selectedBranche || selectedBranche === 'all' || utilisateur.branche_nom === selectedBranche;
    const matchesStatut = !selectedStatut || selectedStatut === 'all' || utilisateur.statut === selectedStatut;

    return matchesSearch && matchesRegion && matchesRole && matchesBranche && matchesStatut;
  });

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case 'actif':
        return <Badge variant="default" className="bg-sabc-success text-white">Actif</Badge>;
      case 'inactif':
        return <Badge variant="secondary">Inactif</Badge>;
      case 'suspendu':
        return <Badge variant="destructive">Suspendu</Badge>;
      default:
        return <Badge>{statut}</Badge>;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'DR':
        return 'bg-sabc-red-primary text-white';
      case 'CDTT':
        return 'bg-sabc-accent text-white';
      case 'CSC':
        return 'bg-blue-500 text-white';
      case 'RTM':
        return 'bg-green-500 text-white';
      case 'CDV':
        return 'bg-purple-500 text-white';
      case 'TMO':
        return 'bg-indigo-500 text-white';
      case 'CDS':
        return 'bg-gray-500 text-white';
      case 'SRMO':
        return 'bg-teal-500 text-white';
      case 'SS':
        return 'bg-orange-500 text-white';
      case 'AS':
        return 'bg-pink-500 text-white';
      default:
        return 'bg-sabc-gray-400 text-white';
    }
  };

  const handleViewUser = (matricule: string) => {
    window.location.href = `/admin/utilisateurs/${matricule}`;
  };

  const handleEditUser = (matricule: string) => {
    window.location.href = `/admin/utilisateurs/${matricule}/edit`;
  };

  const handleCreateUser = () => {
    window.location.href = '/admin/utilisateurs/create';
  };

  const renderHierarchicalTree = (users: any[], regionNom: string) => {
    // Filtrer les utilisateurs pour exclure l'admin (niveau 0)
    const nonAdminUsers = users.filter(user => {
      const level = user.niveau_hierarchique || 0;
      return level > 0; // Exclure niveau 0 (ADMIN)
    });

    // Organiser par hiérarchie manager-subordonné
    const buildHierarchy = (users: any[], managerId: string | null = null): any[] => {
      return users
        .filter(user => user.manager_matricule === managerId)
        .map(user => ({
          ...user,
          children: buildHierarchy(users, user.matricule)
        }))
        .sort((a, b) => (a.niveau_hierarchique || 0) - (b.niveau_hierarchique || 0));
    };

    const hierarchy = buildHierarchy(nonAdminUsers);

    const renderUserNode = (user: any, level: number = 0): React.ReactElement => (
      <div key={user.matricule} className={`ml-${level * 4}`}>
        <div className="bg-white border border-sabc-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow mb-2">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h5 className="font-semibold text-sabc-gray-900 text-sm">
                {user.prenom} {user.nom}
              </h5>
              <p className="text-xs text-sabc-gray-600">{user.matricule}</p>
            </div>
            <Badge className={`text-xs ${getRoleColor(user.role)}`}>
              {user.role}
            </Badge>
          </div>
          
          <div className="space-y-2 text-xs text-sabc-gray-600">
            <div className="flex items-center">
              <Building className="w-3 h-3 mr-1" />
              {user.branche_nom || 'Non définie'}
            </div>
            <div className="flex items-center justify-between">
              {getStatutBadge(user.statut || 'actif')}
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                  <Eye className="w-3 h-3" />
                </Button>
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                  <Edit className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Render children with proper indentation */}
        {user.children && user.children.length > 0 && (
          <div className="ml-4 border-l-2 border-sabc-gray-200 pl-4">
            {user.children.map((child: any) => renderUserNode(child, level + 1))}
          </div>
        )}
      </div>
    );

    return (
      <div className="space-y-4">
        {hierarchy.length > 0 ? (
          hierarchy.map((user: any) => renderUserNode(user, 0))
        ) : (
          <div className="text-center py-8 text-sabc-gray-500">
            <p>Aucun utilisateur dans cette région pour le moment</p>
          </div>
        )}
      </div>
    );
  };

  // Helper function to get level name based on region type
  const getLevelName = (level: number, regionNom: string): string => {
    const isRegionTaniere = ['Littoral', 'Centre'].includes(regionNom);
    
    if (isRegionTaniere) {
      const levelNames: Record<number, string> = {
        1: 'Directeur Régional (DR)',
        2: 'Chef Département Trade (CDTT)',
        3: 'Chef Service Commercial (CSC) / Regional Trade Marketing (RTM)',
        4: 'Chef District Vente (CDV) / Trade Marketing Operator (TMO)',
        5: 'Chef de Secteur (CDS) / Assistant Superviseur Sponsoring (AS)'
      };
      return levelNames[level] || `Niveau ${level}`;
    } else {
      const levelNames: Record<number, string> = {
        1: 'Directeur Régional (DR)',
        2: 'Chef Service Commercial (CSC) / Superviseur Régional Marketing Opérationnel (SRMO)',
        3: 'Chef de Secteur (CDS) / Trade Marketing Operator (TMO)'
      };
      return levelNames[level] || `Niveau ${level}`;
    }
  };



  const renderHierarchyNode = (node: UtilisateurHierarchique, level: number = 0) => (
    <div key={node.matricule} className={`ml-${level * 4}`}>
      <div className="flex items-center justify-between p-3 border rounded-lg mb-2 hover:bg-sabc-gray-50">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${getRoleColor(node.role)}`}>
              {node.prenom.charAt(0)}{node.nom.charAt(0)}
            </div>
          </div>
          <div>
            <h4 className="font-medium text-sabc-gray-900">
              {node.prenom} {node.nom}
            </h4>
            <p className="text-sm text-sabc-gray-600">
              {node.role} • {node.region_nom}
            </p>
          </div>
          {getStatutBadge(node.statut)}
          {node.gap_analysis && node.gap_analysis.evaluations_manquantes > 0 && (
            <Badge variant="destructive" className="ml-2">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {node.gap_analysis.evaluations_manquantes} gaps
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => handleViewUser(node.matricule)}
            variant="ghost"
            size="sm"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => handleEditUser(node.matricule)}
            variant="ghost"
            size="sm"
          >
            <Edit className="h-4 w-4" />
          </Button>
        </div>
      </div>
      {node.subordonnes && node.subordonnes.map(child => 
        renderHierarchyNode(child, level + 1)
      )}
    </div>
  );

  return (
    <AppLayout user={user} pageTitle="Gestion des utilisateurs">
      <Head title="Gestion des utilisateurs - SABC Admin" />
      
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-sabc-gray-900">Gestion des utilisateurs</h1>
            <p className="text-sabc-gray-600 mt-1">Administration SABC - Vue complète</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center border rounded-lg">
              <Button
                onClick={() => setViewMode('list')}
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                className="rounded-r-none"
              >
                <List className="h-4 w-4 mr-2" />
                Liste
              </Button>
              <Button
                variant={viewMode === 'hierarchy' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('hierarchy')}
                className="flex items-center gap-2"
              >
                <TreePine className="w-4 h-4" />
                Hiérarchie
              </Button>
            </div>
            <Button onClick={handleCreateUser} className="bg-sabc-red-primary hover:bg-sabc-red-dark">
              <UserPlus className="h-4 w-4 mr-2" />
              Nouvel utilisateur
            </Button>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-sabc-gray-600">Total</p>
                  <p className="text-2xl font-bold text-sabc-gray-900">{statistiques.total_utilisateurs}</p>
                </div>
                <Users className="h-8 w-8 text-sabc-gray-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-sabc-gray-600">Actifs</p>
                  <p className="text-2xl font-bold text-sabc-success">{statistiques.actifs}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-sabc-success" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-sabc-gray-600">Inactifs</p>
                  <p className="text-2xl font-bold text-sabc-gray-400">{statistiques.inactifs}</p>
                </div>
                <Clock className="h-8 w-8 text-sabc-gray-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-sabc-gray-600">Avec gaps</p>
                  <p className="text-2xl font-bold text-sabc-error">{statistiques.avec_gaps}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-sabc-error" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtres */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtres
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-sabc-gray-400" />
                <Input
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                <SelectTrigger>
                  <SelectValue placeholder="Toutes les régions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les régions</SelectItem>
                  {regions.map(region => (
                    <SelectItem key={region.id} value={region.nom}>{region.nom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les rôles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les rôles</SelectItem>
                  {roles.filter(role => role.nom !== 'ADMIN').map(role => (
                    <SelectItem key={role.nom} value={role.nom}>{role.libelle}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={selectedBranche} onValueChange={setSelectedBranche}>
                <SelectTrigger>
                  <SelectValue placeholder="Toutes les branches" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les branches</SelectItem>
                  {branches.map(branche => (
                    <SelectItem key={branche.id} value={branche.nom}>{branche.nom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={selectedStatut} onValueChange={setSelectedStatut}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="actif">Actif</SelectItem>
                  <SelectItem value="inactif">Inactif</SelectItem>
                  <SelectItem value="suspendu">Suspendu</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Contenu principal */}
        {viewMode === 'list' && (
          <Card>
            <CardHeader>
              <CardTitle>Liste des utilisateurs ({filteredUsers.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredUsers.map((utilisateur) => (
                  <div key={utilisateur.matricule} className="flex items-center justify-between p-4 border rounded-lg hover:bg-sabc-gray-50">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${getRoleColor(utilisateur.role)}`}>
                        {utilisateur.prenom.charAt(0)}{utilisateur.nom.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-medium text-sabc-gray-900">
                          {utilisateur.prenom} {utilisateur.nom}
                        </h4>
                        <p className="text-sm text-sabc-gray-600">
                          {utilisateur.matricule} • {utilisateur.email}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={`text-xs ${getRoleColor(utilisateur.role)}`}>
                            {utilisateur.role}
                          </Badge>
                          <span className="text-xs text-sabc-gray-500">
                            {utilisateur.region_nom} • {utilisateur.branche_nom}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {getStatutBadge(utilisateur.statut || 'actif')}
                      <div className="flex gap-1 ml-4">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => window.location.href = `/admin/utilisateurs/${utilisateur.matricule}`}
                          className="h-8 w-8 p-0"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => window.location.href = `/admin/utilisateurs/${utilisateur.matricule}/edit`}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                
                {filteredUsers.length === 0 && (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-sabc-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-sabc-gray-900 mb-2">
                      Aucun utilisateur trouvé
                    </h3>
                    <p className="text-sabc-gray-600">
                      Modifiez vos critères de recherche ou créez un nouvel utilisateur.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Vue hiérarchique */}
        {viewMode === 'hierarchy' && (
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold text-sabc-gray-900">Organigramme SABC</h2>
                <p className="text-sm text-sabc-gray-600">Structure hiérarchique par région et branche</p>
              </CardHeader>
              <CardContent>
                {(() => {
                  // Pour la vue hiérarchique, utiliser tous les utilisateurs si aucun filtre n'est appliqué
                  // ou utiliser les utilisateurs filtrés si des filtres sont actifs
                  const hasActiveFilters = selectedRegion !== 'all' || selectedRole !== 'all' || 
                                          selectedBranche !== 'all' || selectedStatut !== 'all' || searchTerm.trim() !== '';
                  
                  const usersToDisplay = hasActiveFilters ? filteredUsers : (utilisateurs || []);
                  
                  // Si aucun filtre actif, grouper par région réelle des utilisateurs
                  // Sinon utiliser les régions SABC standards
                  if (!hasActiveFilters) {
                    // Grouper par région réelle des utilisateurs
                    const regionGroups = usersToDisplay.reduce((acc, user) => {
                      const region = user.region_nom || 'Non définie';
                      if (!acc[region]) acc[region] = [];
                      acc[region].push(user);
                      return acc;
                    }, {} as Record<string, typeof usersToDisplay>);
                    
                    return (
                      <div className="space-y-8">
                        {Object.entries(regionGroups).map(([regionNom, usersInRegion]) => (
                          <div key={regionNom} className="border border-sabc-gray-200 rounded-lg p-6 bg-sabc-gray-50">
                            <h3 className="text-lg font-semibold text-sabc-red-primary mb-4 flex items-center">
                              <Building className="w-5 h-5 mr-2" />
                              Région {regionNom}
                            </h3>
                            <div className="space-y-4">
                              {renderHierarchicalTree(usersInRegion, regionNom)}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  }
                  
                  // Avec filtres : utiliser les régions SABC standards
                  const sabcRegions = ['Littoral', 'Centre', 'Nord', 'Ouest'];
                  
                  return usersToDisplay && usersToDisplay.length > 0 ? (
                    <div className="space-y-8">
                      {/* Afficher chaque région SABC avec son organigramme */}
                      {sabcRegions.map(regionNom => {
                        // Mapping flexible pour les noms de régions (majuscules/minuscules)
                        const usersInRegion = usersToDisplay.filter(user => {
                          if (!user.region_nom) return false;
                          const userRegion = user.region_nom.toLowerCase().trim();
                          const targetRegion = regionNom.toLowerCase().trim();
                          return userRegion === targetRegion;
                        });
                        
                        // Afficher la région même si elle n'a pas d'utilisateurs (pour montrer la structure complète)
                        return (
                      <div key={regionNom} className="border border-sabc-gray-200 rounded-lg p-6 bg-sabc-gray-50">
                        <h3 className="text-lg font-semibold text-sabc-red-primary mb-4 flex items-center">
                          <Building className="w-5 h-5 mr-2" />
                          Région {regionNom}
                        </h3>
                        
                        {/* Arbre hiérarchique pour cette région */}
                         <div className="space-y-4">
                           {usersInRegion.length > 0 ? (
                             renderHierarchicalTree(usersInRegion, regionNom)
                           ) : (
                             <div className="text-center py-4 text-sabc-gray-500">
                               <p>Aucun utilisateur dans cette région pour le moment</p>
                             </div>
                           )}
                         </div>
                       </div>
                        );
                      })}
                    </div>
                ) : (
                  <div className="text-center py-8">
                    <Building className="w-12 h-12 text-sabc-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-sabc-gray-900 mb-2">
                      Aucun utilisateur trouvé
                    </h3>
                    <p className="text-sabc-gray-600">
                      Ajustez vos filtres pour voir la structure hiérarchique.
                    </p>
                  </div>
                );
                })()}
              </CardContent>
            </Card>
          )}
      </div>
    </AppLayout>
  );
};

export default AdminUsersPage;
