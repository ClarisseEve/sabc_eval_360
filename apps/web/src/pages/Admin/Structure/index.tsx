import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/UI/Card/Card';
import { useAdminStructure } from '@/Hooks/queries';
import { AdminStructureLayout } from './shared';

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
          Vue consolidée de la hiérarchie commerciale branchée sur les données NestJS.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardContent className="p-6"><div className="text-sm text-sabc-gray-500">Régions</div><div className="text-3xl font-semibold">{regions.length}</div></CardContent></Card>
        <Card><CardContent className="p-6"><div className="text-sm text-sabc-gray-500">Services</div><div className="text-3xl font-semibold">{services.length}</div></CardContent></Card>
        <Card><CardContent className="p-6"><div className="text-sm text-sabc-gray-500">Districts</div><div className="text-3xl font-semibold">{districts.length}</div></CardContent></Card>
        <Card><CardContent className="p-6"><div className="text-sm text-sabc-gray-500">Secteurs</div><div className="text-3xl font-semibold">{secteurs.length}</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Répartition par région</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {regions.map((region: any) => (
            <div key={region.id_region} className="flex items-center justify-between rounded-lg border border-sabc-gray-200 p-4">
              <div>
                <div className="font-medium text-sabc-gray-900">{region.nom_region}</div>
                <div className="text-xs text-sabc-gray-500">{region.est_taniere ? 'Tanière' : 'Non tanière'}</div>
              </div>
              <div className="text-sm text-sabc-gray-500">
                {(services.filter((service: any) => service.id_region === region.id_region)).length} service(s)
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </AdminStructureLayout>
  );
};

export default AdminStructureIndex;
