import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/Components/Layout/app/AppLayout';
import { Card, CardHeader, CardContent } from '@/Components/UI/Card/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/UI/Table/Table';
import { Button } from '@/Components/UI/Button/Button';
import { Badge } from '@/Components/UI/Badge/Badge';
import { Input } from '@/Components/UI/Input/Input';
import { Label } from '@/Components/UI/Label/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/UI/Select/Select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/Components/UI/DropdownMenu/DropdownMenu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/Components/UI/Dialog/Dialog';
import { MapPin, Plus, Edit, Trash2, Users, MoreHorizontal } from 'lucide-react';
import { RoleGuard } from '@/Components/Auth/RoleGuard';

interface Region {
  id_region: string;
  nom_region: string;
  type_region: 'taniere' | 'non_taniere';
  utilisateurs_count: number;
  services_count: number;
  created_at: string;
}

interface RegionsProps {
  regions: Region[];
  auth: {
    user: {
      name: string;
      display_name: string;
      role_display: string;
      matricule: string;
      region: string;
      isAdmin: boolean;
    };
  };
  pageTitle: string;
}

export default function RegionsIndex({ regions, auth, pageTitle }: RegionsProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingRegion, setEditingRegion] = useState<Region | null>(null);
  const [deletingRegion, setDeletingRegion] = useState<string | null>(null);

  const { data, setData, post, put, delete: destroy, processing, errors, reset } = useForm({
    nom_region: '',
    type_region: 'non_taniere' as 'taniere' | 'non_taniere',
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    post(route('admin.structure.regions.store'), {
      onSuccess: () => {
        setIsCreateModalOpen(false);
        reset();
      },
    });
  };

  const handleEdit = (region: Region) => {
    setEditingRegion(region);
    setData({
      nom_region: region.nom_region,
      type_region: region.type_region,
    });
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRegion) return;
    
    put(route('admin.structure.regions.update', editingRegion.id_region), {
      onSuccess: () => {
        setEditingRegion(null);
        reset();
      },
    });
  };

  const handleDelete = (regionId: string, hasUsers: boolean) => {
    if (hasUsers) {
      alert('Impossible de supprimer cette région car elle contient des utilisateurs.');
      return;
    }
    
    if (confirm('Êtes-vous sûr de vouloir supprimer cette région ? Cette action est irréversible.')) {
      setDeletingRegion(regionId);
      destroy(route('admin.structure.regions.destroy', regionId), {
        onFinish: () => setDeletingRegion(null),
      });
    }
  };

  const getTypeBadge = (type: string) => {
    return type === 'taniere' ? (
      <Badge className="bg-sabc-red-primary text-white">Tanière</Badge>
    ) : (
      <Badge variant="outline">Non-Tanière</Badge>
    );
  };

  return (
    <RoleGuard allowedRoles={['ADMIN']}>
      <AppLayout user={auth.user}>
        <Head title={pageTitle} />
        
        <div className="space-y-6">
          {/* En-tête */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-sabc-gray-900">Gestion des Régions</h1>
              <p className="text-sabc-gray-600 mt-1">
                Gérez les régions SABC et leur typologie (tanière/non-tanière)
              </p>
            </div>
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
              <DialogTrigger asChild>
                <Button className="bg-sabc-red-primary hover:bg-sabc-red-dark">
                  <Plus className="w-4 h-4 mr-2" />
                  Nouvelle Région
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Créer une Nouvelle Région</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div>
                    <Label htmlFor="nom_region">Nom de la région</Label>
                    <Input
                      id="nom_region"
                      value={data.nom_region}
                      onChange={(e) => setData('nom_region', e.target.value)}
                      placeholder="Ex: Littoral, Centre, Ouest..."
                      required
                    />
                    {errors.nom_region && (
                      <p className="text-sm text-red-600 mt-1">{errors.nom_region}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="type_region">Type de région</Label>
                    <Select value={data.type_region} onValueChange={(value: 'taniere' | 'non_taniere') => setData('type_region', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="non_taniere">Non-Tanière (3 niveaux)</SelectItem>
                        <SelectItem value="taniere">Tanière (5 niveaux)</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.type_region && (
                      <p className="text-sm text-red-600 mt-1">{errors.type_region}</p>
                    )}
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                      Annuler
                    </Button>
                    <Button type="submit" disabled={processing} className="bg-sabc-red-primary hover:bg-sabc-red-dark">
                      Créer
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <MapPin className="h-8 w-8 text-sabc-red-primary" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-sabc-gray-600">Total Régions</p>
                    <p className="text-2xl font-bold text-sabc-gray-900">{regions.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <MapPin className="h-8 w-8 text-sabc-accent" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-sabc-gray-600">Régions Tanières</p>
                    <p className="text-2xl font-bold text-sabc-gray-900">
                      {regions.filter(r => r.type_region === 'taniere').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-sabc-success" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-sabc-gray-600">Total Utilisateurs</p>
                    <p className="text-2xl font-bold text-sabc-gray-900">
                      {regions.reduce((sum, r) => sum + r.utilisateurs_count, 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <MapPin className="h-8 w-8 text-sabc-info" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-sabc-gray-600">Services Totaux</p>
                    <p className="text-2xl font-bold text-sabc-gray-900">
                      {regions.reduce((sum, r) => sum + r.services_count, 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Table des régions */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-sabc-gray-900">Liste des Régions</h3>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Région</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Utilisateurs</TableHead>
                    <TableHead>Services</TableHead>
                    <TableHead>Créée le</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {regions.map((region) => (
                    <TableRow key={region.id_region}>
                      <TableCell>
                        <div className="font-medium text-sabc-gray-900">{region.nom_region}</div>
                        <div className="text-sm text-sabc-gray-500">{region.id_region}</div>
                      </TableCell>
                      <TableCell>
                        {getTypeBadge(region.type_region)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Users className="w-4 h-4 mr-1 text-sabc-gray-400" />
                          <span className="text-sm">{region.utilisateurs_count}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{region.services_count}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-sabc-gray-500">
                          {new Date(region.created_at).toLocaleDateString('fr-FR')}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(region)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Modifier
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(region.id_region, region.utilisateurs_count > 0)}
                              disabled={deletingRegion === region.id_region || region.utilisateurs_count > 0}
                              className={region.utilisateurs_count > 0 ? "text-gray-400" : "text-red-600"}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              {region.utilisateurs_count > 0 ? 'Suppression bloquée' : 'Supprimer'}
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

          {/* Modal d'édition */}
          {editingRegion && (
            <Dialog open={!!editingRegion} onOpenChange={() => setEditingRegion(null)}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Modifier la Région</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleUpdate} className="space-y-4">
                  <div>
                    <Label htmlFor="edit_nom_region">Nom de la région</Label>
                    <Input
                      id="edit_nom_region"
                      value={data.nom_region}
                      onChange={(e) => setData('nom_region', e.target.value)}
                      required
                    />
                    {errors.nom_region && (
                      <p className="text-sm text-red-600 mt-1">{errors.nom_region}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="edit_type_region">Type de région</Label>
                    <Select value={data.type_region} onValueChange={(value: 'taniere' | 'non_taniere') => setData('type_region', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="non_taniere">Non-Tanière (3 niveaux)</SelectItem>
                        <SelectItem value="taniere">Tanière (5 niveaux)</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.type_region && (
                      <p className="text-sm text-red-600 mt-1">{errors.type_region}</p>
                    )}
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setEditingRegion(null)}>
                      Annuler
                    </Button>
                    <Button type="submit" disabled={processing} className="bg-sabc-red-primary hover:bg-sabc-red-dark">
                      Mettre à jour
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </AppLayout>
    </RoleGuard>
  );
}
