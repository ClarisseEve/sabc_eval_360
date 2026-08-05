import { validate } from 'class-validator';
import { UpdateRemplacementDto } from './update-remplacement.dto';

describe('UpdateRemplacementDto', () => {
  it('accepte tous les champs métier modifiables', async () => {
    const dto = Object.assign(new UpdateRemplacementDto(), {
      titulaire_matricule: 'T0001',
      remplacant_matricule: 'R0001',
      role_remplace: 'CSC',
      region_remplacement: 'Centre',
      service_remplacement: null,
      motif: 'Mission temporaire',
      date_debut: '2026-09-01',
      date_fin: null,
      duree_prevue_jours: 30,
    });

    await expect(validate(dto)).resolves.toEqual([]);
  });

  it('rejette une date invalide et une durée trop courte', async () => {
    const dto = Object.assign(new UpdateRemplacementDto(), {
      date_debut: 'pas-une-date',
      duree_prevue_jours: 29,
    });

    const errors = await validate(dto);

    expect(errors.map((error) => error.property)).toEqual(
      expect.arrayContaining(['date_debut', 'duree_prevue_jours']),
    );
  });
});
