import { ValidationNotationService } from './validation-notation.service';

describe('ValidationNotationService - intégrité de soumission', () => {
  let service: ValidationNotationService;

  const criteres = [
    {
      id: 'c1',
      poids: 75,
      commentaire_requis_si_note_lt: 3,
      echelle: { min: 1, max: 5 },
    },
    {
      id: 'c2',
      poids: 25,
      commentaire_requis_si_note_lt: 2,
      echelle: { min: 1, max: 5 },
    },
  ];

  beforeEach(() => {
    service = new ValidationNotationService();
  });

  it('normalise les anciens identifiants sans conserver les poids du client', () => {
    const result = service.normaliserNotes([
      { id: 'c1', note: 4, poids: 999 },
      {
        id_critere: 2,
        note: '3',
        ponderation: 999,
        commentaire: 'Observation',
      },
    ]);

    expect(result.errors).toEqual([]);
    expect(result.notes).toEqual([
      { critere_id: 'c1', note: 4 },
      { critere_id: '2', note: 3, commentaire: 'Observation' },
    ]);
  });

  it('rejette les critères dupliqués, inconnus et manquants', () => {
    const result = service.validatePourSoumission(
      [
        { critere_id: 'c1', note: 4 },
        { critere_id: 'c1', note: 3 },
        { critere_id: 'intrus', note: 5 },
      ],
      criteres,
    );

    expect(result.valid).toBe(false);
    expect(result.errors.join(' ')).toContain('présent plusieurs fois');
    expect(result.errors.join(' ')).toContain("n'appartient pas à la règle");
    expect(result.errors.join(' ')).toContain('Il manque 1 note');
  });

  it('applique le seuil de commentaire défini par la règle, jamais celui de la note', () => {
    const result = service.validatePourSoumission(
      [
        { critere_id: 'c1', note: 2, seuil: 1 } as any,
        { critere_id: 'c2', note: 4 },
      ],
      criteres,
    );

    expect(result.valid).toBe(false);
    expect(result.errors.join(' ')).toContain('inférieure à 3');
  });

  it("applique l'échelle de chaque critère fournie par le serveur", () => {
    const result = service.validatePourSoumission(
      [{ critere_id: 'c1', note: 5 }],
      [
        {
          id: 'c1',
          poids: 100,
          commentaire_requis_si_note_lt: null,
          echelle: { min: 2, max: 4 },
        },
      ],
    );

    expect(result.valid).toBe(false);
    expect(result.errors.join(' ')).toContain('entier entre 2 et 4');
  });

  it('calcule la note globale exclusivement avec les poids de la règle', () => {
    const result = service.calculerNoteGlobale(
      [
        { critere_id: 'c1', note: 5, poids: 0 } as any,
        { critere_id: 'c2', note: 1, poids: 1000 } as any,
      ],
      criteres,
    );

    expect(result).toBe(4);
  });
});
