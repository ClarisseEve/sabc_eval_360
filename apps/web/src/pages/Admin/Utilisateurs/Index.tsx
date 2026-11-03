import { DashboardSkeleton } from '@/Components/Dashboard/DashboardSkeleton';
import { ExcelImportDialog } from '@/Components/Admin/ExcelImportDialog';
import { Badge } from '@/Components/UI/Badge';
import { Button, buttonVariants } from '@/Components/UI/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/UI/Card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/Components/UI/Dialog/Dialog';
import { Input } from '@/Components/UI/Input';
import { Label } from '@/Components/UI/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/UI/Select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/UI/Table';
import { useAdminUsers } from '@/Hooks/queries';
import { adminApi } from '@/Services/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Suspense, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    buildCreateUserPayload,
    getCreateUserFormErrors,
    initialCreateUserForm,
    isCreateUserFormValid,
    type CreateUserForm,
} from './create-user-contract';
import { AdminUsersLayout } from './shared';
import { UserAssignmentFields } from './UserAssignmentFields';
import {
    buildUpdateUserForm,
    buildUpdateUserPayload,
    initialUpdateUserForm,
    isUpdateUserFormValid,
    type EditableUser,
    type RoleReference,
    type UpdateUserForm,
} from './update-user-contract';
import { PageHeader } from '@/Components/UI/Page/PageHeader';

type BadgeVariant = 'success' | 'warning' | 'error' | 'secondary' | 'outline';

/** Libellé et couleur dérivés du statut AFFICHÉ (et non de est_actif seul). */
function getUserStatusPresentation(user: { statut?: string | null; est_actif?: boolean | null }): { label: string; variant: BadgeVariant } {
    const raw = String(user?.statut ?? '').trim();
    const key = raw
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
    if (key === 'actif') return { label: 'Actif', variant: 'success' };
    if (key === 'indisponible') return { label: 'Indisponible', variant: 'warning' };
    if (key === 'suspendu') return { label: 'Suspendu', variant: 'error' };
    if (key === 'inactif') return { label: 'Inactif', variant: 'secondary' };
    if (raw) return { label: raw.charAt(0).toUpperCase() + raw.slice(1), variant: 'secondary' };
    return user?.est_actif ? { label: 'Actif', variant: 'success' } : { label: 'Inactif', variant: 'secondary' };
}

const createTextFields: Array<{
    key: keyof CreateUserForm;
    label: string;
    type?: string;
}> = [
    { key: 'matricule', label: 'Matricule' },
    { key: 'email', label: 'Adresse e-mail', type: 'email' },
    { key: 'nom', label: 'Nom' },
    { key: 'prenom', label: 'Prénom' },
    { key: 'telephone', label: 'Téléphone', type: 'tel' },
    { key: 'password', label: 'Mot de passe', type: 'password' },
];

const editTextFields: Array<{
    key: 'nom' | 'prenom' | 'email' | 'telephone';
    label: string;
    type?: string;
}> = [
    { key: 'nom', label: 'Nom' },
    { key: 'prenom', label: 'Prénom' },
    { key: 'email', label: 'Adresse e-mail', type: 'email' },
    { key: 'telephone', label: 'Téléphone', type: 'tel' },
];

function Pagination({
    meta,
    onPageChange,
}: {
    meta: { total: number; page: number; limit: number; totalPages: number };
    onPageChange: (p: number) => void;
}) {
    if (meta.totalPages <= 1) return null;

    const pages: number[] = [];
    const start = Math.max(1, meta.page - 2);
    const end = Math.min(meta.totalPages, meta.page + 2);
    for (let i = start; i <= end; i++) pages.push(i);

    return (
        <div className="border-sabc-gray-200 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sabc-gray-600 text-sm">
                {(meta.page - 1) * meta.limit + 1}–{Math.min(meta.page * meta.limit, meta.total)} sur {meta.total} utilisateurs
            </p>
            <div className="flex flex-wrap gap-1">
                <Button variant="outline" size="sm" disabled={meta.page <= 1} onClick={() => onPageChange(meta.page - 1)}>
                    Précédent
                </Button>
                {pages.map((p) => (
                    <Button
                        key={p}
                        variant={p === meta.page ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => onPageChange(p)}
                        aria-current={p === meta.page ? 'page' : undefined}
                    >
                        {p}
                    </Button>
                ))}
                <Button variant="outline" size="sm" disabled={meta.page >= meta.totalPages} onClick={() => onPageChange(meta.page + 1)}>
                    Suivant
                </Button>
            </div>
        </div>
    );
}

