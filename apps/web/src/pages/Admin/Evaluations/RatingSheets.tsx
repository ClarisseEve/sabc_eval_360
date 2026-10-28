import { Button } from '@/Components/UI/Button/Button';
import { useConfirm } from '@/Contexts/ConfirmContext';
import { useToast } from '@/Contexts/ToastContext';
import { RatingSheetCategoryType, RatingSheetConfiguration, ratingSheetsApi } from '@/Services/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React from 'react';
import { AdminEvaluationsLayout } from './shared';

const CATEGORIES: Array<{ type: RatingSheetCategoryType; label: string }> = [
    { type: 'auto', label: 'Auto-évaluation' },
    { type: 'pairs', label: 'Évaluation par les pairs' },
    { type: 'descendante', label: 'Évaluation descendante' },
    { type: 'admin', label: 'Évaluation de l’admin' },
];
const CATEGORY_LABELS = Object.fromEntries(CATEGORIES.map(({ type, label }) => [type, label]));

type RoleOverview = {
    role: string;
    configuration: RatingSheetConfiguration | null;
    collaborateurs: Array<{
        matricule: string;
        nom: string;
        prenom: string;
        configuration_absente?: boolean;
        statut?: 'complete' | 'partielle';
        note_generale_sur_20?: number | null;
        categories?: Record<string, { complete: boolean; evaluations_recues: number; note_sur_20: number | null }>;
        fiche?: {
            id_fiche: string;
            notification_statut: string;
            email_statut: string;
            email_erreur?: string | null;
            notification_erreur?: string | null;
            publie_le: string;
        } | null;
    }>;
};

function initialConfiguration(configuration?: RatingSheetConfiguration | null): RatingSheetConfiguration {
    const configured = new Map((configuration?.categories ?? []).map((category) => [category.type, category.poids]));
    return {
        methode_calcul: configuration?.methode_calcul ?? 'moyenne',
        categories: CATEGORIES.map(({ type }) => ({
            type,
            poids: configured.get(type) ?? 25,
        })),
    };
}

function getErrorMessage(error: unknown) {
    return error instanceof Error ? error.message : 'Une erreur inattendue est survenue.';
}

