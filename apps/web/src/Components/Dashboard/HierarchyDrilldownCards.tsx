import React from 'react';
import { Badge } from '@/Components/UI/Badge/Badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/UI/Card/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/UI/Table/Table';
import { TruncatedList, TruncatedTableBody } from '@/Components/UI/TruncatedList/TruncatedList';
import { EmptyState, getPriorityBadgeVariant } from '@/Components/Dashboard/RoleDashboardShared';
import {
  buildHierarchyBranch,
  buildHierarchyRows,
  getLevelLabel,
  type HierarchyAnalyticsMember,
} from '@/utils/hierarchyDrilldown';
import { formatScore } from '@/utils/helpers';

type HierarchyBreakdownCardProps = {
  title: string;
  description: string;
  members: HierarchyAnalyticsMember[];
  emptyMessage?: string;
};

type HierarchyFocusCardProps = {
  title: string;
  description: string;
  focus: HierarchyAnalyticsMember | null;
  members: HierarchyAnalyticsMember[];
  onSelect: (matricule: string) => void;
  emptyMessage?: string;
  directReportsEmptyMessage?: string;
};

export function HierarchyBreakdownCard({
  title,
  description,
  members,
  emptyMessage = 'Aucune ventilation hiérarchique n’est disponible sur ce périmètre.',
}: HierarchyBreakdownCardProps) {
  const rows = React.useMemo(() => buildHierarchyRows(members), [members]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <EmptyState message={emptyMessage} />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Niveau</TableHead>
                <TableHead>Effectif</TableHead>
                <TableHead>Score moyen</TableHead>
                <TableHead>Axes clés</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TruncatedTableBody
                items={rows}
                previewCount={8}
                colSpan={4}
                keyExtractor={(row) => String(row.niveau)}
                renderRow={(row) => (
                  <TableRow key={row.niveau}>
                    <TableCell>{row.niveau}</TableCell>
                    <TableCell>{row.effectif}</TableCell>
                    <TableCell>{row.scoreMoyen != null ? formatScore(row.scoreMoyen) : '—'}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        {row.axes.length === 0 ? (
                          <Badge variant="secondary">Aucun axe</Badge>
                        ) : (
                          row.axes.map((axis) => (
                            <Badge key={`${row.niveau}-${axis.critere}`} variant={getPriorityBadgeVariant(axis.priorite)}>
                              {axis.critere}
                            </Badge>
                          ))
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              />
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

export function HierarchyFocusCard({
  title,
  description,
  focus,
  members,
  onSelect,
  emptyMessage = 'Sélectionnez un collaborateur pour ouvrir la branche hiérarchique correspondante.',
  directReportsEmptyMessage = 'Aucun subordonné direct n’est visible sur ce périmètre pour ce collaborateur.',
}: HierarchyFocusCardProps) {
  const branch = React.useMemo(() => buildHierarchyBranch(members, focus), [members, focus]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!focus ? (
          <EmptyState message={emptyMessage} />
        ) : (
          <>
            <div className="rounded-lg border border-sabc-gray-200 p-4 dark:border-sabc-gray-800">
              <div className="font-medium text-sabc-gray-900 dark:text-white">{focus.nomComplet}</div>
              <div className="text-sm text-sabc-gray-500 dark:text-sabc-gray-400">{focus.role}</div>
              <div className="mt-1 text-xs text-sabc-gray-400 dark:text-sabc-gray-500">
                {getLevelLabel(focus.niveauHierarchique)} · manager {focus.managerMatricule || 'racine du périmètre'}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-sabc-gray-200 p-3 dark:border-sabc-gray-800">
                <div className="text-xs text-sabc-gray-500 dark:text-sabc-gray-400">Directs</div>
                <div className="mt-1 text-xl font-bold text-sabc-gray-900 dark:text-white">{branch.directReports.length}</div>
              </div>
              <div className="rounded-lg border border-sabc-gray-200 p-3 dark:border-sabc-gray-800">
                <div className="text-xs text-sabc-gray-500 dark:text-sabc-gray-400">Descendants</div>
                <div className="mt-1 text-xl font-bold text-sabc-gray-900 dark:text-white">{branch.descendants.length}</div>
              </div>
              <div className="rounded-lg border border-sabc-gray-200 p-3 dark:border-sabc-gray-800">
                <div className="text-xs text-sabc-gray-500 dark:text-sabc-gray-400">Score branche</div>
                <div className="mt-1 text-xl font-bold text-sabc-gray-900 dark:text-white">
                  {branch.branchAverageScore != null ? formatScore(branch.branchAverageScore) : '—'}
                </div>
              </div>
              <div className="rounded-lg border border-sabc-gray-200 p-3 dark:border-sabc-gray-800">
                <div className="text-xs text-sabc-gray-500 dark:text-sabc-gray-400">Axes dominants</div>
                <div className="mt-1 text-xl font-bold text-sabc-gray-900 dark:text-white">{branch.topAxes.length}</div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium text-sabc-gray-700 dark:text-sabc-gray-200">Axes dominants de la branche</div>
              <div className="flex flex-wrap gap-2">
                {branch.topAxes.length === 0 ? (
                  <Badge variant="secondary">Aucun axe agrégé</Badge>
                ) : (
                  branch.topAxes.map((axis) => (
                    <Badge key={`${focus.matricule}-${axis.critere}`} variant={getPriorityBadgeVariant(axis.priorite)}>
                      {axis.critere}
                    </Badge>
                  ))
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div className="text-sm font-medium text-sabc-gray-700 dark:text-sabc-gray-200">Subordonnés directs</div>
              {branch.directReports.length === 0 ? (
                <EmptyState message={directReportsEmptyMessage} />
              ) : (
                <TruncatedList
                  items={branch.directReports}
                  previewCount={6}
                  keyExtractor={(member) => member.matricule}
                  modalTitle="Subordonnés directs"
                  modalDescription={`${branch.directReports.length} collaborateur(s)`}
                  className="space-y-3"
                  modalClassName="space-y-3"
                  renderItem={(member) => (
                    <button
                      key={member.matricule}
                      type="button"
                      onClick={() => onSelect(member.matricule)}
                      className="flex w-full items-center justify-between rounded-lg border border-sabc-gray-200 p-4 text-left transition-colors hover:border-sabc-red-primary dark:border-sabc-gray-800"
                    >
                      <div>
                        <div className="font-medium text-sabc-gray-900 dark:text-white">{member.nomComplet}</div>
                        <div className="text-sm text-sabc-gray-500 dark:text-sabc-gray-400">
                          {member.role} · {getLevelLabel(member.niveauHierarchique)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-sabc-gray-900 dark:text-white">
                          {member.scoreGlobal != null ? formatScore(member.scoreGlobal) : '—'}
                        </div>
                        <div className="text-xs text-sabc-gray-400 dark:text-sabc-gray-500">
                          {member.progression > 0 ? '+' : ''}
                          {member.progression}
                        </div>
                      </div>
                    </button>
                  )}
                />
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
