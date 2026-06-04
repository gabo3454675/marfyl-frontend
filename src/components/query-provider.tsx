'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/query/client';

/**
 * Provider de TanStack Query montado una sola vez en el layout raíz.
 *
 * Usa la instancia singleton exportada desde `src/lib/query/client.ts` para que
 * los defaults (staleTime, retry, refetchOnWindowFocus) estén centralizados.
 */
export function QueryProvider({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
