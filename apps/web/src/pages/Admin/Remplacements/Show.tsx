import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { Badge } from '@/Components/UI/Badge';
import { Button } from '@/Components/UI/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/UI/Card';
import { remplacementsApi } from '@/Services/api';
import { AdminRemplacementsLayout } from './shared';

export default function ShowRemplacement() {
  const { id = '' } = useParams();
  const queryClient = useQueryClient();
  const { data } = useSuspenseQuery({
    queryKey: ['admin', 'remplacements', id],
    queryFn: () => remplacementsApi.get(id).then((r) => r.data),
  });

  const terminerMutation = useMutation({
    mutationFn: async () => remplacementsApi.terminer(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'remplacements'] });
      await queryClient.invalidateQueries({ queryKey: ['admin', 'remplacements', id] });
    },
  });

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
          {data.est_actif ? <Button variant="outline" onClick={() => terminerMutation.mutate()}>Terminer</Button> : null}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Informations générales</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div><span className="font-medium">ID:</span> {data.id_remplacement}</div>
            <div><span className="font-medium">Statut:</span> <Badge variant={data.est_actif ? 'default' : 'outline'}>{data.est_actif ? 'Actif' : 'Terminé'}</Badge></div>
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
