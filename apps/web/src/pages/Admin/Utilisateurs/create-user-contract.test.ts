import { describe, expect, it } from 'vitest';
import { buildCreateUserPayload, initialCreateUserForm, isCreateUserFormValid } from './create-user-contract';

const validForm = {
    ...initialCreateUserForm,
    matricule: ' U0001 ',
    nom: ' Dupont ',
    prenom: ' Jean ',
    email: ' jean.dupont@sabc.cm ',
    password: 'Fixture-NotARealSecret-1',
    id_role: 'R0003',
    id_region: 'RG001',
};

describe('create user API contract', () => {
    it('sends canonical identifiers without client-controlled derived fields', () => {
        const payload = buildCreateUserPayload(validForm);

        expect(payload).toEqual({
            matricule: 'U0001',
            nom: 'Dupont',
            prenom: 'Jean',
            email: 'jean.dupont@sabc.cm',
            password: 'Fixture-NotARealSecret-1',
            id_role: 'R0003',
            id_region: 'RG001',
            telephone: null,
            manager_matricule: null,
        });
        expect(payload).not.toHaveProperty('role');
        expect(payload).not.toHaveProperty('role_nom');
        expect(payload).not.toHaveProperty('id_branche');
        expect(payload).not.toHaveProperty('niveau_hierarchique');
    });

    it('normalizes optional values and validates the required identifiers', () => {
        expect(
            buildCreateUserPayload({
                ...validForm,
                telephone: ' 690000000 ',
                manager_matricule: ' M0001 ',
            }),
        ).toMatchObject({
            telephone: '690000000',
            manager_matricule: 'M0001',
        });
        expect(isCreateUserFormValid(validForm)).toBe(true);
        expect(isCreateUserFormValid({ ...validForm, id_role: '' })).toBe(false);
        expect(isCreateUserFormValid({ ...validForm, password: 'short' })).toBe(false);
    });
});
