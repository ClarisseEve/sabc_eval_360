import { Head, Link, router } from '@/lib/inertia-shim';
import AppLayout from '@/Components/Layout/app/AppLayout';
import { Button } from '@/Components/UI/Button/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/UI/Card/Card';
import { Badge } from '@/Components/UI/Badge/Badge';
import { Plus, Edit, Power } from 'lucide-react';

interface Regle {
    id_regle: number;
    nom_regle: string;
    description: string;
    role_evaluateur: string;
    role_evalue: string;
    type_evaluation: string;
    nb_criteres: number;
    categories: string[];
    est_active: boolean;
    meme_region_obligatoire: boolean;
    meme_branche_obligatoire: boolean;
    created_at: string;
}

interface Props {
    regles: Regle[];
    pageTitle: string;
    user: any;
}

export default function Index({ regles, pageTitle, user }: Props) {
    const handleToggleActif = (id: number) => {
        router.patch(`/admin/evaluations/regles/${id}/toggle`, {}, {
            preserveScroll: true,
        });
    };

    const getTypeEvaluationBadge = (type: string) => {
        const colors = {
            auto: 'bg-blue-100 text-blue-800',
            pairs: 'bg-purple-100 text-purple-800',
            descendante: 'bg-green-100 text-green-800',
        };
        return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
    };

    return (
        <AppLayout user={user} pageTitle={pageTitle}>
            <Head title="Règles d'Évaluation" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-sabc-gray-900">
                            Règles d'Évaluation
                        </h1>
                        <p className="text-sm text-sabc-gray-400 mt-1">
                            Gérez les règles métier pour les évaluations 360°
                        </p>
                    </div>
                    <Link href="/admin/evaluations/regles/create">
                        <Button className="bg-sabc-red-primary hover:bg-sabc-red-dark text-white">
                            <Plus size={16} className="mr-2" />
                            Nouvelle Règle
                        </Button>
                    </Link>
                </div>

                {/* Statistiques */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="p-4">
                            <div className="text-sm text-sabc-gray-400">Total Règles</div>
                            <div className="text-2xl font-bold text-sabc-gray-900">{regles.length}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="text-sm text-sabc-gray-400">Règles Actives</div>
                            <div className="text-2xl font-bold text-sabc-success">
                                {regles.filter(r => r.est_active).length}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="text-sm text-sabc-gray-400">Auto-évaluations</div>
                            <div className="text-2xl font-bold text-blue-600">
                                {regles.filter(r => r.type_evaluation === 'auto').length}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="text-sm text-sabc-gray-400">Éval. Pairs</div>
                            <div className="text-2xl font-bold text-purple-600">
                                {regles.filter(r => r.type_evaluation === 'pairs').length}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Liste des règles */}
                <Card>
                    <CardHeader>
                        <CardTitle>Liste des Règles</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {regles.length === 0 ? (
                            <div className="text-center py-12">
                                <p className="text-sabc-gray-400">Aucune règle d'évaluation définie</p>
                                <Link href="/admin/evaluations/regles/create">
                                    <Button className="mt-4 bg-sabc-accent hover:bg-sabc-accent-light text-white">
                                        Créer la première règle
                                    </Button>
                                </Link>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-sabc-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-sabc-gray-800 uppercase">
                                                Nom
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-sabc-gray-800 uppercase">
                                                Évaluateur → Évalué
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-sabc-gray-800 uppercase">
                                                Type
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-sabc-gray-800 uppercase">
                                                Critères
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-sabc-gray-800 uppercase">
                                                Contraintes
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-sabc-gray-800 uppercase">
                                                Statut
                                            </th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-sabc-gray-800 uppercase">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-sabc-gray-200">
                                        {regles.map((regle) => (
                                            <tr key={regle.id_regle} className="hover:bg-sabc-gray-50">
                                                <td className="px-4 py-4">
                                                    <div className="font-medium text-sabc-gray-900">
                                                        {regle.nom_regle}
                                                    </div>
                                                    {regle.description && (
                                                        <div className="text-sm text-sabc-gray-400 mt-1">
                                                            {regle.description.substring(0, 60)}
                                                            {regle.description.length > 60 && '...'}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center space-x-2">
                                                        <Badge variant="outline">
                                                            {regle.role_evaluateur}
                                                        </Badge>
                                                        <span>→</span>
                                                        <Badge variant="outline">
                                                            {regle.role_evalue}
                                                        </Badge>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <Badge className={getTypeEvaluationBadge(regle.type_evaluation)}>
                                                        {regle.type_evaluation}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="text-sm">
                                                        <div className="font-medium text-sabc-gray-900">
                                                            {regle.nb_criteres} critères
                                                        </div>
                                                        <div className="text-sabc-gray-400">
                                                            {regle.categories.slice(0, 2).join(', ')}
                                                            {regle.categories.length > 2 && '...'}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="flex flex-col space-y-1">
                                                        {regle.meme_region_obligatoire && (
                                                            <Badge variant="secondary" className="text-xs">
                                                                Même région
                                                            </Badge>
                                                        )}
                                                        {regle.meme_branche_obligatoire && (
                                                            <Badge variant="secondary" className="text-xs">
                                                                Même branche
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <Badge
                                                        className={
                                                            regle.est_active
                                                                ? 'bg-sabc-success text-white'
                                                                : 'bg-sabc-gray-400 text-white'
                                                        }
                                                    >
                                                        {regle.est_active ? 'Active' : 'Inactive'}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-4 text-right">
                                                    <div className="flex items-center justify-end space-x-2">
                                                        <Link href={`/admin/evaluations/regles/${regle.id_regle}/edit`}>
                                                            <Button variant="outline" size="sm">
                                                                <Edit size={14} />
                                                            </Button>
                                                        </Link>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleToggleActif(regle.id_regle)}
                                                            className={
                                                                regle.est_active
                                                                    ? 'text-sabc-error hover:bg-red-50'
                                                                    : 'text-sabc-success hover:bg-green-50'
                                                            }
                                                        >
                                                            <Power size={14} />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
