import { describe, expect, it } from 'vitest';
import {
  getAdminUserSelfEvaluations,
  getLatestSubmittedSelfEvaluation,
} from './evaluation-history-data';

describe('getAdminUserSelfEvaluations', () => {
  it('returns submitted and validated self-evaluations with saved scores', () => {
    const submitted = { type_evaluation: 'auto', statut: 'soumis', notations_json: [{ note: 3 }] };
    const validated = { type_evaluation: 'auto', statut: 'valide', notations_json: '[{"note":4}]' };

    expect(getAdminUserSelfEvaluations([submitted, validated])).toEqual([submitted, validated]);
  });

  it('excludes drafts and other evaluation types', () => {
    expect(getAdminUserSelfEvaluations([
      { type_evaluation: 'auto', statut: 'brouillon', notations_json: [{ note: 3 }] },
      { type_evaluation: 'pairs', statut: 'soumis', notations_json: [{ note: 3 }] },
    ])).toEqual([]);
    expect(getAdminUserSelfEvaluations(null)).toEqual([]);
  });

  it('selects the newest submitted self-evaluation for provisional profile results', () => {
    const latest = { type_evaluation: 'auto', statut: 'soumis', note_globale: 3.65 };

    expect(getLatestSubmittedSelfEvaluation([
      latest,
      { type_evaluation: 'auto', statut: 'valide', note_globale: 4 },
    ])).toBe(latest);
    expect(getLatestSubmittedSelfEvaluation([])).toBeNull();
  });
});
