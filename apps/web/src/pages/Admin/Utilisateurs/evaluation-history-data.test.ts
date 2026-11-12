import { describe, expect, it } from 'vitest';
import {
  filterAdminUserEvaluations,
  getAdminUserEvaluations,
  getAdminUserEvaluationPeriods,
  getEvaluationGapSummary,
  getLatestSubmittedEvaluation,
  getLatestSubmittedSelfEvaluation,
} from './evaluation-history-data';

describe('admin user evaluation filtering and gap summary', () => {
  const evaluations = [
    {
      evalue_matricule: 'U001',
      type_evaluation: 'auto',
      statut: 'soumis',
      id_periode: 'period-1',
      periode: { nom_periode: 'Trimestre 1', date_debut: '2026-01-01' },
      notations_json: [{ critere_id: 'c1', critere_nom: 'Analyse des données', note: 1 }],
      criteres_snapshot_json: { criteres: [{ id: 'c1', libelle: 'Analyse des données', niveau_requis: 4 }] },
    },
    {
      evalue_matricule: 'U001',
      type_evaluation: 'descendante',
      statut: 'valide',
      id_periode: 'period-1',
      periode: { nom_periode: 'Trimestre 1', date_debut: '2026-01-01' },
      notations_json: [{ critere_id: 'c1', critere_nom: 'Analyse des données', note: 2 }],
      criteres_snapshot_json: { criteres: [{ id: 'c1', libelle: 'Analyse des données', niveau_requis: 4 }] },
    },
    {
      evalue_matricule: 'U002',
      type_evaluation: 'auto',
      statut: 'valide',
      id_periode: 'period-1',
      notations_json: [{ critere_id: 'c1', critere_nom: 'Analyse des données', note: 1 }],
    },
  ];

  it('only includes submitted or validated assessments of the requested user', () => {
    expect(getAdminUserEvaluations(evaluations, 'U001')).toHaveLength(2);
  });

  it('filters assessment results by type and quarter', () => {
    const userEvaluations = getAdminUserEvaluations(evaluations, 'U001');
    expect(filterAdminUserEvaluations(userEvaluations, {
      type: 'auto',
      periodId: 'period-1',
    })).toEqual([evaluations[0]]);
  });

  it('reports low scores by criterion and preserves per-type results', () => {
    const summary = getEvaluationGapSummary(getAdminUserEvaluations(evaluations, 'U001'));

    expect(summary).toEqual([{
      id: 'c1',
      critere: 'Analyse des données',
      niveau_requis: 4,
      moyenne: 1.5,
      nb_evaluations: 2,
      par_type: {
        auto: { moyenne: 1, nb_evaluations: 1 },
        descendante: { moyenne: 2, nb_evaluations: 1 },
      },
      commentaires: [],
    }]);
  });

  it('does not interpret missing notes as zero', () => {
    const evaluation = {
      ...evaluations[0],
      notations_json: [{ critere_id: 'c1', note: '' }],
    };

    expect(getEvaluationGapSummary([evaluation])).toEqual([]);
  });

  it('orders available periods from newest to oldest', () => {
    expect(getAdminUserEvaluationPeriods([
      evaluations[0],
      { ...evaluations[1], id_periode: 'period-2', periode: { nom_periode: 'Trimestre 2', date_debut: '2026-04-01' } },
    ]).map(({ id }) => id)).toEqual(['period-2', 'period-1']);
  });

  it('uses the submitted manager assessment as a provisional score', () => {
    const managerEvaluation = { ...evaluations[1], statut: 'soumis', note_globale: 3.2 };
    expect(getLatestSubmittedEvaluation([
      { ...managerEvaluation, statut: 'valide', note_globale: 4 },
      managerEvaluation,
    ], 'descendante')).toBe(managerEvaluation);
  });
});

describe('getLatestSubmittedSelfEvaluation', () => {
  it('selects the newest submitted self-evaluation for provisional profile results', () => {
    const latest = { type_evaluation: 'auto', statut: 'soumis', note_globale: 3.65 };

    expect(getLatestSubmittedSelfEvaluation([
      latest,
      { type_evaluation: 'auto', statut: 'valide', note_globale: 4 },
    ])).toBe(latest);
    expect(getLatestSubmittedSelfEvaluation([])).toBeNull();
  });
});
