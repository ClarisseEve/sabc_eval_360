import { describe, expect, it } from 'vitest';
import { summarizeCompetencies } from './show-data';

describe('summarizeCompetencies', () => {
  it('classifies scores against each criterion required level', () => {
    const result = summarizeCompetencies([
      { id: 'C1', libelle: 'Acquise', note: 4, niveauRequis: 3 },
      { id: 'C2', libelle: 'À renforcer', note: 2, niveauRequis: 3 },
      { id: 'C3', libelle: 'Au seuil', note: 3, niveauRequis: 3 },
      { id: 'C4', libelle: 'Non notée', note: null, niveauRequis: 3 },
    ]);

    expect(result.acquired.map(({ libelle }) => libelle)).toEqual(['Acquise', 'Au seuil']);
    expect(result.needsWork.map(({ libelle }) => libelle)).toEqual(['À renforcer']);
    expect(result.notRated.map(({ libelle }) => libelle)).toEqual(['Non notée']);
  });

  it('returns empty groups when there are no criteria', () => {
    expect(summarizeCompetencies([])).toEqual({
      acquired: [],
      needsWork: [],
      notRated: [],
    });
  });
});
