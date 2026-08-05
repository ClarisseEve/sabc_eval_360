import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateUserDto } from './user.dto';

const validPayload = {
  matricule: 'U0001',
  nom: 'Dupont',
  prenom: 'Jean',
  email: 'jean.dupont@sabc.cm',
  password: '***REMOVED***',
  id_role: 'R0003',
  id_region: 'RG001',
};

describe('CreateUserDto', () => {
  it('keeps only canonical role and region identifiers', async () => {
    const dto = plainToInstance(CreateUserDto, {
      ...validPayload,
      role: 'ADMIN',
      role_nom: 'Administrateur',
      region_nom: 'Région falsifiée',
      type_region: 'non-taniere',
      id_branche: 'FAKE',
      niveau_hierarchique: 0,
      est_admin: true,
    });

    const errors = await validate(dto, { whitelist: true });

    expect(errors).toHaveLength(0);
    expect(dto.id_role).toBe('R0003');
    expect(dto).not.toHaveProperty('role');
    expect(dto).not.toHaveProperty('role_nom');
    expect(dto).not.toHaveProperty('region_nom');
    expect(dto).not.toHaveProperty('type_region');
    expect(dto).not.toHaveProperty('id_branche');
    expect(dto).not.toHaveProperty('niveau_hierarchique');
    expect(dto).not.toHaveProperty('est_admin');
  });

  it('normalizes optional empty strings to null', async () => {
    const dto = plainToInstance(CreateUserDto, {
      ...validPayload,
      manager_matricule: '   ',
      telephone: '',
      id_service: '',
      id_district: '',
      id_secteur: '',
      sexe: '',
    });

    const errors = await validate(dto, { whitelist: true });

    expect(errors).toHaveLength(0);
    expect(dto.manager_matricule).toBeNull();
    expect(dto.telephone).toBeNull();
    expect(dto.id_service).toBeNull();
    expect(dto.id_district).toBeNull();
    expect(dto.id_secteur).toBeNull();
    expect(dto.sexe).toBeNull();
  });

  it('requires the canonical role identifier', async () => {
    const { id_role: _idRole, ...withoutRole } = validPayload;
    const dto = plainToInstance(CreateUserDto, withoutRole);

    const errors = await validate(dto, { whitelist: true });

    expect(errors.some((error) => error.property === 'id_role')).toBe(true);
  });
});
