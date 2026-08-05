import React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/UI/Card/Card';
import { Progress } from '@/Components/UI/Progress/Progress';
import { EmptyState, formatEvaluationType } from '@/Components/Dashboard/RoleDashboardShared';

type SummaryMetric = {
  label: string;
  value: React.ReactNode;
};

type ScoreByTypeEntry = {
  type?: unknown;
  moyenne?: number | null;
  nb_evaluations?: number | null;
};

type HierarchyChainNode = {
  matricule?: string | number | null;
  nom_complet?: string | null;
  role?: string | null;
  niveau?: string | number | null;
};

type SubjectSummaryCardProps = {
  title: string;
  description: string;
  metrics: SummaryMetric[];
};

type ScoresByTypeCardProps = {
  title: string;
  description: string;
  entries: ScoreByTypeEntry[];
  emptyMessage?: string;
  variant?: 'list' | 'chart';
};

type HierarchyChainCardProps = {
  title: string;
  description: string;
  nodes: HierarchyChainNode[];
  emptyMessage?: string;
  selectedMatricule?: string;
  onSelect?: (matricule: string) => void;
};

export function SubjectSummaryCard({
  title,
  description,
  metrics,
}: SubjectSummaryCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <div key={metric.label} className="rounded-lg border border-sabc-gray-200 p-4 dark:border-sabc-gray-800">
              <div className="text-sm text-sabc-gray-500">{metric.label}</div>
              <div className="mt-1 text-2xl font-bold text-sabc-gray-900 dark:text-white">{metric.value}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function ScoresByTypeCard({
  title,
  description,
  entries,
  emptyMessage = 'Aucun score détaillé disponible.',
  variant = 'list',
}: ScoresByTypeCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className={variant === 'list' ? 'space-y-4' : undefined}>
        {entries.length === 0 ? (
          <EmptyState message={emptyMessage} />
        ) : variant === 'chart' ? (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={entries} layout="vertical" margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--sabc-gray-200)" horizontal={false} />
                <XAxis type="number" domain={[0, 5]} tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                <YAxis dataKey="type" type="category" width={110} tickLine={false} axisLine={false} tick={{ fontSize: 11 }} tickFormatter={(value) => formatEvaluationType(value)} />
                <Tooltip formatter={(value: number) => [`${value}/5`, 'Score moyen']} labelFormatter={(value) => formatEvaluationType(value)} />
                <Bar dataKey="moyenne" fill="#C62828" radius={[0, 10, 10, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          entries.map((entry, index) => (
            <div key={`${String(entry.type || 'type')}-${index}`} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-sabc-gray-700 dark:text-sabc-gray-200">{formatEvaluationType(entry.type)}</span>
                <span className="text-sabc-gray-500 dark:text-sabc-gray-400">{Number(entry.moyenne ?? 0).toFixed(2)}/5</span>
              </div>
              <Progress value={Number(entry.moyenne ?? 0)} max={5} />
              <div className="text-xs text-sabc-gray-400 dark:text-sabc-gray-500">
                {entry.nb_evaluations ?? 0} évaluation(s)
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

export function HierarchyChainCard({
  title,
  description,
  nodes,
  emptyMessage = 'Aucune chaîne hiérarchique disponible.',
  selectedMatricule,
  onSelect,
}: HierarchyChainCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {nodes.length === 0 ? (
          <EmptyState message={emptyMessage} />
        ) : (
          nodes.map((node, index) => {
            const matricule = String(node.matricule ?? '');
            const selected = selectedMatricule != null && matricule === selectedMatricule;
            const content = (
              <>
                <div className="font-medium text-sabc-gray-900 dark:text-white">{node.nom_complet || node.matricule || `Noeud ${index + 1}`}</div>
                <div className="text-sm text-sabc-gray-500 dark:text-sabc-gray-400">{node.role || 'Rôle non renseigné'}</div>
                <div className="text-xs text-sabc-gray-400 dark:text-sabc-gray-500">Niveau {node.niveau ?? '—'}</div>
              </>
            );

            if (onSelect) {
              return (
                <button
                  key={`${matricule}-${index}`}
                  type="button"
                  onClick={() => matricule && onSelect(matricule)}
                  className={`w-full rounded-lg border p-4 text-left transition-colors dark:border-sabc-gray-800 ${
                    selected
                      ? 'border-sabc-red-primary bg-sabc-red-primary/5'
                      : 'border-sabc-gray-200 hover:border-sabc-red-primary'
                  }`}
                >
                  {content}
                </button>
              );
            }

            return (
              <div key={`${matricule}-${index}`} className="rounded-lg border border-sabc-gray-200 p-4 dark:border-sabc-gray-800">
                {content}
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
