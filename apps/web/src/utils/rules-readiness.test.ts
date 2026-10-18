import { describe, expect, it } from 'vitest';

import { filterAdminApplicableRules, filterApplicableRules, isPublishedRuleReady } from './rules';

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
