import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDebounce } from '@/hooks/useDebounce';
import { apiClient } from '@/lib/api/client';
import type { PaginatedResponse } from '@/types/pagination';

interface UsePaginatedQueryOptions<T> {
  queryKey: string[];
  url: string;
  limit?: number;
  searchDebounceMs?: number;
  enabled?: boolean;
  staleTime?: number;
}

interface UsePaginatedQueryReturn<T> {
  data: T[];
  pagination: PaginatedResponse<T>['pagination'] | null;
  isLoading: boolean;
  error: Error | null;
  page: number;
  setPage: (page: number) => void;
  search: string;
  setSearch: (search: string) => void;
  refetch: () => void;
}

/**
 * Hook genérico para queries paginadas con TanStack Query.
 *
 * Maneja automáticamente:
 * - Paginación server-side (page, limit)
 * - Búsqueda server-side con debounce
 * - Caché de TanStack Query
 * - Reset de página cuando cambia el search
 *
 * @example
 * const { data, pagination, isLoading, page, setPage, search, setSearch } = usePaginatedQuery<Customer>({
 *   queryKey: ['customers'],
 *   url: '/customers',
 *   limit: 20,
 * });
 */
export function usePaginatedQuery<T = unknown>({
  queryKey,
  url,
  limit = 20,
  searchDebounceMs = 300,
  enabled = true,
  staleTime = 30_000,
}: UsePaginatedQueryOptions<T>): UsePaginatedQueryReturn<T> {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, searchDebounceMs);

  // Reset page to 1 when search changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', String(limit));
    if (debouncedSearch) {
      params.set('search', debouncedSearch);
    }
    return params.toString();
  }, [page, limit, debouncedSearch]);

  const fullUrl = useMemo(() => {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}${queryParams}`;
  }, [url, queryParams]);

  const { data: response, isLoading, error, refetch } = useQuery<PaginatedResponse<T>, Error>({
    queryKey: [...queryKey, page, limit, debouncedSearch],
    queryFn: async () => {
      const res = await apiClient.get<PaginatedResponse<T>>(fullUrl);
      return res.data;
    },
    staleTime,
    enabled,
  });

  return {
    data: response?.data ?? [],
    pagination: response?.pagination ?? null,
    isLoading,
    error,
    page,
    setPage,
    search,
    setSearch,
    refetch,
  };
}
