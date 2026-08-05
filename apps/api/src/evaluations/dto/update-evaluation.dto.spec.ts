import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpdateEvaluationDto } from './update-evaluation.dto';

describe('UpdateEvaluationDto', () => {
  it('produit le contrat canonique et retire les pondérations client', async () => {
    const dto = plainToInstance(UpdateEvaluationDto, {
      notes: [
        { id: 'legacy-id', note: 4, poids: 999, commentaire: 'Observation' },
      ],
    });

    const errors = await validate(dto, { whitelist: true });

    expect(errors).toEqual([]);
    expect(dto.notes[0]).toEqual({
      critere_id: 'legacy-id',
      note: 4,
      commentaire: 'Observation',
    });
    expect(dto.notes[0]).not.toHaveProperty('poids');
    expect(dto.notes[0]).not.toHaveProperty('id');
  });

  it('refuse une note sans identifiant de critère', async () => {
    const dto = plainToInstance(UpdateEvaluationDto, {
      notes: [{ note: 4 }],
    });

    const errors = await validate(dto, { whitelist: true });

    expect(errors).not.toEqual([]);
  });
});
