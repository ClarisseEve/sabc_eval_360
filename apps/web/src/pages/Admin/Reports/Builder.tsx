import { SectionCard } from '@/Components/Admin/Reports/SectionCard';
import { Button } from '@/Components/UI/Button/Button';
import { EmptyState } from '@/Components/UI/EmptyState';
import { PageContainer } from '@/Components/UI/Page/PageContainer';
import { PageHeader } from '@/Components/UI/Page/PageHeader';
import { Skeleton } from '@/Components/UI/Skeleton';
import { Input } from '@/Components/UI/Input/Input';
import { useToast } from '@/Contexts/ToastContext';
import { useAddSection, useRemoveSection, useReorderSections, useReport, useUpdateReport, useUpdateSection } from '@/Hooks/queries/useReports';
import { reportsApi } from '@/Services/api';
import type { DragEndEvent } from '@dnd-kit/core';
import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { ArrowLeft, BarChart3, ChevronLeft, ChevronRight, Eye, FileText, PieChart, Plus, Radar, Table2, TrendingUp } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AdminReportsLayout } from './shared';

const SECTION_TYPES = [
    { value: 'executive_summary', label: 'Synthèse exécutive', description: 'Vue d’ensemble, priorités et signal faibles.' },
    { value: 'kpis', label: 'KPIs globaux', description: 'Score moyen, couverture, validité et volume des évaluations.' },
    { value: 'texte_libre', label: 'Texte libre', description: 'Commentaire spécifique pour la slide de synthèse.' },
    { value: 'recommandations', label: 'Recommandations & actions', description: 'Actions prioritaires et plans de développement identifiés.' },
];

const CHART_LABELS: Record<string, { label: string; icon: typeof BarChart3 }> = {
    kpis: { label: 'Indicateurs clés', icon: BarChart3 },
    types_evaluation: { label: 'Répartition des évaluations', icon: PieChart },
    evolution_performance: { label: 'Évolution du score moyen', icon: TrendingUp },
    matrice_competences: { label: 'Matrice des compétences', icon: BarChart3 },
    competences_faibles_metier: { label: 'Compétences faibles par métier', icon: BarChart3 },
    competences_faibles_region: { label: 'Compétences faibles par région', icon: BarChart3 },
    competences_faibles_district: { label: 'Compétences faibles par district', icon: BarChart3 },
    classement_competences_metier: { label: 'Classement compétences / métier', icon: TrendingUp },
    top_performers: { label: 'Top 10 meilleurs performers', icon: BarChart3 },
    alertes_faiblesses: { label: 'Alerte compétences faiblement acquises', icon: PieChart },
    radar: { label: 'Radar des compétences par métier', icon: Radar },
};

function fileNameBase(value: string) {
    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .toLowerCase()
        .slice(0, 80) || 'synthese-evaluation';
}

