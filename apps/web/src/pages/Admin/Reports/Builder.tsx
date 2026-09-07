import { SectionCard } from '@/Components/Admin/Reports/SectionCard';
import { Button } from '@/Components/UI/Button/Button';
import { EmptyState } from '@/Components/UI/EmptyState';
import { PageContainer } from '@/Components/UI/Page/PageContainer';
import { PageHeader } from '@/Components/UI/Page/PageHeader';
import { Skeleton } from '@/Components/UI/Skeleton';
import { Input } from '@/Components/UI/Input/Input';
import { useToast } from '@/Contexts/ToastContext';
import { useAddSection, useRemoveSection, useReorderSections, useReport, useUpdateSection } from '@/Hooks/queries/useReports';
import { reportsApi } from '@/Services/api';
import type { DragEndEvent } from '@dnd-kit/core';
import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { ArrowLeft, BarChart3, ChevronLeft, ChevronRight, Eye, FileText, PieChart, Plus, Table2, TrendingUp } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AdminReportsLayout } from './shared';

const SECTION_TYPES = [
    { value: 'executive_summary', label: 'Executive Summary' },
    { value: 'kpis', label: 'KPIs Globaux' },
    { value: 'tendances', label: 'Tendances Performance' },
    { value: 'recommandations', label: 'Recommandations' },
    { value: 'texte_libre', label: 'Texte Libre' },
];

