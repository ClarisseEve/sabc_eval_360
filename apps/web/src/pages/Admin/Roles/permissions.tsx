import React, { useState } from 'react';
import { Head, useForm } from '@/lib/inertia-shim';
import AppLayout from '@/Components/Layout/app/AppLayout';

import { Card, CardContent, CardHeader, CardTitle } from '@/Components/UI/Card';
import { Badge } from '@/Components/UI/Badge';
import { Button } from '@/Components/UI/Button';
import { Input } from '@/Components/UI/Input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/UI/Table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/Components/UI/Tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/Components/UI/Dialog';
import { Switch } from '@/Components/UI/Switch/Switch';
import { Label } from '@/Components/UI/Label';
import { Textarea } from '@/Components/UI/Textarea';
import { Shield, Users, Eye, Settings, Search, Filter, CheckCircle, XCircle, AlertCircle, Edit, Save, AlertTriangle, Lock, Unlock, Plus } from 'lucide-react';
import { RoleGuard } from '@/Components/Auth/RoleGuard';

interface Permission {
  id: string;
  nom: string;
  description: string;
  actif: boolean;
}

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
  permissions: Permission[];
}

interface RegleEvaluation {
  id_regle: string;
  nom_regle: string;
  description: string;
  criteres_evaluation_json: any;
  est_active: boolean;
  type_evaluation: string;
  roles_autorises: string[];
}

