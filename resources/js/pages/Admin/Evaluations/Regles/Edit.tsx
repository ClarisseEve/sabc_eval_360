import { Head, useForm, router } from '@inertiajs/react';
import AppLayout from '@/Components/Layout/app/AppLayout';
import { Button } from '@/Components/UI/Button/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/UI/Card/Card';
import { Input } from '@/Components/UI/Input/Input';
import { Label } from '@/Components/UI/Label/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/UI/Select';
import CriteresEditor from '@/Components/Evaluations/CriteresEditor';
import { ArrowLeft } from 'lucide-react';
import { FormEventHandler } from 'react';

interface Regle {
    id_regle: number;
    nom_regle: string;
    description: string;
    role_evaluateur: string;
    role_evalue: string;
    type_evaluation: string;
    criteres: any[];
    est_active: boolean;
    meme_region_obligatoire: boolean;
    meme_branche_obligatoire: boolean;
}

interface Props {
    regle: Regle;
    categories_disponibles: string[];
    roles_disponibles: string[];
    types_evaluation: string[];
    pageTitle: string;
    user: any;
}

export default function Edit({ regle, categories_disponibles, roles_disponibles, types_evaluation, pageTitle, user }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        nom_regle: regle.nom_regle,
        description: regle.description || '',
        role_evaluateur: regle.role_evaluateur,
        role_evalue: regle.role_evalue,
        type_evaluation: regle.type_evaluation,
        criteres: regle.criteres,
        meme_region_obligatoire: regle.meme_region_obligatoire,
        meme_branche_obligatoire: regle.meme_branche_obligatoire,
    });

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        put(`/admin/evaluations/regles/${regle.id_regle}`);
    };

    return (
        <AppLayout user={user} pageTitle={pageTitle}>
            <Head title="Modifier la Règle d'Évaluation" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <Button
                            variant="outline"
                            onClick={() => router.visit('/admin/evaluations/regles')}
                        >
                            <ArrowLeft size={16} className="mr-2" />
                            Retour
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold text-sabc-gray-900">
                                Modifier la Règle d'Évaluation
                            </h1>
                            <p className="text-sm text-sabc-gray-400 mt-1">
                                {regle.nom_regle}
                            </p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Informations générales */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Informations Générales</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label htmlFor="nom_regle">Nom de la règle *</Label>
                                <Input
                                    id="nom_regle"
                                    type="text"
                                    value={data.nom_regle}
                                    onChange={(e) => setData('nom_regle', e.target.value)}
                                    required
                                />
                                {errors.nom_regle && (
                                    <p className="text-sm text-sabc-error mt-1">{errors.nom_regle}</p>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="description">Description</Label>
                                <textarea
                                    id="description"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    className="w-full border border-sabc-gray-200 rounded-lg p-2 min-h-[100px]"
                                />
                                {errors.description && (
                                    <p className="text-sm text-sabc-error mt-1">{errors.description}</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Configuration des rôles */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Configuration des Rôles</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <Label htmlFor="role_evaluateur">Rôle Évaluateur *</Label>
                                    <Select
                                        value={data.role_evaluateur}
                                        onValueChange={(value) => setData('role_evaluateur', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {roles_disponibles.map((role) => (
                                                <SelectItem key={role} value={role}>
                                                    {role}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.role_evaluateur && (
                                        <p className="text-sm text-sabc-error mt-1">{errors.role_evaluateur}</p>
                                    )}
                                </div>

                                <div>
                                    <Label htmlFor="role_evalue">Rôle Évalué *</Label>
                                    <Select
                                        value={data.role_evalue}
                                        onValueChange={(value) => setData('role_evalue', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {roles_disponibles.map((role) => (
                                                <SelectItem key={role} value={role}>
                                                    {role}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.role_evalue && (
                                        <p className="text-sm text-sabc-error mt-1">{errors.role_evalue}</p>
                                    )}
                                </div>

                                <div>
                                    <Label htmlFor="type_evaluation">Type d'Évaluation *</Label>
                                    <Select
                                        value={data.type_evaluation}
                                        onValueChange={(value) => setData('type_evaluation', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {types_evaluation.map((type) => (
                                                <SelectItem key={type} value={type}>
                                                    {type}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.type_evaluation && (
                                        <p className="text-sm text-sabc-error mt-1">{errors.type_evaluation}</p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Contraintes géographiques */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Contraintes Géographiques et Organisationnelles</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="meme_region_obligatoire"
                                    checked={data.meme_region_obligatoire}
                                    onChange={(e) => setData('meme_region_obligatoire', e.target.checked)}
                                    className="rounded border-sabc-gray-200"
                                />
                                <Label htmlFor="meme_region_obligatoire" className="cursor-pointer">
                                    Même région obligatoire
                                </Label>
                            </div>

                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="meme_branche_obligatoire"
                                    checked={data.meme_branche_obligatoire}
                                    onChange={(e) => setData('meme_branche_obligatoire', e.target.checked)}
                                    className="rounded border-sabc-gray-200"
                                />
                                <Label htmlFor="meme_branche_obligatoire" className="cursor-pointer">
                                    Même branche obligatoire (sauf DR/CDTT)
                                </Label>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Critères d'évaluation */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Critères d'Évaluation</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <CriteresEditor
                                value={data.criteres}
                                onChange={(criteres) => setData('criteres', criteres)}
                                categories={categories_disponibles}
                                errors={errors.criteres}
                            />
                        </CardContent>
                    </Card>

                    {/* Actions */}
                    <div className="flex items-center justify-end space-x-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.visit('/admin/evaluations/regles')}
                        >
                            Annuler
                        </Button>
                        <Button
                            type="submit"
                            disabled={processing}
                            className="bg-sabc-red-primary hover:bg-sabc-red-dark text-white"
                        >
                            {processing ? 'Mise à jour...' : 'Mettre à Jour'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
