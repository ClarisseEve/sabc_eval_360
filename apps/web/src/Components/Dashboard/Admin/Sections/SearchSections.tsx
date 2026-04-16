import React from 'react';
import { Search, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/UI/Card/Card';
import { Input } from '@/Components/UI/Input/Input';
import { TruncatedList } from '@/Components/UI/TruncatedList/TruncatedList';

type SearchUserEntry = {
  matricule?: string | number;
  prenom?: string;
  nom?: string;
  role_nom?: string;
  role?: string;
  email?: string;
};

export function AdminUserSearchSection({
  search,
  onSearchChange,
  users,
  selectedMatricule,
  onSelect,
  isLoading,
  getDisplayName,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  users: SearchUserEntry[];
  selectedMatricule: string;
  onSelect: (matricule: string) => void;
  isLoading: boolean;
  getDisplayName: (user: SearchUserEntry) => string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recherche individuelle</CardTitle>
        <CardDescription>
          Recherche admin par matricule ou nom, avec accès aux évaluations reçues, données et aux scores détaillés.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative max-w-2xl">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sabc-gray-400" />
          <Input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Rechercher par matricule, nom, prénom, email ou rôle"
            className="pl-10"
          />
        </div>

        <TruncatedList
          items={users}
          previewCount={12}
          keyExtractor={(user) => String(user.matricule ?? '')}
          modalTitle="Tous les utilisateurs"
          modalDescription={`${users.length} utilisateur(s)`}
          className="grid gap-3 md:grid-cols-2 xl:grid-cols-3"
          modalClassName="grid gap-3 md:grid-cols-2"
          renderItem={(user) => {
            const matricule = String(user.matricule ?? '');
            return (
              <button
                type="button"
                onClick={() => onSelect(matricule)}
                className={`rounded-lg border p-4 text-left transition-colors ${
                  selectedMatricule === matricule
                    ? 'border-sabc-red-primary bg-sabc-red-primary/5'
                    : 'border-sabc-gray-200 hover:border-sabc-gray-300'
                }`}
              >
                <div className="font-medium text-sabc-gray-900 dark:text-white">{getDisplayName(user)}</div>
                <div className="text-sm text-sabc-gray-500 dark:text-sabc-gray-400">{user.role_nom || user.role}</div>
                <div className="mt-1 text-xs text-sabc-gray-400 dark:text-sabc-gray-500">{matricule} · {user.email}</div>
              </button>
            );
          }}
        />

        {isLoading ? (
          <div className="text-sm text-sabc-gray-500">Chargement des utilisateurs…</div>
        ) : null}

        {!isLoading && users.length === 0 ? (
          <div className="rounded-lg border border-dashed border-sabc-gray-300 p-6 text-center text-sabc-gray-500">
            Aucun utilisateur ne correspond à la recherche courante.
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function AdminSearchEmptySelection() {
  return (
    <Card>
      <CardContent className="flex min-h-[220px] flex-col items-center justify-center gap-3 text-center">
        <Users className="h-10 w-10 text-sabc-gray-300" />
        <div className="text-sm text-sabc-gray-500">
          Sélectionnez un collaborateur pour afficher sa fiche 360° administrateur.
        </div>
      </CardContent>
    </Card>
  );
}

export function AdminSearchLoadingSection() {
  return (
    <Card>
      <CardContent className="p-6 text-sm text-sabc-gray-500">Chargement des détails du collaborateur…</CardContent>
    </Card>
  );
}