function UsersContent() {
    const queryClient = useQueryClient();
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [searchDebounced, setSearchDebounced] = useState('');
    const [createOpen, setCreateOpen] = useState(false);
    const [importOpen, setImportOpen] = useState(false);
    const [createForm, setCreateForm] = useState(initialCreateUserForm);

    const [editSource, setEditSource] = useState<(EditableUser & { matricule: string }) | null>(null);
    const [editForm, setEditForm] = useState<UpdateUserForm>(initialUpdateUserForm);
    const editMatricule = editSource?.matricule ?? null;

    useEffect(() => {
        const timer = setTimeout(() => {
            setSearchDebounced(search.trim());
            setPage(1);
        }, 350);
        return () => clearTimeout(timer);
    }, [search]);

    const params = {
        page,
        limit: 15,
        ...(searchDebounced ? { search: searchDebounced } : {}),
    };
    const { data: response } = useAdminUsers(params);
    const { data: roles = [], isPending: rolesPending } = useQuery({
        queryKey: ['admin', 'roles'],
        queryFn: () => adminApi.roles.list().then((response) => response.data),
    });
    const { data: regions = [], isPending: regionsPending } = useQuery({
        queryKey: ['admin', 'structure', 'regions'],
        queryFn: () => adminApi.structure.regions().then((response) => response.data),
    });

    const { data: branches = [] } = useQuery({
        queryKey: ['admin', 'structure', 'branches'],
        queryFn: () => adminApi.structure.branches().then((response) => response.data),
    });
    const { data: services = [] } = useQuery({
        queryKey: ['admin', 'structure', 'services'],
        queryFn: () => adminApi.structure.services().then((response) => response.data),
    });
    const { data: districts = [] } = useQuery({
        queryKey: ['admin', 'structure', 'districts'],
        queryFn: () => adminApi.structure.districts().then((response) => response.data),
    });
    const { data: secteurs = [] } = useQuery({
        queryKey: ['admin', 'structure', 'secteurs'],
        queryFn: () => adminApi.structure.secteurs().then((response) => response.data),
    });

    const regionNames = new Map<string, string>(
        (Array.isArray(regions) ? regions : []).map((region: any) => [String(region.id_region), region.nom_region]),
    );
    const branchNames = new Map<string, string>(
        (Array.isArray(branches) ? branches : []).map((branche: any) => [String(branche.id_branche), branche.nom_branche]),
    );
    const serviceNames = new Map<string, string>(
        (Array.isArray(services) ? services : []).map((service: any) => [String(service.id_service), service.nom_service]),
    );
    const districtNames = new Map<string, string>(
        (Array.isArray(districts) ? districts : []).map((district: any) => [String(district.id_district), district.nom_district]),
    );
    const secteurNames = new Map<string, string>(
        (Array.isArray(secteurs) ? secteurs : []).map((secteur: any) => [String(secteur.id_secteur), secteur.nom_secteur]),
    );
    const regionLabel = (user: any) =>
        user.region?.nom_region || (user.id_region ? regionNames.get(String(user.id_region)) : undefined) || 'n.d.';
    const branchLabel = (user: any) =>
        user.branche?.nom_branche || (user.id_branche ? branchNames.get(String(user.id_branche)) : undefined) || 'n.d.';
    const structureLabel = (user: any) => [
        user.id_service ? serviceNames.get(String(user.id_service)) : null,
        user.id_district ? districtNames.get(String(user.id_district)) : null,
        user.id_secteur ? secteurNames.get(String(user.id_secteur)) : null,
    ].filter(Boolean).join(' · ') || 'n.d.';

    const users = response?.data ?? (Array.isArray(response) ? response : []);
    const meta = response?.meta ?? { total: users.length, page: 1, limit: 15, totalPages: 1 };
    const hasRoles = Array.isArray(roles) && roles.length > 0;
    const hasRegions = Array.isArray(regions) && regions.length > 0;
    const referencesPending = rolesPending || regionsPending;
    const canCreateUser = !referencesPending && hasRoles && hasRegions;

    useEffect(() => {
        if (!editSource || editForm.id_role || (roles as RoleReference[]).length === 0) return;
        setEditForm(buildUpdateUserForm(editSource, roles as RoleReference[]));
    }, [editForm.id_role, editSource, roles]);

    const refresh = async () => {
        await queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    };

    const closeCreate = () => {
        setCreateOpen(false);
        setCreateForm(initialCreateUserForm);
    };

    const openEdit = (user: any) => {
        setEditSource(user);
        setEditForm(buildUpdateUserForm(user, roles as RoleReference[]));
    };

    const closeEdit = () => {
        setEditSource(null);
        setEditForm(initialUpdateUserForm);
    };

    const createMutation = useMutation({
        mutationFn: async () => adminApi.users.create(buildCreateUserPayload(createForm)),
        onSuccess: async () => {
            closeCreate();
            await refresh();
        },
    });

    const updateMutation = useMutation({
        mutationFn: async () => adminApi.users.update(editMatricule!, buildUpdateUserPayload(editForm)),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['admin', 'users', editMatricule] });
            closeEdit();
            await refresh();
        },
    });

    const createError = (createMutation.error as any)?.response?.data?.message || (createMutation.error ? 'Une erreur est survenue.' : null);
    const updateError = (updateMutation.error as any)?.response?.data?.message || (updateMutation.error ? 'Une erreur est survenue.' : null);
    const createValidationErrors = getCreateUserFormErrors(createForm);
    const createErrorMessage = Array.isArray(createError) ? createError.join(' ') : createError;

    return (
        <AdminUsersLayout title="Gestion des utilisateurs">
            <PageHeader
                title="Gestion des utilisateurs"
                description="Comptes, rôles et rattachements des collaborateurs évalués."
                breadcrumbs={[{ label: 'Administration' }, { label: 'Utilisateurs' }]}
                meta={`${meta.total} utilisateur${meta.total > 1 ? 's' : ''} au total`}
                actions={(
                    <>
                        <Link to="/admin/utilisateurs/gaps" className={buttonVariants({ variant: 'outline' })}>
                            Analyse des écarts
                        </Link>
                        {canCreateUser ? (
                            <>
                                <Button variant="outline" onClick={() => setImportOpen(true)}>Importer Excel</Button>
                                <Button onClick={() => setCreateOpen(true)}>Nouvel utilisateur</Button>
                            </>
                        ) : referencesPending ? (
                            <Button disabled>Chargement…</Button>
                        ) : null}
                    </>
                )}
            />

            {!referencesPending && !canCreateUser ? (
                <div role="status" className="flex flex-col gap-4 rounded-lg border border-amber-200 bg-amber-50 p-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <p className="text-sm font-semibold text-amber-900">Création d’utilisateur indisponible</p>
                        <p className="text-sm text-amber-800">
                            {!hasRoles && !hasRegions
                                ? 'Ajoutez au moins un rôle et une région avant de créer un utilisateur.'
                                : !hasRoles
                                  ? 'Ajoutez au moins un rôle avant de créer un utilisateur.'
                                  : 'Ajoutez au moins une région avant de créer un utilisateur.'}
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {!hasRoles ? (
                            <Link to="/admin/roles" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                                Configurer les rôles
                            </Link>
                        ) : null}
                        {!hasRegions ? (
                            <Link to="/admin/structure/regions" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                                Configurer les régions
                            </Link>
                        ) : null}
                    </div>
                </div>
            ) : null}

            <Card>
                <CardHeader>
                    <CardTitle>Utilisateurs</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-3 lg:grid-cols-[minmax(0_1fr)] lg:items-end">
                        <div className="space-y-1">
                            <Label htmlFor="users-search">Rechercher</Label>
                            <Input
                                id="users-search"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Matricule, nom, e-mail, rôle…"
                            />
                        </div>
                    </div>

                    <Table className="min-w-[980px]">
                        <TableHeader>
                            <TableRow>
                                <TableHead>Matricule</TableHead>
                                <TableHead>Nom</TableHead>
                                <TableHead>Rôle</TableHead>
                                <TableHead>Région</TableHead>
                                <TableHead>Service · District · Secteur</TableHead>
                                <TableHead>Manager</TableHead>
                                <TableHead>Branche</TableHead>
                                <TableHead>Statut</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={9} className="text-sabc-gray-500 py-8 text-center">
                                        {searchDebounced ? 'Aucun résultat pour cette recherche' : 'Aucun utilisateur'}
                                    </TableCell>
                                </TableRow>
                            )}
                            {users.map((user: any) => (
                                <TableRow key={user.matricule}>
                                    <TableCell className="font-medium">{user.matricule}</TableCell>
                                    <TableCell>
                                        <div className="font-medium">{[user.prenom, user.nom].filter(Boolean).join(' ')}</div>
                                        <div className="text-sabc-gray-500 text-xs">{user.email}</div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{user.role || 'n.d.'}</Badge>
                                    </TableCell>
                                    <TableCell>{regionLabel(user)}</TableCell>
                                    <TableCell className="max-w-56 truncate" title={structureLabel(user)}>
                                        {structureLabel(user)}
                                    </TableCell>
                                    <TableCell>{user.manager_matricule || 'n.d.'}</TableCell>
                                    <TableCell>{branchLabel(user)}</TableCell>
                                    <TableCell>
                                        {(() => {
                                            const status = getUserStatusPresentation(user);
                                            return <Badge variant={status.variant}>{status.label}</Badge>;
                                        })()}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Link to={`/admin/utilisateurs/${user.matricule}`}>
                                                <Button variant="outline" size="sm">
                                                    Voir
                                                </Button>
                                            </Link>
                                            <Button variant="outline" size="sm" onClick={() => openEdit(user)}>
                                                Modifier
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>

                    <Pagination meta={meta} onPageChange={setPage} />
                </CardContent>
            </Card>

            {/* Modal création */}
            <Dialog open={createOpen} onOpenChange={(value) => (value && canCreateUser ? setCreateOpen(true) : closeCreate())}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Créer un utilisateur</DialogTitle>
                        <DialogDescription>Renseigner les informations du nouvel utilisateur.</DialogDescription>
                    </DialogHeader>

                    <div className="grid max-h-[60vh] gap-4 overflow-y-auto pr-1 md:grid-cols-2">
                        {createTextFields.map(({ key, label, type = 'text' }) => (
                            <div key={key}>
                                <Label htmlFor={`create-${key}`}>{label}</Label>
                                <Input
                                    id={`create-${key}`}
                                    type={type}
                                    value={createForm[key]}
                                    onChange={(e) => setCreateForm((prev) => ({ ...prev, [key]: e.target.value }))}
                                    minLength={key === 'password' ? 8 : undefined}
                                    maxLength={key === 'matricule' ? 6 : undefined}
                                    aria-describedby={key === 'matricule' ? 'create-matricule-hint' : undefined}
                                />
                                {key === 'matricule' ? (
                                    <p id="create-matricule-hint" className="mt-1 text-xs text-sabc-gray-500">
                                        Le matricule SABC comporte 6 caractères.
                                    </p>
                                ) : null}
                                {key === 'matricule' && createValidationErrors.matricule ? (
                                    <p className="mt-1 text-xs text-red-700">{createValidationErrors.matricule}</p>
                                ) : null}
                                {key === 'password' ? (
                                    <p className={`mt-1 text-xs ${createValidationErrors.password ? 'text-red-700' : 'text-sabc-gray-500'}`}>
                                        {createValidationErrors.password || '8 caractères minimum.'}
                                    </p>
                                ) : null}
                            </div>
                        ))}
                        <div>
                            <Label>Rôle</Label>
                            <Select value={createForm.id_role} onValueChange={(id_role) => setCreateForm((prev) => ({ ...prev, id_role, manager_matricule: '' }))}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Sélectionner un rôle" />
                                </SelectTrigger>
                                <SelectContent>
                                    {(roles as any[]).map((role) => (
                                        <SelectItem key={role.id_role} value={role.id_role}>
                                            {role.nom_role}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-sabc-gray-500 mt-1 text-xs">Niveau et branche issus du référentiel.</p>
                        </div>
                        <div>
                            <Label>Région</Label>
                            <Select value={createForm.id_region} onValueChange={(id_region) => setCreateForm((prev) => ({
                                ...prev,
                                id_region,
                                manager_matricule: '',
                                id_service: '',
                                id_district: '',
                                id_secteur: '',
                            }))}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Sélectionner une région" />
                                </SelectTrigger>
                                <SelectContent>
                                    {(regions as any[]).map((region) => (
                                        <SelectItem key={region.id_region} value={region.id_region}>
                                            {region.nom_region}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-4 border-t border-sabc-gray-200 pt-4 md:col-span-2 md:grid-cols-2">
                            <p className="text-sm font-semibold text-sabc-gray-900 md:col-span-2">
                                Périmètre de travail et hiérarchie
                            </p>
                            <UserAssignmentFields
                                values={createForm}
                                onChange={(field, value) => setCreateForm((previous) => ({ ...previous, [field]: value }))}
                            />
                        </div>
                        {createErrorMessage && <p className="text-sabc-red-primary text-sm md:col-span-2">{createErrorMessage}</p>}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={closeCreate}>
                            Annuler
                        </Button>
                        <Button
                            disabled={!canCreateUser || !isCreateUserFormValid(createForm) || createMutation.isPending}
                            onClick={() => createMutation.mutate()}
                        >
                            {createMutation.isPending ? 'Création…' : 'Créer'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal édition */}
            <Dialog open={!!editMatricule} onOpenChange={(value) => (value ? undefined : closeEdit())}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Modifier {editMatricule}</DialogTitle>
                        <DialogDescription>Mettre à jour les informations de l'utilisateur.</DialogDescription>
                    </DialogHeader>

                    <div className="grid max-h-[60vh] gap-4 overflow-y-auto pr-1 md:grid-cols-2">
                        {editTextFields.map(({ key, label, type = 'text' }) => (
                            <div key={key}>
                                <Label htmlFor={`edit-${key}`}>{label}</Label>
                                <Input
                                    id={`edit-${key}`}
                                    type={type}
                                    value={editForm[key]}
                                    onChange={(e) => setEditForm((prev) => ({ ...prev, [key]: e.target.value }))}
                                />
                            </div>
                        ))}
                        <div className="grid gap-4 border-t border-sabc-gray-200 pt-4 md:col-span-2 md:grid-cols-2">
                            <p className="text-sm font-semibold text-sabc-gray-900 md:col-span-2">
                                Périmètre de travail et hiérarchie
                            </p>
                            <UserAssignmentFields
                                values={editForm}
                                onChange={(field, value) => setEditForm((previous) => ({ ...previous, [field]: value }))}
                            />
                        </div>
                        <div>
                            <Label>Rôle</Label>
                            <Select value={editForm.id_role} onValueChange={(id_role) => setEditForm((prev) => ({ ...prev, id_role, manager_matricule: '' }))}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Sélectionner un rôle" />
                                </SelectTrigger>
                                <SelectContent>
                                    {(roles as RoleReference[]).map((role) => (
                                        <SelectItem key={role.id_role} value={role.id_role}>
                                            {role.nom_role}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-sabc-gray-500 mt-1 text-xs">Branche, niveau et droits admin recalculés automatiquement.</p>
                        </div>
                        <div>
                            <Label>Région</Label>
                            <Select value={editForm.id_region} onValueChange={(id_region) => setEditForm((prev) => ({
                                ...prev,
                                id_region,
                                manager_matricule: '',
                                id_service: '',
                                id_district: '',
                                id_secteur: '',
                            }))}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Sélectionner une région" />
                                </SelectTrigger>
                                <SelectContent>
                                    {(regions as any[]).map((region) => (
                                        <SelectItem key={region.id_region} value={region.id_region}>
                                            {region.nom_region}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="md:col-span-2">
                            <Label>Statut</Label>
                            <Select value={editForm.statut} onValueChange={(statut) => setEditForm((prev) => ({ ...prev, statut }))}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Conserver le statut géré par le système" />
                                </SelectTrigger>
                                <SelectContent>
                                    {editForm.statut === 'Indisponible' ? (
                                        <SelectItem value="Indisponible" disabled>
                                            Indisponible (géré par les remplacements)
                                        </SelectItem>
                                    ) : null}
                                    <SelectItem value="Actif">Actif</SelectItem>
                                    <SelectItem value="Inactif">Inactif</SelectItem>
                                    <SelectItem value="Suspendu">Suspendu</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {updateError && <p className="text-sabc-red-primary text-sm md:col-span-2">{updateError}</p>}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={closeEdit}>
                            Annuler
                        </Button>
                        <Button
                            disabled={!isUpdateUserFormValid(editForm) || updateMutation.isPending}
                            onClick={() => updateMutation.mutate()}
                        >
                            {updateMutation.isPending ? 'Enregistrement…' : 'Enregistrer'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <ExcelImportDialog kind="users" open={importOpen} onOpenChange={setImportOpen} />
        </AdminUsersLayout>
    );
}

export default function AdminUsersPage() {
    return (
        <Suspense fallback={<DashboardSkeleton />}>
            <UsersContent />
        </Suspense>
    );
}
