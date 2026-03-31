import React, { useState } from 'react';
import { Head } from '@/lib/inertia-shim';
import AppLayout from '@/Components/Layout/app/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/UI/Card';
import { Button } from '@/Components/UI/Button';
import { Input } from '@/Components/UI/Input';
import { Badge } from '@/Components/UI/Badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/UI/Select';
import { AlertTriangle, Search, TrendingDown, Users, BarChart3 } from 'lucide-react';

interface Props {
  user: any;
  pageTitle: string;
  isAdmin?: boolean;
  permissions?: string[];
  utilisateurs: Array<{
    matricule: string;
    nom: string;
    prenom: string;
    role: string;
    region: string;
    branche: string;
    score_global: number;
    progression: number;
    nb_evaluations: number;
    gaps_detectes: Array<{
      type: string;
      description: string;
      severite: 'faible' | 'moyenne' | 'elevee';
    }>;
  }>;
}

export default function Gaps({ user, pageTitle, isAdmin, permissions, utilisateurs = [] }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedSeverite, setSelectedSeverite] = useState('');

  // Filtrer les utilisateurs selon les critères
  const preparedUtilisateurs = React.useMemo(() => {
    if (!Array.isArray(utilisateurs)) {
      return [] as Props['utilisateurs'];
    }

    return utilisateurs.map(utilisateur => ({
      ...utilisateur,
      region: utilisateur.region || 'Non définie',
      role: utilisateur.role || 'N/A',
      gaps_detectes: utilisateur.gaps_detectes || (utilisateur as any).gaps_identifies || [],
      nb_evaluations: utilisateur.nb_evaluations ?? 0,
      score_global: utilisateur.score_global ?? 0,
      progression: utilisateur.progression ?? 0,
    }));
  }, [utilisateurs]);

  const filteredUtilisateurs = preparedUtilisateurs.filter(utilisateur => {
    const matchesSearch = utilisateur.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         utilisateur.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         utilisateur.matricule.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRegion = !selectedRegion || utilisateur.region === selectedRegion;
    const matchesRole = !selectedRole || utilisateur.role === selectedRole;
    
    const hasGapsWithSeverite = !selectedSeverite || 
      utilisateur.gaps_detectes.some(gap => gap.severite === selectedSeverite);

    return matchesSearch && matchesRegion && matchesRole && hasGapsWithSeverite;
  });

  // Calculer les statistiques
  const totalUtilisateurs = preparedUtilisateurs.length;
  const utilisateursAvecGaps = preparedUtilisateurs.filter(u => u.gaps_detectes.length > 0).length;
  const gapsEleves = preparedUtilisateurs.filter(u => 
    u.gaps_detectes.some(gap => gap.severite === 'elevee')
  ).length;
  const scoreGlobalMoyen = totalUtilisateurs > 0
    ? preparedUtilisateurs.reduce((sum, u) => sum + (u.score_global ?? 0), 0) / totalUtilisateurs
    : 0;

  const getSeveriteBadge = (severite: string) => {
    switch (severite) {
      case 'elevee':
        return <Badge variant="destructive">Élevée</Badge>;
      case 'moyenne':
        return <Badge className="bg-sabc-accent text-white">Moyenne</Badge>;
      case 'faible':
        return <Badge variant="secondary">Faible</Badge>;
      default:
        return <Badge variant="secondary">{severite}</Badge>;
    }
  };

  const getProgressionBadge = (progression: number) => {
    if (progression > 0) {
      return <Badge className="bg-sabc-success text-white">+{progression}%</Badge>;
    } else if (progression < 0) {
      return <Badge variant="destructive">{progression}%</Badge>;
    }
    return <Badge variant="secondary">0%</Badge>;
  };

  return (
    <AppLayout 
      user={user} 
      pageTitle={pageTitle || "Analyse des Gaps d'Évaluation"}
      isAdmin={isAdmin}
      permissions={permissions}
    >
      <Head title="Analyse des Gaps d'Évaluation" />

      <div className="container mx-auto px-4 py-8">
        {/* Statistiques globales */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-sabc-red-primary" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-sabc-gray-400">Total Utilisateurs</p>
                  <p className="text-2xl font-bold text-sabc-gray-900">{totalUtilisateurs}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <AlertTriangle className="h-8 w-8 text-sabc-accent" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-sabc-gray-400">Avec Gaps</p>
                  <p className="text-2xl font-bold text-sabc-gray-900">{utilisateursAvecGaps}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingDown className="h-8 w-8 text-sabc-error" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-sabc-gray-400">Gaps Élevés</p>
                  <p className="text-2xl font-bold text-sabc-gray-900">{gapsEleves}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <BarChart3 className="h-8 w-8 text-sabc-success" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-sabc-gray-400">Score Moyen</p>
                  <p className="text-2xl font-bold text-sabc-gray-900">{scoreGlobalMoyen.toFixed(1)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtres */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sabc-red-primary">
              <Search className="h-5 w-5" />
              Filtres d'Analyse
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium text-sabc-gray-800 mb-2 block">
                  Recherche
                </label>
                <Input
                  placeholder="Nom, prénom ou matricule..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-sabc-gray-800 mb-2 block">
                  Région
                </label>
                <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                  <SelectTrigger>
                    <SelectValue placeholder="Toutes les régions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Toutes les régions</SelectItem>
                    <SelectItem value="Littoral">Littoral</SelectItem>
                    <SelectItem value="Centre">Centre</SelectItem>
                    <SelectItem value="Ouest">Ouest</SelectItem>
                    <SelectItem value="Nord">Nord</SelectItem>
                    <SelectItem value="Sud">Sud</SelectItem>
                    <SelectItem value="Est">Est</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-sabc-gray-800 mb-2 block">
                  Rôle
                </label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les rôles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Tous les rôles</SelectItem>
                    <SelectItem value="DR">Directeur Régional</SelectItem>
                    <SelectItem value="CDTT">Chef Département Trade</SelectItem>
                    <SelectItem value="CSC">Chef Service Commercial</SelectItem>
                    <SelectItem value="CDV">Chef District Vente</SelectItem>
                    <SelectItem value="CDS">Chef de Secteur</SelectItem>
                    <SelectItem value="RTM">Regional Trade Marketing</SelectItem>
                    <SelectItem value="TMO">Trade Marketing Operator</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-sabc-gray-800 mb-2 block">
                  Sévérité des Gaps
                </label>
                <Select value={selectedSeverite} onValueChange={setSelectedSeverite}>
                  <SelectTrigger>
                    <SelectValue placeholder="Toutes les sévérités" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Toutes les sévérités</SelectItem>
                    <SelectItem value="elevee">Élevée</SelectItem>
                    <SelectItem value="moyenne">Moyenne</SelectItem>
                    <SelectItem value="faible">Faible</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Liste des utilisateurs avec gaps */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sabc-red-primary">
              Analyse Détaillée des Gaps ({filteredUtilisateurs.length} utilisateurs)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredUtilisateurs.map((utilisateur) => (
                <div
                  key={utilisateur.matricule}
                  className="border border-sabc-gray-200 rounded-lg p-4 hover:bg-sabc-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-sabc-gray-900">
                        {utilisateur.prenom} {utilisateur.nom.toUpperCase()}
                      </h3>
                      <p className="text-sm text-sabc-gray-400">
                        {utilisateur.matricule} • {utilisateur.role} • {utilisateur.region}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Score: {utilisateur.score_global}</Badge>
                      {getProgressionBadge(utilisateur.progression)}
                    </div>
                  </div>

                  {utilisateur.gaps_detectes.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-sabc-gray-800">
                        Gaps détectés ({utilisateur.gaps_detectes.length}) :
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {utilisateur.gaps_detectes.map((gap, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-2 bg-sabc-gray-100 rounded"
                          >
                            <span className="text-sm text-sabc-gray-800">{gap.description}</span>
                            {getSeveriteBadge(gap.severite)}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-sabc-success">✓ Aucun gap détecté</p>
                  )}
                </div>
              ))}

              {filteredUtilisateurs.length === 0 && (
                <div className="text-center py-8">
                  <AlertTriangle className="h-12 w-12 text-sabc-gray-400 mx-auto mb-4" />
                  <p className="text-sabc-gray-400">Aucun utilisateur ne correspond aux critères sélectionnés.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
