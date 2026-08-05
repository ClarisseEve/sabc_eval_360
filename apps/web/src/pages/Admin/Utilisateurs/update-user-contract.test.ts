import { describe, expect, it } from 'vitest';
import { buildUpdateUserForm, buildUpdateUserPayload, initialUpdateUserForm, isUpdateUserFormValid } from './update-user-contract';

const roles = [
    { id_role: 'R0001', nom_role: 'DR' },
    { id_role: 'R0003', nom_role: 'CSC' },
];

describe('update user API contract', () => {
    it('resolves the current canonical role identifier from the role reference', () => {
        expect(
            buildUpdateUserForm(
                {
                    nom: 'Dupont',
                    prenom: 'Jean',
                    email: 'jean.dupont@sabc.cm',
                    role: 'csc',
                    id_region: 'RG001',
                    statut: 'Actif',
                },
                roles,
            ),
        ).toMatchObject({ id_role: 'R0003', id_region: 'RG001' });
    });

    it('sends canonical identifiers without any derived or privileged field', () => {
        const payload = buildUpdateUserPayload({
            ...initialUpdateUserForm,
            nom: ' Dupont ',
            prenom: ' Jean ',
            email: ' jean.dupont@sabc.cm ',
            telephone: ' 690000000 ',
            id_role: 'R0003',
            id_region: 'RG001',
            manager_matricule: ' M0001 ',
            statut: 'Suspendu',
        });

        expect(payload).toEqual({
            nom: 'Dupont',
            prenom: 'Jean',
            email: 'jean.dupont@sabc.cm',
            telephone: '690000000',
            id_role: 'R0003',
            id_region: 'RG001',
            manager_matricule: 'M0001',
            statut: 'Suspendu',
        });
        for (const field of ['role', 'role_nom', 'region_nom', 'type_region', 'id_branche', 'est_admin', 'est_actif']) {
            expect(payload).not.toHaveProperty(field);
        }
    });

    it('preserves server-managed unavailable status by omitting it from the payload', () => {
        const payload = buildUpdateUserPayload({
            ...initialUpdateUserForm,
            nom: 'Dupont',
            prenom: 'Jean',
            email: 'jean.dupont@sabc.cm',
            id_role: 'R0003',
            id_region: 'RG001',
            statut: 'Indisponible',
        });

        expect(payload).not.toHaveProperty('statut');
    });

    it('requires both canonical identifiers', () => {
        const valid = {
            ...initialUpdateUserForm,
            nom: 'Dupont',
            prenom: 'Jean',
            email: 'jean.dupont@sabc.cm',
            id_role: 'R0003',
            id_region: 'RG001',
        };

        expect(isUpdateUserFormValid(valid)).toBe(true);
        expect(isUpdateUserFormValid({ ...valid, id_role: '' })).toBe(false);
        expect(isUpdateUserFormValid({ ...valid, id_region: '' })).toBe(false);
    });
});
