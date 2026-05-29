import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReportsList, useCreateReport } from '@/Hooks/queries/useReports';
import { FileText, Plus, Edit2, Trash2 } from 'lucide-react';
import { reportsApi } from '@/Services/api';
import { useQueryClient } from '@tanstack/react-query';

export default function ReportsIndex() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data, isLoading } = useReportsList();
  const createReport = useCreateReport();
  const [newTitre, setNewTitre] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const rapports = (data as any)?.data ?? [];

  const handleCreate = async () => {
    if (!newTitre.trim()) return;
    const res = await createReport.mutateAsync(newTitre.trim());
    navigate(`/admin/reports/${(res as any).data.id_rapport}/edit`);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce rapport ?')) return;
    await reportsApi.delete(id);
    qc.invalidateQueries({ queryKey: ['reports'] });
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Rapports</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          <Plus size={18} />
          Nouveau rapport
        </button>
      </div>

      {showCreate && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6 flex gap-3">
          <input
            type="text"
            value={newTitre}
            onChange={(e) => setNewTitre(e.target.value)}
            placeholder="Titre du rapport..."
            className="flex-1 border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-red-500"
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            autoFocus
          />
          <button onClick={handleCreate} className="px-4 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700">
            Créer
          </button>
          <button onClick={() => setShowCreate(false)} className="px-3 py-2 border border-gray-200 rounded text-sm hover:bg-gray-50">
            Annuler
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-10 text-gray-500">Chargement…</div>
      ) : rapports.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          <FileText size={48} className="mx-auto mb-3 opacity-30" />
          <p>Aucun rapport. Créez votre premier rapport.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rapports.map((r: any) => (
            <div key={r.id_rapport} className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">{r.titre}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {r.sections_json?.length ?? 0} section(s) · Statut : {r.statut}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => navigate(`/admin/reports/${r.id_rapport}/edit`)}
                  className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded text-sm hover:bg-gray-50"
                >
                  <Edit2 size={14} />
                  Éditer
                </button>
                <button
                  onClick={() => handleDelete(r.id_rapport)}
                  className="flex items-center gap-1 px-3 py-1.5 border border-red-200 text-red-500 rounded text-sm hover:bg-red-50"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
