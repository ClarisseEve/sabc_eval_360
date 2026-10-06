export interface CompetenceLevelDescription {
  niveau: number;
  description: string;
}

export const COMPETENCE_LEVELS = [1, 2, 3, 4, 5] as const;

export function createEmptyCompetenceLevels(): CompetenceLevelDescription[] {
  return COMPETENCE_LEVELS.map((niveau) => ({ niveau, description: '' }));
}

export function normalizeCompetenceLevels(value: unknown): CompetenceLevelDescription[] {
  const levels = Array.isArray(value) ? value : [];
  return COMPETENCE_LEVELS.map((niveau) => {
    const level = levels.find((entry: any) => Number(entry?.niveau) === niveau);
    return {
      niveau,
      description: typeof level?.description === 'string' ? level.description : '',
    };
  });
}

export function areCompetenceLevelsComplete(levels: CompetenceLevelDescription[]): boolean {
  return COMPETENCE_LEVELS.every((niveau) =>
    levels.some((level) => level.niveau === niveau && level.description.trim().length > 0),
  );
}
