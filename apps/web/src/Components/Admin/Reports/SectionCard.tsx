import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2 } from 'lucide-react';

const SECTION_LABELS: Record<string, string> = {
  executive_summary: 'Executive Summary',
  kpis: 'KPIs Globaux',
  tendances: 'Tendances Performance',
  recommandations: 'Recommandations',
  texte_libre: 'Texte Libre',
};

interface Section {
  id: string;
  type: string;
  titre: string;
  contenu?: { texte?: string };
  ordre: number;
}

interface Props {
  section: Section;
  onUpdate: (sectionId: string, updates: { titre?: string; contenu?: Record<string, unknown> }) => void;
  onDelete: (sectionId: string) => void;
}

export function SectionCard({ section, onUpdate, onDelete }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: section.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white border border-gray-200 rounded-lg p-4 mb-3 shadow-sm"
    >
      <div className="flex items-center justify-between mb-3">
        <div
          {...attributes}
          {...listeners}
          className="flex items-center gap-2 cursor-grab active:cursor-grabbing flex-1"
        >
          <GripVertical size={16} className="text-gray-400 flex-shrink-0" />
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            {SECTION_LABELS[section.type] ?? section.type}
          </span>
        </div>
        <button
          onClick={() => onDelete(section.id)}
          className="text-red-400 hover:text-red-600 transition-colors"
          title="Supprimer la section"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <input
        type="text"
        value={section.titre}
        onChange={(e) => onUpdate(section.id, { titre: e.target.value })}
        className="w-full border-b border-gray-200 pb-1 mb-3 font-medium text-gray-800 focus:outline-none focus:border-sabc-red-primary"
        placeholder="Titre de la section"
      />

      <textarea
        value={section.contenu?.texte ?? ''}
        onChange={(e) =>
          onUpdate(section.id, { contenu: { ...(section.contenu ?? {}), texte: e.target.value } })
        }
        className="w-full border border-gray-200 rounded p-2 text-sm text-gray-700 resize-none focus:outline-none focus:border-sabc-red-primary"
        rows={4}
        placeholder="Contenu de la section..."
      />
    </div>
  );
}
