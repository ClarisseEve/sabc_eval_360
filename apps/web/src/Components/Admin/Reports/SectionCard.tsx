import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { BarChart3, GripVertical, PieChart, Plus, Trash2, TrendingUp, X } from 'lucide-react';

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
  contenu?: { texte?: string; graphes?: ReportChart[] };
  ordre: number;
}

interface ReportChart {
  id: string;
  type: string;
  titre: string;
  donnees_source: string;
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
  const charts = section.contenu?.graphes ?? [];
  const chartOptions = [
    { source: 'kpis', type: 'bar', titre: 'Indicateurs clés', icon: BarChart3 },
    { source: 'types_evaluation', type: 'pie', titre: 'Répartition des évaluations', icon: PieChart },
    { source: 'evolution_performance', type: 'line', titre: 'Évolution du score moyen', icon: TrendingUp },
    { source: 'matrice_competences', type: 'bar', titre: 'Matrice des compétences', icon: BarChart3 },
  ];
  const addChart = (option: typeof chartOptions[number]) => {
    const graphes = [...charts, { id: `${option.source}-${Date.now()}`, type: option.type, titre: option.titre, donnees_source: option.source }];
    onUpdate(section.id, { contenu: { ...(section.contenu ?? {}), graphes } });
  };
  const removeChart = (id: string) => {
    onUpdate(section.id, { contenu: { ...(section.contenu ?? {}), graphes: charts.filter((chart) => chart.id !== id) } });
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

      <div className="mt-4 border-t border-gray-100 pt-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Graphiques de la slide</span>
          <span className="text-xs text-gray-400">{charts.length} ajouté(s)</span>
        </div>
        {charts.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {charts.map((chart) => (
              <span key={chart.id} className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2 py-1 text-xs text-red-700">
                {chart.titre}
                <button type="button" onClick={() => removeChart(chart.id)} aria-label={`Retirer ${chart.titre}`} className="hover:text-red-900">
                  <X size={13} aria-hidden="true" />
                </button>
              </span>
            ))}
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          {chartOptions.filter((option) => !charts.some((chart) => chart.donnees_source === option.source)).map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.source}
                type="button"
                onClick={() => addChart(option)}
                className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-600 hover:border-sabc-red-primary hover:text-sabc-red-primary"
              >
                <Plus size={13} aria-hidden="true" />
                <Icon size={13} aria-hidden="true" />
                {option.titre}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
