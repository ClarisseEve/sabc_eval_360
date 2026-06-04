import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/UI/Card/Card';
import { Badge } from '@/Components/UI/Badge/Badge';
import { EmptyState } from '@/Components/UI/EmptyState';
import { TruncatedList } from '@/Components/UI/TruncatedList/TruncatedList';
import { MapPin } from 'lucide-react';
import { useAdminStructure } from '@/Hooks/queries';
import { AdminStructureLayout } from './shared';

const KPIS = [
  { label: 'Régions', to: '/admin/structure/regions', key: 'regions' as const },
  { label: 'Services', to: '/admin/structure/services', key: 'services' as const },
  { label: 'Districts', to: '/admin/structure/districts', key: 'districts' as const },
  { label: 'Secteurs', to: '/admin/structure/secteurs', key: 'secteurs' as const },
];

const AdminStructureIndex: React.FC = () => {
  const { data } = useAdminStructure();

  const regions = Array.isArray(data?.regions) ? data.regions : [];
  const services = Array.isArray(data?.services) ? data.services : [];
  const districts = Array.isArray(data?.districts) ? data.districts : [];
  const secteurs = Array.isArray(data?.secteurs) ? data.secteurs : [];

  return (
    <AdminStructureLayout title="Structure organisationnelle">
      <div>
        <h1 className="text-2xl font-bold text-sabc-gray-900">Structure organisationnelle</h1>
        <p className="mt-1 text-sabc-gray-600">
          Vue consolidée de la hiérarchie commerciale (régions, services, districts, secteurs).
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {KPIS.map((kpi) => {
          const counts = { regions: regions.length, services: services.length, districts: districts.length, secteurs: secteurs.length };
          return (
            <Link key={kpi.key} to={kpi.to} className="rounded-xl transition hover:opacity-90">
              <Card className="transition hover:border-sabc-gray-300">
                <CardContent className="p-6">
                  <div className="text-sm text-sabc-gray-500">{kpi.label}</div>
                  <div className="text-3xl font-semibold">{counts[kpi.key]}</div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Répartition par région</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {regions.length === 0 ? (
            <EmptyState icon={MapPin} title="Aucune région" description="Aucune région n’est encore définie dans la structure." />
          ) : (
            <TruncatedList
              items={regions}
              previewCount={8}
              keyExtractor={(region: any) => region.id_region}
              modalTitle="Toutes les régions"
              modalDescription={`${regions.length} région(s)`}
              className="space-y-3"
              modalClassName="space-y-3"
              renderItem={(region: any) => (
                <div className="flex items-center justify-between rounded-lg border border-sabc-gray-200 p-4">
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-sabc-gray-900">{region.nom_region}</span>
                    <Badge variant={region.est_taniere ? 'primary' : 'secondary'}>
                      {region.est_taniere ? 'Tanière' : 'Non tanière'}
                    </Badge>
                  </div>
                  <div className="text-sm text-sabc-gray-500">
                    {(services.filter((service: any) => service.id_region === region.id_region)).length} service(s)
                  </div>
                </div>
              )}
            />
          )}
        </CardContent>
      </Card>
    </AdminStructureLayout>
  );
};

export default AdminStructureIndex;
