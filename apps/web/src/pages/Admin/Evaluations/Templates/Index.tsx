import React from 'react';
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, Edit2, Eye, Plus, Power, Trash2 } from 'lucide-react';
import { templatesApi } from '@/Services/api';
import { useConfirm } from '@/Contexts/ConfirmContext';
import { useToast } from '@/Contexts/ToastContext';
import { EmptyState } from '@/Components/UI/EmptyState';
import { AdminEvaluationsLayout } from '../shared';
import { Button } from '@/Components/UI/Button/Button';
import { Badge } from '@/Components/UI/Badge/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/UI/Card/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/UI/Table/Table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/Components/UI/DropdownMenu/DropdownMenu';
import { MoreVertical } from 'lucide-react';
import { PageHeader } from '@/Components/UI/Page/PageHeader';
import { KpiCard, KpiGrid } from '@/Components/UI/KpiCard';
import { formatDateFr } from '@/utils/helpers';

export default function TemplatesIndexPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const { success, error } = useToast();
  const [search, setSearch] = React.useState('');

  const { data } = useSuspenseQuery({
    queryKey: ['templates'],
    queryFn: () => templatesApi.list().then((r) => r.data),
  });

  const templates = Array.isArray(data) ? data : [];

  const publishMutation = useMutation({
    mutationFn: (id: string) => templatesApi.publish(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['templates'] });
      success('Modèle publié.');
    },
    onError: () => error('Impossible de publier ce modèle.'),
  });

  const unpublishMutation = useMutation({
    mutationFn: (id: string) => templatesApi.unpublish(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['templates'] });
      success('Modèle retiré de la publication.');
    },
    onError: () => error('Impossible de retirer ce modèle de la publication.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => templatesApi.delete(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['templates'] });
      success('Modèle supprimé.');
    },
    onError: () => error('Impossible de supprimer ce modèle (des assignations actives existent peut-être).'),
  });

  const filtered = templates.filter((t: any) =>
    String(t.titre ?? t.nom ?? '').toLowerCase().includes(search.toLowerCase()) ||
    String(t.description ?? '').toLowerCase().includes(search.toLowerCase()),
  );

  const published = templates.filter((t: any) => t.statut === 'published').length;
  const drafts = templates.filter((t: any) => t.statut === 'draft').length;

  // La matrice d'assignation n'est volontairement pas exposée ici : ses choix
  // ne pilotent pas encore la règle réellement utilisée à la création. Son
  // ancienne URL redirige vers cette liste jusqu'au raccordement métier.

  return (
    <AdminEvaluationsLayout title="Modèles d’évaluation">
      <PageHeader
        title="Modèles d’évaluation"
        description="Formulaires réutilisables pour structurer les évaluations."
        breadcrumbs={[{ label: 'Administration' }, { label: 'Évaluations' }, { label: 'Modèles' }]}
        actions={templates.length > 0 ? (
          <Button onClick={() => navigate('/admin/evaluations/templates/create')}>
            <Plus size={16} className="mr-2" />
            Nouveau modèle
          </Button>
        ) : undefined}
      />

      <KpiGrid className="lg:grid-cols-3">
        <KpiCard label="Total modèles" value={templates.length} />
        <KpiCard label="Publiés" value={published} />
        <KpiCard label="Brouillons" value={drafts} />
      </KpiGrid>

      <Card>
        <CardHeader className="flex flex-col gap-3 pb-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base">Modèles ({filtered.length})</CardTitle>
          <input
            aria-label="Rechercher un modèle"
            placeholder="Rechercher un modèle"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full rounded-lg sm:w-56 border border-sabc-gray-200 bg-white px-3 text-sm placeholder:text-sabc-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sabc-red-primary"
          />
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            templates.length === 0 ? (
              <EmptyState
                icon={ClipboardList}
                title="Aucun modèle"
                description="Créez votre premier modèle d’évaluation pour structurer les compétences."
                action={
                  <Button onClick={() => navigate('/admin/evaluations/templates/create')}>
                    Nouveau modèle
                  </Button>
                }
              />
            ) : (
              <EmptyState icon={ClipboardList} title="Aucun résultat" description="Aucun modèle ne correspond à votre recherche." />
            )
          ) : (
            <div className="overflow-x-auto">
              <Table className="min-w-[720px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Titre</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Modifié le</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((template: any) => {
                    const id = template.id ?? template.id_template;
                    const titre = template.titre ?? template.nom ?? 'Sans titre';
                    const isPublished = template.statut === 'published';
                    return (
                      <TableRow key={id}>
                        <TableCell className="font-medium">{titre}</TableCell>
                        <TableCell className="max-w-xs truncate text-sabc-gray-500">
                          {template.description || 'Sans description'}
                        </TableCell>
                        <TableCell className="text-sabc-gray-500">v{template.version ?? 1}</TableCell>
                        <TableCell>
                          {isPublished ? (
                            <Badge variant="success">Publié</Badge>
                          ) : template.statut === 'archived' ? (
                            <Badge variant="outline">Archivé</Badge>
                          ) : (
                            <Badge variant="secondary">Brouillon</Badge>
                          )}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sabc-gray-500">{formatDateFr(template.updated_at)}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Actions pour le modèle {titre}</span>
                                <MoreVertical size={16} />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => navigate(`/admin/evaluations/templates/${id}`)}>
                                <Eye size={14} className="mr-2" />
                                Voir
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => navigate(`/admin/evaluations/templates/${id}/edit`)}>
                                <Edit2 size={14} className="mr-2" />
                                Modifier
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => isPublished ? unpublishMutation.mutate(id) : publishMutation.mutate(id)}
                              >
                                <Power size={14} className="mr-2" />
                                {isPublished ? 'Retirer de la publication' : 'Publier'}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-red-700 focus:bg-red-50 focus:text-red-800"
                                onClick={async () => {
                                  const ok = await confirm({
                                    title: 'Supprimer ce modèle ?',
                                    description: 'Cette action est irréversible.',
                                    confirmLabel: 'Supprimer',
                                    variant: 'destructive',
                                  });
                                  if (ok) deleteMutation.mutate(id);
                                }}
                              >
                                <Trash2 size={14} className="mr-2" />
                                Supprimer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </AdminEvaluationsLayout>
  );
}
