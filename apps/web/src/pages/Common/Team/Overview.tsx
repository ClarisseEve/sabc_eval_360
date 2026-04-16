import React from 'react';
import { Head } from '@/lib/inertia-shim';
import { Badge } from '@/Components/UI/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/UI/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/UI/Table';
import { TruncatedTableBody } from '@/Components/UI/TruncatedList/TruncatedList';
import { useSubordonnes } from '@/Hooks/queries';
import { EvaluationPageLayout } from '@/pages/Common/Evaluations/shared';

export default function TeamOverviewPage() {
  const { data } = useSubordonnes();
  const subordonnes = Array.isArray(data) ? data : [];

  const actifs = subordonnes.filter((user: any) => user.est_actif).length;
  const indisponibles = subordonnes.filter((user: any) => user.est_indisponible || user.statut === 'Indisponible').length;
  const sansManager = subordonnes.filter((user: any) => !user.manager_matricule).length;

  return (
    <EvaluationPageLayout pageTitle="Mon équipe">
      <Head title="Mon équipe — SABC Eval360" />
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-sabc-gray-900">Mon équipe</h1>
          <p className="text-sm text-sabc-gray-600">Vue réelle des subordonnés remontés par la hiérarchie NestJS.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card><CardContent className="p-4"><div className="text-sm text-sabc-gray-600">Total</div><div className="text-2xl font-bold">{subordonnes.length}</div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="text-sm text-sabc-gray-600">Actifs</div><div className="text-2xl font-bold">{actifs}</div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="text-sm text-sabc-gray-600">Indisponibles</div><div className="text-2xl font-bold">{indisponibles}</div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="text-sm text-sabc-gray-600">Sans manager</div><div className="text-2xl font-bold">{sansManager}</div></CardContent></Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Subordonnés directs</CardTitle>
          </CardHeader>
          <CardContent>
            {subordonnes.length === 0 ? (
              <div className="py-10 text-center text-sm text-sabc-gray-500">
                Aucun subordonné trouvé pour votre profil.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Matricule</TableHead>
                    <TableHead>Nom</TableHead>
                    <TableHead>Rôle</TableHead>
                    <TableHead>Région</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TruncatedTableBody
                    items={subordonnes}
                    previewCount={10}
                    colSpan={5}
                    keyExtractor={(user: any) => user.matricule}
                    renderRow={(user: any) => (
                      <TableRow key={user.matricule}>
                        <TableCell>{user.matricule}</TableCell>
                        <TableCell>{[user.prenom, user.nom].filter(Boolean).join(' ')}</TableCell>
                        <TableCell>{user.role}</TableCell>
                        <TableCell>{user.id_region || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge variant={user.est_actif ? 'default' : 'outline'}>
                            {user.statut || (user.est_actif ? 'Actif' : 'Inactif')}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    )}
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