export default function AdminRatingSheetsPage() {
    const queryClient = useQueryClient();
    const confirm = useConfirm();
    const toast = useToast();
    const [periodId, setPeriodId] = React.useState('');
    const [selectedRole, setSelectedRole] = React.useState('');
    const [draft, setDraft] = React.useState<RatingSheetConfiguration>(() => initialConfiguration());
    const [selectedRoleCategories, setSelectedRoleCategories] = React.useState<RatingSheetCategoryType[]>(CATEGORIES.map(({ type }) => type));
    const [selection, setSelection] = React.useState<string[]>([]);

    const periodsQuery = useQuery({
        queryKey: ['rating-sheet-periods'],
        queryFn: async () => (await ratingSheetsApi.periods()).data,
    });
    const periods = periodsQuery.data ?? [];
    React.useEffect(() => {
        if (!periodId && periods.length) setPeriodId(periods[0].id_periode);
    }, [periodId, periods]);

    const overviewQuery = useQuery({
        queryKey: ['rating-sheet-overview', periodId],
        queryFn: async () => (await ratingSheetsApi.overview(periodId)).data,
        enabled: Boolean(periodId),
    });
    const roles: RoleOverview[] = overviewQuery.data?.roles ?? [];
    const roleOverview = roles.find((role) => role.role === selectedRole);

    React.useEffect(() => {
        if (!selectedRole && roles.length) setSelectedRole(roles[0].role);
    }, [roles, selectedRole]);
    React.useEffect(() => {
        if (roleOverview) {
            setDraft(initialConfiguration(roleOverview.configuration));
            setSelection([]);
        }
    }, [selectedRole, roleOverview?.configuration]);
    React.useEffect(() => {
        setSelectedRole('');
        setSelection([]);
    }, [periodId]);

    const selectedCategories = draft.categories.filter((category) => selectedRoleCategories.includes(category.type)).map((category) => category.type);
    const saveMutation = useMutation({
        mutationFn: () => {
            const categories = draft.categories.filter((category) => selectedCategories.includes(category.type));
            return ratingSheetsApi.saveConfiguration(periodId, selectedRole, {
                methode_calcul: draft.methode_calcul,
                categories,
            });
        },
        onSuccess: async () => {
            toast.success('La configuration de la fiche a été enregistrée.');
            await queryClient.invalidateQueries({ queryKey: ['rating-sheet-overview', periodId] });
        },
        onError: (error) => toast.error(getErrorMessage(error)),
    });

    React.useEffect(() => {
        setSelectedRoleCategories(roleOverview?.configuration?.categories.map(({ type }) => type) ?? CATEGORIES.map(({ type }) => type));
    }, [selectedRole, roleOverview?.configuration]);

    const publishMutation = useMutation({
        mutationFn: (matricules?: string[]) => ratingSheetsApi.publish(periodId, selectedRole, matricules),
        onSuccess: async ({ data }) => {
            const errors = data.notifications_echouees + data.emails_echoues;
            toast.show(
                errors ? 'warning' : 'success',
                `${data.fiches_publiees}/${data.total} fiches publiées. ${data.notifications_echouees} notification(s) en échec, ${data.emails_echoues} e-mail(s) en échec.`,
            );
            setSelection([]);
            await queryClient.invalidateQueries({ queryKey: ['rating-sheet-overview', periodId] });
        },
        onError: (error) => toast.error(getErrorMessage(error)),
    });

    const toggleCategory = (type: RatingSheetCategoryType) => {
        setSelectedRoleCategories((current) => (current.includes(type) ? current.filter((category) => category !== type) : [...current, type]));
    };
    const updateWeight = (type: RatingSheetCategoryType, poids: number) => {
        setDraft((current) => ({
            ...current,
            methode_calcul: 'ponderee',
            categories: current.categories.map((category) => (category.type === type ? { ...category, poids } : category)),
        }));
    };
    const togglePerson = (matricule: string) => {
        setSelection((current) => (current.includes(matricule) ? current.filter((value) => value !== matricule) : [...current, matricule]));
    };

    const handlePublish = async (matricules?: string[]) => {
        const count = matricules?.length ?? roleOverview?.collaborateurs.length ?? 0;
        const confirmed = await confirm({
            title: 'Publier les fiches de notation',
            description: `${count} fiche(s) seront mises à disposition sur la plateforme. Chaque personne recevra une notification et un e-mail avec son PDF. Les catégories non reçues seront signalées sans bloquer la publication.`,
            confirmLabel: 'Publier et envoyer',
        });
        if (confirmed) publishMutation.mutate(matricules);
    };

    const canSave = Boolean(periodId && selectedRole && selectedRoleCategories.length) && !saveMutation.isPending;

    return (
        <AdminEvaluationsLayout title="Fiches de notation">
            <section className="space-y-5">
                <div>
                    <h1 className="text-sabc-gray-900 text-2xl font-semibold">Fiches de notation</h1>
                    <p className="text-sabc-gray-600 mt-1 text-sm">
                        Configurez le calcul par période et par poste, vérifiez les évaluations reçues, puis publiez les fiches individuellement.
                    </p>
                </div>

                {periodsQuery.isLoading ? <p>Chargement des périodes…</p> : null}
                {periodsQuery.isError ? <p className="text-red-700">{getErrorMessage(periodsQuery.error)}</p> : null}
                {!periods.length && !periodsQuery.isLoading ? (
                    <div className="border-sabc-gray-200 text-sabc-gray-600 rounded-lg border bg-white p-6 text-sm">
                        Aucune période d’évaluation n’est disponible.
                    </div>
                ) : null}

                {periods.length > 0 ? (
                    <>
                        <div className="border-sabc-gray-200 flex flex-wrap gap-4 rounded-lg border bg-white p-4">
                            <label className="text-sabc-gray-700 min-w-64 flex-1 text-sm font-medium">
                                Période d’évaluation
                                <select
                                    className="border-sabc-gray-300 mt-1 block w-full rounded-lg border bg-white px-3 py-2"
                                    value={periodId}
                                    onChange={(event) => setPeriodId(event.target.value)}
                                >
                                    {periods.map((item: any) => (
                                        <option key={item.id_periode} value={item.id_periode}>
                                            {item.nom_periode} ({item.code_periode}) · {item.statut}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <label className="text-sabc-gray-700 min-w-56 flex-1 text-sm font-medium">
                                Poste évalué
                                <select
                                    className="border-sabc-gray-300 mt-1 block w-full rounded-lg border bg-white px-3 py-2"
                                    value={selectedRole}
                                    onChange={(event) => setSelectedRole(event.target.value)}
                                    disabled={!roles.length}
                                >
                                    {roles.map((role) => (
                                        <option key={role.role} value={role.role}>
                                            {role.role}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        </div>

                        {overviewQuery.isLoading ? <p>Chargement des collaborateurs et des évaluations…</p> : null}
                        {overviewQuery.isError ? <p className="text-red-700">{getErrorMessage(overviewQuery.error)}</p> : null}

                        {roleOverview ? (
                            <>
                                <div className="border-sabc-gray-200 rounded-lg border bg-white p-5">
                                    <h2 className="text-sabc-gray-900 text-lg font-semibold">Calcul de la note générale</h2>
                                    <p className="text-sabc-gray-600 mt-1 text-sm">
                                        Les notes de catégorie sont converties sur 20. En cas d’évaluations manquantes, les catégories disponibles
                                        sont renormalisées. Vous pouvez modifier et enregistrer les poids à tout moment. Les fiches déjà publiées
                                        conservent leur contenu ; republiez-les pour appliquer la nouvelle configuration.
                                    </p>
                                    <p className="text-sabc-gray-600 mt-2 text-sm">
                                        Modifier un poids active automatiquement la pondération personnalisée. Le total des catégories choisies doit
                                        alors être égal à 100 %.
                                    </p>

                                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                                        {CATEGORIES.map(({ type, label }) => {
                                            const weight = draft.categories.find((category) => category.type === type)?.poids ?? 25;
                                            return (
                                                <div key={type} className="border-sabc-gray-200 flex items-center gap-3 rounded-lg border p-3">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedRoleCategories.includes(type)}
                                                        onChange={() => toggleCategory(type)}
                                                        aria-label={`Inclure ${label}`}
                                                    />
                                                    <span className="flex-1 text-sm">{label}</span>
                                                    <label className="text-sabc-gray-600 flex items-center gap-2 text-xs">
                                                        Poids
                                                        <input
                                                            type="number"
                                                            min="0.01"
                                                            max="100"
                                                            step="0.01"
                                                            value={weight}
                                                            onChange={(event) => updateWeight(type, Number(event.target.value))}
                                                            disabled={!selectedRoleCategories.includes(type)}
                                                            className="border-sabc-gray-300 w-20 rounded border px-2 py-1"
                                                        />
                                                        %
                                                    </label>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="mt-4 flex flex-wrap items-end gap-3">
                                        <label className="text-sabc-gray-700 text-sm font-medium">
                                            Méthode
                                            <select
                                                className="border-sabc-gray-300 mt-1 block rounded-lg border bg-white px-3 py-2"
                                                value={draft.methode_calcul}
                                                onChange={(event) =>
                                                    setDraft((current) => ({
                                                        ...current,
                                                        methode_calcul: event.target.value as RatingSheetConfiguration['methode_calcul'],
                                                    }))
                                                }
                                            >
                                                <option value="moyenne">Moyenne simple des catégories choisies</option>
                                                <option value="ponderee">Pondération personnalisée</option>
                                            </select>
                                        </label>
                                        {draft.methode_calcul === 'ponderee' ? (
                                            <p className="text-sabc-gray-600 pb-2 text-sm">
                                                Total sélectionné :{' '}
                                                {draft.categories
                                                    .filter((category) => selectedRoleCategories.includes(category.type))
                                                    .reduce((total, category) => total + (Number(category.poids) || 0), 0)}{' '}
                                                %
                                            </p>
                                        ) : null}
                                        <Button onClick={() => saveMutation.mutate()} loading={saveMutation.isPending} disabled={!canSave}>
                                            Enregistrer la configuration
                                        </Button>
                                        {saveMutation.isError ? (
                                            <span className="text-sm text-red-700">{getErrorMessage(saveMutation.error)}</span>
                                        ) : null}
                                    </div>
                                </div>

                                <div className="border-sabc-gray-200 rounded-lg border bg-white">
                                    <div className="border-sabc-gray-200 flex flex-wrap items-center justify-between gap-3 border-b p-4">
                                        <div>
                                            <h2 className="text-sabc-gray-900 font-semibold">Cibles éligibles</h2>
                                            <p className="text-sabc-gray-600 text-sm">
                                                {roleOverview.collaborateurs.length} personne(s)
                                                {roleOverview.configuration
                                                    ? ` · ${roleOverview.collaborateurs.filter((person) => person.statut === 'complete').length} fiche(s) complète(s), ${roleOverview.collaborateurs.filter((person) => person.statut === 'partielle').length} partielle(s)`
                                                    : ''}
                                                {' · '}sélectionnez des lignes pour une publication ciblée.
                                            </p>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            <Button
                                                variant="outline"
                                                disabled={!roleOverview.configuration || !selection.length || publishMutation.isPending}
                                                loading={publishMutation.isPending}
                                                onClick={() => handlePublish(selection)}
                                            >
                                                Publier la sélection ({selection.length})
                                            </Button>
                                            <Button
                                                disabled={
                                                    !roleOverview.configuration || !roleOverview.collaborateurs.length || publishMutation.isPending
                                                }
                                                loading={publishMutation.isPending}
                                                onClick={() => handlePublish()}
                                            >
                                                Publier tout le poste
                                            </Button>
                                        </div>
                                    </div>
                                    {!roleOverview.configuration ? (
                                        <p className="p-4 text-sm text-amber-800">Enregistrez d’abord une configuration pour ce poste.</p>
                                    ) : null}
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[850px] text-left text-sm">
                                            <thead className="bg-sabc-gray-50 text-sabc-gray-600 text-xs uppercase">
                                                <tr>
                                                    <th className="p-3">
                                                        <span className="sr-only">Sélectionner</span>
                                                    </th>
                                                    <th className="p-3">Collaborateur</th>
                                                    {roleOverview.configuration?.categories.map(({ type }) => (
                                                        <th className="p-3" key={type}>
                                                            {CATEGORY_LABELS[type]}
                                                        </th>
                                                    ))}
                                                    <th className="p-3">Note générale</th>
                                                    <th className="p-3">Fiche / envoi</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-sabc-gray-100 divide-y">
                                                {roleOverview.collaborateurs.map((person) => (
                                                    <tr key={person.matricule}>
                                                        <td className="p-3">
                                                            <input
                                                                type="checkbox"
                                                                checked={selection.includes(person.matricule)}
                                                                onChange={() => togglePerson(person.matricule)}
                                                                disabled={!roleOverview.configuration}
                                                                aria-label={`Sélectionner ${person.prenom} ${person.nom}`}
                                                            />
                                                        </td>
                                                        <td className="p-3">
                                                            <div className="font-medium">
                                                                {person.prenom} {person.nom}
                                                            </div>
                                                            <div className="text-sabc-gray-500 text-xs">
                                                                {person.matricule}
                                                                {person.categories
                                                                    ? ` · ${Object.values(person.categories).filter((category) => category.complete).length}/${Object.keys(person.categories).length} catégorie(s) reçue(s)`
                                                                    : ''}
                                                            </div>
                                                        </td>
                                                        {roleOverview.configuration?.categories.map(({ type }) => {
                                                            const category = person.categories?.[type];
                                                            return (
                                                                <td className="p-3" key={type}>
                                                                    {category ? (
                                                                        <span className={category.complete ? 'text-emerald-700' : 'text-amber-700'}>
                                                                            {category.complete
                                                                                ? `${category.evaluations_recues} reçue(s)`
                                                                                : 'Manquante'}
                                                                            {category.note_sur_20 !== null ? ` · ${category.note_sur_20}/20` : ''}
                                                                        </span>
                                                                    ) : (
                                                                        '—'
                                                                    )}
                                                                </td>
                                                            );
                                                        })}
                                                        <td className="p-3">
                                                            {person.note_generale_sur_20 === null || person.note_generale_sur_20 === undefined
                                                                ? 'Non disponible'
                                                                : `${person.note_generale_sur_20}/20`}
                                                        </td>
                                                        <td className="p-3">
                                                            {person.fiche ? (
                                                                <div className="space-y-1 text-xs">
                                                                    <div className="text-emerald-700">
                                                                        Publiée · notification {person.fiche.notification_statut}
                                                                    </div>
                                                                    <div
                                                                        className={
                                                                            person.fiche.email_statut === 'envoye'
                                                                                ? 'text-emerald-700'
                                                                                : 'text-amber-700'
                                                                        }
                                                                    >
                                                                        E-mail {person.fiche.email_statut}
                                                                    </div>
                                                                    {person.fiche.email_erreur ? (
                                                                        <div className="max-w-56 text-red-700">{person.fiche.email_erreur}</div>
                                                                    ) : null}
                                                                    {person.fiche.notification_erreur ? (
                                                                        <div className="max-w-56 text-red-700">
                                                                            {person.fiche.notification_erreur}
                                                                        </div>
                                                                    ) : null}
                                                                </div>
                                                            ) : (
                                                                <span className="text-sabc-gray-500">Non publiée</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                                {!roleOverview.collaborateurs.length ? (
                                                    <tr>
                                                        <td
                                                            colSpan={4 + (roleOverview.configuration?.categories.length ?? 0)}
                                                            className="text-sabc-gray-500 p-6 text-center"
                                                        >
                                                            Aucune cible active pour ce poste.
                                                        </td>
                                                    </tr>
                                                ) : null}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </>
                        ) : null}
                    </>
                ) : null}
            </section>
        </AdminEvaluationsLayout>
    );
}