const CHART_LABELS: Record<string, { label: string; icon: typeof BarChart3 }> = {
    kpis: { label: 'Indicateurs clés', icon: BarChart3 },
    types_evaluation: { label: 'Répartition des évaluations', icon: PieChart },
    evolution_performance: { label: 'Évolution du score moyen', icon: TrendingUp },
    matrice_competences: { label: 'Matrice des compétences', icon: BarChart3 },
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
    const updateSection = useUpdateSection(id!);
    const removeSection = useRemoveSection(id!);
    const reorderSections = useReorderSections(id!);
    const [showTypeSelector, setShowTypeSelector] = useState(false);
    const [exporting, setExporting] = useState<'pptx' | 'xlsx' | null>(null);
    const [previewFormat, setPreviewFormat] = useState<'pptx' | 'xlsx'>('pptx');
    const [fileBaseName, setFileBaseName] = useState('');
    const [previewSlide, setPreviewSlide] = useState(0);
    const { success, error } = useToast();

    const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

    const sections = ((rapport as any)?.sections_json ?? []).sort((a: any, b: any) => a.ordre - b.ordre);
    const previewSections = sections.length > 0 ? sections : [{ id: 'empty', titre: 'Aucune section', contenu: {}, type: 'texte_libre' }];
    const totalSlides = previewSections.length + 2;

    useEffect(() => {
        setPreviewSlide((current) => Math.min(current, totalSlides - 1));
    }, [totalSlides]);

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

    const handleExportXLSX = async () => {
        setExporting('xlsx');
        try {
            const res = await reportsApi.exportXLSX(id!);
            downloadBlob(
                new Blob([(res as any).data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
                `${fileNameBase(fileBaseName || reportTitle)}.xlsx`,
            );
            success('Export Excel généré.');
        } catch (e: any) {
            error(e?.response?.data?.message || e?.message || "L'export Excel a échoué. Réessayez.");
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

                <div className="grid items-start gap-8 xl:grid-cols-[minmax(440px,0.9fr)_minmax(0,1fr)]">
                    <section className="space-y-4 xl:sticky xl:top-24" aria-labelledby="report-preview-title">
                    <div className="flex flex-wrap items-end justify-between gap-3">
                        <div>
                            <div className="flex items-center gap-2">
                                <Eye size={18} className="text-sabc-red-primary" aria-hidden="true" />
                                <h2 id="report-preview-title" className="text-lg font-semibold text-sabc-gray-900">Prévisualisation</h2>
                            </div>
                            <p className="mt-1 text-sm text-sabc-gray-600">Vérifiez la mise en page avant de télécharger le document.</p>
                        </div>
                        <div className="flex rounded-lg border border-sabc-gray-200 bg-white p-1" role="tablist" aria-label="Format de prévisualisation">
                            <button type="button" role="tab" aria-selected={previewFormat === 'pptx'} onClick={() => setPreviewFormat('pptx')} className={`rounded-md px-3 py-1.5 text-sm ${previewFormat === 'pptx' ? 'bg-sabc-red-primary text-white' : 'text-sabc-gray-600'}`}>PowerPoint</button>
                            <button type="button" role="tab" aria-selected={previewFormat === 'xlsx'} onClick={() => setPreviewFormat('xlsx')} className={`rounded-md px-3 py-1.5 text-sm ${previewFormat === 'xlsx' ? 'bg-sabc-red-primary text-white' : 'text-sabc-gray-600'}`}>Excel</button>
                        </div>
                    </div>

                    <div className="rounded-xl border border-sabc-gray-200 bg-sabc-gray-100 p-4 dark:border-sabc-gray-700 dark:bg-sabc-gray-900">
                        <div className="mb-3 flex items-center justify-between text-xs text-sabc-gray-500">
                            <span>{previewFormat === 'pptx' ? 'Aperçu des diapositives PowerPoint' : 'Aperçu des feuilles Excel'}</span>
                            <span>Slide {previewSlide + 1} / {totalSlides}</span>
                        </div>
                        <div className="rounded-lg border border-sabc-gray-200 bg-white p-5 shadow-sm dark:border-sabc-gray-700 dark:bg-sabc-gray-950">
                            {previewSlide === 0 ? (
                                <>
                                    <div className="mb-8 h-2 rounded bg-sabc-red-primary" />
                                    <div className="flex min-h-[430px] flex-col items-center justify-center text-center">
                                        <div className="text-2xl font-bold text-sabc-gray-900 dark:text-white">{reportTitle}</div>
                                        <div className="mt-3 text-sm text-sabc-gray-500">SABC — Évaluation 360°</div>
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

                    <div className="flex flex-col gap-3 rounded-lg border border-sabc-gray-200 bg-white p-4 dark:border-sabc-gray-700 dark:bg-sabc-gray-950">
                        <div className="flex-1">
                            <label htmlFor="report-file-name" className="mb-1 block text-sm font-medium text-sabc-gray-700 dark:text-sabc-gray-200">Nom du fichier</label>
                            <Input id="report-file-name" value={fileBaseName || fileNameBase(reportTitle)} onChange={(event) => setFileBaseName(event.target.value)} placeholder={fileNameBase(reportTitle)} aria-describedby="report-file-name-help" />
                            <p id="report-file-name-help" className="mt-1 text-xs text-sabc-gray-500">Le nom sera utilisé pour les téléchargements .pptx et .xlsx.</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Button type="button" variant="warning" onClick={handleExportPPTX} loading={exporting === 'pptx'} disabled={exporting !== null}><FileText size={16} aria-hidden="true" />Télécharger PowerPoint</Button>
                            <Button type="button" variant="success" onClick={handleExportXLSX} loading={exporting === 'xlsx'} disabled={exporting !== null}><FileText size={16} aria-hidden="true" />Télécharger Excel</Button>
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
                        <p className="text-sabc-gray-700 mb-3 text-sm font-medium">Choisir un type de section :</p>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            {SECTION_TYPES.map((type) => (
                                <Button
                                    key={type.value}
                                    type="button"
                                    variant="outline"
                                    className="justify-start"
                                    disabled={addSection.isPending}
                                    onClick={() => handleAddSection(type.value)}
                                >
                                    {type.label}
                                </Button>
                            ))}
                        </div>
                        <Button type="button" variant="ghost" className="mt-3" onClick={() => setShowTypeSelector(false)}>
                            Annuler
                        </Button>
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