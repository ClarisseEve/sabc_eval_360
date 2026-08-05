import React from 'react';
import {
  RadarChart as RechartsRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { Badge } from '@/Components/UI/Badge/Badge';
import { Button } from '@/Components/UI/Button/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/UI/Card/Card';
import { Progress } from '@/Components/UI/Progress/Progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/UI/Select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/UI/Table/Table';
import { EmptyState, getPriorityBadgeVariant } from '@/Components/Dashboard/RoleDashboardShared';
import { TruncatedTableBody } from '@/Components/UI/TruncatedList/TruncatedList';
import { getLevelLabel } from '@/utils/hierarchyDrilldown';
import type { TeamMemberAnalytics } from '@/Hooks/queries/useRoleDashboards';

type TeamAxisAggregateLike = {
  critere: string;
  count: number;
  scoreMoyen?: number;
};

type TeamMemberLike = Pick<
  TeamMemberAnalytics,
  'matricule' | 'nomComplet' | 'role' | 'scoreGlobal' | 'progression' | 'topAxes'
> & Partial<Pick<TeamMemberAnalytics, 'email' | 'niveauHierarchique' | 'totalEvaluations'>>;

type TeamAxisFrequencyChartCardProps = {
  title: string;
  description: string;
  axes: TeamAxisAggregateLike[];
  emptyMessage?: string;
  barColor?: string;
  tooltipLabel?: string;
  heightClassName?: string;
};

type TeamMemberAnalyticsTableCardProps<TMember extends TeamMemberLike> = {
  title: string;
  description: string;
  members: TMember[];
  emptyMessage?: string;
  selector?: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    formatOptionLabel?: (member: TMember) => string;
  };
  selectedMatricule?: string;
  onSelect?: (matricule: string) => void;
  showLevelColumn?: boolean;
  showTotalEvaluations?: boolean;
  axesHeader?: string;
  renderIdentityMeta?: (member: TMember) => React.ReactNode;
  renderRoleMeta?: (member: TMember) => React.ReactNode;
  actionLabel?: string;
  onAction?: (member: TMember) => void;
};

