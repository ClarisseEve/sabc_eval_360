import { buildRatingSheetFilename } from './rating-sheet-filename';

describe('buildRatingSheetFilename', () => {
  it('uses the cycle, semester, role, and person name', () => {
    expect(
      buildRatingSheetFilename(
        'Cycle 2026 - Semestre 2',
        'P2602',
        'CDS',
        'Eva',
        'Lucia',
      ),
    ).toBe('fiche-notation-cycle2026-Sem2-CDS-Eva-Lucia.pdf');
  });

  it('derives cycle and semester from the period code when the label is not parseable', () => {
    expect(
      buildRatingSheetFilename('Période active', 'P2602', 'CDS', 'Eva', 'Lucia'),
    ).toBe('fiche-notation-cycle2026-Sem2-CDS-Eva-Lucia.pdf');
  });

  it('normalizes accented names and unsafe filename characters', () => {
    expect(
      buildRatingSheetFilename(
        'Cycle 2026 - Semestre 2',
        'P2602',
        'CDS',
        'Éva Marie',
        'D’Ávila/Lucia',
      ),
    ).toBe('fiche-notation-cycle2026-Sem2-CDS-Eva-Marie-D-Avila-Lucia.pdf');
  });
});
