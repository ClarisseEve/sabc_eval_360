import React, { useMemo, useState } from 'react';
import { Head } from '@/lib/inertia-shim';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/UI/Card';
import Badge from '@/Components/UI/Badge';
import { Alert, AlertDescription, AlertTitle } from '@/Components/UI/Alert';
import { Button } from '@/Components/UI/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/Components/UI/Tabs';
import { useEvaluations } from '@/Hooks/queries';
import { EvaluationPageLayout, formatDisplayName, formatRole } from './shared';
import { ClipboardList, Clock, FileEdit, Send } from 'lucide-react';

const Pending: React.FC = () => {
  const { data } = useEvaluations();
  const [activeTab, setActiveTab] = useState<string>('all');

  const evaluations = useMemo(() => {
    return Array.isArray(data?.en_attente) ? data.en_attente : [];
  }, [data]);

  const grouped = useMemo(() => {
    const groups = new Map<string, any[]>();
    for (const evaluation of evaluations) {
      const key = evaluation.type_evaluation || 'autre';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(evaluation);
    }
    return Array.from(groups.entries());
  }, [evaluations]);

  const summary = {
    total: evaluations.length,
    brouillons: evaluations.filter((evaluation) => evaluation.statut === 'brouillon').length,
    soumis: evaluations.filter((evaluation) => evaluation.statut === 'soumis').length,
  };

  const filtered = activeTab === 'all'
    ? evaluations
    : evaluations.filter((evaluation) => (evaluation.type_evaluation || 'autre') === activeTab);

  return (
    <EvaluationPageLayout pageTitle="Évaluations à compléter">
      <Head title="Évaluations à compléter" />

      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="flex items-center gap-3 p-6">
              <ClipboardList className="h-8 w-8 text-sabc-red-primary" />
              <div>
                <div className="text-2xl font-semibold text-sabc-gray-900">{summary.total}</div>
                <div className="text-sm text-sabc-gray-500">Évaluations en attente</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-6">
              <FileEdit className="h-8 w-8 text-sabc-accent" />
              <div>
                <div className="text-2xl font-semibold text-sabc-gray-900">{summary.brouillons}</div>
                <div className="text-sm text-sabc-gray-500">Brouillons à reprendre</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-6">
              <Send className="h-8 w-8 text-sabc-info" />
              <div>
                <div className="text-2xl font-semibold text-sabc-gray-900">{summary.soumis}</div>
                <div className="text-sm text-sabc-gray-500">Soumises en attente de validation</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="space-y-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-5 w-5 text-sabc-red-primary" />
              Brouillons et soumissions en cours
            </CardTitle>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full justify-start overflow-x-auto">
                <TabsTrigger value="all">Toutes ({evaluations.length})</TabsTrigger>
                {grouped.map(([type, list]) => (
                  <TabsTrigger key={type} value={type}>
                    {type} ({list.length})
                  </TabsTrigger>
                ))}
              </TabsList>
              <TabsContent value={activeTab} className="mt-4 space-y-3">
                {filtered.length === 0 ? (
                  <Alert>
                    <AlertTitle>Aucune évaluation</AlertTitle>
                    <AlertDescription>
                      Aucun élément ne correspond au filtre sélectionné.
                    </AlertDescription>
                  </Alert>
                ) : (
                  filtered.map((evaluation: any) => (
                    <div key={evaluation.id_evaluation} className="flex flex-col gap-3 rounded-lg border border-sabc-gray-200 p-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="font-medium text-sabc-gray-900">
                          {formatDisplayName(evaluation.evalue || {})}
                        </div>
                        <div className="text-sm text-sabc-gray-500">
                          {formatRole(evaluation.evalue || {})} · {evaluation.regle?.nom_regle || evaluation.type_evaluation || 'Évaluation'}
                        </div>
                        <div className="text-xs text-sabc-gray-400">
                          Créée le {evaluation.created_at ? new Date(evaluation.created_at).toLocaleDateString('fr-FR') : '—'}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={evaluation.statut === 'soumis' ? 'primary' : 'secondary'}>
                          {evaluation.statut}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            window.location.href =
                              evaluation.statut === 'brouillon'
                                ? `/evaluations/${evaluation.id_evaluation}/edit`
                                : `/evaluations/${evaluation.id_evaluation}`;
                          }}
                        >
                          {evaluation.statut === 'brouillon' ? 'Reprendre' : 'Voir'}
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </TabsContent>
            </Tabs>
          </CardHeader>
        </Card>
      </div>
    </EvaluationPageLayout>
  );
};

export default Pending;
