import React from 'react';
import { Head } from '@/lib/inertia-shim';
import { Link } from '@/lib/inertia-shim';
import AppLayout from '@/Components/Layout/app/AppLayout';
import { Card, CardHeader, CardContent, CardFooter } from '@/Components/UI/Card/Card';
import { Button } from '@/Components/UI/Button/Button';

/**
 * Page de détails d'un remplacement temporaire
 */
interface Utilisateur {
  id: number;
  matricule: string;
  nom: string;
  email: string;
  telephone: string;
  role: string;
}

interface Role {
  id: number;
  nom: string;
  description: string;
}

interface Remplacement {
  id: number;
  remplacant: Utilisateur;
  remplace: Utilisateur;
  role: Role;
  date_debut: string;
  date_fin: string;
  motif: string;
  statut: string;
  created_at: string;
  updated_at: string;
}

interface ShowProps {
  remplacement?: Remplacement;
  auth: {
    user: {
      name: string;
      email: string;
      role: string;
      avatar?: string;
    }
  };
}

export default function Show({ remplacement, auth }: ShowProps) {
  // Données de démonstration pour le remplacement
  const replacementData = remplacement || {
    id: 1,
    remplacant: {
      id: 1,
      nom: 'Jean Dupont',
      matricule: 'EMP001',
      role: 'CDV',
      email: 'jean.dupont@sabc.cm',
      telephone: '+237 6XX XX XX XX'
    },
    remplace: {
      id: 2,
      nom: 'Marie Martin',
      matricule: 'EMP002',
      role: 'CDS',
      email: 'marie.martin@sabc.cm',
      telephone: '+237 6XX XX XX XX'
    },
    role: {
      id: 4,
      nom: 'CDV',
      description: 'Chef District Vente'
    },
    date_debut: '2025-06-01',
    date_fin: '2025-06-30',
    motif: 'Congé maladie',
    statut: 'actif',
    created_at: '2025-05-15T10:30:00',
    updated_at: '2025-05-15T10:30:00'
  };

  return (
    <AppLayout user={auth.user}>
      <Head title={`Détails du Remplacement #${replacementData.id}`} />
      
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-semibold text-gray-900">Détails du Remplacement</h1>
            <div className="flex space-x-3">
              <Link href={`/admin/remplacements/${replacementData.id}/edit`}>
                <Button
                  variant="secondary"
                  type="button"
                >
                  Modifier
                </Button>
              </Link>
              {replacementData.statut === 'actif' && (
                <Button
                  onClick={() => {
                    if (confirm('Êtes-vous sûr de vouloir terminer ce remplacement ?')) {
                      // Logique pour terminer le remplacement
                    }
                  }}
                  variant="outline"
                >
                  Terminer
                </Button>
              )}
            </div>
          </div>
          
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <h2 className="text-lg font-medium">Informations générales</h2>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-1 gap-4">
                  <div className="sm:grid sm:grid-cols-3 sm:gap-4">
                    <dt className="text-sm font-medium text-gray-500">ID</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {replacementData.id}
                    </dd>
                  </div>
                  <div className="sm:grid sm:grid-cols-3 sm:gap-4">
                    <dt className="text-sm font-medium text-gray-500">Statut</dt>
                    <dd className="mt-1 text-sm sm:mt-0 sm:col-span-2">
                      <span 
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          replacementData.statut === 'actif' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {replacementData.statut}
                      </span>
                    </dd>
                  </div>
                  <div className="sm:grid sm:grid-cols-3 sm:gap-4">
                    <dt className="text-sm font-medium text-gray-500">Date de début</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {replacementData.date_debut}
                    </dd>
                  </div>
                  <div className="sm:grid sm:grid-cols-3 sm:gap-4">
                    <dt className="text-sm font-medium text-gray-500">Date de fin</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {replacementData.date_fin}
                    </dd>
                  </div>
                  <div className="sm:grid sm:grid-cols-3 sm:gap-4">
                    <dt className="text-sm font-medium text-gray-500">Rôle temporaire</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {replacementData.role.nom} - {replacementData.role.description}
                    </dd>
                  </div>
                  <div className="sm:grid sm:grid-cols-3 sm:gap-4">
                    <dt className="text-sm font-medium text-gray-500">Motif</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {replacementData.motif}
                    </dd>
                  </div>
                  <div className="sm:grid sm:grid-cols-3 sm:gap-4">
                    <dt className="text-sm font-medium text-gray-500">Créé le</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {new Date(replacementData.created_at).toLocaleString()}
                    </dd>
                  </div>
                  <div className="sm:grid sm:grid-cols-3 sm:gap-4">
                    <dt className="text-sm font-medium text-gray-500">Mis à jour le</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {new Date(replacementData.updated_at).toLocaleString()}
                    </dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
            
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <h2 className="text-lg font-medium">Remplaçant</h2>
                </CardHeader>
                <CardContent>
                  <dl className="grid grid-cols-1 gap-4">
                    <div className="sm:grid sm:grid-cols-3 sm:gap-4">
                      <dt className="text-sm font-medium text-gray-500">Nom</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        {replacementData.remplacant.nom}
                      </dd>
                    </div>
                    <div className="sm:grid sm:grid-cols-3 sm:gap-4">
                      <dt className="text-sm font-medium text-gray-500">Matricule</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        {replacementData.remplacant.matricule}
                      </dd>
                    </div>
                    <div className="sm:grid sm:grid-cols-3 sm:gap-4">
                      <dt className="text-sm font-medium text-gray-500">Rôle habituel</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        {replacementData.remplacant.role}
                      </dd>
                    </div>
                    <div className="sm:grid sm:grid-cols-3 sm:gap-4">
                      <dt className="text-sm font-medium text-gray-500">Email</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        {replacementData.remplacant.email}
                      </dd>
                    </div>
                    <div className="sm:grid sm:grid-cols-3 sm:gap-4">
                      <dt className="text-sm font-medium text-gray-500">Téléphone</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        {replacementData.remplacant.telephone}
                      </dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <h2 className="text-lg font-medium">Remplacé</h2>
                </CardHeader>
                <CardContent>
                  <dl className="grid grid-cols-1 gap-4">
                    <div className="sm:grid sm:grid-cols-3 sm:gap-4">
                      <dt className="text-sm font-medium text-gray-500">Nom</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        {replacementData.remplace.nom}
                      </dd>
                    </div>
                    <div className="sm:grid sm:grid-cols-3 sm:gap-4">
                      <dt className="text-sm font-medium text-gray-500">Matricule</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        {replacementData.remplace.matricule}
                      </dd>
                    </div>
                    <div className="sm:grid sm:grid-cols-3 sm:gap-4">
                      <dt className="text-sm font-medium text-gray-500">Rôle habituel</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        {replacementData.remplace.role}
                      </dd>
                    </div>
                    <div className="sm:grid sm:grid-cols-3 sm:gap-4">
                      <dt className="text-sm font-medium text-gray-500">Email</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        {replacementData.remplace.email}
                      </dd>
                    </div>
                    <div className="sm:grid sm:grid-cols-3 sm:gap-4">
                      <dt className="text-sm font-medium text-gray-500">Téléphone</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        {replacementData.remplace.telephone}
                      </dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>
            </div>
          </div>
          
          <div className="mt-6 flex justify-between">
            <Link href="/admin/remplacements">
              <Button
                variant="secondary"
                type="button"
              >
                Retour à la liste
              </Button>
            </Link>
            <Button
              onClick={() => {
                if (confirm('Êtes-vous sûr de vouloir supprimer ce remplacement ?')) {
                  // Logique pour supprimer le remplacement
                }
              }}
              variant="destructive"
            >
              Supprimer
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
