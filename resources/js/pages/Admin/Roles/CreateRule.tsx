import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/Components/Layout/app/AppLayout';
import { Card, CardHeader, CardContent, CardTitle } from '@/Components/UI/Card';
import { Button } from '@/Components/UI/Button';
import { Input } from '@/Components/UI/Input';
import { Label } from '@/Components/UI/Label';
import { Textarea } from '@/Components/UI/Textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/UI/Select';
import { Checkbox } from '@/Components/UI/Checkbox';
import { Badge } from '@/Components/UI/Badge';
import { ArrowLeft, Save, Plus, Trash2, AlertTriangle } from 'lucide-react';
import { RoleGuard } from '@/Components/Auth/RoleGuard';
import { route } from 'ziggy-js';

interface Role {
  id_role: string;
  nom_role: string;
  description: string;
}

interface CreateRuleProps {
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
  roles: Role[];
}

interface Critere {
  nom: string;
  description: string;
  poids: number;
}

export default function CreateRule({ auth, pageTitle, roles }: CreateRuleProps) {
  const [criteres, setCriteres] = useState<Critere[]>([
    { nom: 'Performance Commerciale', description: 'Atteinte des objectifs de vente', poids: 25 },
    { nom: 'Leadership', description: 'Capacité à diriger et motiver une équipe', poids: 20 },
    { nom: 'Communication', description: 'Qualité de la communication interne et externe', poids: 15 },
    { nom: 'Innovation', description: 'Capacité d\'innovation et d\'amélioration continue', poids: 20 },
    { nom: 'Respect des Procédures', description: 'Conformité aux processus SABC', poids: 20 },
  ]);

  const { data, setData, post, processing, errors } = useForm({
    nom_regle: '',
    description: '',
    type_evaluation: '',
    est_active: true,
  });

  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation des poids (doivent totaliser 100%)
    const totalPoids = criteres.reduce((sum, critere) => sum + critere.poids, 0);
    if (totalPoids !== 100) {
      alert('La somme des poids des critères doit être égale à 100%');
      return;
    }

    // Préparation des données selon les règles SABC
    post(route('admin.roles.rules.store'), {
      ...data,
      criteres_evaluation_json: criteres,
      roles_autorises: selectedRoles,
    });
  };

  const ajouterCritere = () => {
    setCriteres([...criteres, { nom: '', description: '', poids: 0 }]);
  };

  const supprimerCritere = (index: number) => {
    if (criteres.length > 5) {
      setCriteres(criteres.filter((_, i) => i !== index));
    }
  };

  const updateCritere = (index: number, field: keyof Critere, value: string | number) => {
    const nouveauxCriteres = [...criteres];
    nouveauxCriteres[index] = { ...nouveauxCriteres[index], [field]: value };
    setCriteres(nouveauxCriteres);
  };

  const toggleRole = (roleId: string) => {
    if (selectedRoles.includes(roleId)) {
      setSelectedRoles(selectedRoles.filter(id => id !== roleId));
    } else {
      setSelectedRoles([...selectedRoles, roleId]);
    }
  };

  const totalPoids = criteres.reduce((sum, critere) => sum + critere.poids, 0);

  return (
    <RoleGuard allowed={['ADMIN']} userRoleName={auth.user.role_display}>
      <AppLayout user={auth.user}>
        <Head title={pageTitle} />
        
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-sabc-gray-900">Créer une Règle d'Évaluation</h1>
              <p className="text-sabc-gray-600 mt-1">
                Configuration d'une nouvelle règle d'évaluation selon les standards SABC
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => window.history.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informations générales */}
            <Card>
              <CardHeader>
                <CardTitle>Informations Générales</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nom_regle">Nom de la Règle *</Label>
                    <Input
                      id="nom_regle"
                      value={data.nom_regle}
                      onChange={(e) => setData('nom_regle', e.target.value)}
                      placeholder="Ex: Évaluation DR - Région Tanière"
                      className={errors.nom_regle ? 'border-sabc-error' : ''}
                    />
                    {errors.nom_regle && (
                      <p className="text-sm text-sabc-error mt-1">{errors.nom_regle}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="type_evaluation">Type d'Évaluation *</Label>
                    <Select value={data.type_evaluation} onValueChange={(value) => setData('type_evaluation', value)}>
                      <SelectTrigger className={errors.type_evaluation ? 'border-sabc-error' : ''}>
                        <SelectValue placeholder="Sélectionner le type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">Auto-évaluation</SelectItem>
                        <SelectItem value="pairs">Évaluation par les pairs</SelectItem>
                        <SelectItem value="descendante">Évaluation descendante (Manager → Subordonné)</SelectItem>
                        <SelectItem value="ascendante">Évaluation ascendante (Subordonné → Manager)</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.type_evaluation && (
                      <p className="text-sm text-sabc-error mt-1">{errors.type_evaluation}</p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={data.description}
                    onChange={(e) => setData('description', e.target.value)}
                    placeholder="Décrivez l'objectif et le contexte de cette règle d'évaluation..."
                    rows={3}
                    className={errors.description ? 'border-sabc-error' : ''}
                  />
                  {errors.description && (
                    <p className="text-sm text-sabc-error mt-1">{errors.description}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Critères d'évaluation */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Critères d'Évaluation</CardTitle>
                    <p className="text-sm text-sabc-gray-600 mt-1">
                      Minimum 5 critères requis. Total des poids : {totalPoids}%
                      {totalPoids !== 100 && (
                        <span className="text-sabc-error ml-2">
                          <AlertTriangle className="h-4 w-4 inline mr-1" />
                          Doit totaliser 100%
                        </span>
                      )}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={ajouterCritere}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Ajouter
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {criteres.map((critere, index) => (
                    <div key={index} className="border border-sabc-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="font-medium text-sabc-gray-900">Critère {index + 1}</h4>
                        {criteres.length > 5 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => supprimerCritere(index)}
                            className="text-sabc-error hover:text-sabc-error hover:bg-sabc-error/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <Label>Nom du Critère</Label>
                          <Input
                            value={critere.nom}
                            onChange={(e) => updateCritere(index, 'nom', e.target.value)}
                            placeholder="Ex: Performance Commerciale"
                          />
                        </div>
                        <div>
                          <Label>Description</Label>
                          <Input
                            value={critere.description}
                            onChange={(e) => updateCritere(index, 'description', e.target.value)}
                            placeholder="Décrivez ce critère..."
                          />
                        </div>
                        <div>
                          <Label>Poids (%)</Label>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={critere.poids}
                            onChange={(e) => updateCritere(index, 'poids', parseInt(e.target.value) || 0)}
                            placeholder="0"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Rôles autorisés */}
            <Card>
              <CardHeader>
                <CardTitle>Rôles Autorisés</CardTitle>
                <p className="text-sm text-sabc-gray-600">
                  Sélectionnez les rôles qui peuvent utiliser cette règle d'évaluation
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {roles.map((role) => (
                    <div
                      key={role.id_role}
                      className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                        selectedRoles.includes(role.id_role)
                          ? 'border-sabc-red-primary bg-sabc-red-light'
                          : 'border-sabc-gray-200 hover:border-sabc-gray-300'
                      }`}
                      onClick={() => toggleRole(role.id_role)}
                    >
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={selectedRoles.includes(role.id_role)}
                          onChange={() => toggleRole(role.id_role)}
                        />
                        <div>
                          <Badge variant="outline" className="text-xs">
                            {role.nom_role}
                          </Badge>
                          <p className="text-xs text-sabc-gray-600 mt-1 truncate">
                            {role.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {errors.roles_autorises && (
                  <p className="text-sm text-sabc-error mt-2">{errors.roles_autorises}</p>
                )}
              </CardContent>
            </Card>

            {/* Statut */}
            <Card>
              <CardHeader>
                <CardTitle>Statut</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="est_active"
                    checked={data.est_active}
                    onCheckedChange={(checked) => setData('est_active', checked as boolean)}
                  />
                  <Label htmlFor="est_active">
                    Activer cette règle d'évaluation immédiatement
                  </Label>
                </div>
                <p className="text-sm text-sabc-gray-600 mt-2">
                  Si désactivée, cette règle ne sera pas disponible pour les évaluations
                </p>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => window.history.back()}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={processing || totalPoids !== 100 || selectedRoles.length === 0}
                className="bg-sabc-red-primary hover:bg-sabc-red-dark"
              >
                <Save className="h-4 w-4 mr-2" />
                {processing ? 'Création...' : 'Créer la Règle'}
              </Button>
            </div>
          </form>
        </div>
      </AppLayout>
    </RoleGuard>
  );
}