export function TeamAxisFrequencyChartCard({
  title,
  description,
  axes,
  emptyMessage = "Aucun axe agrégé n'est disponible sur ce périmètre.",
  barColor = '#C62828',
  tooltipLabel = 'Occurrences',
  heightClassName = 'h-72',
}: Readonly<TeamAxisFrequencyChartCardProps>) {
  // Normaliser les données pour le radar (score relatif au max)
  const maxCount = Math.max(...axes.map((a) => a.count), 1);
  const radarData = axes.map((a) => ({
    axe: a.critere,
    value: a.count,
    fullMark: maxCount,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {axes.length === 0 ? (
          <EmptyState message={emptyMessage} />
        ) : (
          <div className={heightClassName}>
            <ResponsiveContainer width="100%" height="100%">
              <RechartsRadarChart data={radarData} margin={{ top: 8, right: 30, left: 30, bottom: 8 }}>
                <PolarGrid stroke="var(--sabc-gray-200)" />
                <PolarAngleAxis
                  dataKey="axe"
                  tick={{ fill: 'var(--sabc-gray-600)', fontSize: 11 }}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, maxCount]}
                  tick={{ fill: 'var(--sabc-gray-400)', fontSize: 10 }}
                  tickCount={4}
                />
                <Radar
                  name={tooltipLabel}
                  dataKey="value"
                  stroke={barColor}
                  fill={barColor}
                  fillOpacity={0.25}
                  animationDuration={500}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E0E0E0',
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    fontSize: '12px',
                  }}
                  formatter={(value: number) => [value, tooltipLabel]}
                />
              </RechartsRadarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function TeamMemberAnalyticsTableCard<TMember extends TeamMemberLike>({
  title,
  description,
  members,
  emptyMessage = "Aucun collaborateur n'est disponible sur ce périmètre.",
  selector,
  selectedMatricule,
  onSelect,
  showLevelColumn = false,
  showTotalEvaluations = false,
  axesHeader = 'Axes clés',
  renderIdentityMeta,
  renderRoleMeta,
  actionLabel,
  onAction,
}: Readonly<TeamMemberAnalyticsTableCardProps<TMember>>) {
  const showActionColumn = Boolean(actionLabel && onAction);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {selector ? (
          <div className="max-w-md">
            <Select value={selector.value} onValueChange={selector.onChange}>
              <SelectTrigger>
                <SelectValue placeholder={selector.placeholder ?? 'Sélectionner un collaborateur'} />
              </SelectTrigger>
              <SelectContent>
                {members.map((member) => (
                  <SelectItem key={member.matricule} value={member.matricule}>
                    {selector.formatOptionLabel ? selector.formatOptionLabel(member) : `${member.nomComplet} · ${member.role}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}

        {members.length === 0 ? (
          <EmptyState message={emptyMessage} />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Collaborateur</TableHead>
                <TableHead>Rôle</TableHead>
                {showLevelColumn ? <TableHead>Niveau</TableHead> : null}
                <TableHead>Score global</TableHead>
                <TableHead>Progression</TableHead>
                {showTotalEvaluations ? <TableHead>Évaluations</TableHead> : null}
                <TableHead>{axesHeader}</TableHead>
                {showActionColumn ? <TableHead className="text-right">Action</TableHead> : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              <TruncatedTableBody
                items={members}
                previewCount={8}
                colSpan={4 + (showLevelColumn ? 1 : 0) + (showTotalEvaluations ? 1 : 0) + (showActionColumn ? 1 : 0)}
                keyExtractor={(member) => member.matricule}
                viewAllHref="/common/team/overview"
                renderRow={(member) => (
                  <TableRow
                    key={member.matricule}
                    className={selectedMatricule === member.matricule ? 'bg-sabc-red-primary/5' : undefined}
                  >
                    <TableCell>
                      {onSelect ? (
                        <button type="button" className="text-left" onClick={() => onSelect(member.matricule)}>
                          <div className="font-medium text-sabc-gray-900 dark:text-white">{member.nomComplet}</div>
                          {renderIdentityMeta ? (
                            <div className="text-xs text-sabc-gray-500 dark:text-sabc-gray-400">{renderIdentityMeta(member)}</div>
                          ) : null}
                        </button>
                      ) : (
                        <>
                          <div className="font-medium text-sabc-gray-900 dark:text-white">{member.nomComplet}</div>
                          {renderIdentityMeta ? (
                            <div className="text-xs text-sabc-gray-500 dark:text-sabc-gray-400">{renderIdentityMeta(member)}</div>
                          ) : null}
                        </>
                      )}
                    </TableCell>
                    <TableCell>
                      <div>{member.role}</div>
                      {renderRoleMeta ? (
                        <div className="text-xs text-sabc-gray-500 dark:text-sabc-gray-400">{renderRoleMeta(member)}</div>
                      ) : null}
                    </TableCell>
                    {showLevelColumn ? <TableCell>{getLevelLabel(member.niveauHierarchique ?? null)}</TableCell> : null}
                    <TableCell className="min-w-[160px]">
                      {member.scoreGlobal == null ? (
                        <Badge variant="secondary">Non évalué</Badge>
                      ) : (
                        <div className="space-y-2">
                          <div className="font-medium text-sabc-gray-900 dark:text-white">{member.scoreGlobal}/5</div>
                          <Progress value={member.scoreGlobal} max={5} />
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={member.progression < 0 ? 'warning' : 'outline'}>
                        {member.progression > 0 ? '+' : ''}
                        {member.progression}
                      </Badge>
                    </TableCell>
                    {showTotalEvaluations ? <TableCell>{member.totalEvaluations ?? 0}</TableCell> : null}
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        {member.topAxes.length === 0 ? (
                          <Badge variant="secondary">Aucun axe</Badge>
                        ) : (
                          member.topAxes.map((axis) => (
                            <Badge key={`${member.matricule}-${axis.critere}`} variant={getPriorityBadgeVariant(axis.priorite)}>
                              {axis.critere}
                            </Badge>
                          ))
                        )}
                      </div>
                    </TableCell>
                    {showActionColumn ? (
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" onClick={() => onAction?.(member)}>
                          {actionLabel}
                        </Button>
                      </TableCell>
                    ) : null}
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
