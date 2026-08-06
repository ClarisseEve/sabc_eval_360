import { describe, expect, it } from 'vitest';

import {
  buildTeamEvaluationItems,
  buildTeamEvaluationSummary,
  getTeamEvaluationActionHref,
  getTeamEvaluationStep,
} from './team-evaluations';

describe("files d'évaluations de l'équipe", () => {
  it('interprète les files en_attente et a_valider sans les confondre avec une liste plate', () => {
    const items = buildTeamEvaluationItems({
      en_attente: [
        { id_evaluation: 'draft', statut: 'brouillon', evalue_matricule: 'SUB-1' },
        { id_evaluation: 'submitted', statut: 'soumis', evalue_matricule: 'SUB-1' },
      ],
      a_valider: [
        { id_evaluation: 'validate', statut: 'soumis', evalue: { matricule: 'SUB-1' } },
      ],
    }, ['SUB-1']);

    expect(buildTeamEvaluationSummary(items)).toEqual({
      total: 3,
      toComplete: 1,
      awaitingValidation: 1,
      toValidate: 1,
    });
    expect(getTeamEvaluationStep(items[0]).label).toBe('À valider');
    expect(getTeamEvaluationActionHref(items[0])).toBe('/evaluations/validate?id=validate');
  });

  it('écarte les évaluations sans lien avec un subordonné direct et déduplique les files', () => {
    const items = buildTeamEvaluationItems({
      en_attente: [
        { id_evaluation: 'same', statut: 'soumis', evalue_matricule: 'SUB-1' },
        { id_evaluation: 'outside', statut: 'brouillon', evalue_matricule: 'OTHER' },
      ],
      a_valider: [
        { id_evaluation: 'same', statut: 'soumis', evalue_matricule: 'SUB-1' },
      ],
    }, ['SUB-1']);

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ id_evaluation: 'same', teamQueue: 'validation' });
  });
});
