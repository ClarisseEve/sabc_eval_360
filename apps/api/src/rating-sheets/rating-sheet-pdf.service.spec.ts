import { RatingSheetPdfService } from './rating-sheet-pdf.service';

describe('RatingSheetPdfService', () => {
  it('creates a PDF containing the published rating-sheet snapshot', async () => {
    const service = new RatingSheetPdfService();
    const pdf = await service.create({
      personne: {
        matricule: 'U0001',
        role: 'CDS',
        prenom: 'Jane',
        nom: 'Doe',
        service: null,
        branche: null,
      },
      periode: {
        id_periode: 'period-1',
        nom: 'Semestre 1',
        code: 'S1',
        date_debut: '2026-01-01',
        date_fin: '2026-06-30',
      },
      emise_le: '2026-07-01T00:00:00.000Z',
      statut: 'partielle',
      note_generale_sur_20: null,
      methode_calcul: 'moyenne',
      categories: [
        {
          type: 'auto',
          poids: 100,
          evaluations_recues: 0,
          complete: false,
          note_sur_20: null,
          evaluations: [],
        },
      ],
      competences: [],
      lacunes: [],
      forces: [],
    });

    expect(pdf.subarray(0, 4).toString()).toBe('%PDF');
    expect(pdf.length).toBeGreaterThan(100);
  });
});
