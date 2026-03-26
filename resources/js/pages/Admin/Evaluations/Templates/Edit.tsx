import React, { useState } from 'react';
import { Head } from '@/lib/inertia-shim';
import AppLayout from '@/Components/Layout/app/AppLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/Components/UI/Card/Card';
import { Button } from '@/Components/UI/Button/Button';
import { Input } from '@/Components/UI/Input/Input';
import { Label } from '@/Components/UI/Label/Label';
import { ArrowLeft, Plus, Save, Trash2 } from 'lucide-react';
import { Link } from '@/lib/inertia-shim';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/UI/Select/Select';
import { Checkbox } from '@/Components/UI/Checkbox/Checkbox';

/**
 * Page d'édition de template d'évaluation pour l'administrateur
 * 
 * Spécifications selon les règles métier SABC :
 * - Templates d'évaluation par catégorie (Commercial/Marketing)
 * - Sections et compétences configurables
 * - Minimum 5 compétences par template
 */
const TemplateEditPage: React.FC = () => {
  // Simuler un utilisateur administrateur pour la démo
  const mockUser = {
    name: 'Admin SABC',
    email: 'admin@sabc.cm',
    role: 'ADMIN',
    avatar: undefined
  };
  
  // Données de démonstration pour le template à éditer
  const initialTemplateData = {
    id: '1',
    titre: 'Évaluation Commerciale Standard',
    categorie: 'commercial',
    description: 'Template standard pour l\'évaluation des performances commerciales',
    est_actif: true,
    version: '2.1',
    date_creation: '2023-01-15',
    date_modification: '2023-05-20',
  };
  
  // État du formulaire pour les informations de base du template
  const [formData, setFormData] = useState(initialTemplateData);
  
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
    }>;
  }>>([
    {
      id: '1',
      titre: 'Communication et relationnel',
      description: 'Capacités de communication et gestion des relations',
      competences: [
        {
          id: '1-1',
          libelle: 'Communication orale',
          description: 'Capacité à s\'exprimer clairement et efficacement à l\'oral',
          obligatoire: true
        },
        {
          id: '1-2',
          libelle: 'Communication écrite',
          description: 'Capacité à rédiger des documents clairs et structurés',
          obligatoire: true
        },
        {
          id: '1-3',
          libelle: 'Gestion des conflits',
          description: 'Capacité à gérer et résoudre les situations conflictuelles',
          obligatoire: false
        }
      ]
    },
    {
      id: '2',
      titre: 'Compétences techniques',
      description: 'Maîtrise des outils et processus commerciaux',
      competences: [
        {
          id: '2-1',
          libelle: 'Connaissance produits',
          description: 'Maîtrise des caractéristiques et avantages des produits SABC',
          obligatoire: true
        },
        {
          id: '2-2',
          libelle: 'Techniques de vente',
          description: 'Application des méthodes et techniques de vente efficaces',
          obligatoire: true
        },
        {
          id: '2-3',
          libelle: 'Négociation commerciale',
          description: 'Capacité à négocier et conclure des accords favorables',
          obligatoire: true
        }
      ]
    },
    {
      id: '3',
      titre: 'Leadership et management',
      description: 'Capacités de direction et gestion d\'équipe',
      competences: [
        {
          id: '3-1',
          libelle: 'Prise de décision',
          description: 'Capacité à prendre des décisions pertinentes et assumées',
          obligatoire: true
        },
        {
          id: '3-2',
          libelle: 'Délégation',
          description: 'Capacité à déléguer efficacement les tâches',
          obligatoire: false
        },
        {
          id: '3-3',
          libelle: 'Développement des collaborateurs',
          description: 'Capacité à faire progresser et développer son équipe',
          obligatoire: true
        }
      ]
    }
  ]);
  
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
        obligatoire: true
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
            obligatoire: true
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
  const totalCompetences = sections.reduce((total, section) => total + section.competences.length, 0);
  
  // Vérifier si le formulaire est valide
  const isFormValid = () => {
    return (
      formData.titre.trim() !== '' &&
      formData.categorie !== '' &&
      totalCompetences >= 5 && // Règle métier: minimum 5 compétences
      sections.every(section => section.titre.trim() !== '' && section.competences.length > 0) &&
      sections.every(section => 
        section.competences.every(comp => comp.libelle.trim() !== '')
      )
    );
  };
  
  // Gérer la soumission du formulaire
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid()) {
      alert('Veuillez remplir tous les champs obligatoires et ajouter au moins 5 compétences au total.');
      return;
    }
    
    // Ici, on simulerait l'envoi des données au backend
    console.log('Données du formulaire soumises:', {
      ...formData,
      sections
    });
    // Redirection vers la liste des templates après modification
  };
  
  return (
    <AppLayout
      user={mockUser}
      notifications={[]}
    >
      <Head title={`Modifier le template: ${formData.titre} - SABC Évaluation 360°`} />
      
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center mb-6">
          <Link href="/admin/evaluation/templates">
            <Button variant="ghost" className="mr-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-sabc-gray-900">Modifier le template d'évaluation</h1>
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
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Description du template et de son objectif..."
                      className="w-full min-h-[100px] p-2 border border-sabc-gray-200 rounded-md"
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
                
                <div className="mt-4 p-4 bg-sabc-accent-light border-l-4 border-sabc-warning rounded-md">
                  <p className="text-sm text-sabc-gray-800">
                    <span className="font-medium">Information:</span> Ce template a été créé le {formData.date_creation} 
                    et modifié pour la dernière fois le {formData.date_modification}.
                  </p>
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
                            <div className="space-y-2 md:col-span-2">
                              <Label htmlFor={`comp-${competence.id}-description`}>Description</Label>
                              <textarea
                                id={`comp-${competence.id}-description`}
                                value={competence.description}
                                onChange={(e) => updateCompetence(section.id, competence.id, 'description', e.target.value)}
                                placeholder="Description de la compétence et critères d'évaluation..."
                                className="w-full min-h-[80px] p-2 border border-sabc-gray-200 rounded-md"
                              />
                            </div>
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
              <Link href="/admin/evaluation/templates">
                <Button variant="outline">Annuler</Button>
              </Link>
              <Button 
                type="submit" 
                className="bg-sabc-red-primary hover:bg-sabc-red-dark text-white"
                disabled={!isFormValid()}
              >
                <Save className="h-4 w-4 mr-2" />
                Enregistrer les modifications
              </Button>
            </div>
          </div>
        </form>
      </div>
    </AppLayout>
  );
};

export default TemplateEditPage;
