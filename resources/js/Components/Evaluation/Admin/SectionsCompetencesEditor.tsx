import React, { useState } from 'react';
import { Card, CardContent } from '@/Components/UI/Card/Card';
import { Button } from '@/Components/UI/Button/Button';
import { Input } from '@/Components/UI/Input/Input';
import { Label } from '@/Components/UI/Label/Label';
import { Badge } from '@/Components/UI/Badge/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/Components/UI/Tabs/Tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/UI/Select';
import { ArrowUp, ArrowDown, Plus, X, Trash2 } from 'lucide-react';

// Interfaces pour les types de données
export interface Competence {
  id: string;
  libelle: string;
  description: string;
  niveau_requis: number;
  ordre: number;
}

export interface Section {
  id: string;
  titre: string;
  description: string;
  ordre: number;
  competences: Competence[];
}

interface SectionsCompetencesEditorProps {
  sections: Section[];
  onChange: (sections: Section[]) => void;
  errors?: Record<string, string>;
}

const SectionsCompetencesEditor: React.FC<SectionsCompetencesEditorProps> = ({
  sections,
  onChange,
  errors = {}
}) => {
  // État pour la section courante dans les onglets
  const [currentSection, setCurrentSection] = useState(0);
  
  // État pour la compétence en cours d'ajout
  const [newCompetence, setNewCompetence] = useState({
    libelle: '',
    description: '',
    niveau_requis: 3
  });
  
  // Ajouter une section
  const ajouterSection = () => {
    const newSections = [...sections];
    newSections.push({
      id: `${Date.now()}`,
      titre: '',
      description: '',
      ordre: newSections.length + 1,
      competences: []
    });
    onChange(newSections);
    setCurrentSection(newSections.length - 1);
  };
  
  // Supprimer une section
  const supprimerSection = (index: number) => {
    if (sections.length <= 1) {
      return; // Garder au moins une section
    }
    
    const newSections = [...sections];
    newSections.splice(index, 1);
    
    // Réorganiser les ordres
    newSections.forEach((section, idx) => {
      section.ordre = idx + 1;
    });
    
    onChange(newSections);
    if (currentSection >= newSections.length) {
      setCurrentSection(newSections.length - 1);
    }
  };
  
  // Ajouter une compétence à la section courante
  const ajouterCompetence = () => {
    if (!newCompetence.libelle.trim()) return;
    
    const newSections = [...sections];
    newSections[currentSection].competences.push({
      id: `${Date.now()}`,
      libelle: newCompetence.libelle,
      description: newCompetence.description,
      niveau_requis: newCompetence.niveau_requis,
      ordre: newSections[currentSection].competences.length + 1
    });
    
    onChange(newSections);
    setNewCompetence({
      libelle: '',
      description: '',
      niveau_requis: 3
    });
  };
  
  // Supprimer une compétence
  const supprimerCompetence = (sectionIndex: number, competenceIndex: number) => {
    const newSections = [...sections];
    newSections[sectionIndex].competences.splice(competenceIndex, 1);
    
    // Réorganiser les ordres
    newSections[sectionIndex].competences.forEach((comp, idx) => {
      comp.ordre = idx + 1;
    });
    
    onChange(newSections);
  };
  
  // Déplacer une compétence vers le haut ou le bas dans une section
  const moveCompetence = (sectionIndex: number, competenceIndex: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && competenceIndex === 0) || 
      (direction === 'down' && competenceIndex === sections[sectionIndex].competences.length - 1)
    ) {
      return;
    }
    
    const newSections = [...sections];
    const newIndex = direction === 'up' ? competenceIndex - 1 : competenceIndex + 1;
    
    // Échanger les compétences
    const temp = newSections[sectionIndex].competences[competenceIndex];
    newSections[sectionIndex].competences[competenceIndex] = newSections[sectionIndex].competences[newIndex];
    newSections[sectionIndex].competences[newIndex] = temp;
    
    // Mettre à jour les ordres
    newSections[sectionIndex].competences.forEach((comp, idx) => {
      comp.ordre = idx + 1;
    });
    
    onChange(newSections);
  };
  
  // Déplacer une compétence vers une autre section
  const moveCompetenceToSection = (fromSectionIndex: number, competenceIndex: number, toSectionIndex: number) => {
    const newSections = [...sections];
    
    // Récupérer la compétence à déplacer
    const competence = { ...newSections[fromSectionIndex].competences[competenceIndex] };
    
    // Supprimer de la section d'origine
    newSections[fromSectionIndex].competences.splice(competenceIndex, 1);
    
    // Ajouter à la nouvelle section
    competence.ordre = newSections[toSectionIndex].competences.length + 1;
    newSections[toSectionIndex].competences.push(competence);
    
    // Mettre à jour les ordres dans les deux sections
    newSections[fromSectionIndex].competences.forEach((comp, idx) => {
      comp.ordre = idx + 1;
    });
    
    newSections[toSectionIndex].competences.forEach((comp, idx) => {
      comp.ordre = idx + 1;
    });
    
    onChange(newSections);
  };
  
  return (
    <Card>
      <CardContent className="p-0">
        <Tabs
          value={currentSection.toString()}
          onValueChange={(value) => setCurrentSection(parseInt(value))}
          className="w-full"
        >
          <div className="flex justify-between items-center p-4 border-b">
            <TabsList className="mb-0">
              {sections.map((section, index) => (
                <TabsTrigger key={section.id} value={index.toString()}>
                  <div className="flex items-center">
                    <span>{section.titre || `Section ${index + 1}`}</span>
                    {sections.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          supprimerSection(index);
                        }}
                        className="ml-2 text-sabc-error h-6 w-6 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TabsTrigger>
              ))}
            </TabsList>
            
            <Button
              type="button"
              onClick={ajouterSection}
              variant="outline"
              size="sm"
              className="border-sabc-red-primary text-sabc-red-primary"
            >
              <Plus className="h-4 w-4 mr-1" />
              Ajouter une section
            </Button>
          </div>
          
          {sections.map((section, sectionIndex) => (
            <TabsContent key={section.id} value={sectionIndex.toString()} className="p-4">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`section-${sectionIndex}-titre`}>Titre de la section</Label>
                    <Input 
                      id={`section-${sectionIndex}-titre`}
                      value={section.titre}
                      onChange={(e) => {
                        const newSections = [...sections];
                        newSections[sectionIndex].titre = e.target.value;
                        onChange(newSections);
                      }}
                      placeholder="Ex: Compétences managériales"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor={`section-${sectionIndex}-description`}>Description</Label>
                    <Input 
                      id={`section-${sectionIndex}-description`}
                      value={section.description}
                      onChange={(e) => {
                        const newSections = [...sections];
                        newSections[sectionIndex].description = e.target.value;
                        onChange(newSections);
                      }}
                      placeholder="Description de la section..."
                    />
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-4">Compétences de cette section</h3>
                  
                  <div className="space-y-2 min-h-[100px]">
                    {section.competences.map((competence, competenceIndex) => (
                      <div
                        key={competence.id}
                        className="flex items-center justify-between p-3 border rounded-md bg-white shadow-sm"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="flex flex-col space-y-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => moveCompetence(sectionIndex, competenceIndex, 'up')}
                              disabled={competenceIndex === 0}
                              className="h-4 w-4 p-0"
                            >
                              <ArrowUp className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => moveCompetence(sectionIndex, competenceIndex, 'down')}
                              disabled={competenceIndex === section.competences.length - 1}
                              className="h-4 w-4 p-0"
                            >
                              <ArrowDown className="h-4 w-4" />
                            </Button>
                          </div>
                          <div>
                            <div className="font-medium">{competence.libelle}</div>
                            {competence.description && (
                              <div className="text-sm text-sabc-gray-400">{competence.description}</div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Badge className="bg-sabc-gray-800">
                            Niveau {competence.niveau_requis}
                          </Badge>
                          
                          {sections.length > 1 && (
                            <Select
                              value=""
                              onValueChange={(value) => {
                                const toSectionIndex = parseInt(value);
                                if (toSectionIndex !== sectionIndex) {
                                  moveCompetenceToSection(sectionIndex, competenceIndex, toSectionIndex);
                                }
                              }}
                            >
                              <SelectTrigger className="w-[130px]">
                                <SelectValue placeholder="Déplacer vers" />
                              </SelectTrigger>
                              <SelectContent>
                                {sections.map((s, idx) => {
                                  if (idx !== sectionIndex) {
                                    return (
                                      <SelectItem key={s.id} value={idx.toString()}>
                                        {s.titre || `Section ${idx + 1}`}
                                      </SelectItem>
                                    );
                                  }
                                  return null;
                                })}
                              </SelectContent>
                            </Select>
                          )}
                          
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => supprimerCompetence(sectionIndex, competenceIndex)}
                            className="text-sabc-error"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    
                    {section.competences.length === 0 && (
                      <div className="text-center py-8 text-sabc-gray-400">
                        Aucune compétence dans cette section.
                        <br />
                        Utilisez le formulaire ci-dessous pour en ajouter.
                      </div>
                    )}
                  </div>
                  
                  {/* Formulaire d'ajout de compétence */}
                  <div className="mt-4 border-t pt-4">
                    <h4 className="font-medium mb-2">Ajouter une compétence</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="md:col-span-2">
                        <Input 
                          value={newCompetence.libelle}
                          onChange={(e) => setNewCompetence({...newCompetence, libelle: e.target.value})}
                          placeholder="Libellé de la compétence"
                        />
                      </div>
                      <div>
                        <Select 
                          value={newCompetence.niveau_requis.toString()} 
                          onValueChange={(value) => setNewCompetence({...newCompetence, niveau_requis: parseInt(value)})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Niveau requis" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">Niveau 1</SelectItem>
                            <SelectItem value="2">Niveau 2</SelectItem>
                            <SelectItem value="3">Niveau 3</SelectItem>
                            <SelectItem value="4">Niveau 4</SelectItem>
                            <SelectItem value="5">Niveau 5</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="mt-2">
                      <Input 
                        value={newCompetence.description}
                        onChange={(e) => setNewCompetence({...newCompetence, description: e.target.value})}
                        placeholder="Description de la compétence (optionnel)"
                      />
                    </div>
                    <div className="mt-3 flex justify-end">
                      <Button 
                        type="button"
                        onClick={ajouterCompetence}
                        disabled={!newCompetence.libelle.trim()}
                        className="bg-sabc-red-primary hover:bg-sabc-red-dark text-white"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Ajouter
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default SectionsCompetencesEditor;
