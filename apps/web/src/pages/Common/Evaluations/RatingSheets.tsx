import { Button } from '@/Components/UI/Button/Button';
import { useToast } from '@/Contexts/ToastContext';
import { ratingSheetsApi } from '@/Services/api';
import { useQuery } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import { EvaluationPageLayout } from './shared';

const CATEGORY_LABELS: Record<string, string> = {
    auto: 'Auto-évaluation',
    pairs: 'Évaluation par les pairs',
    descendante: 'Évaluation descendante',
    admin: 'Évaluation de l’admin',
};

function formatDate(value?: string | null) {
    if (!value) return '—';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('fr-FR');
}

export default function MyRatingSheetsPage() {
    const toast = useToast();
    const sheetsQuery = useQuery({
        queryKey: ['my-rating-sheets'],
        queryFn: async () => (await ratingSheetsApi.mine()).data,
    });

    const download = async (idFiche: string, filename: string) => {
        try {
            const { data } = await ratingSheetsApi.pdf(idFiche);
            const url = URL.createObjectURL(data);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            link.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Téléchargement de la fiche impossible.');
        }
    };

    return (
        <EvaluationPageLayout pageTitle="Mes fiches de notation">
            <main className="space-y-5 p-6">
                <div>
                    <h1 className="text-sabc-gray-900 text-2xl font-semibold">Mes fiches de notation</h1>
                    <p className="text-sabc-gray-600 mt-1 text-sm">
                        Retrouvez les synthèses publiées pour vos périodes d’évaluation et téléchargez votre PDF personnel.
                    </p>
                </div>
                {sheetsQuery.isLoading ? <p>Chargement de vos fiches…</p> : null}
                {sheetsQuery.isError ? (
                    <p className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
                        {sheetsQuery.error instanceof Error ? sheetsQuery.error.message : 'Chargement des fiches impossible.'}
                    </p>
                ) : null}
                {!sheetsQuery.isLoading && !sheetsQuery.isError && !sheetsQuery.data?.length ? (
                    <div className="border-sabc-gray-200 text-sabc-gray-600 rounded-xl border bg-white p-8 text-center text-sm">
                        Aucune fiche de notation n’a encore été publiée pour votre compte.
                    </div>
                ) : null}
                <div className="grid gap-4">
                    {(sheetsQuery.data ?? []).map((sheet: any) => {
                        const content = sheet.contenu_json;
                        const categories = Array.isArray(content?.categories) ? content.categories : [];
                        return (
                            <article key={sheet.id_fiche} className="border-sabc-gray-200 rounded-xl border bg-white p-5 shadow-sm">
                                <div className="flex flex-wrap items-start justify-between gap-4">
                                    <div>
                                        <h2 className="text-sabc-gray-900 text-lg font-semibold">
                                            {sheet.nom_periode || content?.periode?.nom || sheet.code_periode}
                                        </h2>
                                        <p className="text-sabc-gray-600 mt-1 text-sm">
                                            {sheet.role_evalue} · publiée le {formatDate(sheet.publie_le)}
                                        </p>
                                    </div>
                                    <Button
                                        variant="outline"
                                        onClick={() => download(sheet.id_fiche, `fiche-notation-${sheet.code_periode || 'periode'}.pdf`)}
                                    >
                                        <Download className="mr-2 h-4 w-4" />
                                        Télécharger le PDF
                                    </Button>
                                </div>
                                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                    {categories.map((category: any) => (
                                        <div key={category.type} className="bg-sabc-gray-50 rounded-lg p-3">
                                            <div className="text-sabc-gray-500 text-xs uppercase">
                                                {CATEGORY_LABELS[category.type] ?? category.type}
                                            </div>
                                            <div className="text-sabc-gray-900 mt-1 font-semibold">
                                                {category.note_sur_20 === null ? 'Non disponible' : `${category.note_sur_20}/20`}
                                            </div>
                                            <div className="text-sabc-gray-600 text-xs">
                                                {category.complete ? `${category.evaluations_recues} évaluation(s) reçue(s)` : 'Évaluation manquante'}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="border-sabc-gray-200 mt-4 rounded-lg border p-4">
                                    <div className="text-sabc-gray-600 text-sm">Note générale sur 20</div>
                                    <div className="text-sabc-red-primary mt-1 text-2xl font-bold">
                                        {content?.note_generale_sur_20 === null || content?.note_generale_sur_20 === undefined
                                            ? 'Non disponible'
                                            : `${content.note_generale_sur_20}/20`}
                                    </div>
                                    {content?.statut === 'partielle' ? (
                                        <p className="mt-2 text-sm text-amber-700">
                                            Fiche partielle : les catégories non reçues ne sont pas comptées comme zéro.
                                        </p>
                                    ) : null}
                                </div>
                                {content?.lacunes?.length ? (
                                    <div className="mt-4">
                                        <h3 className="text-sabc-gray-900 font-semibold">Compétences à renforcer</h3>
                                        <ul className="text-sabc-gray-700 mt-2 list-disc space-y-1 pl-5 text-sm">
                                            {content.lacunes.map((competence: any, index: number) => (
                                                <li key={`${competence.libelle}-${index}`}>
                                                    {competence.libelle} — {competence.mention}
                                                    {competence.axe ? ` : ${competence.axe}` : ''}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ) : null}
                                {content?.competences?.length ? (
                                    <div className="mt-4">
                                        <h3 className="text-sabc-gray-900 font-semibold">Compétences évaluées</h3>
                                        <div className="mt-2 space-y-2">
                                            {content.competences.map((competence: any, index: number) => (
                                                <div key={`${competence.id}-${index}`} className="border-sabc-gray-200 rounded-lg border p-3">
                                                    <div className="text-sabc-gray-900 font-medium">{competence.libelle}</div>
                                                    <div className="text-sabc-gray-600 mt-1 flex flex-wrap gap-2 text-xs">
                                                        {categories.map((category: any) => {
                                                            const note = competence.notes_par_categorie?.[category.type];
                                                            const mention = competence.mentions_par_categorie?.[category.type];
                                                            return note === null || note === undefined ? null : (
                                                                <span key={category.type} className="bg-sabc-gray-50 rounded px-2 py-1">
                                                                    {CATEGORY_LABELS[category.type] ?? category.type} : {note}/5 · {mention}
                                                                </span>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : null}
                            </article>
                        );
                    })}
                </div>
            </main>
        </EvaluationPageLayout>
    );
}
