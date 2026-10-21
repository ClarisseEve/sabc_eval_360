export interface CompetenceLevelDescription {
  niveau: number;
  description: string;
}

export const COMPETENCE_LEVELS = [1, 2, 3, 4, 5] as const;

export function defaultCompetenceLevelDescription(niveau: number): string {
  return `Description du score ${niveau}`;
}

export function createEmptyCompetenceLevels(): CompetenceLevelDescription[] {
  return COMPETENCE_LEVELS.map((niveau) => ({
    niveau,
    description: defaultCompetenceLevelDescription(niveau),
  }));
}

export function normalizeCompetenceLevels(value: unknown): CompetenceLevelDescription[] {
  const levels = Array.isArray(value) ? value : [];

  return COMPETENCE_LEVELS.map((niveau) => {
    const level = levels.find((entry: any) => Number(entry?.niveau) === niveau);
    const description = typeof level?.description === 'string' ? level.description : '';

    return {
      niveau,
      description: description.trim() ? description : defaultCompetenceLevelDescription(niveau),
    };
  });
}
