import React, { useMemo } from 'react';
import { Head } from '@/lib/inertia-shim';
import { Badge } from '@/Components/UI/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/UI/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/UI/Table';
import { useSubordonnes } from '@/Hooks/queries';
import { useEvaluations } from '@/Hooks/queries/useEvaluationsQuery';
import { EvaluationPageLayout, formatDisplayName } from '@/pages/Common/Evaluations/shared';

export default function TeamEvaluationsPage() {
  const { data: subordonnesData } = useSubordonnes();
  const { data: evaluationsData } = useEvaluations();

  const subordonnes = Array.isArray(subordonnesData) ? subordonnesData : [];
  const evaluations = Array.isArray(evaluationsData) ? evaluationsData : [];
  const subordonnesSet = useMemo(() => new Set(subordonnes.map((user: any) => user.matricule)), [subordonnes]);

  const teamEvaluations = useMemo(
    () =>
      evaluations.filter((evaluation: any) =>
        subordonnesSet.has(evaluation?.evalue_matricule) ||
        subordonnesSet.has(evaluation?.evaluateur_matricule) ||
        subordonnesSet.has(evaluation?.evalue?.matricule) ||
        subordonnesSet.has(evaluation?.evaluateur?.matricule),
      ),
    [evaluations, subordonnesSet],
  );

  const pending = teamEvaluations.filter((evaluation: any) => evaluation.statut === 'en_attente' || evaluation.statut === 'brouillon').length;
  const submitted = teamEvaluations.filter((evaluation: any) => evaluation.statut === 'soumis').length;
  const validated = teamEvaluations.filter((evaluation: any) => evaluation.statut === 'valide').length;

  return (
    <EvaluationPageLayout pageTitle="Évaluations d'équipe">
      <Head title="Évaluations d'équipe — SABC Eval360" />
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-sabc-gray-900">Évaluations d'équipe</h1>
          <p className="text-sm text-sabc-gray-600">Suivi des évaluations liées à vos subordonnés directs.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card><CardContent className="p-4"><div className="text-sm text-sabc-gray-600">Total</div><div className="text-2xl font-bold">{teamEvaluations.length}</div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="text-sm text-sabc-gray-600">En attente</div><div className="text-2xl font-bold">{pending}</div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="text-sm text-sabc-gray-600">Soumises</div><div className="text-2xl font-bold">{submitted}</div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="text-sm text-sabc-gray-600">Validées</div><div className="text-2xl font-bold">{validated}</div></CardContent></Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Évaluations de l'équipe</CardTitle>
          </CardHeader>
          <CardContent>
            {teamEvaluations.length === 0 ? (
              <div className="py-10 text-center text-sm text-sabc-gray-500">
                Aucune évaluation liée à vos subordonnés n’a été trouvée.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Évalué</TableHead>
                    <TableHead>Évaluateur</TableHead>
                    <TableHead>Période</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teamEvaluations.map((evaluation: any) => (
                    <TableRow key={evaluation.id_evaluation}>
                      <TableCell>{evaluation.id_evaluation}</TableCell>
                      <TableCell>{formatDisplayName(evaluation.evalue || { matricule: evaluation.evalue_matricule })}</TableCell>
                      <TableCell>{formatDisplayName(evaluation.evaluateur || { matricule: evaluation.evaluateur_matricule })}</TableCell>
                      <TableCell>{evaluation.periode?.nom_periode || evaluation.id_periode || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge variant={evaluation.statut === 'valide' ? 'default' : 'outline'}>
                          {evaluation.statut}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </EvaluationPageLayout>
  );
}
