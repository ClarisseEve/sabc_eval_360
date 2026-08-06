import React, { useMemo } from 'react';
import { Head } from '@/lib/inertia-shim';
import { Badge } from '@/Components/UI/Badge';
import { Button } from '@/Components/UI/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/UI/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/UI/Table';
import { TruncatedTableBody } from '@/Components/UI/TruncatedList/TruncatedList';
import { useSubordonnes } from '@/Hooks/queries';
import { useEvaluations } from '@/Hooks/queries/useEvaluationsQuery';
import { EvaluationPageLayout, formatDisplayName } from '@/pages/Common/Evaluations/shared';
import { formatEvaluationType } from '@/Components/Dashboard/RoleDashboardShared';
import {
  buildTeamEvaluationItems,
  buildTeamEvaluationSummary,
  getTeamEvaluationActionHref,
  getTeamEvaluationStep,
} from './team-evaluations';

export default function TeamEvaluationsPage() {
  const { data: subordonnesData } = useSubordonnes();
  const { data: evaluationsData } = useEvaluations();

  const subordonnes = Array.isArray(subordonnesData) ? subordonnesData : [];
  const subordonnesSet = useMemo(() => new Set(subordonnes.map((user: any) => user.matricule)), [subordonnes]);

  const teamEvaluations = useMemo(
    () => buildTeamEvaluationItems(evaluationsData, subordonnesSet),
    [evaluationsData, subordonnesSet],
  );
  const summary = useMemo(() => buildTeamEvaluationSummary(teamEvaluations), [teamEvaluations]);

  return (
    <EvaluationPageLayout pageTitle="Évaluations d'équipe">
      <Head title="Évaluations d'équipe — SABC Eval360" />
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-sabc-gray-900">Évaluations d'équipe</h1>
          <p className="text-sm text-sabc-gray-600">
            Actions en cours liées à vos subordonnés directs. L’historique validé reste disponible dans le menu Évaluations.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card><CardContent className="p-4"><div className="text-sm text-sabc-gray-600">Total en cours</div><div className="text-2xl font-bold">{summary.total}</div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="text-sm text-sabc-gray-600">À compléter</div><div className="text-2xl font-bold">{summary.toComplete}</div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="text-sm text-sabc-gray-600">En validation</div><div className="text-2xl font-bold">{summary.awaitingValidation}</div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="text-sm text-sabc-gray-600">À valider</div><div className="text-2xl font-bold">{summary.toValidate}</div></CardContent></Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Évaluations de l'équipe</CardTitle>
          </CardHeader>
          <CardContent>
            {teamEvaluations.length === 0 ? (
              <div className="py-10 text-center text-sm text-sabc-gray-500">
                Aucune action d’évaluation en cours n’est liée à vos subordonnés directs.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Évalué</TableHead>
                    <TableHead>Évaluateur</TableHead>
                    <TableHead>Évaluation</TableHead>
                    <TableHead>Période</TableHead>
                    <TableHead>Étape actuelle</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TruncatedTableBody
                    items={teamEvaluations}
                    previewCount={10}
                    colSpan={6}
                    keyExtractor={(evaluation: any) => evaluation.id_evaluation}
                    renderRow={(evaluation: any) => {
                      const step = getTeamEvaluationStep(evaluation);
                      return (
                        <TableRow key={evaluation.id_evaluation}>
                          <TableCell>{formatDisplayName(evaluation.evalue || { matricule: evaluation.evalue_matricule })}</TableCell>
                          <TableCell>{formatDisplayName(evaluation.evaluateur || { matricule: evaluation.evaluateur_matricule })}</TableCell>
                          <TableCell>{formatEvaluationType(evaluation.type_evaluation)}</TableCell>
                          <TableCell>{evaluation.periode?.nom_periode || evaluation.id_periode || 'Non renseignée'}</TableCell>
                          <TableCell>
                            <Badge variant={step.badge}>{step.label}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant={evaluation.teamQueue === 'validation' ? 'default' : 'outline'}
                              onClick={() => { window.location.href = getTeamEvaluationActionHref(evaluation); }}
                            >
                              {step.action}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    }}
                  />
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </EvaluationPageLayout>
  );
}
