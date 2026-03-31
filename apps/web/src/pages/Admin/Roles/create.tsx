import React from 'react';
import { Head, useForm } from '@/lib/inertia-shim';
import AppLayout from '@/Components/Layout/app/AppLayout';
import { Card, CardHeader, CardContent } from '@/Components/UI/Card';
import { Button } from '@/Components/UI/Button';
import { Input } from '@/Components/UI/Input';
import { Label } from '@/Components/UI/Label';
import { Textarea } from '@/Components/UI/Textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/UI/Select';
import { Checkbox } from '@/Components/UI/Checkbox';
import { ArrowLeft, Save } from 'lucide-react';
import { RoleGuard } from '@/Components/Auth/RoleGuard';

interface CreateRoleProps {
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

export default function CreateRole({ auth, pageTitle }: CreateRoleProps) {
  const { data, setData, post, processing, errors } = useForm({
    nom_role: '',
    description: '',
    niveau_hierarchique: 5,
    peut_auto_evaluer: true,
    peut_evaluer_pairs: true,
    peut_evaluer_subordonnes: false,
    peut_cross_branch: false,
    est_support: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post('/admin/roles');
  };

  const niveauxHierarchiques = [
    { value: 1, label: 'Niveau 1 - Directeur Régional (DR)' },
    { value: 2, label: 'Niveau 2 - Chef Département Trade (CDTT)' },
    { value: 3, label: 'Niveau 3 - Chef Service/RTM (CSC/RTM)' },
    { value: 4, label: 'Niveau 4 - Chef District/TMO (CDV/TMO)' },
    { value: 5, label: 'Niveau 5 - Chef Secteur/AS (CDS/AS)' },
  ];

  return (
    <RoleGuard allowed={['ADMIN']} userRoleName={auth.user.role ?? auth.user.role_display}>
      <AppLayout user={auth.user}>
        <Head title={pageTitle} />
        
        <div className="space-y-6">
          {/* En-tête */}
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => window.history.back()}
              className="flex items-center"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-sabc-gray-900">Créer un Nouveau Rôle</h1>
              <p className="text-sabc-gray-600 mt-1">
                Définissez un nouveau rôle avec ses permissions d'évaluation
              </p>
            </div>
          </div>

          {/* Formulaire */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-sabc-gray-900">Informations du Rôle</h3>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Informations de base */}
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="nom_role">Nom du rôle *</Label>
                      <Input
                        id="nom_role"
                        value={data.nom_role}
                        onChange={(e) => setData('nom_role', e.target.value)}
                        placeholder="Ex: Chef de Secteur"
                        required
                      />
                      {errors.nom_role && (
                        <p className="text-sm text-red-600 mt-1">{errors.nom_role}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={data.description}
                        onChange={(e) => setData('description', e.target.value)}
                        placeholder="Description du rôle et de ses responsabilités"
                        rows={3}
                      />
                      {errors.description && (
                        <p className="text-sm text-red-600 mt-1">{errors.description}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="niveau_hierarchique">Niveau hiérarchique *</Label>
                      <Select 
                        value={data.niveau_hierarchique.toString()} 
                        onValueChange={(value) => setData('niveau_hierarchique', parseInt(value))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {niveauxHierarchiques.map((niveau) => (
                            <SelectItem key={niveau.value} value={niveau.value.toString()}>
                              {niveau.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.niveau_hierarchique && (
                        <p className="text-sm text-red-600 mt-1">{errors.niveau_hierarchique}</p>
                      )}
                    </div>
                  </div>

                  {/* Permissions d'évaluation */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-sabc-gray-900">Permissions d'Évaluation</h4>
                    
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="peut_auto_evaluer"
                          checked={data.peut_auto_evaluer}
                          onCheckedChange={(checked) => setData('peut_auto_evaluer', !!checked)}
                        />
                        <Label htmlFor="peut_auto_evaluer" className="text-sm">
                          Peut s'auto-évaluer
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="peut_evaluer_pairs"
                          checked={data.peut_evaluer_pairs}
                          onCheckedChange={(checked) => setData('peut_evaluer_pairs', !!checked)}
                        />
                        <Label htmlFor="peut_evaluer_pairs" className="text-sm">
                          Peut évaluer ses pairs (même niveau)
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="peut_evaluer_subordonnes"
                          checked={data.peut_evaluer_subordonnes}
                          onCheckedChange={(checked) => setData('peut_evaluer_subordonnes', !!checked)}
                        />
                        <Label htmlFor="peut_evaluer_subordonnes" className="text-sm">
                          Peut évaluer ses subordonnés
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="peut_cross_branch"
                          checked={data.peut_cross_branch}
                          onCheckedChange={(checked) => setData('peut_cross_branch', !!checked)}
                        />
                        <Label htmlFor="peut_cross_branch" className="text-sm">
                          Peut évaluer inter-branches (DR/CDTT uniquement)
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="est_support"
                          checked={data.est_support}
                          onCheckedChange={(checked) => setData('est_support', !!checked)}
                        />
                        <Label htmlFor="est_support" className="text-sm">
                          Rôle de support (remplacements temporaires)
                        </Label>
                      </div>
                    </div>

                    {/* Aide contextuelle */}
                    <div className="bg-sabc-gray-50 p-4 rounded-lg">
                      <h5 className="font-medium text-sabc-gray-900 mb-2">Règles SABC</h5>
                      <ul className="text-sm text-sabc-gray-600 space-y-1">
                        <li>• DR et CDTT : Pas d'auto-évaluation ni évaluation pairs</li>
                        <li>• RTM et SRMO : Uniques par région, pas d'évaluation pairs</li>
                        <li>• CDS et AS : Pas d'évaluation de subordonnés</li>
                        <li>• Inter-branches : Réservé aux DR et CDTT</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-4 pt-6 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => window.history.back()}
                  >
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    disabled={processing}
                    className="bg-sabc-red-primary hover:bg-sabc-red-dark"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {processing ? 'Création...' : 'Créer le Rôle'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    </RoleGuard>
  );
}
