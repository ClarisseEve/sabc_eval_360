import { describe, expect, it } from 'vitest';

import {
  buildEditableEvaluationNotes,
  findNoteForCriterion,
  getEvaluationSubmissionState,
  selectEvaluatorActionEvaluations,
  serializeRatedEvaluationNotes,
} from './workflow-ui';

const criteria = [
  { id: 'c1', note: null, commentaire: '', commentaireRequisSiNoteLt: 3 },
  { id: 'c2', note: 4, commentaire: 'Déjà renseigné', commentaireRequisSiNoteLt: 3 },
];

describe("état de saisie d'une évaluation", () => {
  it("n'invente aucune note pour un nouveau critère", () => {
    expect(buildEditableEvaluationNotes(criteria)).toEqual([
      { critere_id: 'c1', note: null, commentaire: '' },
      { critere_id: 'c2', note: 4, commentaire: 'Déjà renseigné' },
    ]);
  });

  it('restaure un brouillon local en acceptant les anciens identifiants', () => {
    expect(buildEditableEvaluationNotes(criteria, [
      { id_critere: 'c1', note: 2, commentaire: 'À accompagner' },
      { id: 'c2', note: null, commentaire: '' },
    ])).toEqual([
      { critere_id: 'c1', note: 2, commentaire: 'À accompagner' },
      { critere_id: 'c2', note: null, commentaire: '' },
    ]);
  });

  it("n'envoie au serveur que les critères explicitement notés", () => {
    expect(serializeRatedEvaluationNotes(buildEditableEvaluationNotes(criteria))).toEqual([
      { critere_id: 'c2', note: 4, commentaire: 'Déjà renseigné' },
    ]);
  });

  it("n'attribue pas une note partielle au mauvais critère", () => {
    const partialNotes = [{ critere_id: 'c2', note: 5 }];

    expect(findNoteForCriterion(partialNotes, 'c1', 0)).toBeUndefined();
    expect(findNoteForCriterion(partialNotes, 'c2', 1)).toEqual(partialNotes[0]);
  });

  it('calcule la progression sur les notes réellement saisies et bloque une saisie incomplète', () => {
    const state = getEvaluationSubmissionState(buildEditableEvaluationNotes(criteria), criteria);

    expect(state).toMatchObject({
      canSubmit: false,
      ratedCount: 1,
      totalCount: 2,
      completion: 50,
      missingRatings: 1,
      missingComments: 0,
    });
  });

  it('exige les commentaires sous le seuil avant la soumission', () => {
    const incomplete = buildEditableEvaluationNotes(criteria, [
      { critere_id: 'c1', note: 2, commentaire: '   ' },
      { critere_id: 'c2', note: 5, commentaire: '' },
    ]);
    const complete = buildEditableEvaluationNotes(criteria, [
      { critere_id: 'c1', note: 2, commentaire: 'Objectif de progression défini' },
      { critere_id: 'c2', note: 5, commentaire: '' },
    ]);

    expect(getEvaluationSubmissionState(incomplete, criteria)).toMatchObject({
      canSubmit: false,
      missingRatings: 0,
      missingComments: 1,
    });
    expect(getEvaluationSubmissionState(complete, criteria)).toMatchObject({
      canSubmit: true,
      completion: 100,
      missingComments: 0,
    });
  });
});

describe('file des actions évaluateur', () => {
  it('conserve les brouillons et retours du propriétaire, jamais les soumissions ou validations', () => {
    const result = selectEvaluatorActionEvaluations(
      [
        { id_evaluation: 'draft', statut: 'brouillon' },
        { id_evaluation: 'submitted', statut: 'soumis' },
      ],
      [
        { id_evaluation: 'rejected-owner', statut: 'rejete', evaluateur_matricule: 'ME' },
        { id_evaluation: 'rejected-other', statut: 'rejete', evaluateur_matricule: 'OTHER' },
        { id_evaluation: 'validation', statut: 'soumis', validateur_matricule: 'ME' },
      ],
      'ME',
    );

    expect(result.map((evaluation) => evaluation.id_evaluation)).toEqual(['draft', 'rejected-owner']);
  });
});