interface Props {
  roles: Role[];
  regles_evaluation: RegleEvaluation[];
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

export default function RolesPermissions({ roles = [], regles_evaluation = [], auth, pageTitle }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [editingRule, setEditingRule] = useState<RegleEvaluation | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Vérifications de sécurité selon règles SABC
  const safeRoles = Array.isArray(roles) ? roles : [];
  const safeReglesEvaluation = Array.isArray(regles_evaluation) ? regles_evaluation : [];

  const { data, setData, post, processing, errors, reset } = useForm({
    id_regle: '',
    nom_regle: '',
    description: '',
    criteres_evaluation_json: {},
    est_active: true as boolean,
    type_evaluation: '',
    roles_autorises: [] as string[],
  });

  // Matrice des permissions selon les règles SABC
  const getPermissionMatrix = () => {
    return safeRoles.map(role => ({
      id_role: role.id_role,
      nom_role: role.nom_role,
      auto_eval: role.peut_auto_evaluer,
      eval_pairs: role.peut_evaluer_pairs,
      eval_subordonnes: role.peut_evaluer_subordonnes,
      cross_branch: role.peut_cross_branch,
      niveau_taniere: role.niveau_taniere,
      niveau_non_taniere: role.niveau_non_taniere,
      permissions: role.permissions || []
    }));
  };

  const handleEditRule = (rule: RegleEvaluation) => {
    setEditingRule(rule);
    setData({
      id_regle: rule.id_regle,
      nom_regle: rule.nom_regle,
      description: rule.description,
      criteres_evaluation_json: rule.criteres_evaluation_json,
      est_active: rule.est_active,
      type_evaluation: rule.type_evaluation,
      roles_autorises: rule.roles_autorises,
    });
    setIsEditModalOpen(true);
  };

  const handleSaveRule = () => {
    post('/admin/roles/permissions/update', {
      onSuccess: () => {
        setIsEditModalOpen(false);
        setEditingRule(null);
        reset();
      },
    });
  };

  const toggleRolePermission = (ruleId: string, roleId: string) => {
    // Logique pour basculer les permissions des rôles
    console.log(`Toggle permission for rule ${ruleId} and role ${roleId}`);
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
                <h1 className="text-2xl font-bold text-sabc-gray-900">Rôles et Permissions</h1>
                <p className="text-sm text-sabc-gray-600 mt-1">Configuration des permissions d'évaluation selon les règles métier SABC</p>
              </div>
              <div className="flex items-center gap-3">
                <Button 
                  className="bg-sabc-red-primary hover:bg-sabc-red-dark text-white"
                  onClick={() => window.location.href = '/admin/roles/rules/create'}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nouvelle Règle
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
                    <p className="text-xl font-semibold text-sabc-gray-900">{safeRoles.length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-sabc-gray-50 rounded-lg p-4">
                <div className="flex items-center">
                  <CheckCircle className="h-6 w-6 text-sabc-success mr-3" />
                  <div>
                    <p className="text-sm text-sabc-gray-600">Règles Actives</p>
                    <p className="text-xl font-semibold text-sabc-gray-900">{safeReglesEvaluation.filter(r => r.est_active).length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-sabc-gray-50 rounded-lg p-4">
                <div className="flex items-center">
                  <Users className="h-6 w-6 text-sabc-accent mr-3" />
                  <div>
                    <p className="text-sm text-sabc-gray-600">Auto-évaluation</p>
                    <p className="text-xl font-semibold text-sabc-gray-900">{getPermissionMatrix().filter(p => p.auto_eval).length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-sabc-gray-50 rounded-lg p-4">
                <div className="flex items-center">
                  <Settings className="h-6 w-6 text-sabc-info mr-3" />
                  <div>
                    <p className="text-sm text-sabc-gray-600">Inter-branches</p>
                    <p className="text-xl font-semibold text-sabc-gray-900">{getPermissionMatrix().filter(p => p.cross_branch).length}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="space-y-6 p-6">
          {/* Onglets */}
          <Tabs defaultValue="matrix" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="matrix" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Matrice des Permissions
              </TabsTrigger>
              <TabsTrigger value="rules" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Règles d'Évaluation
              </TabsTrigger>
              <TabsTrigger value="details" className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Détails par Rôle
              </TabsTrigger>
            </TabsList>

            {/* Matrice des permissions */}
            <TabsContent value="matrix" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-sabc-red-primary" />
                    Matrice des Permissions SABC
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Rôle</TableHead>
                        <TableHead>Niveau</TableHead>
                        <TableHead className="text-center">Auto-évaluation</TableHead>
                        <TableHead className="text-center">Évaluation Pairs</TableHead>
                        <TableHead className="text-center">Évaluation Subordonnés</TableHead>
                        <TableHead className="text-center">Inter-branches</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getPermissionMatrix().map((permission) => (
                        <TableRow key={permission.id_role}>
                          <TableCell>
                            <Badge variant="default" className="bg-sabc-red-primary">
                              {permission.nom_role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {permission.niveau_taniere || permission.niveau_non_taniere || 'N/A'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            {permission.auto_eval ? (
                              <CheckCircle className="h-5 w-5 text-sabc-success mx-auto" />
                            ) : (
                              <XCircle className="h-5 w-5 text-sabc-gray-400 mx-auto" />
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {permission.eval_pairs ? (
                              <CheckCircle className="h-5 w-5 text-sabc-success mx-auto" />
                            ) : (
                              <XCircle className="h-5 w-5 text-sabc-gray-400 mx-auto" />
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {permission.eval_subordonnes ? (
                              <CheckCircle className="h-5 w-5 text-sabc-success mx-auto" />
                            ) : (
                              <XCircle className="h-5 w-5 text-sabc-gray-400 mx-auto" />
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {permission.cross_branch ? (
                              <CheckCircle className="h-5 w-5 text-sabc-success mx-auto" />
                            ) : (
                              <XCircle className="h-5 w-5 text-sabc-gray-400 mx-auto" />
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Règles d'évaluation */}
            <TabsContent value="rules" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5 text-sabc-red-primary" />
                    Règles d'Évaluation 360°
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Règle</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Rôles Autorisés</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {regles_evaluation?.map((rule) => (
                        <TableRow key={rule.id_regle}>
                          <TableCell>
                            <div>
                              <div className="font-medium text-sabc-gray-900">{rule.nom_regle}</div>
                              <div className="text-sm text-sabc-gray-500">{rule.description}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {rule.type_evaluation}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {rule.roles_autorises?.map((role, index) => (
                                <Badge key={`${rule.id_regle}-role-${index}`} variant="secondary" className="text-xs">
                                  {role}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            {rule.est_active ? (
                              <Badge variant="default" className="bg-sabc-success">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Active
                              </Badge>
                            ) : (
                              <Badge variant="secondary">
                                <XCircle className="h-3 w-3 mr-1" />
                                Inactive
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditRule(rule)}
                              className="mr-2"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      )) || (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-sabc-gray-500">
                            Aucune règle d'évaluation configurée
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Détails par rôle */}
            <TabsContent value="details" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {getPermissionMatrix().map((permission) => (
                  <Card key={permission.id_role}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Badge variant="default" className="bg-sabc-red-primary">
                          {permission.nom_role}
                        </Badge>
                        <span className="text-sm text-sabc-gray-500">
                          {permission.niveau_taniere || permission.niveau_non_taniere || 'N/A'}
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Auto-évaluation</span>
                          {permission.auto_eval ? (
                            <CheckCircle className="h-4 w-4 text-sabc-success" />
                          ) : (
                            <XCircle className="h-4 w-4 text-sabc-gray-400" />
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Évaluation pairs</span>
                          {permission.eval_pairs ? (
                            <CheckCircle className="h-4 w-4 text-sabc-success" />
                          ) : (
                            <XCircle className="h-4 w-4 text-sabc-gray-400" />
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Évaluation subordonnés</span>
                          {permission.eval_subordonnes ? (
                            <CheckCircle className="h-4 w-4 text-sabc-success" />
                          ) : (
                            <XCircle className="h-4 w-4 text-sabc-gray-400" />
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Inter-branches</span>
                          {permission.cross_branch ? (
                            <CheckCircle className="h-4 w-4 text-sabc-success" />
                          ) : (
                            <XCircle className="h-4 w-4 text-sabc-gray-400" />
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>

          {/* Modal d'édition des règles */}
          <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Edit className="h-5 w-5 text-sabc-red-primary" />
                  Modifier la Règle d'Évaluation
                </DialogTitle>
                <DialogDescription>
                  Modifiez les paramètres de la règle d'évaluation selon les règles métier SABC.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nom_regle">Nom de la règle</Label>
                    <Input
                      id="nom_regle"
                      value={data.nom_regle}
                      onChange={(e) => setData('nom_regle', e.target.value)}
                      placeholder="Ex: Évaluation Semestrielle"
                    />
                  </div>
                  <div>
                    <Label htmlFor="type_evaluation">Type d'évaluation</Label>
                    <Input
                      id="type_evaluation"
                      value={data.type_evaluation}
                      onChange={(e) => setData('type_evaluation', e.target.value)}
                      placeholder="Ex: 360°, Performance, Compétences"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={data.description}
                    onChange={(e) => setData('description', e.target.value)}
                    placeholder="Description détaillée de la règle d'évaluation..."
                    rows={3}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="est_active"
                    checked={data.est_active}
                    onCheckedChange={(checked: boolean) => setData('est_active', checked)}
                  />
                  <Label htmlFor="est_active">Règle active</Label>
                </div>

                {/* Alerte de confirmation */}
                <div className="bg-sabc-accent-light border border-sabc-accent rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-sabc-accent" />
                    <span className="font-medium text-sabc-accent">Attention</span>
                  </div>
                  <p className="text-sm text-sabc-gray-700 mt-1">
                    La modification de cette règle affectera toutes les évaluations en cours utilisant cette règle.
                    Assurez-vous que les changements sont conformes aux règles métier SABC.
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={processing}
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleSaveRule}
                  disabled={processing}
                  className="bg-sabc-red-primary hover:bg-sabc-red-dark text-white"
                >
                  {processing ? (
                    <>
                      <AlertCircle className="h-4 w-4 mr-2 animate-spin" />
                      Sauvegarde...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Sauvegarder
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </AppLayout>
    </RoleGuard>
  );
}
