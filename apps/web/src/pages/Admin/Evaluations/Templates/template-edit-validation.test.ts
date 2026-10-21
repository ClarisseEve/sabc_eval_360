import { describe, expect, it } from 'vitest';
import { createEmptyCompetenceLevels } from './template-levels';
import { getTemplateEditValidationError } from './template-edit-validation';

const validSections = [{
  titre: 'Compétences commerciales',
  competences: [{
    libelle: 'Suivi des performances',
    poids: '100',
    niveaux: createEmptyCompetenceLevels(),
  }],
}];

describe('template edit validation', () => {
  it('accepts a complete template', () => {
    expect(getTemplateEditValidationError('Template CDS', validSections)).toBeNull();
  });

  it('reports a missing template title', () => {
    expect(getTemplateEditValidationError('  ', validSections)).toBe('Le titre du template est requis.');
  });

  it('reports the section missing its name', () => {
    expect(getTemplateEditValidationError('Template CDS', [{
      ...validSections[0],
      titre: '',
    }])).toBe('Le nom de la section 1 est manquant.');
  });

  it('reports the exact competency missing its label', () => {
    expect(getTemplateEditValidationError('Template CDS', [{
      ...validSections[0],
      competences: [{
        ...validSections[0].competences[0],
        libelle: '',
      }],
    }])).toBe('Le libellé de la compétence 1 de la section « Compétences commerciales » est manquant.');
  });

  it('reports incomplete level descriptions with the competency name', () => {
    expect(getTemplateEditValidationError('Template CDS', [{
      ...validSections[0],
      competences: [{
        ...validSections[0].competences[0],
        niveaux: createEmptyCompetenceLevels().map((niveau) => ({ ...niveau, description: '' })),
      }],
    }])).toBe('Renseignez les cinq descriptions de niveau pour « Suivi des performances » dans la section « Compétences commerciales ».');
  });

  it('reports a total weight different from 100 percent', () => {
    expect(getTemplateEditValidationError('Template CDS', [{
      ...validSections[0],
      competences: [{
        ...validSections[0].competences[0],
        poids: '5',
      }],
    }])).toBe('La somme des poids doit être égale à 100 %. Total actuel : 5.00 %.');
  });
});
