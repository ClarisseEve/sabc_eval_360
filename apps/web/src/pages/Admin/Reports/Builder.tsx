import { SectionCard } from '@/Components/Admin/Reports/SectionCard';
import { Button } from '@/Components/UI/Button/Button';
import { EmptyState } from '@/Components/UI/EmptyState';
import { PageContainer } from '@/Components/UI/Page/PageContainer';
import { PageHeader } from '@/Components/UI/Page/PageHeader';
import { Skeleton } from '@/Components/UI/Skeleton';
import { useToast } from '@/Contexts/ToastContext';
import { useAddSection, useRemoveSection, useReorderSections, useReport, useUpdateSection } from '@/Hooks/queries/useReports';
import { reportsApi } from '@/Services/api';
import type { DragEndEvent } from '@dnd-kit/core';
import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { ArrowLeft, FileText, Plus } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AdminReportsLayout } from './shared';

const SECTION_TYPES = [
    { value: 'executive_summary', label: 'Executive Summary' },
    { value: 'kpis', label: 'KPIs Globaux' },
    { value: 'tendances', label: 'Tendances Performance' },
    { value: 'recommandations', label: 'Recommandations' },
    { value: 'texte_libre', label: 'Texte Libre' },
];

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
    const { success, error } = useToast();

    const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

    const sections = ((rapport as any)?.sections_json ?? []).sort((a: any, b: any) => a.ordre - b.ordre);

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
                `rapport-${id}.pptx`,
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
                `rapport-${id}.xlsx`,
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

    return (
        <AdminReportsLayout title={reportTitle}>
            <PageContainer width="narrow">
                <PageHeader
                    title={reportTitle}
                    description="Organisez les sections du rapport puis exportez-le dans le format souhaité."
                    breadcrumbs={[{ label: 'Administration' }, { label: 'Rapports', to: '/admin/reports' }, { label: reportTitle }]}
                    actions={
                        <div className="flex flex-wrap gap-2">
                            <Button
                                type="button"
                                variant="warning"
                                onClick={handleExportPPTX}
                                loading={exporting === 'pptx'}
                                disabled={exporting !== null}
                                aria-label="Exporter le rapport au format PowerPoint"
                            >
                                <FileText size={16} aria-hidden="true" />
                                PowerPoint
                            </Button>
                            <Button
                                type="button"
                                variant="success"
                                onClick={handleExportXLSX}
                                loading={exporting === 'xlsx'}
                                disabled={exporting !== null}
                                aria-label="Exporter le rapport au format Excel"
                            >
                                <FileText size={16} aria-hidden="true" />
                                Excel
                            </Button>
                        </div>
                    }
                />

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
            </PageContainer>
        </AdminReportsLayout>
    );
}
