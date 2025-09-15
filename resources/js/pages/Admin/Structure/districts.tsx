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
import { Building, Plus, Trash2, Users, MoreHorizontal, MapPin } from 'lucide-react';
import { RoleGuard } from '@/Components/Auth/RoleGuard';
import { route } from 'ziggy-js';

interface District {
  id_district: string;
  nom_district: string;
  id_service: string;
  service_nom: string;
  region_nom: string;
  utilisateurs_count: number;
  secteurs_count: number;
  created_at: string;
}

interface ServiceCommercial {
  id_service: string;
  nom_service: string;
  region_nom: string;
}

interface DistrictsProps {
  districts: District[];
  services: ServiceCommercial[];
  auth: {
    user: {
      name: string;
      email: string;
      role: string;
      avatar?: string;
    };
  };
  pageTitle: string;
}

export default function DistrictsIndex({ districts, services, auth, pageTitle }: DistrictsProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [deletingDistrict, setDeletingDistrict] = useState<string | null>(null);

  const { data, setData, post, delete: destroy, processing, errors, reset } = useForm({
    nom_district: '',
    id_service: '',
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    post(route('admin.structure.districts.store'), {
      onSuccess: () => {
        setIsCreateModalOpen(false);
        reset();
      },
    });
  };

  const handleDelete = (districtId: string, hasUsers: boolean, hasSecteurs: boolean) => {
    if (hasUsers) {
      alert('Impossible de supprimer ce district car il contient des utilisateurs.');
      return;
    }
    if (hasSecteurs) {
      alert('Impossible de supprimer ce district car il contient des secteurs.');
      return;
    }
    
    if (confirm('Êtes-vous sûr de vouloir supprimer ce district ? Cette action est irréversible.')) {
      setDeletingDistrict(districtId);
      destroy(route('admin.structure.districts.destroy', districtId), {
        onFinish: () => setDeletingDistrict(null),
      });
    }
  };

  return (
    <RoleGuard allowed={['ADMIN']}>
      <AppLayout user={auth.user}>
        <Head title={pageTitle} />
        
        <div className="space-y-6">
          {/* En-tête */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-sabc-gray-900">Gestion des Districts</h1>
              <p className="text-sabc-gray-600 mt-1">
                Gérez les districts de vente par service commercial
              </p>
            </div>
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
              <DialogTrigger asChild>
                <Button className="bg-sabc-red-primary hover:bg-sabc-red-dark">
                  <Plus className="w-4 h-4 mr-2" />
                  Nouveau District
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Créer un Nouveau District</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div>
                    <Label htmlFor="nom_district">Nom du district</Label>
                    <Input
                      id="nom_district"
                      value={data.nom_district}
                      onChange={(e) => setData('nom_district', e.target.value)}
                      placeholder="Ex: District Douala Centre"
                      required
                    />
                    {errors.nom_district && (
                      <p className="text-sm text-red-600 mt-1">{errors.nom_district}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="id_service">Service Commercial</Label>
                    <Select value={data.id_service} onValueChange={(value) => setData('id_service', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un service" />
                      </SelectTrigger>
                      <SelectContent>
                        {services.map((service) => (
                          <SelectItem key={service.id_service} value={service.id_service}>
                            {service.nom_service} - {service.region_nom}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.id_service && (
                      <p className="text-sm text-red-600 mt-1">{errors.id_service}</p>
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
                  <Building className="h-8 w-8 text-sabc-red-primary" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-sabc-gray-600">Total Districts</p>
                    <p className="text-2xl font-bold text-sabc-gray-900">{districts.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-sabc-accent" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-sabc-gray-600">Total Utilisateurs</p>
                    <p className="text-2xl font-bold text-sabc-gray-900">
                      {districts.reduce((sum, d) => sum + d.utilisateurs_count, 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <MapPin className="h-8 w-8 text-sabc-success" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-sabc-gray-600">Total Secteurs</p>
                    <p className="text-2xl font-bold text-sabc-gray-900">
                      {districts.reduce((sum, d) => sum + d.secteurs_count, 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Building className="h-8 w-8 text-sabc-info" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-sabc-gray-600">Districts Actifs</p>
                    <p className="text-2xl font-bold text-sabc-gray-900">
                      {districts.filter(d => d.utilisateurs_count > 0).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Table des districts */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-sabc-gray-900">Liste des Districts</h3>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>District</TableHead>
                    <TableHead>Service Commercial</TableHead>
                    <TableHead>Région</TableHead>
                    <TableHead>Utilisateurs</TableHead>
                    <TableHead>Secteurs</TableHead>
                    <TableHead>Créé le</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {districts.map((district) => (
                    <TableRow key={district.id_district}>
                      <TableCell>
                        <div className="font-medium text-sabc-gray-900">{district.nom_district}</div>
                        <div className="text-sm text-sabc-gray-500">{district.id_district}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{district.service_nom}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{district.region_nom}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Users className="w-4 h-4 mr-1 text-sabc-gray-400" />
                          <span className="text-sm">{district.utilisateurs_count}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{district.secteurs_count}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-sabc-gray-500">
                          {new Date(district.created_at).toLocaleDateString('fr-FR')}
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
                            <DropdownMenuItem
                              onClick={() => handleDelete(
                                district.id_district, 
                                district.utilisateurs_count > 0,
                                district.secteurs_count > 0
                              )}
                              disabled={
                                deletingDistrict === district.id_district || 
                                district.utilisateurs_count > 0 || 
                                district.secteurs_count > 0
                              }
                              className={
                                district.utilisateurs_count > 0 || district.secteurs_count > 0
                                  ? "text-gray-400" 
                                  : "text-red-600"
                              }
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              {district.utilisateurs_count > 0 || district.secteurs_count > 0
                                ? 'Suppression bloquée' 
                                : 'Supprimer'}
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
      </AppLayout>
    </RoleGuard>
  );
}
