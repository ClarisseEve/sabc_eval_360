import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/UI/Card/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/UI/Table/Table';
import {
  EmptyState,
  formatDateLabel,
  formatEvaluationType,
  getStatusBadgeVariant,
} from '@/Components/Dashboard/RoleDashboardShared';
import { Badge } from '@/Components/UI/Badge/Badge';

type EvaluationHistoryEntry = {
  id_evaluation?: string | number | null;
  type_evaluation?: unknown;
  note_globale?: number | null;
  date_soumission?: unknown;
  date_creation?: unknown;
  statut?: unknown;
};

type EvaluationHistoryTableCardProps<TRow extends EvaluationHistoryEntry> = {
  title: string;
  description: string;
  evaluations: TRow[];
  emptyMessage: string;
  subjectHeader: string;
  subjectCell: (evaluation: TRow) => React.ReactNode;
  secondaryHeader?: string;
  secondaryCell?: (evaluation: TRow) => React.ReactNode;
};

export function EvaluationHistoryTableCard<TRow extends EvaluationHistoryEntry>({
  title,
  description,
  evaluations,
  emptyMessage,
  subjectHeader,
  subjectCell,
  secondaryHeader,
  secondaryCell,
}: EvaluationHistoryTableCardProps<TRow>) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {evaluations.length === 0 ? (
          <EmptyState message={emptyMessage} />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{subjectHeader}</TableHead>
                {secondaryHeader ? <TableHead>{secondaryHeader}</TableHead> : null}
                <TableHead>Type</TableHead>
                <TableHead>Note</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {evaluations.map((evaluation, index) => (
                <TableRow key={String(evaluation.id_evaluation ?? `${title}-${index}`)}>
                  <TableCell className="font-medium">{subjectCell(evaluation)}</TableCell>
                  {secondaryHeader ? <TableCell>{secondaryCell?.(evaluation) ?? '—'}</TableCell> : null}
                  <TableCell>{formatEvaluationType(evaluation.type_evaluation)}</TableCell>
                  <TableCell>{evaluation.note_globale != null ? `${evaluation.note_globale}/5` : '—'}</TableCell>
                  <TableCell>{formatDateLabel(evaluation.date_soumission || evaluation.date_creation)}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(evaluation.statut)}>
                      {String(evaluation.statut || 'inconnu')}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
