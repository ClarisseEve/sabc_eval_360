import { describe, expect, it } from 'vitest';
import {
    buildCreateUserPayload,
    getCreateUserFormErrors,
    initialCreateUserForm,
    isCreateUserFormValid,
} from './create-user-contract';

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

    it('explains invalid identifier lengths and password requirements', () => {
        const invalidForm = {
            ...validForm,
            matricule: 'EVE1234',
            password: '123456',
            manager_matricule: 'A00010E',
        };

        expect(getCreateUserFormErrors(invalidForm)).toEqual({
            matricule: 'Le matricule doit contenir 5 caractères maximum.',
            password: 'Le mot de passe doit contenir au moins 8 caractères.',
            manager_matricule:
                'Le matricule du manager doit contenir 5 caractères maximum. Laissez ce champ vide si nécessaire.',
        });
        expect(isCreateUserFormValid(invalidForm)).toBe(false);
    });
});
