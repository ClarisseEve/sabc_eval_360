import { describe, expect, it } from 'vitest';
import { templateHasValidWeights, templateToRuleCriteria } from './rules';

describe('template rule criteria', () => {
  const template = {
    sections: [
      {
        titre: 'Compétences métier',
        ordre: 2,
        competences: [
          {
            id: 'criterion-1',
            libelle: 'Qualité',
            description: 'Description',
            niveau_requis: 4,
            niveaux: [{ niveau: 4, description: 'Maîtrisé' }],
            poids: 60,
          },
          {
            id: 'criterion-2',
            libelle: 'Collaboration',
            poids: 40,
          },
        ],
      },
    ],
  };

  it('converts template competencies while preserving their weights and levels', () => {
    expect(templateHasValidWeights(template)).toBe(true);
    expect(templateToRuleCriteria(template)).toMatchObject([
      {
        id: 'criterion-1',
        libelle: 'Qualité',
        description: 'Description',
        poids: 60,
        section_label: 'Compétences métier',
        section_order: 2,
        niveau_requis: 4,
        niveaux: [
          { niveau: 1, description: '' },
          { niveau: 2, description: '' },
          { niveau: 3, description: '' },
          { niveau: 4, description: 'Maîtrisé' },
          { niveau: 5, description: '' },
        ],
      },
      {
        id: 'criterion-2',
        libelle: 'Collaboration',
        poids: 40,
        section_label: 'Compétences métier',
        section_order: 2,
      },
    ]);
  });

  it('uses whole-number equal weights when template weights are invalid', () => {
    const invalidTemplate = {
      sections: [{
        competences: [
          { libelle: 'Un' },
          { libelle: 'Deux' },
          { libelle: 'Trois' },
        ],
      }],
    };

    expect(templateHasValidWeights(invalidTemplate)).toBe(false);
    expect(templateToRuleCriteria(invalidTemplate).map((criterion) => criterion.poids)).toEqual([34, 33, 33]);
  });

  it('rejects empty or malformed template sections without producing criteria', () => {
    expect(templateHasValidWeights(undefined)).toBe(false);
    expect(templateToRuleCriteria(undefined)).toEqual([]);
    expect(templateToRuleCriteria({ sections: [null, { competences: 'invalid' }] })).toEqual([]);
  });
});
