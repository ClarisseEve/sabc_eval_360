import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import { Button } from '@/Components/UI/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/UI/Card';
import { Badge } from '@/Components/UI/Badge';
import { Input } from '@/Components/UI/Input';
import { 
  Calendar, 
  Plus, 
  Search, 
  Filter, 
  Eye,
  Edit,
  Trash2,
  Play,
  Pause,
  Square,
  Clock,
  CheckCircle,
  AlertTriangle,
  Users
} from 'lucide-react';
import AppLayout from '@/Components/Layout/app/AppLayout';

interface Periode {
  id_periode: string;
  titre: string;
  description?: string;
  date_debut: string;
  date_fin: string;
  statut: 'planifiée' | 'active' | 'terminée' | 'suspendue';
  est_ouverte: boolean;
  regle_nom: string;
  region_nom: string;
  nb_evaluations: number;
  nb_evaluations_completees: number;
  created_at: string;
  updated_at: string;
}

interface Regle {
  id_regle: string;
  nom_regle: string;
  criteres_evaluation_json: any;
}

interface Region {
  id_region: string;
  nom_region: string;
}

interface Statistiques {
  total_periodes: number;
  periodes_actives: number;
  periodes_ouvertes: number;
  periodes_terminees: number;
}

interface PageProps {
  periodes: Periode[];
  statistiques: Statistiques;
  regles: Regle[];
  regions: Region[];
  user: any;
}

