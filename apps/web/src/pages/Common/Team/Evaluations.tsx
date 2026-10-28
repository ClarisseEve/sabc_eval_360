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
import { PageHeader } from '@/Components/UI/Page/PageHeader';
import { KpiCard, KpiGrid } from '@/Components/UI/KpiCard';
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
    <EvaluationPageLayout pageTitle="Évaluations d’équipe">
      <Head title="Évaluations d’équipe - SABC Eval360" />
      <div className="space-y-6">
        <PageHeader
          title="Évaluations d’équipe"
          description="Évaluations en cours qui concernent vos subordonnés directs. L’historique des évaluations validées reste disponible dans le menu Évaluations."
        />

        <KpiGrid>
          <KpiCard label="Total en cours" value={summary.total} />
          <KpiCard label="À compléter" value={summary.toComplete} caption="Brouillons et retours à corriger" />
          <KpiCard label="À valider par vous" value={summary.toValidate} caption="Décision attendue de votre part" />
          <KpiCard label="Soumises, validation en cours" value={summary.awaitingValidation} caption="Hors de votre file de validation" />
        </KpiGrid>

        <Card>
          <CardHeader>
            <CardTitle>Évaluations de l’équipe ({teamEvaluations.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {teamEvaluations.length === 0 ? (
              <div className="py-10 text-center text-sm text-sabc-gray-500">
                Aucune évaluation en cours ne concerne vos subordonnés directs.
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
                          <TableCell>{evaluation.periode?.nom_periode || evaluation.id_periode || 'n.d.'}</TableCell>
                          <TableCell>
                            <Badge variant={step.badge}>{step.label}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="outline"
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
