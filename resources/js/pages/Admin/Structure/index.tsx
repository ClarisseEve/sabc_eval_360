import React, { useMemo, useState } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/Components/Layout/app/AppLayout';
import { adaptUserForLayout } from '@/utils/userAdapter';
import HierarchyTree, { HierarchyNode } from '@/Components/UI/HierarchyTree/HierarchyTree';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/UI/Card';
import { MapPin, Briefcase, GitBranch, Users, Layers } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/Components/UI/Select';

interface StructureStatistics {
  regions: number;
  taniere: number;
  non_taniere: number;
  services: number;
  districts: number;
  secteurs: number;
  utilisateurs: number;
}

interface Props {
  user: any;
  tree: HierarchyNode[];
  statistics: StructureStatistics;
}

const metricCards = (
  stats: StructureStatistics
): Array<{ label: string; value: number; icon: React.ReactNode; helper?: string }> => [
  {
    label: 'Régions',
    value: stats.regions,
    icon: <MapPin className="h-5 w-5 text-sabc-red-primary" />,
    helper: `${stats.taniere} tanière • ${stats.non_taniere} non-tanière`,
  },
  {
    label: 'Services commerciaux',
    value: stats.services,
    icon: <Briefcase className="h-5 w-5 text-sabc-red-primary" />,
  },
  {
    label: 'Districts',
    value: stats.districts,
    icon: <GitBranch className="h-5 w-5 text-sabc-red-primary" />,
  },
  {
    label: 'Secteurs',
    value: stats.secteurs,
    icon: <Layers className="h-5 w-5 text-sabc-red-primary" />,
  },
  {
    label: 'Collaborateurs référencés',
    value: stats.utilisateurs,
    icon: <Users className="h-5 w-5 text-sabc-red-primary" />,
  },
];

const AdminStructureIndex: React.FC<Props> = ({ user, tree, statistics }) => {
  const layoutUser = adaptUserForLayout(user);
  const cards = metricCards(statistics);
  const regions = useMemo(() => (Array.isArray(tree) ? tree : []), [tree]);
  const [selectedRegionId, setSelectedRegionId] = useState<string>('all');

  const regionOptions = useMemo(
    () =>
      [
        { label: 'Toutes les régions', value: 'all' },
        ...regions.map((region) => ({
          label: region.nom,
          value: region.id,
        })),
      ],
    [regions]
  );

  const selectedRegion = useMemo(
    () => regions.find((region) => region.id === selectedRegionId),
    [regions, selectedRegionId]
  );

  const treeNodes = useMemo(
    () => (selectedRegionId === 'all' ? regions : selectedRegion ? [selectedRegion] : []),
    [regions, selectedRegion, selectedRegionId]
  );

  const treeTitle = selectedRegion ? selectedRegion.nom : 'Structure organisationnelle';
  const treeSubtitle = selectedRegion
    ? selectedRegion.manager
      ? `Responsable : ${selectedRegion.manager}`
      : 'Poste vacant'
    : 'Vue consolidée des régions SABC';

  const treeVariant = selectedRegion
    ? selectedRegion.metadata?.statut === 'tanière'
      ? 'taniere'
      : 'non-taniere'
    : 'roles';

  return (
    <AppLayout user={layoutUser} pageTitle="Structure organisationnelle" notifications={[]}>
      <Head title="Structure organisationnelle" />
      <div className="max-w-full space-y-6">
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {cards.map((card) => (
            <Card key={card.label} className="border-sabc-gray-200 shadow-sm dark:border-sabc-gray-800">
              <CardContent className="flex items-start justify-between gap-4 p-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-sabc-gray-500 dark:text-sabc-gray-400">
                    {card.label}
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-sabc-gray-900 dark:text-white">
                    {card.value}
                  </p>
                  {card.helper && (
                    <p className="mt-1 text-xs text-sabc-gray-500 dark:text-sabc-gray-400">{card.helper}</p>
                  )}
                </div>
                <div className="rounded-lg bg-sabc-red-primary/10 p-2 text-sabc-red-primary">
                  {card.icon}
                </div>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="space-y-4">
          <div className="flex flex-wrap items-start gap-4">
            <div className="w-full max-w-xs">
              <p className="text-xs font-semibold uppercase tracking-wide text-sabc-gray-500 dark:text-sabc-gray-400 mb-2">
                Région à afficher
              </p>
              <Select value={selectedRegionId} onValueChange={setSelectedRegionId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir une région" />
                </SelectTrigger>
                <SelectContent>
                  {regionOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <HierarchyTree
            title={treeTitle}
            subtitle={treeSubtitle}
            nodes={treeNodes}
            showMetadata
            variant={treeVariant}
            className="shadow-sm max-w-full"
          />
        </section>
      </div>
    </AppLayout>
  );
};

export default AdminStructureIndex;
