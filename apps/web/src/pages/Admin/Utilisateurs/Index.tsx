import React, { useState } from 'react';
import { Head, router } from '@/lib/inertia-shim';
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
  Building
} from 'lucide-react';
import AppLayout from '@/Components/Layout/app/AppLayout';
import { HierarchyTree, SABC_HIERARCHY_DATA } from '@/Components/UI/HierarchyTree';
import type { HierarchyNode } from '@/Components/UI/HierarchyTree/HierarchyTree';
import { route } from '@/routes';

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

interface PageProps {
  utilisateurs: Utilisateur[];
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

const TANIERE_REGIONS = new Set(['littoral', 'centre']);

const ROLE_BY_NODE_ID: Record<string, string> = {
  dr: 'DR',
  cdtt: 'CDTT',
  csc: 'CSC',
  cdv: 'CDV',
  cds: 'CDS',
  rtm: 'RTM',
  tmo: 'TMO',
  'dr-nt': 'DR',
  'csc-nt': 'CSC',
  'cds-nt': 'CDS',
  srmo: 'SRMO',
  'tmo-nt': 'TMO',
};

const normalizeRegionName = (value?: string | null): string => {
  if (!value) {
    return 'non-definie';
  }

  return value.trim().toLowerCase();
};

const formatUserName = (user: Pick<Utilisateur, 'prenom' | 'nom'>): string => {
  const prenom = user.prenom ? `${user.prenom.charAt(0).toUpperCase()}${user.prenom.slice(1).toLowerCase()}` : '';
  const nom = user.nom ? user.nom.toUpperCase() : '';
  return [prenom, nom].filter(Boolean).join(' ').trim() || 'Profil inconnu';
};

const hydrateNodesForRegion = (
  templateNodes: HierarchyNode[],
  usersInRegion: Utilisateur[]
): HierarchyNode[] => {
  return templateNodes.map((node) => {
    const roleKey = ROLE_BY_NODE_ID[node.id] ?? ROLE_BY_NODE_ID[node.id.replace('-nt', '')] ?? node.id.toUpperCase();
    const assignedUsers = usersInRegion.filter((user) => user.role === roleKey);
    const managerLabel = assignedUsers.length > 0
      ? assignedUsers.map((user) => formatUserName(user)).join(' • ')
      : 'Poste vacant';

    return {
      ...node,
      manager: managerLabel,
      metadata: {
        ...node.metadata,
        utilisateurs_count: assignedUsers.length,
      },
      children: node.children ? hydrateNodesForRegion(node.children, usersInRegion) : [],
    };
  });
};

const AdminUsersPage = ({ 
  utilisateurs, 
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
    router.visit(`/admin/utilisateurs/${matricule}`);
  };

  const handleEditUser = (matricule: string) => {
    router.visit(`/admin/utilisateurs/${matricule}/edit`);
  };

  const handleCreateUser = () => {
    router.visit('/admin/utilisateurs/create');
  };

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
                  const hasActiveFilters =
                    (selectedRegion && selectedRegion !== 'all') ||
                    (selectedRole && selectedRole !== 'all') ||
                    (selectedBranche && selectedBranche !== 'all') ||
                    (selectedStatut && selectedStatut !== 'all') ||
                    searchTerm.trim() !== '';

                  const baseUsers = hasActiveFilters ? filteredUsers : utilisateurs;

                  if (!baseUsers || baseUsers.length === 0) {
                    return (
                      <div className="text-center py-8">
                        <Building className="w-12 h-12 text-sabc-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-sabc-gray-900 mb-2">
                          Aucun utilisateur trouvé
                        </h3>
                        <p className="text-sabc-gray-600">
                          Ajustez vos filtres pour visualiser les responsables par région.
                        </p>
                      </div>
                    );
                  }

                  const usersForHierarchy = baseUsers.filter((user) => user.role !== 'ADMIN');

                  const regionEntriesMap = new Map<string, { key: string; name: string }>();

                  regions.forEach((region) => {
                    const key = normalizeRegionName(region.nom);
                    regionEntriesMap.set(key, { key, name: region.nom });
                  });

                  baseUsers.forEach((user) => {
                    const key = normalizeRegionName(user.region_nom);
                    const displayName = user.region_nom && user.region_nom.trim() !== '' ? user.region_nom : 'Non définie';
                    if (!regionEntriesMap.has(key)) {
                      regionEntriesMap.set(key, { key, name: displayName });
                    }
                  });

                  const selectedRegionKey =
                    selectedRegion && selectedRegion !== 'all' ? normalizeRegionName(selectedRegion) : null;

                  const regionsToRender = Array.from(regionEntriesMap.values())
                    .filter((region) => (selectedRegionKey ? region.key === selectedRegionKey : true))
                    .sort((a, b) => a.name.localeCompare(b.name));

                  if (regionsToRender.length === 0) {
                    return (
                      <div className="text-center py-8">
                        <Building className="w-12 h-12 text-sabc-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-sabc-gray-900 mb-2">
                          Aucune région correspondante
                        </h3>
                        <p className="text-sabc-gray-600">
                          Sélectionnez une autre région ou réinitialisez les filtres.
                        </p>
                      </div>
                    );
                  }

                  const usersGroupedByRegion = usersForHierarchy.reduce((acc, user) => {
                    const key = normalizeRegionName(user.region_nom);
                    if (!acc.has(key)) {
                      acc.set(key, []);
                    }
                    acc.get(key)!.push(user);
                    return acc;
                  }, new Map<string, Utilisateur[]>());

                  return (
                    <div className="space-y-8">
                      {regionsToRender.map((region) => {
                        const normalizedRegion = region.key;
                        const usersInRegion = usersGroupedByRegion.get(normalizedRegion) ?? [];
                        const isTaniere = TANIERE_REGIONS.has(normalizedRegion);
                        const templateNodes = isTaniere
                          ? SABC_HIERARCHY_DATA.roles_taniere
                          : SABC_HIERARCHY_DATA.roles_non_taniere;
                        const nodes = hydrateNodesForRegion(templateNodes, usersInRegion);

                        return (
                          <HierarchyTree
                            key={region.key}
                            title={`Région ${region.name}`}
                            subtitle={isTaniere ? 'Structure Tanière (5 niveaux)' : 'Structure Non-Tanière (3 niveaux)'}
                            nodes={nodes}
                            variant={isTaniere ? 'taniere' : 'non-taniere'}
                          />
                        );
                      })}
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
