import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/UI/Card/Card';
import { Button } from '@/Components/UI/Button/Button';
import { Input } from '@/Components/UI/Input/Input';
import { Label } from '@/Components/UI/Label/Label';
import { ArrowLeft, Plus, Save, Trash2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/UI/Select/Select';
import { Checkbox } from '@/Components/UI/Checkbox/Checkbox';
import { Textarea } from '@/Components/UI/Textarea/Textarea';
import { templatesApi } from '@/Services/api';
import { useToast } from '@/Contexts/ToastContext';
import { AdminEvaluationsLayout } from '../shared';
import { TemplateCompetenceLevels } from './TemplateCompetenceLevels';
import {
  areCompetenceLevelsComplete,
  createEmptyCompetenceLevels,
  type CompetenceLevelDescription,
} from './template-levels';

/**
 * Page de création de template d'évaluation pour l'administrateur
 * 
 * Spécifications selon les règles métier SABC :
 * - Templates d'évaluation par catégorie (Commercial/Marketing)
 * - Sections et compétences configurables
 * - Minimum 5 compétences par template
 */
const TemplateCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const { warning, success, error } = useToast();

  // État du formulaire pour les informations de base du template
  const [formData, setFormData] = useState({
    titre: '',
    categorie: '',
    description: '',
    est_actif: true,
    version: '1.0',
  });
  
  // État pour les sections et compétences
  const [sections, setSections] = useState<Array<{
    id: string;
    titre: string;
    description: string;
    competences: Array<{
      id: string;
      libelle: string;
      description: string;
      obligatoire: boolean;
      poids: string;
      niveau_requis: number;
      niveaux: CompetenceLevelDescription[];
    }>;
  }>>([{
    id: '1',
    titre: 'Section 1',
    description: '',
    competences: [
      {
        id: '1-1',
        libelle: 'Compétence 1',
        description: '',
        obligatoire: true,
        poids: '0',
        niveau_requis: 3,
        niveaux: createEmptyCompetenceLevels(),
      }
    ]
  }]);

  // Gérer les changements dans le formulaire principal
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Gérer les changements dans les sélecteurs
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Gérer les changements de checkbox
  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
  };
  
  // Ajouter une nouvelle section
  const addSection = () => {
    const newId = (sections.length + 1).toString();
    setSections(prev => [...prev, {
      id: newId,
      titre: `Section ${newId}`,
      description: '',
      competences: [{
        id: `${newId}-1`,
        libelle: 'Nouvelle compétence',
        description: '',
        obligatoire: true,
        poids: '0',
        niveau_requis: 3,
        niveaux: createEmptyCompetenceLevels(),
      }]
    }]);
  };
  
  // Supprimer une section
  const removeSection = (sectionId: string) => {
    setSections(prev => prev.filter(section => section.id !== sectionId));
  };
  
  // Mettre à jour une section
  const updateSection = (sectionId: string, field: string, value: string) => {
    setSections(prev => prev.map(section => {
      if (section.id === sectionId) {
        return { ...section, [field]: value };
      }
      return section;
    }));
  };
  
  // Ajouter une compétence à une section
  const addCompetence = (sectionId: string) => {
    setSections(prev => prev.map(section => {
      if (section.id === sectionId) {
        const newCompId = `${sectionId}-${section.competences.length + 1}`;
        return {
          ...section,
          competences: [...section.competences, {
            id: newCompId,
            libelle: 'Nouvelle compétence',
            description: '',
            obligatoire: true,
            poids: '0',
            niveau_requis: 3,
            niveaux: createEmptyCompetenceLevels(),
          }]
        };
      }
      return section;
    }));
  };
  
  // Supprimer une compétence
  const removeCompetence = (sectionId: string, competenceId: string) => {
    setSections(prev => prev.map(section => {
      if (section.id === sectionId) {
        return {
          ...section,
          competences: section.competences.filter(comp => comp.id !== competenceId)
        };
      }
      return section;
    }));
  };
  
  // Mettre à jour une compétence
  const updateCompetence = (sectionId: string, competenceId: string, field: string, value: any) => {
    setSections(prev => prev.map(section => {
      if (section.id === sectionId) {
        return {
          ...section,
          competences: section.competences.map(comp => {
            if (comp.id === competenceId) {
              return { ...comp, [field]: value };
            }
            return comp;
          })
        };
      }
      return section;
    }));
  };
  
  // Calculer le nombre total de compétences
  const parseWeight = (value: string) => {
    const weight = Number(value.replace(',', '.'));
    return Number.isFinite(weight) ? weight : 0;
  };
  const totalCompetences = sections.reduce((total, section) => total + section.competences.length, 0);
  const totalPoids = sections.reduce(
    (total, section) => total + section.competences.reduce((sum, competence) => sum + parseWeight(competence.poids), 0),
    0,
  );
  
  // Vérifier si le formulaire est valide
  const isFormValid = () => {
    return (
      formData.titre.trim() !== '' &&
      formData.categorie !== '' &&
      totalCompetences >= 5 && // Règle métier: minimum 5 compétences
      sections.every(section => section.titre.trim() !== '' && section.competences.length > 0) &&
      sections.every(section => 
        section.competences.every(comp => comp.libelle.trim() !== '')
      ) &&
      sections.every(section => section.competences.every((comp) => areCompetenceLevelsComplete(comp.niveaux))) &&
      sections.every(section => section.competences.every(comp => parseWeight(comp.poids) > 0)) &&
      Math.abs(totalPoids - 100) <= 0.01
    );
  };
  
  // Construit le payload attendu par l'API (modèle sections -> compétences)
  const buildDto = () => ({
    titre: formData.titre,
    description: formData.description || undefined,
    categorie: formData.categorie,
    version: formData.version,
    est_actif: formData.est_actif,
    sections: sections.map((section, sectionIndex) => ({
      titre: section.titre,
      description: section.description || undefined,
      ordre: sectionIndex + 1,
      competences: section.competences.map((competence, compIndex) => ({
        libelle: competence.libelle,
        description: competence.description || undefined,
        niveau_requis: competence.niveau_requis,
        niveaux: competence.niveaux,
        ordre: compIndex + 1,
        poids: parseWeight(competence.poids),
      })),
    })),
  });

  const createMutation = useMutation({
    mutationFn: () => templatesApi.create(buildDto()),
    onSuccess: () => {
      success('Template créé.');
      navigate('/admin/evaluations/templates');
    },
    onError: (e: any) => {
      error(e?.response?.data?.message || e?.message || 'La création du template a échoué.');
    },
  });

  // Gérer la soumission du formulaire
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid()) {
      warning('Renseignez chaque compétence, son niveau requis, ses cinq descriptions de niveau et ajoutez au moins 5 compétences.');
      return;
    }
    createMutation.mutate();
  };
  
  return (
    <AdminEvaluationsLayout title="Créer un template d'évaluation">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center mb-6">
          <Button variant="ghost" className="mr-4" onClick={() => navigate('/admin/evaluations/templates')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <h1 className="text-2xl font-bold text-sabc-gray-900">Créer un template d'évaluation</h1>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-6">
            {/* Informations de base */}
            <Card>
              <CardHeader>
                <CardTitle>Informations du template</CardTitle>
                <CardDescription>Détails de base du template d'évaluation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="titre">Titre du template</Label>
                    <Input
                      id="titre"
                      name="titre"
                      value={formData.titre}
                      onChange={handleChange}
                      placeholder="Ex: Évaluation Commerciale Standard"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="categorie">Catégorie</Label>
                    <Select 
                      onValueChange={(value) => handleSelectChange('categorie', value)}
                      value={formData.categorie}
                    >
                      <SelectTrigger id="categorie">
                        <SelectValue placeholder="Sélectionner une catégorie" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="commercial">Commercial</SelectItem>
                        <SelectItem value="marketing">Marketing</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Description du template et de son objectif..."
                      className="min-h-[100px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="version">Version</Label>
                    <Input
                      id="version"
                      name="version"
                      value={formData.version}
                      onChange={handleChange}
                      placeholder="Ex: 1.0"
                    />
                  </div>
                  <div className="flex items-center space-x-2 self-end">
                    <Checkbox 
                      id="est_actif" 
                      checked={formData.est_actif}
                      onCheckedChange={(checked) => 
                        handleCheckboxChange('est_actif', checked === true)
                      }
                    />
                    <Label htmlFor="est_actif">Template actif</Label>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Sections et compétences */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Sections et compétences</h2>
                <div className="flex items-center space-x-2">
                  <span className={`text-sm ${totalCompetences < 5 ? 'text-sabc-error' : 'text-sabc-success'}`}>
                    {totalCompetences} compétence{totalCompetences > 1 ? 's' : ''} au total
                  </span>
                  <span className={`text-sm ${Math.abs(totalPoids - 100) <= 0.01 ? 'text-sabc-success' : 'text-sabc-error'}`}>
                    Poids : {totalPoids.toFixed(2)} % / 100 %
                  </span>
                  <Button 
                    type="button" 
                    onClick={addSection}
                    className="bg-sabc-red-primary hover:bg-sabc-red-dark text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter une section
                  </Button>
                </div>
              </div>
              
              {totalCompetences < 5 && (
                <div className="p-4 bg-sabc-red-light border-l-4 border-sabc-red-primary rounded-md">
                  <p className="text-sm text-sabc-gray-800">
                    <span className="font-medium">Attention:</span> Selon les règles métier SABC, un template doit contenir au minimum 5 compétences.
                  </p>
                </div>
              )}
              {Math.abs(totalPoids - 100) > 0.01 && (
                <div className="p-4 bg-amber-50 border-l-4 border-amber-500 rounded-md">
                  <p className="text-sm text-sabc-gray-800">La somme des poids doit être exactement égale à 100 %.</p>
                </div>
              )}
              
              {sections.map((section, sectionIndex) => (
                <Card key={section.id} className="border-t-4 border-t-sabc-red-primary">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div>
                      <CardTitle>
                        <Input
                          value={section.titre}
                          onChange={(e) => updateSection(section.id, 'titre', e.target.value)}
                          className="font-bold text-lg"
                          placeholder="Titre de la section"
                        />
                      </CardTitle>
                      <CardDescription>
                        <Input
                          value={section.description}
                          onChange={(e) => updateSection(section.id, 'description', e.target.value)}
                          className="text-sm mt-1"
                          placeholder="Description de la section (optionnelle)"
                        />
                      </CardDescription>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => removeSection(section.id)}
                      disabled={sections.length === 1}
                      className="text-sabc-error"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {section.competences.map((competence, compIndex) => (
                        <div key={competence.id} className="border rounded-md p-4 relative">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeCompetence(section.id, competence.id)}
                            disabled={section.competences.length === 1 && sections.length === 1}
                            className="absolute top-2 right-2 text-sabc-error"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor={`comp-${competence.id}-libelle`}>Libellé de la compétence</Label>
                              <Input
                                id={`comp-${competence.id}-libelle`}
                                value={competence.libelle}
                                onChange={(e) => updateCompetence(section.id, competence.id, 'libelle', e.target.value)}
                                placeholder="Ex: Communication efficace"
                                required
                              />
                            </div>
                            <div className="flex items-center space-x-2 self-end">
                              <Checkbox 
                                id={`comp-${competence.id}-obligatoire`}
                                checked={competence.obligatoire}
                                onCheckedChange={(checked) => 
                                  updateCompetence(section.id, competence.id, 'obligatoire', checked === true)
                                }
                              />
                              <Label htmlFor={`comp-${competence.id}-obligatoire`}>Compétence obligatoire</Label>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`comp-${competence.id}-poids`}>Poids de la compétence (%)</Label>
                              <Input
                                id={`comp-${competence.id}-poids`}
                                type="text"
                                inputMode="decimal"
                                value={competence.poids}
                                onChange={(e) => updateCompetence(section.id, competence.id, 'poids', e.target.value)}
                                required
                              />
                              <p className="text-xs text-sabc-gray-500">Définissez ce pourcentage manuellement. Les autres poids ne changent pas automatiquement ; le total doit faire 100 %.</p>
                            </div>
                            <div className="space-y-2 md:col-span-2">
                              <Label htmlFor={`comp-${competence.id}-description`}>Description</Label>
                              <Textarea
                                id={`comp-${competence.id}-description`}
                                value={competence.description}
                                onChange={(e) => updateCompetence(section.id, competence.id, 'description', e.target.value)}
                                placeholder="Description de la compétence et critères d'évaluation..."
                                className="min-h-[80px]"
                              />
                            </div>
                            <TemplateCompetenceLevels
                              idPrefix={`comp-${competence.id}`}
                              niveauRequis={competence.niveau_requis}
                              niveaux={competence.niveaux}
                              onNiveauRequisChange={(niveau) => updateCompetence(section.id, competence.id, 'niveau_requis', niveau)}
                              onNiveauxChange={(niveaux) => updateCompetence(section.id, competence.id, 'niveaux', niveaux)}
                            />
                          </div>
                        </div>
                      ))}
                      
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => addCompetence(section.id)}
                        className="w-full mt-2"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Ajouter une compétence
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {/* Boutons d'action */}
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => navigate('/admin/evaluations/templates')}>
                Annuler
              </Button>
              <Button
                type="submit"
                className="bg-sabc-red-primary hover:bg-sabc-red-dark text-white"
                disabled={!isFormValid() || createMutation.isPending}
              >
                <Save className="h-4 w-4 mr-2" />
                {createMutation.isPending ? 'Création...' : 'Créer le template'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </AdminEvaluationsLayout>
  );
};

export default TemplateCreatePage;