'use client';

import { Button } from '@/components/ui/button';
import type { PaginatedResponse } from '@/types/pagination';

interface PaginationControlsProps {
  pagination: PaginatedResponse<unknown>['pagination'];
  page: number;
  setPage: (page: number) => void;
  itemLabel?: string; // ej. "clientes", "productos"
}

export function PaginationControls({
  pagination,
  page,
  setPage,
  itemLabel = 'registros',
}: PaginationControlsProps) {
  if (pagination.totalPages <= 1) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-4 py-3 border-t">
      <div className="text-sm text-muted-foreground">
        Mostrando {pagination.limit} de {pagination.total} {itemLabel}
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage(page - 1)}
          disabled={page <= 1}
        >
          Anterior
        </Button>
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          Página {pagination.page} de {pagination.totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage(page + 1)}
          disabled={page >= pagination.totalPages}
        >
          Siguiente
        </Button>
      </div>
    </div>
  );
}
