import { describe, expect, it } from 'vitest';
import {
  areCompetenceLevelsComplete,
  createEmptyCompetenceLevels,
  normalizeCompetenceLevels,
} from './template-levels';

describe('template-levels', () => {
  it('creates five ordered empty levels', () => {
    expect(createEmptyCompetenceLevels()).toEqual([
      { niveau: 1, description: '' },
      { niveau: 2, description: '' },
      { niveau: 3, description: '' },
      { niveau: 4, description: '' },
      { niveau: 5, description: '' },
    ]);
  });

  it('normalizes stored descriptions and fills missing levels', () => {
    expect(normalizeCompetenceLevels([
      { niveau: 3, description: 'Conforme' },
      { niveau: 5, description: 'Expert' },
    ])).toEqual([
      { niveau: 1, description: '' },
      { niveau: 2, description: '' },
      { niveau: 3, description: 'Conforme' },
      { niveau: 4, description: '' },
      { niveau: 5, description: 'Expert' },
    ]);
  });

  it('requires a non-empty description for each level', () => {
    const levels = createEmptyCompetenceLevels();
    expect(areCompetenceLevelsComplete(levels)).toBe(false);
    expect(areCompetenceLevelsComplete(levels.map((level) => ({
      ...level,
      description: `Description ${level.niveau}`,
    })))).toBe(true);
  });
});
