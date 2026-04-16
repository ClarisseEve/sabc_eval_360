import { useState, useEffect, useCallback, useRef } from 'react';
import api from './api';

interface UseApiDataOptions {
  /** Skip automatic fetch on mount */
  manual?: boolean;
  /** Dependencies that trigger a re-fetch */
  deps?: any[];
}

interface UseApiDataReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Generic hook to fetch data from the NestJS API.
 * Replaces the old shared-props access pattern with direct API fetching.
 *
 * @example
 * const { data, loading } = useApiData<DashboardStats>('/dashboard');
 */
export function useApiData<T = any>(
  url: string,
  options: UseApiDataOptions = {},
): UseApiDataReturn<T> {
  const { manual = false, deps = [] } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(!manual);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<T>(url);
      if (mountedRef.current) {
        setData(res.data);
      }
    } catch (err: any) {
      if (mountedRef.current) {
        setError(err.response?.data?.message || err.message || 'Erreur inconnue');
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [url]);

  useEffect(() => {
    mountedRef.current = true;
    if (!manual) {
      fetchData();
    }
    return () => {
      mountedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manual, fetchData, ...deps]);

  return { data, loading, error, refetch: fetchData };
}

/**
 * Hook for mutations (POST/PUT/DELETE).
 * Returns a trigger function, loading state, and error.
 *
 * @example
 * const { trigger, loading } = useApiMutation<Evaluation>('post', '/evaluations');
 * await trigger({ evaluateur_matricule: 'US-01', ... });
 */
export function useApiMutation<T = any>(
  method: 'post' | 'put' | 'delete',
  url: string,
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<T | null>(null);

  const trigger = useCallback(
    async (body?: any): Promise<T> => {
      setLoading(true);
      setError(null);
      try {
        const res = await api[method]<T>(url, body);
        setData(res.data);
        return res.data;
      } catch (err: any) {
        const msg = err.response?.data?.message || err.message || 'Erreur inconnue';
        setError(msg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [method, url],
  );

  return { trigger, loading, error, data };
}

export default useApiData;
