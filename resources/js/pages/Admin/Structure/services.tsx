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
import { Building2, Plus, Trash2, Users, MoreHorizontal, MapPin } from 'lucide-react';
import { RoleGuard } from '@/Components/Auth/RoleGuard';
import { route } from 'ziggy-js';

interface ServiceCommercial {
  id_service: string;
  nom_service: string;
  id_region: string;
  region_nom: string;
  utilisateurs_count: number;
  districts_count: number;
  secteurs_count: number;
  created_at: string;
}

interface Region {
  id_region: string;
  nom_region: string;
  type_region: string;
}

interface ServicesProps {
  services: ServiceCommercial[];
  regions: Region[];
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

export default function ServicesIndex({ services, regions, auth, pageTitle }: ServicesProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [deletingService, setDeletingService] = useState<string | null>(null);

  const { data, setData, post, delete: destroy, processing, errors, reset } = useForm({
    nom_service: '',
    id_region: '',
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    post(route('admin.structure.services.store'), {
      onSuccess: () => {
        setIsCreateModalOpen(false);
        reset();
      },
    });
  };

  const handleDelete = (serviceId: string, hasUsers: boolean, hasSubEntities: boolean) => {
    if (hasUsers) {
      alert('Impossible de supprimer ce service car il contient des utilisateurs.');
      return;
    }
    if (hasSubEntities) {
      alert('Impossible de supprimer ce service car il contient des districts ou secteurs.');
      return;
    }
    
    if (confirm('Êtes-vous sûr de vouloir supprimer ce service commercial ? Cette action est irréversible.')) {
      setDeletingService(serviceId);
      destroy(route('admin.structure.services.destroy', serviceId), {
        onFinish: () => setDeletingService(null),
      });
    }
  };

  const getRegionBadge = (regionNom: string, regions: Region[]) => {
    const region = regions.find(r => r.nom_region === regionNom);
    return region?.type_region === 'taniere' ? (
      <Badge className="bg-sabc-red-primary text-white">{regionNom}</Badge>
    ) : (
      <Badge variant="outline">{regionNom}</Badge>
    );
  };

  return (
    <RoleGuard allowed={['ADMIN']}>
      <AppLayout user={auth.user}>
        <Head title={pageTitle} />
        
        <div className="space-y-6">
          {/* En-tête */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-sabc-gray-900">Services Commerciaux</h1>
              <p className="text-sabc-gray-600 mt-1">
                Gérez les services commerciaux par région
              </p>
            </div>
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
              <DialogTrigger asChild>
                <Button className="bg-sabc-red-primary hover:bg-sabc-red-dark">
                  <Plus className="w-4 h-4 mr-2" />
                  Nouveau Service
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Créer un Nouveau Service Commercial</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div>
                    <Label htmlFor="nom_service">Nom du service</Label>
                    <Input
                      id="nom_service"
                      value={data.nom_service}
                      onChange={(e) => setData('nom_service', e.target.value)}
                      placeholder="Ex: Service Commercial Littoral"
                      required
                    />
                    {errors.nom_service && (
                      <p className="text-sm text-red-600 mt-1">{errors.nom_service}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="id_region">Région</Label>
                    <Select value={data.id_region} onValueChange={(value) => setData('id_region', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une région" />
                      </SelectTrigger>
                      <SelectContent>
                        {regions.map((region) => (
                          <SelectItem key={region.id_region} value={region.id_region}>
                            {region.nom_region} ({region.type_region === 'taniere' ? 'Tanière' : 'Non-Tanière'})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.id_region && (
                      <p className="text-sm text-red-600 mt-1">{errors.id_region}</p>
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
                  <Building2 className="h-8 w-8 text-sabc-red-primary" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-sabc-gray-600">Total Services</p>
                    <p className="text-2xl font-bold text-sabc-gray-900">{services.length}</p>
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
                      {services.reduce((sum, s) => sum + s.utilisateurs_count, 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Building2 className="h-8 w-8 text-sabc-success" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-sabc-gray-600">Total Districts</p>
                    <p className="text-2xl font-bold text-sabc-gray-900">
                      {services.reduce((sum, s) => sum + s.districts_count, 0)}
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
                    <p className="text-sm font-medium text-sabc-gray-600">Total Secteurs</p>
                    <p className="text-2xl font-bold text-sabc-gray-900">
                      {services.reduce((sum, s) => sum + s.secteurs_count, 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Table des services */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-sabc-gray-900">Liste des Services Commerciaux</h3>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Service</TableHead>
                    <TableHead>Région</TableHead>
                    <TableHead>Utilisateurs</TableHead>
                    <TableHead>Districts</TableHead>
                    <TableHead>Secteurs</TableHead>
                    <TableHead>Créé le</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {services.map((service) => (
                    <TableRow key={service.id_service}>
                      <TableCell>
                        <div className="font-medium text-sabc-gray-900">{service.nom_service}</div>
                        <div className="text-sm text-sabc-gray-500">{service.id_service}</div>
                      </TableCell>
                      <TableCell>
                        {getRegionBadge(service.region_nom, regions)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Users className="w-4 h-4 mr-1 text-sabc-gray-400" />
                          <span className="text-sm">{service.utilisateurs_count}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{service.districts_count}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{service.secteurs_count}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-sabc-gray-500">
                          {new Date(service.created_at).toLocaleDateString('fr-FR')}
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
                                service.id_service, 
                                service.utilisateurs_count > 0,
                                service.districts_count > 0 || service.secteurs_count > 0
                              )}
                              disabled={
                                deletingService === service.id_service || 
                                service.utilisateurs_count > 0 || 
                                service.districts_count > 0 || 
                                service.secteurs_count > 0
                              }
                              className={
                                service.utilisateurs_count > 0 || service.districts_count > 0 || service.secteurs_count > 0
                                  ? "text-gray-400" 
                                  : "text-red-600"
                              }
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              {service.utilisateurs_count > 0 || service.districts_count > 0 || service.secteurs_count > 0
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
