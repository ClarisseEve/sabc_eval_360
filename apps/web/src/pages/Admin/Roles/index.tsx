import React, { useState } from 'react';
import { Head } from '@/lib/inertia-shim';
import AppLayout from '@/Components/Layout/app/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/UI/Card';
import { Badge } from '@/Components/UI/Badge';
import { Button } from '@/Components/UI/Button';
import { Input } from '@/Components/UI/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/UI/Select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/UI/Table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/Components/UI/DropdownMenu';
import { Users, Shield, Eye, Edit, Trash2, MoreHorizontal, Search, Filter, Plus, Network } from 'lucide-react';
import { RoleGuard } from '@/Components/Auth/RoleGuard';

interface Role {
  id_role: string;
  nom_role: string;
  description: string;
  niveau_taniere: number | null;
  niveau_non_taniere: number | null;
  peut_auto_evaluer: boolean;
  peut_evaluer_pairs: boolean;
  peut_evaluer_subordonnes: boolean;
  peut_cross_branch: boolean;
  utilisateurs_count: number;
  est_actif: boolean;
  est_support: boolean;
}

interface Props {
  roles: Role[];
  auth: {
    user: {
      name: string;
      email: string;
      role: string;
      avatar: string;
    };
  };
  pageTitle: string;
}

export default function RolesIndex({ roles, auth, pageTitle }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [deletingRole, setDeletingRole] = useState<string | null>(null);

  const handleDelete = (roleId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce rôle ?')) {
      setDeletingRole(roleId);
      // Logique de suppression ici
    }
  };

  // Fonction pour obtenir le type de badge selon le niveau
  const getBadgeVariant = (role: Role): 'default' | 'secondary' | 'destructive' | 'outline' => {
    if (role.niveau_taniere && role.niveau_taniere <= 2) return 'destructive';
    if (role.niveau_non_taniere && role.niveau_non_taniere <= 2) return 'destructive';
    return 'default';
  };

  // Fonction pour obtenir la portée géographique selon les règles SABC
  const getPorteeGeographique = (role: Role): string => {
    const nom = role.nom_role;
    if (nom === 'ADMIN') return 'Global';
    if (['DR', 'CDTT', 'RTM', 'SRMO'].includes(nom)) return 'Région';
    if (['CSC', 'TMO'].includes(nom)) return 'Service';
    if (nom === 'CDV') return 'District';
    if (['CDS', 'AS'].includes(nom)) return 'Secteur';
    return 'Non définie';
  };

  const getNiveauDisplay = (role: Role) => {
    if (role.niveau_taniere) {
      return `Tanière N${role.niveau_taniere}`;
    }
    if (role.niveau_non_taniere) {
      return `Non-Tanière N${role.niveau_non_taniere}`;
    }
    return 'N/A';
  };

  const getPermissionsBadges = (role: Role) => {
    const badges = [];
    if (role.peut_auto_evaluer) badges.push('Auto-éval');
    if (role.peut_evaluer_pairs) badges.push('Pairs');
    if (role.peut_evaluer_subordonnes) badges.push('Subordonnés');
    if (role.peut_cross_branch) badges.push('Inter-branches');
    return badges;
  };

  return (
    <RoleGuard allowed={['ADMIN']} userRoleName={auth.user.role}>
      <AppLayout user={auth.user}>
        <Head title={pageTitle} />
        
        {/* Header simple */}
        <div className="border-b border-sabc-gray-200 bg-white">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-sabc-gray-900">Gestion des Rôles</h1>
                <p className="text-sm text-sabc-gray-600 mt-1">Administration des rôles selon les règles SABC</p>
              </div>
              <div className="flex items-center gap-3">
                <Button className="bg-sabc-red-primary hover:bg-sabc-red-dark text-white gap-2">
                  <Plus className="h-4 w-4" />
                  Nouveau Rôle
                </Button>
              </div>
            </div>
            
            {/* Statistiques */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-sabc-gray-50 rounded-lg p-4">
                <div className="flex items-center">
                  <Shield className="h-6 w-6 text-sabc-red-primary mr-3" />
                  <div>
                    <p className="text-sm text-sabc-gray-600">Total Rôles</p>
                    <p className="text-xl font-semibold text-sabc-gray-900">{roles.length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-sabc-gray-50 rounded-lg p-4">
                <div className="flex items-center">
                  <Users className="h-6 w-6 text-sabc-success mr-3" />
                  <div>
                    <p className="text-sm text-sabc-gray-600">Rôles Actifs</p>
                    <p className="text-xl font-semibold text-sabc-gray-900">{roles.filter(r => r.est_actif).length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-sabc-gray-50 rounded-lg p-4">
                <div className="flex items-center">
                  <Shield className="h-6 w-6 text-sabc-accent mr-3" />
                  <div>
                    <p className="text-sm text-sabc-gray-600">Management</p>
                    <p className="text-xl font-semibold text-sabc-gray-900">{roles.filter(r => r.peut_evaluer_subordonnes).length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-sabc-gray-50 rounded-lg p-4">
                <div className="flex items-center">
                  <Network className="h-6 w-6 text-sabc-info mr-3" />
                  <div>
                    <p className="text-sm text-sabc-gray-600">Inter-branches</p>
                    <p className="text-xl font-semibold text-sabc-gray-900">{roles.filter(r => r.peut_cross_branch).length}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="space-y-6 p-6">

          <div className="space-y-4">
            {/* Table des rôles */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-sabc-red-primary" />
                  Liste des Rôles
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rôle</TableHead>
                      <TableHead>Niveau</TableHead>
                      <TableHead>Permissions</TableHead>
                      <TableHead>Utilisateurs</TableHead>
                      <TableHead>Portée Géographique</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {roles.map((role, roleIndex) => (
                      <TableRow key={`role-${role.id_role || roleIndex}`}>
                        <TableCell>
                          <div>
                            <div className="font-medium text-sabc-gray-900">{role.nom_role}</div>
                            <div className="text-sm text-sabc-gray-500">{role.description}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getBadgeVariant(role)}>
                            {getNiveauDisplay(role)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {getPermissionsBadges(role).map((permission, index) => (
                              <Badge key={`role-${role.id_role || roleIndex}-permission-${permission}-${index}`} variant="outline" className="text-xs">
                                {permission}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Users className="w-4 h-4 mr-1 text-sabc-gray-400" />
                            <span className="text-sm">{role.utilisateurs_count}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {getPorteeGeographique(role)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Eye className="mr-2 h-4 w-4" />
                                Voir
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit className="mr-2 h-4 w-4" />
                                Modifier
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Supprimer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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
    </RoleGuard>
  );
}
