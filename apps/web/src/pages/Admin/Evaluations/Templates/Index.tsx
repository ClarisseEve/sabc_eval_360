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

function formatDate(value?: string | null) {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

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
      success('Template publié.');
    },
    onError: () => error('Impossible de publier ce template.'),
  });

  const unpublishMutation = useMutation({
    mutationFn: (id: string) => templatesApi.unpublish(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['templates'] });
      success('Template dépublié.');
    },
    onError: () => error('Impossible de dépublier ce template.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => templatesApi.delete(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['templates'] });
      success('Template supprimé.');
    },
    onError: () => error('Impossible de supprimer ce template (des assignations actives existent peut-être).'),
  });

  const filtered = templates.filter((t: any) =>
    String(t.titre ?? t.nom ?? '').toLowerCase().includes(search.toLowerCase()) ||
    String(t.description ?? '').toLowerCase().includes(search.toLowerCase()),
  );

  const published = templates.filter((t: any) => t.statut === 'published').length;
  const drafts = templates.filter((t: any) => t.statut === 'draft').length;

  return (
    <AdminEvaluationsLayout title="Templates d'évaluation">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-sabc-gray-900">Templates d'évaluation</h1>
          <p className="mt-1 text-sm text-sabc-gray-400">
            Formulaires réutilisables assignables aux rôles pour chaque période.
          </p>
        </div>
        <Button
          className="bg-sabc-red-primary text-white hover:bg-sabc-red-dark"
          onClick={() => navigate('/admin/evaluations/templates/create')}
        >
          <Plus size={16} className="mr-2" />
          Nouveau template
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-sabc-gray-400">Total templates</div>
            <div className="text-2xl font-bold text-sabc-gray-900">{templates.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-sabc-gray-400">Publiés</div>
            <div className="text-2xl font-bold text-sabc-success">{published}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-sabc-gray-400">Brouillons</div>
            <div className="text-2xl font-bold text-sabc-warning">{drafts}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <ClipboardList size={18} className="text-sabc-red-primary" />
            Templates ({filtered.length})
          </CardTitle>
          <input
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-56 rounded-md border border-sabc-gray-200 bg-white px-3 text-sm placeholder:text-sabc-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sabc-red-primary"
          />
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            templates.length === 0 ? (
              <EmptyState
                icon={ClipboardList}
                title="Aucun template"
                description="Créez votre premier template d’évaluation pour structurer les compétences."
                action={
                  <Button className="bg-sabc-red-primary text-white hover:bg-sabc-red-dark" onClick={() => navigate('/admin/evaluations/templates/create')}>
                    Nouveau template
                  </Button>
                }
              />
            ) : (
              <EmptyState icon={ClipboardList} title="Aucun résultat" description="Aucun template ne correspond à votre recherche." />
            )
          ) : (
            <div className="overflow-x-auto">
              <Table>
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
                        <TableCell className="max-w-xs truncate text-sabc-gray-400">
                          {template.description || '—'}
                        </TableCell>
                        <TableCell className="text-sabc-gray-400">v{template.version ?? 1}</TableCell>
                        <TableCell>
                          {isPublished ? (
                            <Badge variant="success">Publié</Badge>
                          ) : template.statut === 'archived' ? (
                            <Badge variant="secondary">Archivé</Badge>
                          ) : (
                            <Badge variant="warning">Brouillon</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sabc-gray-400">{formatDate(template.updated_at)}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Ouvrir menu</span>
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
                                {isPublished ? 'Dépublier' : 'Publier'}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-sabc-red-primary focus:text-sabc-red-primary"
                                onClick={async () => {
                                  const ok = await confirm({
                                    title: 'Supprimer ce template ?',
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
