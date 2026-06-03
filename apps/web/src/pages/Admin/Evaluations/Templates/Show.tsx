import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/UI/Card/Card';
import { Button } from '@/Components/UI/Button/Button';
import { Badge } from '@/Components/UI/Badge/Badge';
import { Skeleton } from '@/Components/UI/Skeleton';
import { EmptyState } from '@/Components/UI/EmptyState';
import { ClipboardList, ArrowLeft, Edit2, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { templatesApi } from '@/Services/api';
import { AdminEvaluationsLayout } from '../shared';

function formatDate(value?: string | null) {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return format(date, 'dd MMMM yyyy à HH:mm', { locale: fr });
}

export default function TemplateShowPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();

  const { data: template, isLoading } = useQuery({
    queryKey: ['templates', id],
    queryFn: () => templatesApi.get(id).then((r) => r.data),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <AdminEvaluationsLayout title="Template">
        <div className="container mx-auto px-4 py-6 space-y-4">
          <Skeleton height={40} className="w-1/3 rounded-lg" />
          <Skeleton height={160} className="w-full rounded-lg" />
          <Skeleton height={220} className="w-full rounded-lg" />
        </div>
      </AdminEvaluationsLayout>
    );
  }

  if (!template) {
    return (
      <AdminEvaluationsLayout title="Template">
        <div className="container mx-auto px-4 py-6">
          <EmptyState
            variant="error"
            icon={FileText}
            title="Template introuvable"
            description="Ce template n'existe pas ou a été supprimé."
            action={
              <Button onClick={() => navigate('/admin/evaluations/templates')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour aux templates
              </Button>
            }
          />
        </div>
      </AdminEvaluationsLayout>
    );
  }

  const sections: any[] = Array.isArray(template.sections) ? template.sections : [];

  return (
    <AdminEvaluationsLayout title={`Template : ${template.titre}`}>
      <div className="container mx-auto py-6 px-4 md:px-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center">
            <Button variant="outline" size="sm" className="mr-4" onClick={() => navigate('/admin/evaluations/templates')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour
            </Button>
            <h1 className="text-2xl font-semibold tracking-tight text-sabc-gray-900">{template.titre}</h1>
          </div>
          <Button onClick={() => navigate(`/admin/evaluations/templates/${template.id_template}/edit`)}>
            <Edit2 className="mr-2 h-4 w-4" />
            Modifier
          </Button>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <ClipboardList className="mr-2 h-5 w-5" />
              Détails du template
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="md:col-span-2">
                <h3 className="text-sm font-medium text-sabc-gray-500">Description</h3>
                <p className="mt-1 text-sabc-gray-800">{template.description || '—'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-sabc-gray-500">Statut</h3>
                <div className="mt-1">
                  <Badge variant={template.est_actif ? 'success' : 'secondary'}>
                    {template.est_actif ? 'Publié' : 'Brouillon'}
                  </Badge>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-sabc-gray-500">Catégorie</h3>
                <p className="mt-1 text-sabc-gray-800">{template.categorie || '—'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-sabc-gray-500">Version</h3>
                <p className="mt-1 text-sabc-gray-800">{template.version}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-sabc-gray-500">Dernière modification</h3>
                <p className="mt-1 text-sabc-gray-800">{formatDate(template.updated_at)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <ClipboardList className="mr-2 h-5 w-5" />
                Sections et compétences
              </div>
              <Badge variant="secondary">
                {sections.length} section{sections.length > 1 ? 's' : ''} · {template.nb_competences ?? 0} compétence{(template.nb_competences ?? 0) > 1 ? 's' : ''}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {sections.length === 0 ? (
              <EmptyState title="Aucune section" description="Ce template ne contient pas encore de section." />
            ) : (
              sections.map((section: any, sectionIndex: number) => (
                <div key={sectionIndex} className="rounded-lg border border-sabc-gray-200 p-4">
                  <h3 className="font-semibold text-sabc-gray-900">{section.titre}</h3>
                  {section.description ? (
                    <p className="mt-0.5 text-sm text-sabc-gray-600">{section.description}</p>
                  ) : null}
                  <ul className="mt-3 space-y-2">
                    {(section.competences ?? []).map((competence: any, compIndex: number) => (
                      <li key={compIndex} className="rounded-md bg-sabc-gray-50 px-3 py-2">
                        <span className="text-sm font-medium text-sabc-gray-800">{competence.libelle}</span>
                        {competence.description ? (
                          <span className="block text-xs text-sabc-gray-500">{competence.description}</span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </AdminEvaluationsLayout>
  );
}
