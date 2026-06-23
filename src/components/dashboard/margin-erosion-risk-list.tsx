'use client';

import { AlertTriangle, ChevronRight } from 'lucide-react';
import { AdminChartCard } from '@/components/admin/admin-card';
import { cn } from '@/lib/utils';
import type { MarginErosionProduct } from './types';

interface MarginErosionRiskListProps {
  products: MarginErosionProduct[];
  loading: boolean;
  formatForDisplay: (value: number) => string;
  onProductClick?: (productId: number) => void;
}

export function MarginErosionRiskList({
  products,
  loading,
  formatForDisplay,
  onProductClick,
}: MarginErosionRiskListProps) {
  const critical = products.filter((p) => p.marginCritical);
  const sorted = [...products].sort((a, b) => a.marginPct - b.marginPct);

  return (
    <AdminChartCard
      title="Erosión de margen"
      description="Productos en riesgo por inestabilidad de tasa BCV (margen &lt; 15%)"
      bodyClassName="space-y-3"
    >
      {loading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">Cargando...</div>
      ) : sorted.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">Sin productos con precio de venta</p>
      ) : (
        <>
          {critical.length > 0 && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>
                <strong>{critical.length}</strong> producto{critical.length === 1 ? '' : 's'} con margen crítico
              </span>
            </div>
          )}
          <ul className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
            {sorted.slice(0, 12).map((p) => (
              <li key={p.productId}>
                <button
                  type="button"
                  onClick={() => onProductClick?.(p.productId)}
                  className={cn(
                    'w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors',
                    'hover:bg-secondary/80 border',
                    p.marginCritical
                      ? 'bg-red-500/5 border-red-500/25 hover:border-red-500/40'
                      : 'bg-secondary/40 border-border/40 hover:border-border',
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{p.productName}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Costo {formatForDisplay(p.costPrice)} → Venta {formatForDisplay(p.salePrice)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={cn(
                        'text-sm font-bold tabular-nums',
                        p.marginCritical ? 'text-red-400' : 'text-emerald-400',
                      )}
                    >
                      {p.marginPct}%
                    </span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </AdminChartCard>
  );
}
