import { describe, expect, it } from 'vitest';

import { filterAdminApplicableRules, filterApplicableRules, isPublishedRuleReady, templateToRuleCriteria } from './rules';

describe("pré-requis d'une règle avant création d'un brouillon", () => {
  const validRule = {
    id_regle: 'REG-1',
    est_active: true,
    criteres_evaluation_json: {
      criteres: [{ id: 'c1', libelle: 'Qualité', poids: 100 }],
    },
  };

  it('accepte uniquement une règle active, chargée et contenant des critères', () => {
    expect(isPublishedRuleReady(validRule, 'REG-1')).toBe(true);
    expect(isPublishedRuleReady(undefined, 'REG-1')).toBe(false);
    expect(isPublishedRuleReady({ ...validRule, est_active: false }, 'REG-1')).toBe(false);
    expect(isPublishedRuleReady({ ...validRule, criteres_evaluation_json: { criteres: [] } }, 'REG-1')).toBe(false);
  });

  it('refuse un détail de règle qui ne correspond pas à la sélection', () => {
    expect(isPublishedRuleReady(validRule, 'REG-2')).toBe(false);
  });
});

describe('filterApplicableRules', () => {
  it.each([
    ['Directeur regional', 'DR', 'Trade Marketing Operator', 'TMO'],
    ['Trade Marketing Operator', 'TMO', 'Directeur regional', 'DR'],
  ])('reconnaît les libellés de rôles %s / %s comme les codes %s / %s', (evaluator, evaluatorCode, evaluatee, evaluateeCode) => {
    const rules = filterApplicableRules(
      [{ est_active: true, role_evaluateur: evaluatorCode, role_evalue: evaluateeCode, type_evaluation: 'descendante' }],
      evaluator,
      evaluatee,
      'descendante',
    );

    expect(rules).toHaveLength(1);
  });
});

describe('filterAdminApplicableRules', () => {
  it('sélectionne les règles actives du rôle évalué sans exiger le rôle évaluateur', () => {
    const rules = filterAdminApplicableRules([
      { id_regle: 'R1', est_active: true, role_evaluateur: 'DR', role_evalue: 'CDV', type_evaluation: 'descendante' },
      { id_regle: 'R2', est_active: true, role_evaluateur: 'CDS', role_evalue: 'CSC', type_evaluation: 'descendante' },
      { id_regle: 'R3', est_active: false, role_evaluateur: 'DR', role_evalue: 'CDV', type_evaluation: 'descendante' },
      { id_regle: 'R4', est_active: true, role_evaluateur: 'CDV', role_evalue: 'CDV', type_evaluation: 'auto' },
    ], 'CDV');

    expect(rules.map((rule) => rule.id_regle)).toEqual(['R1']);
  });

  it('n’expose aucune règle tant qu’aucun rôle évalué n’est sélectionné', () => {
    expect(filterAdminApplicableRules([
      { est_active: true, role_evaluateur: 'DR', role_evalue: null, type_evaluation: 'descendante' },
    ], null)).toEqual([]);
  });
});

describe('templateToRuleCriteria', () => {
  it('maps template competencies and preserves valid weights and levels', () => {
    expect(templateToRuleCriteria({
      sections: [{
        titre: 'Leadership',
        ordre: 2,
        competences: [
          {
            libelle: 'Prise de décision',
            description: 'Décide avec discernement',
            poids: 40,
            niveau_requis: 4,
            niveaux: [{ niveau: 1, description: 'Débutant' }, { niveau: 4, description: 'Confirmé' }],
          },
          ...Array.from({ length: 3 }, (_, index) => ({ libelle: `Compétence ${index + 2}`, poids: 15 })),
          { libelle: 'Communication', poids: 15 },
        ],
      }],
    })[0]).toEqual({
      id: '1-1',
      libelle: 'Prise de décision',
      description: 'Décide avec discernement',
      poids: 40,
      section_label: 'Leadership',
      section_order: 2,
      niveau_requis: 4,
      niveaux: [
        { niveau: 1, description: 'Débutant' },
        { niveau: 2, description: 'Description du score 2' },
        { niveau: 3, description: 'Description du score 3' },
        { niveau: 4, description: 'Confirmé' },
        { niveau: 5, description: 'Description du score 5' },
      ],
      improvement_axis_code: null,
      recommendation_tags: [],
      recommendation_text: null,
      commentaire_requis_si_note_lt: 3,
      echelle: { min: 1, max: 5 },
    });
  });

  it('distributes weights when a legacy template has no competency weights', () => {
    const criteria = templateToRuleCriteria({
      sections: [{
        titre: 'Compétences',
        competences: Array.from({ length: 5 }, (_, index) => ({ libelle: `Compétence ${index + 1}` })),
      }],
    });

    expect(criteria.map((criterion) => criterion.poids)).toEqual([20, 20, 20, 20, 20]);
    expect(criteria.reduce((total, criterion) => total + criterion.poids, 0)).toBe(100);
  });
});
