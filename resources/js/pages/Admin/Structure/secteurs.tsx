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
import { MapPin, Plus, Trash2, Users, MoreHorizontal, Building } from 'lucide-react';
import { RoleGuard } from '@/Components/Auth/RoleGuard';
import { route } from 'ziggy-js';

interface Secteur {
  id_secteur: string;
  nom_secteur: string;
  id_service: string;
  id_district?: string;
  service_nom: string;
  district_nom?: string;
  region_nom: string;
  utilisateurs_count: number;
  created_at: string;
}

interface ServiceCommercial {
  id_service: string;
  nom_service: string;
  region_nom: string;
}

interface District {
  id_district: string;
  nom_district: string;
  id_service: string;
}

interface SecteursProps {
  secteurs: Secteur[];
  services: ServiceCommercial[];
  districts: District[];
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

export default function SecteursIndex({ secteurs, services, districts, auth, pageTitle }: SecteursProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [deletingSecteur, setDeletingSecteur] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<string>('');

  const { data, setData, post, delete: destroy, processing, errors, reset } = useForm({
    nom_secteur: '',
    id_service: '',
    id_district: '',
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    post(route('admin.structure.secteurs.store'), {
      onSuccess: () => {
        setIsCreateModalOpen(false);
        reset();
        setSelectedService('');
      },
    });
  };

  const handleDelete = (secteurId: string, hasUsers: boolean) => {
    if (hasUsers) {
      alert('Impossible de supprimer ce secteur car il contient des utilisateurs.');
      return;
    }
    
    if (confirm('Êtes-vous sûr de vouloir supprimer ce secteur ? Cette action est irréversible.')) {
      setDeletingSecteur(secteurId);
      destroy(route('admin.structure.secteurs.destroy', secteurId), {
        onFinish: () => setDeletingSecteur(null),
      });
    }
  };

  const handleServiceChange = (serviceId: string) => {
    setSelectedService(serviceId);
    setData('id_service', serviceId);
    setData('id_district', ''); // Reset district when service changes
  };

  const availableDistricts = districts.filter(d => d.id_service === selectedService);

  return (
    <RoleGuard allowedRoles={['ADMIN']}>
      <AppLayout user={auth.user}>
        <Head title={pageTitle} />
        
        <div className="space-y-6">
          {/* En-tête */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-sabc-gray-900">Gestion des Secteurs</h1>
              <p className="text-sabc-gray-600 mt-1">
                Gérez les secteurs de vente par service commercial et district
              </p>
            </div>
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
              <DialogTrigger asChild>
                <Button className="bg-sabc-red-primary hover:bg-sabc-red-dark">
                  <Plus className="w-4 h-4 mr-2" />
                  Nouveau Secteur
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Créer un Nouveau Secteur</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div>
                    <Label htmlFor="nom_secteur">Nom du secteur</Label>
                    <Input
                      id="nom_secteur"
                      value={data.nom_secteur}
                      onChange={(e) => setData('nom_secteur', e.target.value)}
                      placeholder="Ex: Secteur Bonanjo"
                      required
                    />
                    {errors.nom_secteur && (
                      <p className="text-sm text-red-600 mt-1">{errors.nom_secteur}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="id_service">Service Commercial</Label>
                    <Select value={selectedService} onValueChange={handleServiceChange}>
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
                  <div>
                    <Label htmlFor="id_district">District (optionnel)</Label>
                    <Select 
                      value={data.id_district} 
                      onValueChange={(value) => setData('id_district', value)}
                      disabled={!selectedService}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={selectedService ? "Sélectionner un district" : "Sélectionnez d'abord un service"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Aucun district (rattaché directement au service)</SelectItem>
                        {availableDistricts.map((district) => (
                          <SelectItem key={district.id_district} value={district.id_district}>
                            {district.nom_district}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.id_district && (
                      <p className="text-sm text-red-600 mt-1">{errors.id_district}</p>
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
                    <p className="text-sm font-medium text-sabc-gray-600">Total Secteurs</p>
                    <p className="text-2xl font-bold text-sabc-gray-900">{secteurs.length}</p>
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
                      {secteurs.reduce((sum, s) => sum + s.utilisateurs_count, 0)}
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
                    <p className="text-sm font-medium text-sabc-gray-600">Secteurs Actifs</p>
                    <p className="text-2xl font-bold text-sabc-gray-900">
                      {secteurs.filter(s => s.utilisateurs_count > 0).length}
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
                    <p className="text-sm font-medium text-sabc-gray-600">Avec Districts</p>
                    <p className="text-2xl font-bold text-sabc-gray-900">
                      {secteurs.filter(s => s.district_nom).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Table des secteurs */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-sabc-gray-900">Liste des Secteurs</h3>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Secteur</TableHead>
                    <TableHead>Service Commercial</TableHead>
                    <TableHead>District</TableHead>
                    <TableHead>Région</TableHead>
                    <TableHead>Utilisateurs</TableHead>
                    <TableHead>Créé le</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {secteurs.map((secteur) => (
                    <TableRow key={secteur.id_secteur}>
                      <TableCell>
                        <div className="font-medium text-sabc-gray-900">{secteur.nom_secteur}</div>
                        <div className="text-sm text-sabc-gray-500">{secteur.id_secteur}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{secteur.service_nom}</div>
                      </TableCell>
                      <TableCell>
                        {secteur.district_nom ? (
                          <Badge variant="outline">{secteur.district_nom}</Badge>
                        ) : (
                          <span className="text-sm text-sabc-gray-400">Direct service</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{secteur.region_nom}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Users className="w-4 h-4 mr-1 text-sabc-gray-400" />
                          <span className="text-sm">{secteur.utilisateurs_count}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-sabc-gray-500">
                          {new Date(secteur.created_at).toLocaleDateString('fr-FR')}
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
                              onClick={() => handleDelete(secteur.id_secteur, secteur.utilisateurs_count > 0)}
                              disabled={deletingSecteur === secteur.id_secteur || secteur.utilisateurs_count > 0}
                              className={secteur.utilisateurs_count > 0 ? "text-gray-400" : "text-red-600"}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              {secteur.utilisateurs_count > 0 ? 'Suppression bloquée' : 'Supprimer'}
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
