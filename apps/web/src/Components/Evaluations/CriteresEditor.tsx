import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/Components/UI/Button/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/UI/Card/Card';
import { Input } from '@/Components/UI/Input/Input';
import { Label } from '@/Components/UI/Label/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/UI/Select';
import type { RuleCriterion } from '@/types/rules';

interface CriteresEditorProps {
  value: RuleCriterion[];
  onChange: (criteres: RuleCriterion[]) => void;
  categories: string[];
  errors?: string;
}

function createEmptyCriterion(sectionLabel: string, index: number): RuleCriterion {
  return {
    id: `critere-${Date.now()}-${index}`,
    libelle: '',
    description: '',
    poids: 0,
    section_label: sectionLabel,
    section_order: 1,
    niveau_requis: 3,
    improvement_axis_code: null,
    recommendation_tags: [],
    commentaire_requis_si_note_lt: 3,
    echelle: { min: 1, max: 5 },
  };
}

function getPonderationColorClass(total: number): string {
  if (total === 100) return 'bg-sabc-success';
  if (total > 100) return 'bg-sabc-error';
  return 'bg-sabc-accent';
}

export default function CriteresEditor({ value, onChange, categories, errors }: Readonly<CriteresEditorProps>) {
  const [criteres, setCriteres] = useState<RuleCriterion[]>(value || []);

  useEffect(() => {
    setCriteres(value || []);
  }, [value]);

  const totalPonderation = criteres.reduce((sum, critere) => sum + (Number(critere.poids) || 0), 0);

  const addCritere = () => {
    const nextCriteres = [
      ...criteres,
      createEmptyCriterion(categories[0] || 'Compétences', criteres.length + 1),
    ];
    setCriteres(nextCriteres);
    onChange(nextCriteres);
  };

  const removeCritere = (index: number) => {
    const nextCriteres = criteres.filter((_, currentIndex) => currentIndex !== index);
    setCriteres(nextCriteres);
    onChange(nextCriteres);
  };

  const updateCritere = (index: number, patch: Partial<RuleCriterion>) => {
    const nextCriteres = criteres.map((critere, currentIndex) => (
      currentIndex === index ? { ...critere, ...patch } : critere
    ));
    setCriteres(nextCriteres);
    onChange(nextCriteres);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="space-y-2 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-sabc-gray-800">Total des poids</span>
            <span className={`text-lg font-bold ${totalPonderation === 100 ? 'text-sabc-success' : 'text-sabc-error'}`}>
              {totalPonderation}%
            </span>
          </div>
          <div className="h-3 w-full rounded-full bg-sabc-gray-200">
            <div
              className={`h-3 rounded-full transition-all ${getPonderationColorClass(totalPonderation)}`}
              style={{ width: `${Math.min(totalPonderation, 100)}%` }}
            />
          </div>
          {criteres.length < 5 ? (
            <p className="text-sm text-sabc-error">Minimum 5 critères requis (actuellement: {criteres.length})</p>
          ) : null}
        </CardContent>
      </Card>

      {criteres.map((critere, index) => (
        <Card key={critere.id || index}>
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-lg font-semibold text-sabc-gray-900">Critère {index + 1}</CardTitle>
            <Button
              type="button"
              onClick={() => removeCritere(index)}
              variant="destructive"
              size="sm"
              disabled={criteres.length <= 5}
            >
              <Trash2 size={16} />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor={`libelle-${index}`}>Libellé</Label>
                <Input
                  id={`libelle-${index}`}
                  value={critere.libelle}
                  onChange={(e) => updateCritere(index, { libelle: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor={`poids-${index}`}>Poids (%)</Label>
                <Input
                  id={`poids-${index}`}
                  type="number"
                  min={1}
                  max={100}
                  value={critere.poids}
                  onChange={(e) => updateCritere(index, { poids: Number(e.target.value) || 0 })}
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor={`description-${index}`}>Description</Label>
                <textarea
                  id={`description-${index}`}
                  value={critere.description}
                  onChange={(e) => updateCritere(index, { description: e.target.value })}
                  className="min-h-[80px] w-full rounded-lg border border-sabc-gray-200 p-2"
                />
              </div>

              <div>
                <Label htmlFor={`section-${index}`}>Section</Label>
                <Select
                  value={critere.section_label}
                  onValueChange={(value) => updateCritere(index, { section_label: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une section" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor={`section-order-${index}`}>Ordre de section</Label>
                <Input
                  id={`section-order-${index}`}
                  type="number"
                  min={1}
                  value={critere.section_order}
                  onChange={(e) => updateCritere(index, { section_order: Number(e.target.value) || 1 })}
                />
              </div>

              <div>
                <Label htmlFor={`niveau-${index}`}>Niveau requis</Label>
                <Input
                  id={`niveau-${index}`}
                  type="number"
                  min={1}
                  max={5}
                  value={critere.niveau_requis}
                  onChange={(e) => updateCritere(index, { niveau_requis: Number(e.target.value) || 3 })}
                />
              </div>

              <div>
                <Label htmlFor={`threshold-${index}`}>Commentaire requis si note &lt;</Label>
                <Input
                  id={`threshold-${index}`}
                  type="number"
                  min={1}
                  max={5}
                  value={critere.commentaire_requis_si_note_lt ?? 3}
                  onChange={(e) => updateCritere(index, { commentaire_requis_si_note_lt: Number(e.target.value) || 3 })}
                />
              </div>

              <div>
                <Label htmlFor={`axis-${index}`}>Code axe d'amélioration</Label>
                <Input
                  id={`axis-${index}`}
                  value={critere.improvement_axis_code ?? ''}
                  onChange={(e) => updateCritere(index, { improvement_axis_code: e.target.value || null })}
                  placeholder="ex: leadership, execution, reporting"
                />
              </div>

              <div>
                <Label htmlFor={`tags-${index}`}>Tags recommandations</Label>
                <Input
                  id={`tags-${index}`}
                  value={critere.recommendation_tags.join(', ')}
                  onChange={(e) => updateCritere(index, {
                    recommendation_tags: e.target.value
                      .split(',')
                      .map((tag) => tag.trim())
                      .filter(Boolean),
                  })}
                  placeholder="formation, mentorat, coaching"
                />
              </div>

              <div>
                <Label>Échelle</Label>
                <div className="flex items-center gap-2">
                  <Input disabled value={critere.echelle.min} />
                  <span>à</span>
                  <Input disabled value={critere.echelle.max} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      <Button
        type="button"
        onClick={addCritere}
        className="w-full bg-sabc-accent text-white hover:bg-sabc-accent-light"
      >
        <Plus size={16} className="mr-2" />
        Ajouter un critère
      </Button>

      {errors ? <p className="text-sm text-sabc-error">{errors}</p> : null}
    </div>
  );
}
