import React, { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { useReport, useAddSection, useUpdateSection, useRemoveSection, useReorderSections } from '@/Hooks/queries/useReports';
import { SectionCard } from '@/Components/Admin/Reports/SectionCard';
import { reportsApi } from '@/Services/api';
import { useToast } from '@/Contexts/ToastContext';
import { EmptyState } from '@/Components/UI/EmptyState';
import { Skeleton } from '@/Components/UI/Skeleton';
import { ArrowLeft, Plus, FileText } from 'lucide-react';

const SECTION_TYPES = [
  { value: 'executive_summary', label: 'Executive Summary' },
  { value: 'kpis',              label: 'KPIs Globaux' },
  { value: 'tendances',         label: 'Tendances Performance' },
  { value: 'recommandations',   label: 'Recommandations' },
  { value: 'texte_libre',       label: 'Texte Libre' },
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

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

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
      <div className="max-w-3xl mx-auto p-6 space-y-4">
        <Skeleton height={40} className="w-1/3 rounded-lg" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} height={96} className="w-full rounded-lg" />
        ))}
      </div>
    );
  }
  if (!rapport) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <EmptyState
          variant="error"
          icon={FileText}
          title="Rapport introuvable"
          description="Ce rapport n'existe pas ou a été supprimé."
          action={
            <button
              onClick={() => navigate('/admin/reports')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-sabc-red-primary text-white rounded-lg hover:bg-sabc-red-dark"
            >
              <ArrowLeft size={18} />
              Retour aux rapports
            </button>
          }
        />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => navigate('/admin/reports')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
          <ArrowLeft size={18} />
          <span className="text-sm">Retour aux rapports</span>
        </button>
        <div className="flex gap-2">
          <button
            onClick={handleExportPPTX}
            disabled={exporting !== null}
            className="flex items-center gap-2 px-3 py-2 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <FileText size={16} />
            {exporting === 'pptx' ? 'Export en cours…' : 'PowerPoint'}
          </button>
          <button
            onClick={handleExportXLSX}
            disabled={exporting !== null}
            className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <FileText size={16} />
            {exporting === 'xlsx' ? 'Export en cours…' : 'Excel'}
          </button>
        </div>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">{(rapport as any).titre}</h1>

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
        <div className="bg-white border border-gray-200 rounded-lg p-4 mt-3">
          <p className="text-sm font-medium text-gray-700 mb-3">Choisir un type :</p>
          <div className="grid grid-cols-2 gap-2">
            {SECTION_TYPES.map((t) => (
              <button
                key={t.value}
                onClick={() => handleAddSection(t.value)}
                className="text-left px-3 py-2 border border-gray-200 rounded hover:bg-red-600 hover:text-white hover:border-red-600 text-sm transition-colors"
              >
                {t.label}
              </button>
            ))}
          </div>
          <button onClick={() => setShowTypeSelector(false)} className="mt-3 text-xs text-gray-500 hover:text-gray-700">
            Annuler
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowTypeSelector(true)}
          className="w-full mt-3 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-red-500 hover:text-red-500 flex items-center justify-center gap-2 transition-colors"
        >
          <Plus size={18} />
          Ajouter une section
        </button>
      )}
    </div>
  );
}
