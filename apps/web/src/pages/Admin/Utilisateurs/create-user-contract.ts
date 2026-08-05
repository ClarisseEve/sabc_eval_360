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
    };
}

export function isCreateUserFormValid(form: CreateUserForm): boolean {
    return Boolean(
        form.matricule.trim() &&
            form.nom.trim() &&
            form.prenom.trim() &&
            form.email.trim() &&
            form.password.length >= 8 &&
            form.id_role &&
            form.id_region,
    );
}
