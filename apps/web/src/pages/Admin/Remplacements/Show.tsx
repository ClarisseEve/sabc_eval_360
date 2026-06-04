import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { Badge } from '@/Components/UI/Badge';
import { Button } from '@/Components/UI/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/UI/Card';
import { remplacementsApi } from '@/Services/api';
import { useConfirm } from '@/Contexts/ConfirmContext';
import { useToast } from '@/Contexts/ToastContext';
import { AdminRemplacementsLayout } from './shared';

const STATUT_META = {
  actif: { label: 'Actif', variant: 'success' as const },
  avenir: { label: 'À venir', variant: 'info' as const },
  termine: { label: 'Terminé', variant: 'secondary' as const },
};

export default function ShowRemplacement() {
  const { id = '' } = useParams();
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const { success, error } = useToast();
  const { data } = useSuspenseQuery({
    queryKey: ['admin', 'remplacements', id],
    queryFn: () => remplacementsApi.get(id).then((r) => r.data),
  });

  // Statut tri-état dérivé (objet seul, pas de bucket d'origine)
  const statut: keyof typeof STATUT_META = data.est_actif
    ? 'actif'
    : new Date(data.date_debut) > new Date()
      ? 'avenir'
      : 'termine';
  const meta = STATUT_META[statut];

  const terminerMutation = useMutation({
    mutationFn: async () => remplacementsApi.terminer(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'remplacements'] });
      await queryClient.invalidateQueries({ queryKey: ['admin', 'remplacements', id] });
    },
  });

  const handleTerminer = async () => {
    const ok = await confirm({
      title: 'Terminer ce remplacement ?',
      description: 'Le remplacement sera clôturé immédiatement.',
      confirmLabel: 'Terminer',
      variant: 'destructive',
    });
    if (!ok) return;
    try {
      await terminerMutation.mutateAsync();
      success('Remplacement terminé.');
    } catch (e: any) {
      error(e?.response?.data?.message || e?.message || 'La clôture du remplacement a échoué.');
    }
  };

  return (
    <AdminRemplacementsLayout title={`Remplacement #${id}`}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-sabc-gray-900">Détails du remplacement</h1>
          <p className="text-sm text-sabc-gray-600">Vue réelle du remplacement #{id}.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/admin/remplacements"><Button variant="outline">Retour</Button></Link>
          <Link to={`/admin/remplacements/${id}/edit`}><Button variant="outline">Modifier</Button></Link>
          {statut === 'actif' ? <Button variant="outline" onClick={handleTerminer}>Terminer</Button> : null}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Informations générales</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div><span className="font-medium">ID:</span> {data.id_remplacement}</div>
            <div><span className="font-medium">Statut:</span> <Badge variant={meta.variant}>{meta.label}</Badge></div>
            <div><span className="font-medium">Rôle remplacé:</span> {data.role_remplace}</div>
            <div><span className="font-medium">Région:</span> {data.region_remplacement}</div>
            <div><span className="font-medium">Service:</span> {data.service_remplacement || 'N/A'}</div>
            <div><span className="font-medium">Début:</span> {String(data.date_debut).slice(0, 10)}</div>
            <div><span className="font-medium">Fin:</span> {data.date_fin ? String(data.date_fin).slice(0, 10) : 'Non définie'}</div>
            <div><span className="font-medium">Motif:</span> {data.motif}</div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Titulaire</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div><span className="font-medium">Nom:</span> {[data.titulaire_prenom, data.titulaire_nom].filter(Boolean).join(' ')}</div>
              <div><span className="font-medium">Matricule:</span> {data.titulaire_matricule}</div>
              <div><span className="font-medium">Rôle:</span> {data.titulaire_role}</div>
              <div><span className="font-medium">Email:</span> {data.titulaire_email || 'N/A'}</div>
              <div><span className="font-medium">Téléphone:</span> {data.titulaire_telephone || 'N/A'}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Remplaçant</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div><span className="font-medium">Nom:</span> {[data.remplacant_prenom, data.remplacant_nom].filter(Boolean).join(' ')}</div>
              <div><span className="font-medium">Matricule:</span> {data.remplacant_matricule}</div>
              <div><span className="font-medium">Rôle:</span> {data.remplacant_role}</div>
              <div><span className="font-medium">Email:</span> {data.remplacant_email || 'N/A'}</div>
              <div><span className="font-medium">Téléphone:</span> {data.remplacant_telephone || 'N/A'}</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminRemplacementsLayout>
  );
}
