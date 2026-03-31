import { useSuspenseQuery } from '@tanstack/react-query';
import { dashboardApi, analyticsApi } from '@/Services/api';

export function useMyDashboard() {
  return useSuspenseQuery({
    queryKey: ['dashboard', 'my'],
    queryFn: () => dashboardApi.getMy().then(r => r.data),
  });
}

export function useAdminDashboard() {
  return useSuspenseQuery({
    queryKey: ['dashboard', 'admin'],
    queryFn: () => dashboardApi.getAdmin().then(r => r.data),
  });
}

export function useDashboardStats() {
  return useSuspenseQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: () => dashboardApi.getStats().then(r => r.data),
  });
}

export function useAnalyticsDashboard() {
  return useSuspenseQuery({
    queryKey: ['analytics', 'dashboard'],
    queryFn: () => analyticsApi.dashboard().then(r => r.data),
  });
}

export function useRegionAnalytics(idRegion: string) {
  return useSuspenseQuery({
    queryKey: ['analytics', 'region', idRegion],
    queryFn: () => analyticsApi.region(idRegion).then(r => r.data),
  });
}
