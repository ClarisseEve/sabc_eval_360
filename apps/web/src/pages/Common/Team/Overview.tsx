import React from 'react';
import { Head } from '@/lib/inertia-shim';
import { Badge } from '@/Components/UI/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/UI/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/UI/Table';
import { TruncatedTableBody } from '@/Components/UI/TruncatedList/TruncatedList';
import { useSubordonnes } from '@/Hooks/queries';
import { EvaluationPageLayout } from '@/pages/Common/Evaluations/shared';
import { PageHeader } from '@/Components/UI/Page/PageHeader';
import { KpiCard, KpiGrid } from '@/Components/UI/KpiCard';

/** Nom lisible de la région ; le code seul n'est affiché qu'en dernier recours. */
function formatRegion(user: Record<string, any>): string {
  return user.region_nom || user.region?.nom_region || user.region?.nom || user.id_region || 'n.d.';
}

export default function TeamOverviewPage() {
  const { data } = useSubordonnes();
  const subordonnes = Array.isArray(data) ? data : [];

  // Le statut d'activité ou de disponibilité peut être absent de la réponse :
  // on affiche alors « n.d. » au lieu d'en déduire « inactif » ou « disponible ».
  const hasActiveField = subordonnes.some((user: any) => typeof user.est_actif === 'boolean');
  const hasAvailabilityField = subordonnes.some((user: any) =>
    typeof user.est_indisponible === 'boolean' || typeof user.statut === 'string',
  );
  const actifs = hasActiveField
    ? subordonnes.filter((user: any) => user.est_actif === true).length
    : null;
  const indisponibles = hasAvailabilityField
    ? subordonnes.filter((user: any) => user.est_indisponible === true || user.statut === 'Indisponible').length
    : null;
  const sansManager = subordonnes.filter((user: any) => !user.manager_matricule).length;

  return (
    <EvaluationPageLayout pageTitle="Mon équipe">
      <Head title="Mon équipe - SABC Eval360" />
      <div className="space-y-6">
        <PageHeader
          title="Mon équipe"
          description="Les collaborateurs placés sous votre responsabilité directe."
        />

        <KpiGrid>
          <KpiCard label="Total" value={subordonnes.length} />
          <KpiCard label="Actifs" value={actifs} />
          <KpiCard label="Indisponibles" value={indisponibles} />
          <KpiCard label="Sans manager" value={sansManager} />
        </KpiGrid>

        <Card>
          <CardHeader>
            <CardTitle>Subordonnés directs ({subordonnes.length})</CardTitle>
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
                        <TableCell>{user.role_nom || user.role || 'n.d.'}</TableCell>
                        <TableCell>{formatRegion(user)}</TableCell>
                        <TableCell>
                          {user.statut ? (
                            <Badge variant={user.statut === 'Indisponible' ? 'warning' : 'outline'}>{user.statut}</Badge>
                          ) : typeof user.est_actif === 'boolean' ? (
                            <Badge variant={user.est_actif ? 'success' : 'outline'}>
                              {user.est_actif ? 'Actif' : 'Inactif'}
                            </Badge>
                          ) : (
                            <span className="text-sm text-sabc-gray-500">n.d.</span>
                          )}
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
