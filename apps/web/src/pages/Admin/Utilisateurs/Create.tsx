import { Button } from '@/Components/UI/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/UI/Card';
import { FormField } from '@/Components/UI/Form';
import { Input } from '@/Components/UI/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/UI/Select';
import { useToast } from '@/Contexts/ToastContext';
import { adminApi } from '@/Services/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { buildCreateUserPayload, initialCreateUserForm, isCreateUserFormValid } from './create-user-contract';
import { AdminUsersLayout } from './shared';
import { UserAssignmentFields } from './UserAssignmentFields';

export default function CreateUser() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { success, error } = useToast();
    const [form, setForm] = useState(initialCreateUserForm);

    const { data: regions = [] } = useQuery({
        queryKey: ['admin', 'structure', 'regions'],
        queryFn: () => adminApi.structure.regions().then((r) => r.data),
    });
    const { data: roles = [] } = useQuery({
        queryKey: ['admin', 'roles'],
        queryFn: () => adminApi.roles.list().then((r) => r.data),
    });

    const setField = (key: keyof typeof initialCreateUserForm, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

    const createMutation = useMutation({
        mutationFn: async () => adminApi.users.create(buildCreateUserPayload(form)),
        onSuccess: async (response) => {
            await queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
            success('Utilisateur créé.');
            navigate(`/admin/utilisateurs/${response.data.matricule}`);
        },
        onError: (e: any) => {
            error(e?.response?.data?.message || e?.message || "La création de l'utilisateur a échoué.");
        },
    });

    const isValid = isCreateUserFormValid(form);

    return (
        <AdminUsersLayout title="Créer un utilisateur">
            <div className="flex items-center justify-between">
                <h1 className="text-sabc-gray-900 text-2xl font-semibold tracking-tight">Créer un utilisateur</h1>
                <Link to="/admin/utilisateurs">
                    <Button variant="outline">Retour</Button>
                </Link>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Informations</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                    <FormField
                        label="Matricule"
                        htmlFor="matricule"
                        required
                        hint="Le matricule doit comporter 6 caractères."
                    >
                        <Input
                            id="matricule"
                            value={form.matricule}
                            onChange={(e) => setField('matricule', e.target.value)}
                            placeholder="Ex. 114804"
                            maxLength={6}
                        />
                    </FormField>
                    <FormField label="Adresse e-mail" htmlFor="email" required>
                        <Input
                            id="email"
                            type="email"
                            value={form.email}
                            onChange={(e) => setField('email', e.target.value)}
                            placeholder="prenom.nom@sabc.local"
                        />
                    </FormField>
                    <FormField label="Nom" htmlFor="nom" required>
                        <Input id="nom" value={form.nom} onChange={(e) => setField('nom', e.target.value)} />
                    </FormField>
                    <FormField label="Prénom" htmlFor="prenom" required>
                        <Input id="prenom" value={form.prenom} onChange={(e) => setField('prenom', e.target.value)} />
                    </FormField>
                    <FormField label="Téléphone" htmlFor="telephone">
                        <Input id="telephone" type="tel" value={form.telephone} onChange={(e) => setField('telephone', e.target.value)} />
                    </FormField>
                    <FormField label="Mot de passe" htmlFor="password" required>
                        <Input id="password" type="password" value={form.password} onChange={(e) => setField('password', e.target.value)} />
                    </FormField>

                    <FormField label="Rôle" required hint="Le niveau et la branche seront déterminés automatiquement.">
                        <Select value={form.id_role} onValueChange={(id_role) => setForm((previous) => ({
                            ...previous,
                            id_role,
                            manager_matricule: '',
                        }))}>
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
                    </FormField>

                    <FormField label="Région" required hint="Le type de région sera déterminé automatiquement.">
                        <Select value={form.id_region} onValueChange={(id_region) => setForm((previous) => ({
                            ...previous,
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
                                {(regions as any[]).map((r) => (
                                    <SelectItem key={r.id_region} value={r.id_region}>
                                        {r.nom_region}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </FormField>

                    <div className="md:col-span-2">
                        <h2 className="mb-1 text-sm font-semibold text-sabc-gray-900">Périmètre de travail et hiérarchie</h2>
                        <p className="mb-3 text-xs text-sabc-gray-500">
                            Le service, district et secteur sont facultatifs. Les secteurs disponibles dépendent du service et du district sélectionnés.
                        </p>
                        <div className="grid gap-4 md:grid-cols-2">
                            <UserAssignmentFields
                                values={form}
                                onChange={(field, value) => setForm((previous) => ({ ...previous, [field]: value }))}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 md:col-span-2">
                        <Link to="/admin/utilisateurs">
                            <Button variant="outline">Annuler</Button>
                        </Link>
                        <Button
                            className="bg-sabc-red-primary hover:bg-sabc-red-dark text-white"
                            disabled={!isValid || createMutation.isPending}
                            onClick={() => createMutation.mutate()}
                        >
                            {createMutation.isPending ? 'Création...' : 'Créer'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </AdminUsersLayout>
    );
}
