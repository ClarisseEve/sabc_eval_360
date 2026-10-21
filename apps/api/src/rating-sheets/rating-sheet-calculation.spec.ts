import {
  buildRatingSheet,
  categoryForEvaluation,
  RatingSheetConfiguration,
  RatingSheetEvaluation,
  validateRatingSheetConfiguration,
} from './rating-sheet-calculation';

const user = {
  matricule: 'U0001',
  nom: 'Doe',
  prenom: 'Jane',
  role_nom: 'CDS',
};

const period = {
  id_periode: 'period-1',
  nom_periode: 'Semestre 1',
  code_periode: 'S1',
  date_debut: '2026-01-01',
  date_fin: '2026-06-30',
};

const configuration: RatingSheetConfiguration = {
  methode_calcul: 'ponderee',
  categories: [
    { type: 'auto', poids: 40 },
    { type: 'pairs', poids: 30 },
    { type: 'descendante', poids: 20 },
    { type: 'admin', poids: 10 },
  ],
};

function evaluation(
  type_evaluation: string,
  note_globale: number,
  options: Partial<RatingSheetEvaluation> = {},
): RatingSheetEvaluation {
  return {
    id_evaluation: `${type_evaluation}-${note_globale}`,
    type_evaluation,
    statut: 'valide',
    note_globale,
    notations_json: [],
    ...options,
  };
}

describe('rating-sheet-calculation', () => {
  it('classifies admin-authored evaluations separately and excludes ascending evaluations', () => {
    expect(
      categoryForEvaluation(
        evaluation('descendante', 4, { evaluateur_role: 'ADMIN' }),
      ),
    ).toBe('admin');
    expect(categoryForEvaluation(evaluation('ascendante', 4))).toBeNull();
    expect(categoryForEvaluation(evaluation('pairs', 4))).toBe('pairs');
  });

  it('converts 1–5 category averages to 0–20 and calculates weighted results', () => {
    const sheet = buildRatingSheet(user, period, configuration, [
      evaluation('auto', 4),
      evaluation('pairs', 2),
      evaluation('descendante', 3),
      evaluation('descendante', 5, { evaluateur_role: 'ADMIN' }),
      evaluation('ascendante', 5),
    ]);

    expect(
      sheet.categories.map(({ type, note_sur_20 }) => [type, note_sur_20]),
    ).toEqual([
      ['auto', 16],
      ['pairs', 8],
      ['descendante', 12],
      ['admin', 20],
    ]);
    expect(sheet.note_generale_sur_20).toBe(13.2);
    expect(sheet.statut).toBe('complete');
  });

  it('renormalizes the overall score using only categories with scores', () => {
    const sheet = buildRatingSheet(user, period, configuration, [
      evaluation('auto', 4),
    ]);
    expect(sheet.note_generale_sur_20).toBe(16);
    expect(
      sheet.categories.find((category) => category.type === 'pairs')?.complete,
    ).toBe(false);
  });

  it('averages configured category weights in simple-average mode', () => {
    const sheet = buildRatingSheet(
      user,
      period,
      {
        methode_calcul: 'moyenne',
        categories: configuration.categories.slice(0, 2),
      },
      [evaluation('auto', 4), evaluation('pairs', 2)],
    );
    expect(sheet.note_generale_sur_20).toBe(12);
    expect(sheet.categories.map((category) => category.poids)).toEqual([
      50, 50,
    ]);
  });

  it('calculates competency mentions against the required level and preserves category notes', () => {
    const sheet = buildRatingSheet(
      user,
      period,
      { methode_calcul: 'moyenne', categories: [{ type: 'auto', poids: 100 }] },
      [
        evaluation('auto', 3, {
          notations_json: [
            { critere_id: 'c1', note: 3 },
            { critere_id: 'c2', note: 2 },
          ],
          rule_json: {
            criteres: [
              { id: 'c1', libelle: 'Gestion', niveau_requis: 4 },
              { id: 'c2', libelle: 'Organisation', niveau_requis: 4 },
            ],
          },
        }),
      ],
    );
    expect(
      sheet.competences.map(({ score, mention }) => [score, mention]),
    ).toEqual([
      [3, 'Presque acquis'],
      [2, 'Non acquis'],
    ]);
    expect(sheet.competences[0].mentions_par_categorie.auto).toBe(
      'Presque acquis',
    );
    expect(sheet.lacunes).toHaveLength(2);
  });

  it('returns no consolidated score when none of the selected categories has evaluations', () => {
    const sheet = buildRatingSheet(user, period, configuration, []);
    expect(sheet.note_generale_sur_20).toBeNull();
    expect(
      sheet.categories.every((category) => category.note_sur_20 === null),
    ).toBe(true);
  });

  it('requires unique categories and a 100% total for weighted mode', () => {
    expect(
      validateRatingSheetConfiguration({
        methode_calcul: 'ponderee',
        categories: [
          { type: 'auto', poids: 60 },
          { type: 'pairs', poids: 30 },
        ],
      }),
    ).toContain('100 %');
    expect(
      validateRatingSheetConfiguration({
        methode_calcul: 'moyenne',
        categories: [
          { type: 'auto', poids: 50 },
          { type: 'auto', poids: 50 },
        ],
      }),
    ).toContain('double');
  });
});
