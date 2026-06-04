import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';

/**
 * Hook genérico para fetching tipado con TanStack Query.
 *
 * @example
 * const { data, isLoading, error } = useApiQuery<User[]>(['users'], '/users');
 */
export function useApiQuery<TData = unknown>(
  queryKey: readonly unknown[],
  url: string,
  options?: Omit<UseQueryOptions<TData, Error, TData, readonly unknown[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery<TData, Error, TData, readonly unknown[]>({
    queryKey,
    queryFn: async () => {
      const response = await apiClient.get<TData>(url);
      return response.data;
    },
    ...options,
  });
}
