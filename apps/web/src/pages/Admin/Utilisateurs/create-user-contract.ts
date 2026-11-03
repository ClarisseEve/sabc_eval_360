export type CreateUserForm = {
    matricule: string;
    nom: string;
    prenom: string;
    email: string;
    password: string;
    id_role: string;
    id_region: string;
    telephone: string;
    manager_matricule: string;
    id_service: string;
    id_district: string;
    id_secteur: string;
};

export const initialCreateUserForm: CreateUserForm = {
    matricule: '',
    nom: '',
    prenom: '',
    email: '',
    password: '',
    id_role: '',
    id_region: '',
    telephone: '',
    manager_matricule: '',
    id_service: '',
    id_district: '',
    id_secteur: '',
};

const nullable = (value: string): string | null => {
    const normalized = value.trim();
    return normalized.length > 0 ? normalized : null;
};

export function buildCreateUserPayload(form: CreateUserForm) {
    return {
        matricule: form.matricule.trim(),
        nom: form.nom.trim(),
        prenom: form.prenom.trim(),
        email: form.email.trim(),
        password: form.password,
        id_role: form.id_role,
        id_region: form.id_region,
        telephone: nullable(form.telephone),
        manager_matricule: nullable(form.manager_matricule),
        id_service: nullable(form.id_service),
        id_district: nullable(form.id_district),
        id_secteur: nullable(form.id_secteur),
    };
}

export function getCreateUserFormErrors(form: CreateUserForm) {
    return {
        matricule:
            form.matricule.trim().length > 6
                ? 'Le matricule doit contenir 6 caractères maximum.'
                : '',
        password:
            form.password.length < 8
                ? 'Le mot de passe doit contenir au moins 8 caractères.'
                : '',
        manager_matricule:
            form.manager_matricule.trim().length > 6
                ? 'Le matricule du manager doit contenir 6 caractères maximum. Laissez ce champ vide si nécessaire.'
                : '',
    };
}

export function isCreateUserFormValid(form: CreateUserForm): boolean {
    const errors = getCreateUserFormErrors(form);
    return Boolean(
        form.matricule.trim() &&
            !errors.matricule &&
            form.nom.trim() &&
            form.prenom.trim() &&
            form.email.trim() &&
            !errors.password &&
            form.id_role &&
            form.id_region &&
            !errors.manager_matricule,
    );
}
