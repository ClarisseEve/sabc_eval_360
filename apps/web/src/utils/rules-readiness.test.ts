import { describe, expect, it } from 'vitest';

import { filterApplicableRules, isPublishedRuleReady } from './rules';

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
