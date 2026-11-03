export type RoleReference = {
    id_role: string;
    nom_role: string;
};

export type UpdateUserForm = {
    nom: string;
    prenom: string;
    email: string;
    telephone: string;
    id_role: string;
    id_region: string;
    manager_matricule: string;
    id_service: string;
    id_district: string;
    id_secteur: string;
    statut: string;
};

export type EditableUser = Partial<UpdateUserForm> & {
    role?: string | null;
    role_nom?: string | null;
};

export const initialUpdateUserForm: UpdateUserForm = {
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    id_role: '',
    id_region: '',
    manager_matricule: '',
    id_service: '',
    id_district: '',
    id_secteur: '',
    statut: '',
};

const nullable = (value: string): string | null => {
    const normalized = value.trim();
    return normalized.length > 0 ? normalized : null;
};

const EDITABLE_STATUSES = ['Actif', 'Inactif', 'Suspendu'] as const;

export function buildUpdateUserForm(user: EditableUser, roles: RoleReference[]): UpdateUserForm {
    const roleName = String(user.role ?? user.role_nom ?? '')
        .trim()
        .toUpperCase();
    const matchingRole = roles.find((role) => role.nom_role.trim().toUpperCase() === roleName);

    return {
        nom: user.nom ?? '',
        prenom: user.prenom ?? '',
        email: user.email ?? '',
        telephone: user.telephone ?? '',
        id_role: user.id_role ?? matchingRole?.id_role ?? '',
        id_region: user.id_region ?? '',
        manager_matricule: user.manager_matricule ?? '',
        id_service: user.id_service ?? '',
        id_district: user.id_district ?? '',
        id_secteur: user.id_secteur ?? '',
        statut: user.statut ?? '',
    };
}

export function buildUpdateUserPayload(form: UpdateUserForm) {
    const statut = EDITABLE_STATUSES.find((value) => value === form.statut);

    return {
        nom: form.nom.trim(),
        prenom: form.prenom.trim(),
        email: form.email.trim(),
        telephone: nullable(form.telephone),
        id_role: form.id_role.trim(),
        id_region: form.id_region.trim(),
        manager_matricule: nullable(form.manager_matricule),
        id_service: nullable(form.id_service),
        id_district: nullable(form.id_district),
        id_secteur: nullable(form.id_secteur),
        ...(statut ? { statut } : {}),
    };
}

export function isUpdateUserFormValid(form: UpdateUserForm): boolean {
    return Boolean(form.nom.trim() && form.prenom.trim() && form.email.trim() && form.id_role.trim() && form.id_region.trim());
}
