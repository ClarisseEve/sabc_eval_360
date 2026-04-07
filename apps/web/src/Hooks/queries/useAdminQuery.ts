import { useSuspenseQuery } from '@tanstack/react-query';
import { adminApi, hierarchyApi, utilisateursApi } from '@/Services/api';

export function useAdminUsers(params?: any) {
  return useSuspenseQuery({
    queryKey: ['admin', 'users', params],
    queryFn: () => adminApi.users.list(params).then(r => r.data),
  });
}

export function useAdminUser(matricule: string) {
  return useSuspenseQuery({
    queryKey: ['admin', 'users', matricule],
    queryFn: () => adminApi.users.get(matricule).then(r => r.data),
  });
}

export function useAdminRoles() {
  return useSuspenseQuery({
    queryKey: ['admin', 'roles'],
    queryFn: () => adminApi.roles.list().then(r => r.data),
  });
}

export function useAdminRole(id: string) {
  return useSuspenseQuery({
    queryKey: ['admin', 'roles', id],
    queryFn: () => adminApi.roles.get(id).then(r => r.data),
  });
}

export function useAdminRoleRules() {
  return useSuspenseQuery({
    queryKey: ['admin', 'roles', 'regles'],
    queryFn: () => adminApi.roles.regles().then(r => r.data),
  });
}

export function useAdminStructure() {
  return useSuspenseQuery({
    queryKey: ['admin', 'structure'],
    queryFn: async () => {
      const [regions, services, districts, secteurs] = await Promise.all([
        adminApi.structure.regions(),
        adminApi.structure.services(),
        adminApi.structure.districts(),
        adminApi.structure.secteurs(),
      ]);
      return {
        regions: regions.data,
        services: services.data,
        districts: districts.data,
        secteurs: secteurs.data,
      };
    },
  });
}

export function useSubordonnes() {
  return useSuspenseQuery({
    queryKey: ['hierarchy', 'subordonnes'],
    queryFn: () => hierarchyApi.getSubordonnes().then(r => r.data),
  });
}

export function useChaineManagriale() {
  return useSuspenseQuery({
    queryKey: ['hierarchy', 'chaine'],
    queryFn: () => hierarchyApi.getChaine().then(r => r.data),
  });
}
