import { DashboardSkeleton } from '@/Components/Dashboard/DashboardSkeleton';
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
import { buildCreateUserPayload, initialCreateUserForm, isCreateUserFormValid, type CreateUserForm } from './create-user-contract';
import { AdminUsersLayout } from './shared';
import {
    buildUpdateUserForm,
    buildUpdateUserPayload,
    initialUpdateUserForm,
    isUpdateUserFormValid,
    type EditableUser,
    type RoleReference,
    type UpdateUserForm,
} from './update-user-contract';

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
    key: 'nom' | 'prenom' | 'email' | 'telephone' | 'manager_matricule';
    label: string;
    type?: string;
}> = [
    { key: 'nom', label: 'Nom' },
    { key: 'prenom', label: 'Prénom' },
    { key: 'email', label: 'Adresse e-mail', type: 'email' },
    { key: 'telephone', label: 'Téléphone', type: 'tel' },
    { key: 'manager_matricule', label: 'Manager (matricule)' },
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
        <div className="border-sabc-gray-200 flex items-center justify-between border-t pt-4">
            <p className="text-sabc-gray-600 text-sm">
                {(meta.page - 1) * meta.limit + 1}–{Math.min(meta.page * meta.limit, meta.total)} sur {meta.total} utilisateurs
            </p>
            <div className="flex gap-1">
                <Button variant="outline" size="sm" disabled={meta.page <= 1} onClick={() => onPageChange(meta.page - 1)}>
                    Précédent
                </Button>
                {pages.map((p) => (
                    <Button
                        key={p}
                        variant={p === meta.page ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => onPageChange(p)}
                        className={p === meta.page ? 'bg-sabc-red-primary text-white' : ''}
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
    const [sortBy, setSortBy] = useState<'name' | 'score'>('score');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    const [createOpen, setCreateOpen] = useState(false);
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
        sort_by: sortBy,
        sort_order: sortOrder,
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

    return (
        <AdminUsersLayout title="Gestion des utilisateurs">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-sabc-gray-900 text-2xl font-bold">Gestion des utilisateurs</h1>
                    <p className="text-sabc-gray-600 text-sm">
                        {meta.total} utilisateur{meta.total > 1 ? 's' : ''} au total
                    </p>
                </div>
                <div className="flex gap-2">
                    <Link to="/admin/utilisateurs/gaps" className={buttonVariants({ variant: 'outline' })}>
                        Analyse des gaps
                    </Link>
                    {canCreateUser ? (
                        <Button className="bg-sabc-red-primary hover:bg-sabc-red-dark text-white" onClick={() => setCreateOpen(true)}>
                            Nouvel utilisateur
                        </Button>
                    ) : referencesPending ? (
                        <Button disabled>Chargement…</Button>
                    ) : null}
                </div>
            </div>

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
                    <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_210px_210px] lg:items-end">
                        <div className="space-y-1">
                            <Label htmlFor="users-search">Rechercher</Label>
                            <Input
                                id="users-search"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Matricule, nom, e-mail, rôle..."
                            />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="users-sort-by">Trier par</Label>
                            <Select value={sortBy} onValueChange={(value: 'name' | 'score') => { setSortBy(value); setPage(1); }}>
                                <SelectTrigger id="users-sort-by"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="score">Score moyen</SelectItem>
                                    <SelectItem value="name">Nom</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="users-sort-order">Ordre</Label>
                            <Select value={sortOrder} onValueChange={(value: 'asc' | 'desc') => { setSortOrder(value); setPage(1); }}>
                                <SelectTrigger id="users-sort-order"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="desc">{sortBy === 'score' ? 'Du plus élevé au plus faible' : 'Z à A'}</SelectItem>
                                    <SelectItem value="asc">{sortBy === 'score' ? 'Du plus faible au plus élevé' : 'A à Z'}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Matricule</TableHead>
                                <TableHead>Nom</TableHead>
                                <TableHead>Rôle</TableHead>
                                <TableHead>Score moyen /5</TableHead>
                                <TableHead>Région</TableHead>
                                <TableHead>Branche</TableHead>
                                <TableHead>Statut</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-sabc-gray-500 py-8 text-center">
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
                                        <Badge variant="primary">{user.role}</Badge>
                                    </TableCell>
                                    <TableCell>{user.score_moyen != null ? `${Number(user.score_moyen).toFixed(2)}/5` : 'Non évalué'}</TableCell>
                                    <TableCell>{user.region?.nom_region || user.id_region}</TableCell>
                                    <TableCell>{user.branche?.nom_branche || user.id_branche}</TableCell>
                                    <TableCell>
                                        <Badge variant={user.est_actif ? 'success' : 'secondary'}>
                                            {user.statut || (user.est_actif ? 'Actif' : 'Inactif')}
                                        </Badge>
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
                                />
                            </div>
                        ))}
                        <div>
                            <Label>Rôle</Label>
                            <Select value={createForm.id_role} onValueChange={(id_role) => setCreateForm((prev) => ({ ...prev, id_role }))}>
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
                            <Select value={createForm.id_region} onValueChange={(id_region) => setCreateForm((prev) => ({ ...prev, id_region }))}>
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
                            <Label htmlFor="create-manager_matricule">Manager (matricule)</Label>
                            <Input
                                id="create-manager_matricule"
                                value={createForm.manager_matricule}
                                onChange={(e) =>
                                    setCreateForm((prev) => ({
                                        ...prev,
                                        manager_matricule: e.target.value,
                                    }))
                                }
                            />
                        </div>
                        {createError && <p className="text-sabc-red-primary text-sm md:col-span-2">{createError}</p>}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={closeCreate}>
                            Annuler
                        </Button>
                        <Button
                            className="bg-sabc-red-primary hover:bg-sabc-red-dark text-white"
                            disabled={!canCreateUser || !isCreateUserFormValid(createForm) || createMutation.isPending}
                            onClick={() => createMutation.mutate()}
                        >
                            {createMutation.isPending ? 'Création...' : 'Créer'}
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
                            <div key={key} className={key === 'manager_matricule' ? 'md:col-span-2' : undefined}>
                                <Label htmlFor={`edit-${key}`}>{label}</Label>
                                <Input
                                    id={`edit-${key}`}
                                    type={type}
                                    value={editForm[key]}
                                    onChange={(e) => setEditForm((prev) => ({ ...prev, [key]: e.target.value }))}
                                />
                            </div>
                        ))}
                        <div>
                            <Label>Rôle</Label>
                            <Select value={editForm.id_role} onValueChange={(id_role) => setEditForm((prev) => ({ ...prev, id_role }))}>
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
                            <Select value={editForm.id_region} onValueChange={(id_region) => setEditForm((prev) => ({ ...prev, id_region }))}>
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
                            className="bg-sabc-red-primary hover:bg-sabc-red-dark text-white"
                            disabled={!isUpdateUserFormValid(editForm) || updateMutation.isPending}
                            onClick={() => updateMutation.mutate()}
                        >
                            {updateMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
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
