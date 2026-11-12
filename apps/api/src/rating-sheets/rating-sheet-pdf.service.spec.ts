import {
  formatRatingSheetDate,
  getRatingSheetPeriodHeader,
  hasAllEvaluationTypes,
  RatingSheetPdfService,
} from './rating-sheet-pdf.service';
import type {
  RatingSheetCategoryResult,
  RatingSheetSnapshot,
} from './rating-sheet-calculation';

describe('RatingSheetPdfService', () => {
  const category = (
    type: RatingSheetCategoryResult['type'],
    complete: boolean,
  ): RatingSheetCategoryResult => ({
    type,
    poids: 1,
    evaluations_recues: complete ? 1 : 0,
    complete,
    note_sur_20: complete ? 12 : null,
    evaluations: [],
  });

  it('formats ISO period dates as year-month-day', () => {
    expect(formatRatingSheetDate('2026-09-07T00:00:00.000Z')).toBe(
      '2026-09-07',
    );
    expect(formatRatingSheetDate('2026-12-06')).toBe('2026-12-06');
  });

  it('extracts the cycle and semester from the period name or code', () => {
    expect(
      getRatingSheetPeriodHeader({
        nom: 'Cycle 2026 - Semestre 2',
        code: 'P2602',
      }),
    ).toEqual({ cycle: '2026', semestre: '2' });
    expect(
      getRatingSheetPeriodHeader({ nom: 'Période active', code: 'P2601' }),
    ).toEqual({ cycle: '2026', semestre: '1' });
  });

  it('uses category note columns only when all three evaluation types are complete', () => {
    expect(
      hasAllEvaluationTypes([
        category('auto', true),
        category('pairs', true),
        category('descendante', true),
      ]),
    ).toBe(true);
    expect(
      hasAllEvaluationTypes([
        category('auto', true),
        category('pairs', true),
        category('descendante', false),
      ]),
    ).toBe(false);
    expect(
      hasAllEvaluationTypes([category('auto', true), category('pairs', true)]),
    ).toBe(false);
  });

  it('creates a PDF containing the published rating-sheet snapshot', async () => {
    const service = new RatingSheetPdfService();
    const snapshot: RatingSheetSnapshot = {
      personne: {
        matricule: 'U0001',
        role: 'CDS',
        prenom: 'Jane',
        nom: 'Doe',
        service: 'Service Centre',
        branche: null,
        district: 'District Yaoundé',
        region: 'Centre',
      },
      periode: {
        id_periode: 'period-1',
        nom: 'Semestre 1',
        code: 'S1',
        date_debut: '2026-01-01T00:00:00.000Z',
        date_fin: '2026-06-30T00:00:00.000Z',
      },
      emise_le: '2026-07-01T00:00:00.000Z',
      statut: 'partielle',
      note_generale_sur_20: null,
      methode_calcul: 'moyenne',
      categories: [
        {
          type: 'auto',
          poids: 50,
          evaluations_recues: 1,
          complete: true,
          note_sur_20: 4,
          evaluations: [],
        },
        {
          type: 'pairs',
          poids: 50,
          evaluations_recues: 1,
          complete: true,
          note_sur_20: 16,
          evaluations: [],
        },
      ],
      competences: [
        {
          id: 'c1',
          libelle: 'Connaissance du produit',
          description: '',
          section_label: 'Compétences',
          section_order: 1,
          poids: 25,
          niveau_requis: 4,
          recommendation_text: null,
          score: 2.5,
          mention: 'Non acquis',
          notes_par_categorie: { auto: 1, pairs: 4 },
          mentions_par_categorie: {
            auto: 'Non acquis',
            pairs: 'Acquis',
          },
        },
      ],
      lacunes: [],
      forces: [],
    };
    const pdf = await service.create(snapshot);

    expect(pdf.subarray(0, 4).toString()).toBe('%PDF');
    expect(pdf.length).toBeGreaterThan(100);

    const completePdf = await service.create({
      ...snapshot,
      statut: 'complete',
      categories: [...snapshot.categories, category('descendante', true)],
    });
    expect(completePdf.subarray(0, 4).toString()).toBe('%PDF');
    expect(completePdf.length).toBeGreaterThan(100);
  });
});
