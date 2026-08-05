import { Button } from '@/Components/UI/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/UI/Card';
import { FormField } from '@/Components/UI/Form';
import { Input } from '@/Components/UI/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/UI/Select';
import { useToast } from '@/Contexts/ToastContext';
import { useAdminUser } from '@/Hooks/queries';
import { adminApi } from '@/Services/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AdminUsersLayout } from './shared';
import {
    buildUpdateUserForm,
    buildUpdateUserPayload,
    initialUpdateUserForm,
    isUpdateUserFormValid,
    type RoleReference,
    type UpdateUserForm,
} from './update-user-contract';

export default function EditUser() {
    const { matricule = '' } = useParams();
    const { data } = useAdminUser(matricule);
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const { success, error } = useToast();
    const [form, setForm] = useState<UpdateUserForm>(initialUpdateUserForm);

    const { data: regions = [] } = useQuery({
        queryKey: ['admin', 'structure', 'regions'],
        queryFn: () => adminApi.structure.regions().then((r) => r.data),
    });
    const { data: roles = [] } = useQuery({
        queryKey: ['admin', 'roles'],
        queryFn: () => adminApi.roles.list().then((r) => r.data),
    });

    React.useEffect(() => {
        if (!data) return;
        setForm(buildUpdateUserForm(data, roles as RoleReference[]));
    }, [data, roles]);

    const setField = (key: keyof UpdateUserForm, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

    const updateMutation = useMutation({
        mutationFn: async () => adminApi.users.update(matricule, buildUpdateUserPayload(form)),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
            await queryClient.invalidateQueries({ queryKey: ['admin', 'users', matricule] });
            success('Utilisateur mis à jour.');
            navigate(`/admin/utilisateurs/${matricule}`);
        },
        onError: (e: any) => {
            error(e?.response?.data?.message || e?.message || 'La mise à jour a échoué.');
        },
    });

    return (
        <AdminUsersLayout title={`Modifier ${matricule}`}>
            <div className="flex items-center justify-between">
                <h1 className="text-sabc-gray-900 text-2xl font-semibold tracking-tight">Modifier {matricule}</h1>
                <Link to={`/admin/utilisateurs/${matricule}`}>
                    <Button variant="outline">Retour</Button>
                </Link>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Informations éditables</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                    <FormField label="Nom" htmlFor="nom" required>
                        <Input id="nom" value={form.nom} onChange={(e) => setField('nom', e.target.value)} />
                    </FormField>
                    <FormField label="Prénom" htmlFor="prenom" required>
                        <Input id="prenom" value={form.prenom} onChange={(e) => setField('prenom', e.target.value)} />
                    </FormField>
                    <FormField label="Adresse e-mail" htmlFor="email" required>
                        <Input id="email" type="email" value={form.email} onChange={(e) => setField('email', e.target.value)} />
                    </FormField>
                    <FormField label="Téléphone" htmlFor="telephone">
                        <Input id="telephone" type="tel" value={form.telephone} onChange={(e) => setField('telephone', e.target.value)} />
                    </FormField>
                    <FormField label="Rôle" required hint="Le niveau, la branche et les droits admin sont recalculés depuis le référentiel.">
                        <Select value={form.id_role} onValueChange={(v) => setField('id_role', v)}>
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
                    </FormField>
                    <FormField label="Statut">
                        <Select value={form.statut} onValueChange={(v) => setField('statut', v)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Sélectionner un statut" />
                            </SelectTrigger>
                            <SelectContent>
                                {form.statut === 'Indisponible' ? (
                                    <SelectItem value="Indisponible" disabled>
                                        Indisponible (géré par les remplacements)
                                    </SelectItem>
                                ) : null}
                                <SelectItem value="Actif">Actif</SelectItem>
                                <SelectItem value="Inactif">Inactif</SelectItem>
                                <SelectItem value="Suspendu">Suspendu</SelectItem>
                            </SelectContent>
                        </Select>
                    </FormField>
                    <FormField label="Région">
                        <Select value={form.id_region} onValueChange={(v) => setField('id_region', v)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Sélectionner une région" />
                            </SelectTrigger>
                            <SelectContent>
                                {(regions as any[]).map((r) => (
                                    <SelectItem key={r.id_region} value={r.id_region}>
                                        {r.nom_region}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </FormField>
                    <FormField
                        label="Manager (matricule)"
                        htmlFor="manager_matricule"
                        className="md:col-span-2"
                        hint="Matricule du responsable hiérarchique (facultatif)."
                    >
                        <Input
                            id="manager_matricule"
                            value={form.manager_matricule}
                            onChange={(e) => setField('manager_matricule', e.target.value)}
                            placeholder="Ex. D1010"
                        />
                    </FormField>

                    <div className="flex justify-end gap-2 md:col-span-2">
                        <Link to={`/admin/utilisateurs/${matricule}`}>
                            <Button variant="outline">Annuler</Button>
                        </Link>
                        <Button
                            className="bg-sabc-red-primary hover:bg-sabc-red-dark text-white"
                            disabled={!isUpdateUserFormValid(form) || updateMutation.isPending}
                            onClick={() => updateMutation.mutate()}
                        >
                            {updateMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </AdminUsersLayout>
    );
}
