import { Label } from '@/Components/UI/Label/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/UI/Select/Select';
import { Textarea } from '@/Components/UI/Textarea/Textarea';
import { COMPETENCE_LEVELS, type CompetenceLevelDescription } from './template-levels';

interface TemplateCompetenceLevelsProps {
  idPrefix: string;
  niveauRequis: number;
  niveaux: CompetenceLevelDescription[];
  onNiveauRequisChange: (niveau: number) => void;
  onNiveauxChange: (niveaux: CompetenceLevelDescription[]) => void;
}

export function TemplateCompetenceLevels({
  idPrefix,
  niveauRequis,
  niveaux,
  onNiveauRequisChange,
  onNiveauxChange,
}: TemplateCompetenceLevelsProps) {
  const updateDescription = (niveau: number, description: string) => {
    onNiveauxChange(niveaux.map((level) => level.niveau === niveau ? { ...level, description } : level));
  };

  return (
    <div className="space-y-4 md:col-span-2">
      <div className="max-w-sm space-y-2">
        <Label htmlFor={`${idPrefix}-niveau-requis`}>Niveau requis pour le poste</Label>
        <Select value={String(niveauRequis)} onValueChange={(value) => onNiveauRequisChange(Number(value))}>
          <SelectTrigger id={`${idPrefix}-niveau-requis`}>
            <SelectValue placeholder="Choisir le niveau requis" />
          </SelectTrigger>
          <SelectContent>
            {COMPETENCE_LEVELS.map((niveau) => (
              <SelectItem key={niveau} value={String(niveau)}>
                Niveau {niveau}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="overflow-x-auto pb-1">
        <div className="grid min-w-[900px] grid-cols-5 gap-3">
        {niveaux.map((level) => (
          <div key={level.niveau} className="min-w-0 space-y-2">
            <Label htmlFor={`${idPrefix}-niveau-${level.niveau}`}>
              Description du score {level.niveau}
            </Label>
            <Textarea
              id={`${idPrefix}-niveau-${level.niveau}`}
              value={level.description}
              onChange={(event) => updateDescription(level.niveau, event.target.value)}
              placeholder={`Description du score ${level.niveau}`}
              className="min-h-[88px] resize-y"
              required
            />
          </div>
        ))}
        </div>
      </div>
    </div>
  );
}
