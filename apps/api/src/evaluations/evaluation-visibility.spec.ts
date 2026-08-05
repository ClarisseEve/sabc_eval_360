import {
  redactEvaluationForVisibility,
  resolveEvaluationVisibilityPolicy,
} from './evaluation-visibility';

describe('evaluation visibility policy', () => {
  it('lit la politique depuis l’enveloppe de règle interne', () => {
    const policy = resolveEvaluationVisibilityPolicy({
      __rule_envelope: {
        visibility_policy: {
          evaluated: false,
          manager_n1: false,
          upper_management: true,
          admin: false,
          detail: 'detailed',
        },
      },
    });

    expect(policy).toEqual({
      evaluated: false,
      manager_n1: false,
      upper_management: true,
      admin: false,
      detail: 'detailed',
    });
  });

  it('cumule anonymisation pairs et redaction aggregated sans masquer le score', () => {
    const result = redactEvaluationForVisibility({
      type_evaluation: 'pairs',
      evaluateur_matricule: 'SECRET',
      evaluateur: { matricule: 'SECRET', nom: 'Identité' },
      statut: 'valide',
      note_globale: 4.5,
      notations_json: [{ note: 4, commentaire: 'privé' }],
      commentaire_global: 'privé',
      commentaire_validation: 'privé',
      motif_rejet: 'privé',
      __rule_envelope: {
        visibility_policy: { evaluated: true, detail: 'aggregated' },
      },
    });

    expect(result).toEqual(
      expect.objectContaining({
        evaluateur_matricule: null,
        evaluateur: null,
        evaluateur_nom: 'Anonyme',
        statut: 'valide',
        note_globale: 4.5,
        notations_json: null,
        commentaire_global: null,
        commentaire_validation: null,
        motif_rejet: null,
      }),
    );
    expect(result.__rule_envelope).toBeUndefined();
  });
});
