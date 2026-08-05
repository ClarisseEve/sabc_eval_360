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
                    <FormField label="Matricule" htmlFor="matricule" required>
                        <Input
                            id="matricule"
                            value={form.matricule}
                            onChange={(e) => setField('matricule', e.target.value)}
                            placeholder="Ex. A0001"
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
                        <Select value={form.id_role} onValueChange={(value) => setField('id_role', value)}>
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
                        <Select value={form.id_region} onValueChange={(value) => setField('id_region', value)}>
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
