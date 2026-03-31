import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/UI/Card/Card';
import { Badge } from '@/Components/UI/Badge/Badge';
import { BarChart } from '@/Components/UI/Charts/BarChart';
import { PieChart } from '@/Components/UI/Charts/PieChart';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/UI/Table/Table';
import type { RoleCompetencyInsight } from './types';
import { ReferenceLine } from 'recharts';

interface RoleCompetencyDetailsSectionProps {
  insights: RoleCompetencyInsight[];
}

const formatPercent = (value: number) => `${value.toFixed(1)}%`;

const RoleCompetencyDetailsSection: React.FC<RoleCompetencyDetailsSectionProps> = ({ insights }) => {
  if (!insights || insights.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {insights.map((insight) => {
        const competencies = insight.competencies ?? [];
        const acquisitionData = competencies.map((competency) => ({
          label: competency.label,
          acquisitionRate: competency.acquisitionRate,
        }));

        const scoreData = competencies.map((competency) => ({
          label: competency.label,
          averageScore: competency.averageScore,
        }));

        const distributionData = (insight.acquisitionDistribution ?? []).map((segment) => ({
          name: segment.bracket,
          value: Number(segment.percentage.toFixed(1)),
        }));

        const topCompetencies = insight.topCompetencies ?? [];
        const bottomCompetencies = insight.bottomCompetencies ?? [];
        const population = insight.population ?? 0;
        const overallAcquisitionRate = insight.overallAcquisitionRate ?? 0;
        const overallAverageScore = insight.overallAverageScore ?? 0;
        const matrixCompetencies = insight.matrix?.competencies ?? [];
        const matrixIndividuals = insight.matrix?.individuals ?? [];

        return (
          <Card key={insight.role} className="shadow-sm">
            <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle className="text-lg text-sabc-gray-900">{insight.role}</CardTitle>
                <CardDescription>
                  Seuil d'acquisition : {insight.acquisitionThresholdScore.toFixed(1)} / 5 • Population : {population}
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">Taux global {formatPercent(overallAcquisitionRate)}</Badge>
                <Badge variant="outline">Score moyen {overallAverageScore.toFixed(2)}/5</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="text-sm font-semibold text-sabc-gray-700">
                  Taux d'acquisition des compétences
                </h4>
                <BarChart
                  data={acquisitionData}
                  xAxisDataKey="label"
                  layout="vertical"
                  height={Math.max(320, acquisitionData.length * 28)}
                  bars={[{ dataKey: 'acquisitionRate', name: "Taux d'acquisition (%)", color: 'var(--sabc-success)' }]}
                  showLegend={false}
                  barSize={18}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="text-sm font-semibold text-sabc-gray-700">
                    Structure du niveau d'acquisition
                  </h4>
                  <PieChart
                    data={distributionData}
                    height={260}
                    innerRadius={50}
                    outerRadius={90}
                  />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-sabc-gray-700">
                    Score moyen par compétence
                  </h4>
                  <BarChart
                    data={scoreData}
                    xAxisDataKey="label"
                    layout="vertical"
                    height={Math.max(320, scoreData.length * 28)}
                    bars={[{ dataKey: 'averageScore', name: 'Score moyen (/5)', color: 'var(--sabc-info)' }]}
                    showLegend={false}
                    barSize={18}
                  >
                    <ReferenceLine x={insight.acquisitionThresholdScore} stroke="var(--sabc-warning)" strokeDasharray="3 3" label={{ value: 'Seuil 3/5', position: 'insideTopRight', fill: 'var(--sabc-warning)', fontSize: 12 }} />
                  </BarChart>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-sabc-gray-700">Top compétences</h4>
                  {topCompetencies.length === 0 ? (
                    <p className="rounded border border-dashed border-sabc-gray-200 px-3 py-2 text-xs text-sabc-gray-500">
                      Aucune donnée disponible avec les filtres sélectionnés.
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Compétence</TableHead>
                            <TableHead className="text-right">Taux</TableHead>
                            <TableHead className="text-right">Score</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {topCompetencies.map((competency) => (
                            <TableRow key={`${insight.role}-top-${competency.id}`}>
                              <TableCell>{competency.label}</TableCell>
                              <TableCell className="text-right">{formatPercent(competency.acquisitionRate)}</TableCell>
                              <TableCell className="text-right">{competency.averageScore.toFixed(2)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-sabc-gray-700">Compétences à renforcer</h4>
                  {bottomCompetencies.length === 0 ? (
                    <p className="rounded border border-dashed border-sabc-gray-200 px-3 py-2 text-xs text-sabc-gray-500">
                      Aucune donnée disponible avec les filtres sélectionnés.
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Compétence</TableHead>
                            <TableHead className="text-right">Taux</TableHead>
                            <TableHead className="text-right">Score</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {bottomCompetencies.map((competency) => (
                            <TableRow key={`${insight.role}-bottom-${competency.id}`}>
                              <TableCell>{competency.label}</TableCell>
                              <TableCell className="text-right">{formatPercent(competency.acquisitionRate)}</TableCell>
                              <TableCell className="text-right">{competency.averageScore.toFixed(2)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-sabc-gray-700">Matrice des compétences</h4>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Collaborateur</TableHead>
                        {matrixCompetencies.map((competency) => (
                          <TableHead key={`${insight.role}-matrix-head-${competency.id}`} className="text-right">
                          {competency.label}
                        </TableHead>
                      ))}
                      <TableHead className="text-right">% acquis</TableHead>
                      <TableHead className="text-right">Score</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow className="bg-sabc-gray-50">
                      <TableCell className="font-semibold">Niveau requis</TableCell>
                      {matrixCompetencies.map((competency) => (
                        <TableCell key={`${insight.role}-req-${competency.id}`} className="text-right">
                          {competency.requiredLevel?.toFixed(1) ?? '—'}
                        </TableCell>
                      ))}
                      <TableCell />
                      <TableCell />
                    </TableRow>
                    <TableRow className="bg-sabc-gray-50">
                      <TableCell className="font-semibold">Poids</TableCell>
                      {matrixCompetencies.map((competency) => (
                        <TableCell key={`${insight.role}-weight-${competency.id}`} className="text-right">
                          {competency.weight ? `${(competency.weight * 100).toFixed(0)}%` : '—'}
                        </TableCell>
                      ))}
                      <TableCell />
                      <TableCell />
                    </TableRow>
                    {matrixIndividuals.map((individual) => {
                      const acquisitionRate = individual.acquisitionRate ?? 0;
                      const averageScore = individual.averageScore ?? 0;

                      return (
                        <TableRow key={`${insight.role}-${individual.id}`}>
                          <TableCell className="whitespace-nowrap font-medium text-sabc-gray-800">
                            {individual.name}
                            {individual.region && (
                              <span className="ml-1 text-xs text-sabc-gray-500">({individual.region})</span>
                            )}
                          </TableCell>
                          {matrixCompetencies.map((competency) => (
                            <TableCell key={`${insight.role}-${individual.id}-${competency.id}`} className="text-right">
                              {(individual.scores[competency.id] ?? 0).toFixed(1)}
                            </TableCell>
                          ))}
                          <TableCell className="text-right font-semibold">
                            {formatPercent(acquisitionRate)}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {averageScore.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                  </Table>
                </div>
                {insight.population === 0 && (
                  <p className="rounded border border-dashed border-sabc-gray-200 px-3 py-2 text-sm text-sabc-gray-500">
                    Aucun collaborateur ne correspond aux filtres sélectionnés pour ce rôle.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default RoleCompetencyDetailsSection;
