import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReportsList, useCreateReport } from '@/Hooks/queries/useReports';
import { FileText, Plus, Edit2, Trash2 } from 'lucide-react';
import { reportsApi } from '@/Services/api';
import { useQueryClient } from '@tanstack/react-query';
import { PageContainer } from '@/Components/UI/Page/PageContainer';
import { PageHeader } from '@/Components/UI/Page/PageHeader';
import { useConfirm } from '@/Contexts/ConfirmContext';
import { useToast } from '@/Contexts/ToastContext';
import { EmptyState } from '@/Components/UI/EmptyState';
import { Skeleton } from '@/Components/UI/Skeleton';
import { Button } from '@/Components/UI/Button/Button';
import { Input } from '@/Components/UI/Input/Input';
import { Label } from '@/Components/UI/Label/Label';
import { AdminReportsLayout } from './shared';

export default function ReportsIndex() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data, isLoading } = useReportsList();
  const createReport = useCreateReport();
  const confirm = useConfirm();
  const { success, error } = useToast();
  const [newTitre, setNewTitre] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const rapports = (data as any)?.data ?? [];

  const handleCreate = async () => {
    if (!newTitre.trim() || createReport.isPending) return;
    try {
      const res = await createReport.mutateAsync(newTitre.trim());
      navigate(`/admin/reports/${(res as any).data.id_rapport}/edit`);
    } catch (e: any) {
      error(e?.response?.data?.message || e?.message || 'La création du rapport a échoué.');
    }
  };

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: 'Supprimer ce rapport ?',
      description: 'Cette action est irréversible.',
      confirmLabel: 'Supprimer',
      variant: 'destructive',
    });
    if (!ok) return;
    try {
      await reportsApi.delete(id);
      qc.invalidateQueries({ queryKey: ['reports'] });
      success('Rapport supprimé.');
    } catch (e: any) {
      error(e?.response?.data?.message || e?.message || 'La suppression a échoué.');
    }
  };

  return (
    <AdminReportsLayout title="Rapports">
      <PageContainer width="narrow">
        <PageHeader
          title="Rapports"
          description="Assemblez, organisez et exportez vos rapports d'évaluation."
          breadcrumbs={[{ label: 'Administration' }, { label: 'Rapports' }]}
          actions={rapports.length > 0 && !showCreate ? (
            <Button onClick={() => setShowCreate(true)}>
              <Plus size={18} aria-hidden="true" />
              Nouveau rapport
            </Button>
          ) : undefined}
        />

        {showCreate && (
          <form
            className="flex flex-col gap-3 rounded-lg border border-sabc-gray-200 bg-white p-4 sm:flex-row sm:items-end"
            onSubmit={(event) => {
              event.preventDefault();
              void handleCreate();
            }}
          >
            <div className="min-w-0 flex-1">
              <Label htmlFor="report-title" className="mb-1.5 block">
                Titre du rapport
              </Label>
              <Input
                id="report-title"
                type="text"
                value={newTitre}
                onChange={(e) => setNewTitre(e.target.value)}
                placeholder="Ex. Synthèse annuelle 2026"
                autoFocus
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" loading={createReport.isPending} disabled={!newTitre.trim()}>
                {createReport.isPending ? 'Création…' : 'Créer'}
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>
                Annuler
              </Button>
            </div>
          </form>
        )}

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} height={72} className="w-full rounded-lg" />
            ))}
          </div>
        ) : rapports.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="Aucun rapport"
            description="Créez votre premier rapport pour assembler des sections et l'exporter en PowerPoint ou Excel."
            action={!showCreate ? (
              <Button onClick={() => setShowCreate(true)}>
                <Plus size={18} aria-hidden="true" />
                Nouveau rapport
              </Button>
            ) : undefined}
          />
        ) : (
          <div className="space-y-3">
            {rapports.map((rapport: any) => (
              <div
                key={rapport.id_rapport}
                className="flex flex-col gap-4 rounded-lg border border-sabc-gray-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-sabc-gray-900">{rapport.titre}</p>
                  <p className="mt-1 text-xs text-sabc-gray-500">
                    {rapport.sections_json?.length ?? 0} section(s) · Statut : {rapport.statut}
                  </p>
                </div>
                <div className="flex flex-shrink-0 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/admin/reports/${rapport.id_rapport}/edit`)}
                  >
                    <Edit2 size={14} aria-hidden="true" />
                    Éditer
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    onClick={() => handleDelete(rapport.id_rapport)}
                    aria-label={`Supprimer le rapport ${rapport.titre}`}
                  >
                    <Trash2 size={14} aria-hidden="true" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </PageContainer>
    </AdminReportsLayout>
  );
}