const AdminPeriodesPage = ({ periodes, statistiques, regles, regions, user }: PageProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatut, setSelectedStatut] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');

  // Filtrage des périodes
  const filteredPeriodes = periodes.filter(periode => {
    const matchesSearch = !searchTerm || 
      periode.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      periode.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      periode.regle_nom.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatut = !selectedStatut || periode.statut === selectedStatut;
    const matchesRegion = !selectedRegion || periode.region_nom === selectedRegion;

    return matchesSearch && matchesStatut && matchesRegion;
  });

  const getStatutBadge = (statut: string, est_ouverte: boolean) => {
    switch (statut) {
      case 'planifiée':
        return <Badge variant="secondary">Planifiée</Badge>;
      case 'active':
        return est_ouverte 
          ? <Badge variant="default" className="bg-sabc-success text-white">Active - Ouverte</Badge>
          : <Badge variant="default" className="bg-sabc-accent text-white">Active - Fermée</Badge>;
      case 'terminée':
        return <Badge variant="outline" className="border-sabc-gray-400 text-sabc-gray-600">Terminée</Badge>;
      case 'suspendue':
        return <Badge variant="destructive">Suspendue</Badge>;
      default:
        return <Badge>{statut}</Badge>;
    }
  };

  const getProgressPercentage = (completees: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((completees / total) * 100);
  };

  const handleCreatePeriode = () => {
    window.location.href = '/admin/evaluations/periodes/create';
  };

  const handleViewPeriode = (id: string) => {
    window.location.href = `/admin/evaluations/periodes/${id}`;
  };

  const handleEditPeriode = (id: string) => {
    window.location.href = `/admin/evaluations/periodes/${id}/edit`;
  };

  const handleToggleStatus = (id: string, action: string) => {
    // Implémentation via formulaire Inertia ou fetch
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = `/admin/evaluations/periodes/${id}/toggle`;
    
    const csrfInput = document.createElement('input');
    csrfInput.type = 'hidden';
    csrfInput.name = '_token';
    csrfInput.value = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
    
    const methodInput = document.createElement('input');
    methodInput.type = 'hidden';
    methodInput.name = '_method';
    methodInput.value = 'PATCH';
    
    const actionInput = document.createElement('input');
    actionInput.type = 'hidden';
    actionInput.name = 'action';
    actionInput.value = action;
    
    form.appendChild(csrfInput);
    form.appendChild(methodInput);
    form.appendChild(actionInput);
    document.body.appendChild(form);
    form.submit();
  };

  const handleDeletePeriode = (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette période d\'évaluation ?')) {
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = `/admin/evaluations/periodes/${id}`;
      
      const csrfInput = document.createElement('input');
      csrfInput.type = 'hidden';
      csrfInput.name = '_token';
      csrfInput.value = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
      
      const methodInput = document.createElement('input');
      methodInput.type = 'hidden';
      methodInput.name = '_method';
      methodInput.value = 'DELETE';
      
      form.appendChild(csrfInput);
      form.appendChild(methodInput);
      document.body.appendChild(form);
      form.submit();
    }
  };

  return (
    <AppLayout user={user} pageTitle="Gestion des périodes d'évaluation">
      <Head title="Périodes d'évaluation - SABC Admin" />
      
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-sabc-gray-900">Périodes d'évaluation</h1>
            <p className="text-sabc-gray-600 mt-1">Gestion des cycles d'évaluation SABC</p>
          </div>
          <Button onClick={handleCreatePeriode} className="bg-sabc-red-primary hover:bg-sabc-red-dark">
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle période
          </Button>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-sabc-gray-600">Total</p>
                  <p className="text-2xl font-bold text-sabc-gray-900">{statistiques.total_periodes}</p>
                </div>
                <Calendar className="h-8 w-8 text-sabc-gray-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-sabc-gray-600">Actives</p>
                  <p className="text-2xl font-bold text-sabc-success">{statistiques.periodes_actives}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-sabc-success" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-sabc-gray-600">Ouvertes</p>
                  <p className="text-2xl font-bold text-sabc-accent">{statistiques.periodes_ouvertes}</p>
                </div>
                <Play className="h-8 w-8 text-sabc-accent" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-sabc-gray-600">Terminées</p>
                  <p className="text-2xl font-bold text-sabc-gray-400">{statistiques.periodes_terminees}</p>
                </div>
                <Square className="h-8 w-8 text-sabc-gray-400" />
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-sabc-gray-400" />
                <Input
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <select 
                value={selectedStatut} 
                onChange={(e) => setSelectedStatut(e.target.value)}
                className="px-3 py-2 border border-sabc-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-sabc-red-primary"
              >
                <option value="">Tous les statuts</option>
                <option value="planifiée">Planifiée</option>
                <option value="active">Active</option>
                <option value="terminée">Terminée</option>
                <option value="suspendue">Suspendue</option>
              </select>
              
              <select 
                value={selectedRegion} 
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="px-3 py-2 border border-sabc-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-sabc-red-primary"
              >
                <option value="">Toutes les régions</option>
                {regions.map(region => (
                  <option key={region.id_region} value={region.nom_region}>{region.nom_region}</option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Liste des périodes */}
        <Card>
          <CardHeader>
            <CardTitle>Périodes d'évaluation ({filteredPeriodes.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredPeriodes.map((periode) => (
                <div key={periode.id_periode} className="border rounded-lg p-4 hover:bg-sabc-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-medium text-sabc-gray-900">
                          {periode.titre}
                        </h3>
                        {getStatutBadge(periode.statut, periode.est_ouverte)}
                      </div>
                      
                      {periode.description && (
                        <p className="text-sm text-sabc-gray-600 mb-2">
                          {periode.description}
                        </p>
                      )}
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-sabc-gray-600">
                        <div>
                          <span className="font-medium">Début:</span> {new Date(periode.date_debut).toLocaleDateString('fr-FR')}
                        </div>
                        <div>
                          <span className="font-medium">Fin:</span> {new Date(periode.date_fin).toLocaleDateString('fr-FR')}
                        </div>
                        <div>
                          <span className="font-medium">Région:</span> {periode.region_nom}
                        </div>
                        <div>
                          <span className="font-medium">Règle:</span> {periode.regle_nom}
                        </div>
                      </div>
                      
                      {/* Barre de progression */}
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-sabc-gray-600">
                            Évaluations: {periode.nb_evaluations_completees}/{periode.nb_evaluations}
                          </span>
                          <span className="text-sabc-gray-600">
                            {getProgressPercentage(periode.nb_evaluations_completees, periode.nb_evaluations)}%
                          </span>
                        </div>
                        <div className="w-full bg-sabc-gray-200 rounded-full h-2">
                          <div 
                            className="bg-sabc-red-primary h-2 rounded-full transition-all duration-300"
                            style={{ 
                              width: `${getProgressPercentage(periode.nb_evaluations_completees, periode.nb_evaluations)}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center gap-2 ml-4">
                      {periode.statut === 'planifiée' && (
                        <Button
                          onClick={() => handleToggleStatus(periode.id_periode, 'activer')}
                          variant="outline"
                          size="sm"
                          title="Activer"
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                      )}
                      
                      {periode.statut === 'active' && (
                        <>
                          <Button
                            onClick={() => handleToggleStatus(periode.id_periode, periode.est_ouverte ? 'fermer' : 'ouvrir')}
                            variant="outline"
                            size="sm"
                            title={periode.est_ouverte ? 'Fermer' : 'Ouvrir'}
                          >
                            {periode.est_ouverte ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                          </Button>
                          <Button
                            onClick={() => handleToggleStatus(periode.id_periode, 'terminer')}
                            variant="outline"
                            size="sm"
                            title="Terminer"
                          >
                            <Square className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      
                      <Button
                        onClick={() => handleViewPeriode(periode.id_periode)}
                        variant="outline"
                        size="sm"
                        title="Voir détails"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      
                      {periode.statut !== 'terminée' && (
                        <Button
                          onClick={() => handleEditPeriode(periode.id_periode)}
                          variant="ghost"
                          size="sm"
                          title="Modifier"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      
                      {periode.nb_evaluations === 0 && (
                        <Button
                          onClick={() => handleDeletePeriode(periode.id_periode)}
                          variant="ghost"
                          size="sm"
                          className="text-sabc-error hover:text-sabc-error hover:bg-sabc-red-light"
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {filteredPeriodes.length === 0 && (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-sabc-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-sabc-gray-900 mb-2">
                    Aucune période trouvée
                  </h3>
                  <p className="text-sabc-gray-600">
                    Modifiez vos critères de recherche ou créez une nouvelle période d'évaluation.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default AdminPeriodesPage;