export default function Builder() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { data: rapport, isLoading } = useReport(id!);
    const addSection = useAddSection(id!);
    const updateReport = useUpdateReport(id!);
    const updateSection = useUpdateSection(id!);
    const removeSection = useRemoveSection(id!);
    const reorderSections = useReorderSections(id!);
    const [showTypeSelector, setShowTypeSelector] = useState(false);
    const [newSectionType, setNewSectionType] = useState<string>('executive_summary');
    const [exporting, setExporting] = useState<'pptx' | 'docx' | null>(null);
    const [previewFormat, setPreviewFormat] = useState<'pptx' | 'docx'>('pptx');
    const [fileBaseName, setFileBaseName] = useState('');
    const [subtitleDraft, setSubtitleDraft] = useState('');
    const [previewSlide, setPreviewSlide] = useState(0);
    const { success, error } = useToast();

    const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

    const sections = ((rapport as any)?.sections_json ?? []).sort((a: any, b: any) => a.ordre - b.ordre);
    const previewSections = sections.length > 0 ? sections : [{ id: 'empty', titre: 'Aucune section', contenu: {}, type: 'texte_libre' }];
    const totalSlides = previewSections.length + 2;

    useEffect(() => {
        setPreviewSlide((current) => Math.min(current, totalSlides - 1));
    }, [totalSlides]);

    useEffect(() => {
        setSubtitleDraft((rapport as any)?.sous_titre ?? '');
    }, [(rapport as any)?.sous_titre]);

    const handleDragEnd = useCallback(
        (event: DragEndEvent) => {
            const { active, over } = event;
            if (!over || active.id === over.id) return;
            const oldIndex = sections.findIndex((s: any) => s.id === active.id);
            const newIndex = sections.findIndex((s: any) => s.id === over.id);
            const newOrder = arrayMove(sections, oldIndex, newIndex);
            reorderSections.mutate(newOrder.map((s: any) => s.id));
        },
        [sections, reorderSections],
    );

    const handleAddSection = (type: string) => {
        const label = SECTION_TYPES.find((t) => t.value === type)?.label ?? type;
        addSection.mutate({ type, titre: label });
        setShowTypeSelector(false);
        setNewSectionType(type);
    };

    const downloadBlob = (blob: Blob, filename: string) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleExportPPTX = async () => {
        setExporting('pptx');
        try {
            const res = await reportsApi.exportPPTX(id!);
            downloadBlob(
                new Blob([(res as any).data], { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' }),
                `${fileNameBase(fileBaseName || reportTitle)}.pptx`,
            );
            success('Export PowerPoint généré.');
        } catch (e: any) {
            error(e?.response?.data?.message || e?.message || "L'export PowerPoint a échoué. Réessayez.");
        } finally {
            setExporting(null);
        }
    };

    const handleExportDOCX = async () => {
        setExporting('docx');
        try {
            const res = await reportsApi.exportDOCX(id!);
            downloadBlob(
                new Blob([(res as any).data], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }),
                `${fileNameBase(fileBaseName || reportTitle)}.docx`,
            );
            success('Export Word généré.');
        } catch (e: any) {
            error(e?.response?.data?.message || e?.message || "L'export Word a échoué. Réessayez.");
        } finally {
            setExporting(null);
        }
    };

    if (isLoading) {
        return (
            <AdminReportsLayout title="Chargement du rapport">
                <PageContainer width="narrow">
                    <Skeleton height={40} className="w-1/3 rounded-lg" />
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} height={96} className="w-full rounded-lg" />
                    ))}
                </PageContainer>
            </AdminReportsLayout>
        );
    }
    if (!rapport) {
        return (
            <AdminReportsLayout title="Rapport introuvable">
                <PageContainer width="narrow">
                    <EmptyState
                        variant="error"
                        icon={FileText}
                        title="Rapport introuvable"
                        description="Ce rapport n'existe pas ou a été supprimé."
                        action={
                            <Button onClick={() => navigate('/admin/reports')}>
                                <ArrowLeft size={18} aria-hidden="true" />
                                Retour aux rapports
                            </Button>
                        }
                    />
                </PageContainer>
            </AdminReportsLayout>
        );
    }

    const reportTitle = (rapport as any).titre || 'Rapport sans titre';
    const reportSubtitle = subtitleDraft;
    const activeSection = previewSlide > 0 && previewSlide <= previewSections.length
        ? previewSections[previewSlide - 1]
        : null;

    return (
        <AdminReportsLayout title={reportTitle}>
            <PageContainer width="narrow">
                <PageHeader
                    title={reportTitle}
                    description="Organisez les sections du rapport puis exportez-le dans le format souhaité."
                    breadcrumbs={[{ label: 'Administration' }, { label: 'Rapports', to: '/admin/reports' }, { label: reportTitle }]}
                />

                <div className="grid items-start gap-8 xl:grid-cols-[minmax(440px_0.9fr)_minmax(0_1fr)]">
                    <section className="space-y-4 xl:sticky xl:top-24" aria-labelledby="report-preview-title">
                    <div className="flex flex-wrap items-end justify-between gap-3">
                        <div>
                            <div className="flex items-center gap-2">
                                <Eye size={18} className="text-sabc-red-primary" aria-hidden="true" />
                                <h2 id="report-preview-title" className="text-lg font-semibold text-sabc-gray-900">Prévisualisation</h2>
                            </div>
                            <p className="mt-1 text-sm text-sabc-gray-600">Vérifiez les sous-titres, axes annotés et graphiques de chaque analyse avant export.</p>
                        </div>
                        <div className="flex rounded-lg border border-sabc-gray-200 bg-white p-1" role="tablist" aria-label="Format de prévisualisation">
                            <button type="button" role="tab" aria-selected={previewFormat === 'pptx'} onClick={() => setPreviewFormat('pptx')} className={`rounded-md px-3 py-1.5 text-sm ${previewFormat === 'pptx' ? 'bg-sabc-red-primary text-white' : 'text-sabc-gray-600'}`}>PowerPoint</button>
                            <button type="button" role="tab" aria-selected={previewFormat === 'docx'} onClick={() => setPreviewFormat('docx')} className={`rounded-md px-3 py-1.5 text-sm ${previewFormat === 'docx' ? 'bg-sabc-red-primary text-white' : 'text-sabc-gray-600'}`}>Word</button>
                        </div>
                    </div>

                    <div className="rounded-lg border border-sabc-gray-200 bg-sabc-gray-100 p-4 dark:border-sabc-gray-700 dark:bg-sabc-gray-900">
                        <div className="mb-3 flex items-center justify-between text-xs text-sabc-gray-500">
                            <span>{previewFormat === 'pptx' ? 'Aperçu des diapositives PowerPoint' : 'Aperçu du document Word'}</span>
                            <span>Slide {previewSlide + 1} / {totalSlides}</span>
                        </div>
                        <div className="rounded-lg border border-sabc-gray-200 bg-white p-5 shadow-sm dark:border-sabc-gray-700 dark:bg-white">
                            {previewSlide === 0 ? (
                                <>
                                    <div className="mb-8 h-2 rounded bg-sabc-red-primary" />
                                    <div className="flex min-h-[430px] flex-col items-center justify-center text-center">
                                        <img src="/images/logos/sabc-logo.png" alt="Logo SABC" className="mb-5 h-20 w-auto object-contain" />
                                        <div className="text-2xl font-bold text-sabc-gray-900 dark:text-white">{reportTitle}</div>
                                        <div className="mt-3 text-sm text-sabc-gray-500">{reportSubtitle || 'Sous-titre à renseigner'}</div>
                                        <div className="mt-16 text-[10px] uppercase tracking-wide text-sabc-gray-400">Page de couverture</div>
                                    </div>
                                </>
                            ) : previewSlide <= previewSections.length ? (
                                <div className="min-h-[430px]">
                                    <div className="mb-3 flex items-center justify-between border-b border-sabc-red-primary pb-2">
                                        <span className="text-base font-semibold text-sabc-gray-900 dark:text-white">{activeSection.titre}</span>
                                        <span className="text-[10px] text-sabc-gray-400">Slide {previewSlide + 1}</span>
                                    </div>
                                    {activeSection.contenu?.texte ? <p className="mb-5 text-sm text-sabc-gray-600">{activeSection.contenu.texte}</p> : null}
                                    <div className="grid gap-2 sm:grid-cols-2">
                                        {(activeSection.contenu?.graphes ?? []).map((chart: any) => {
                                            const chartMeta = CHART_LABELS[chart.donnees_source] ?? { label: chart.titre, icon: BarChart3 };
                                            const Icon = chartMeta.icon;
                                            return <div key={chart.id} className="flex h-44 flex-col justify-between rounded border border-sabc-gray-200 bg-sabc-gray-50 p-3 dark:border-sabc-gray-700 dark:bg-sabc-gray-900"><div className="flex items-center gap-1 text-xs font-medium text-sabc-gray-700 dark:text-sabc-gray-200"><Icon size={15} aria-hidden="true" />{chartMeta.label}</div><div className="flex h-24 items-end gap-2">{[35, 55, 43, 72, 62].map((height, barIndex) => <span key={barIndex} className="flex-1 rounded-t bg-sabc-red-primary/70" style={{ height: `${height}%` }} />)}</div><div className="text-center text-[10px] text-sabc-gray-500">Valeurs annotées dans le fichier final</div></div>;
                                        })}
                                    </div>
                                    {!(activeSection.contenu?.graphes ?? []).length && <div className="flex h-56 items-center justify-center text-sm text-sabc-gray-400"><Table2 size={18} className="mr-1" aria-hidden="true" />Contenu de la section</div>}
                                </div>
                            ) : (
                                <div className="min-h-[430px]">
                                <div className="mb-5 border-b border-sabc-red-primary pb-2 text-base font-semibold text-sabc-gray-900 dark:text-white">Bilan général et formations à programmer</div>
                                <div className="space-y-2 text-xs text-sabc-gray-600 dark:text-sabc-gray-300">
                                    <div className="grid grid-cols-[1.4fr_.6fr_.6fr_2fr] gap-1 rounded bg-sabc-red-primary px-2 py-1 font-semibold text-white"><span>Compétence</span><span>Moyenne</span><span>Priorité</span><span>Formation</span></div>
                                    {['Axe prioritaire', 'Compétence à renforcer', 'Développement commercial'].map((label) => <div key={label} className="grid grid-cols-[1.4fr_.6fr_.6fr_2fr] gap-1 border-b border-sabc-gray-100 px-2 py-2"><span>{label}</span><span>3,20/5</span><span>Moyenne</span><span>Accompagnement pratique</span></div>)}
                                </div>
                            </div>
                            )}
                        </div>
                        <div className="flex items-center justify-between">
                            <Button type="button" variant="outline" size="sm" onClick={() => setPreviewSlide((current) => Math.max(0, current - 1))} disabled={previewSlide === 0} aria-label="Slide précédente"><ChevronLeft size={16} aria-hidden="true" />Précédente</Button>
                            <div className="flex gap-1" aria-label="Navigation des slides">
                                {Array.from({ length: totalSlides }, (_, index) => <button key={index} type="button" onClick={() => setPreviewSlide(index)} aria-label={`Afficher la slide ${index + 1}`} aria-current={previewSlide === index ? 'step' : undefined} className={`h-2.5 w-2.5 rounded-full ${previewSlide === index ? 'bg-sabc-red-primary' : 'bg-sabc-gray-300'}`} />)}
                            </div>
                            <Button type="button" variant="outline" size="sm" onClick={() => setPreviewSlide((current) => Math.min(totalSlides - 1, current + 1))} disabled={previewSlide === totalSlides - 1} aria-label="Slide suivante">Suivante<ChevronRight size={16} aria-hidden="true" /></Button>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 rounded-lg border border-sabc-gray-200 bg-white p-4 dark:border-sabc-gray-700 dark:bg-white">
                        <div className="flex-1">
                            <label htmlFor="report-file-name" className="mb-1 block text-sm font-medium text-sabc-gray-700 dark:text-sabc-gray-200">Nom du fichier</label>
                            <Input id="report-file-name" value={fileBaseName || fileNameBase(reportTitle)} onChange={(event) => setFileBaseName(event.target.value)} placeholder={fileNameBase(reportTitle)} aria-describedby="report-file-name-help" />
                            <label htmlFor="report-subtitle" className="mb-1 mt-3 block text-sm font-medium text-sabc-gray-700 dark:text-sabc-gray-200">Sous-titre de la couverture</label>
                            <Input id="report-subtitle" value={subtitleDraft} onChange={(event) => setSubtitleDraft(event.target.value)} onBlur={() => updateReport.mutate({ sous_titre: subtitleDraft.trim() })} placeholder="Saisissez le sous-titre de votre présentation" aria-describedby="report-subtitle-help" />
                            <p id="report-subtitle-help" className="mt-1 text-xs text-sabc-gray-500">Ce texte apparaîtra sur la première page du PowerPoint.</p>
                            <p id="report-file-name-help" className="mt-1 text-xs text-sabc-gray-500">Le nom sera utilisé pour les téléchargements .pptx et .docx.</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Button type="button" variant="warning" onClick={handleExportPPTX} loading={exporting === 'pptx'} disabled={exporting !== null}><FileText size={16} aria-hidden="true" />Télécharger PowerPoint</Button>
                            <Button type="button" variant="success" onClick={handleExportDOCX} loading={exporting === 'docx'} disabled={exporting !== null}><FileText size={16} aria-hidden="true" />Télécharger Word</Button>
                        </div>
                    </div>
                </section>

                <div>
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <SortableContext items={sections.map((s: any) => s.id)} strategy={verticalListSortingStrategy}>
                            {sections.map((section: any) => (
                                <SectionCard
                                    key={section.id}
                                    section={section}
                                    onUpdate={(sectionId, updates) => updateSection.mutate({ sectionId, updates })}
                                    onDelete={(sectionId) => removeSection.mutate(sectionId)}
                                />
                            ))}
                        </SortableContext>
                    </DndContext>

                    {showTypeSelector ? (
                    <div className="border-sabc-gray-200 rounded-lg border bg-white p-4">
                        <p className="text-sabc-gray-700 mb-3 text-sm font-medium">Choisir la grande section du rapport :</p>
                        <label htmlFor="report-section-type" className="mb-1 block text-xs font-medium uppercase tracking-wide text-sabc-gray-500">Section</label>
                        <select
                            id="report-section-type"
                            value={newSectionType}
                            onChange={(event) => setNewSectionType(event.target.value)}
                            className="w-full rounded-lg border border-sabc-gray-200 bg-sabc-gray-50 px-3 py-2 text-sm text-sabc-gray-800 outline-none focus:border-sabc-red-primary"
                        >
                            {SECTION_TYPES.map((type) => (
                                <option key={type.value} value={type.value}>{type.label}</option>
                            ))}
                        </select>
                        <p className="mt-2 text-xs text-sabc-gray-600">
                            {SECTION_TYPES.find((type) => type.value === newSectionType)?.description}
                        </p>
                        <div className="mt-4 flex gap-2">
                            <Button type="button" onClick={() => handleAddSection(newSectionType)} disabled={addSection.isPending}>
                                Ajouter la section
                            </Button>
                            <Button type="button" variant="ghost" onClick={() => setShowTypeSelector(false)}>
                                Annuler
                            </Button>
                        </div>
                    </div>
                    ) : (
                    <Button
                        type="button"
                        variant="outline"
                        className="text-sabc-gray-600 w-full border-2 border-dashed py-3"
                        onClick={() => setShowTypeSelector(true)}
                    >
                        <Plus size={18} aria-hidden="true" />
                        Ajouter une section
                    </Button>
                    )}
                </div>
                </div>
            </PageContainer>
        </AdminReportsLayout>
    );
}