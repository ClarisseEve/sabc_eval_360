import { describe, expect, it } from 'vitest';
import {
  areCompetenceLevelsComplete,
  createEmptyCompetenceLevels,
  normalizeCompetenceLevels,
} from './template-levels';

describe('template-levels', () => {
  it('creates five ordered levels with editable default descriptions', () => {
    expect(createEmptyCompetenceLevels()).toEqual([
      { niveau: 1, description: 'Description du score 1' },
      { niveau: 2, description: 'Description du score 2' },
      { niveau: 3, description: 'Description du score 3' },
      { niveau: 4, description: 'Description du score 4' },
      { niveau: 5, description: 'Description du score 5' },
    ]);
  });

  it('normalizes stored descriptions and fills missing levels', () => {
    expect(normalizeCompetenceLevels([
      { niveau: 3, description: 'Conforme' },
      { niveau: 5, description: 'Expert' },
    ])).toEqual([
      { niveau: 1, description: 'Description du score 1' },
      { niveau: 2, description: 'Description du score 2' },
      { niveau: 3, description: 'Conforme' },
      { niveau: 4, description: 'Description du score 4' },
      { niveau: 5, description: 'Expert' },
    ]);
  });

  it('replaces missing or blank descriptions with editable defaults', () => {
    expect(normalizeCompetenceLevels([
      { niveau: 1, description: '  ' },
      { niveau: 2, description: '' },
      { niveau: 3, description: 'Compétence acquise' },
    ])).toEqual([
      { niveau: 1, description: 'Description du score 1' },
      { niveau: 2, description: 'Description du score 2' },
      { niveau: 3, description: 'Compétence acquise' },
      { niveau: 4, description: 'Description du score 4' },
      { niveau: 5, description: 'Description du score 5' },
    ]);
  });

  it('requires a non-empty description for each level', () => {
    const levels = createEmptyCompetenceLevels();
    expect(areCompetenceLevelsComplete(levels)).toBe(true);
    expect(areCompetenceLevelsComplete(levels.map((level) => ({ ...level, description: '' })))).toBe(false);
    expect(areCompetenceLevelsComplete(levels.map((level) => ({
      ...level,
      description: `Description ${level.niveau}`,
    })))).toBe(true);
  });
});
