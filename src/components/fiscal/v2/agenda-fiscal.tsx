'use client';

import Link from 'next/link';
import { Calendar, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AgendaItem {
  id: string;
  title: string;
  subtitle?: string;
  dateLabel: string;
  urgency: 'high' | 'medium' | 'low';
  tipo?: string;
}

export function FiscalAgenda({ items, limit = 5 }: { items: AgendaItem[]; limit?: number }) {
  const list = items.slice(0, limit);

  const urgencyClass = (u: AgendaItem['urgency']) => {
    if (u === 'high') return 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-300';
    if (u === 'medium') return 'bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-200';
    return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300';
  };

  const barColor = (u: AgendaItem['urgency']) => {
    if (u === 'high') return '#ef4444';
    if (u === 'medium') return '#f59e0b';
    return 'hsl(var(--fiscal-accent))';
  };

  return (
    <div className="fiscal-v0-panel p-5 fiscal-v2-fade-in h-full">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-primary/10">
          <Calendar className="h-5 w-5 text-primary" />
        </div>
        <h2 className="text-lg font-bold">Agenda fiscal</h2>
        <span className="ml-auto text-xs fiscal-v0-muted">Próximos vencimientos</span>
      </div>
      <div className="space-y-2">
        {list.length === 0 ? (
          <p className="text-sm fiscal-v0-muted py-6 text-center">
            Sin vencimientos. Configure RIF en perfil y sincronice el calendario SENIAT.
          </p>
        ) : (
          list.map((item) => (
            <div
              key={item.id}
              className="group flex items-start gap-3 p-3 rounded-lg border border-border/60 bg-muted/30 hover:bg-muted/50 hover:border-primary/30 transition-all"
            >
              <div
                className="w-1 rounded-full shrink-0 self-stretch min-h-[2.5rem]"
                style={{ backgroundColor: barColor(item.urgency) }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-sm">{item.title}</p>
                    {item.subtitle && (
                      <p className="text-xs text-muted-foreground mt-0.5">{item.subtitle}</p>
                    )}
                  </div>
                  <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-md border', urgencyClass(item.urgency))}>
                    {item.urgency === 'high' ? 'Urgente' : item.urgency === 'medium' ? 'Próximo' : 'OK'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1 font-mono">{item.dateLabel}</p>
              </div>
            </div>
          ))
        )}
      </div>
      <Link
        href="/fiscal/calendario"
        className="mt-4 flex items-center justify-center gap-1 text-sm font-medium text-primary hover:underline"
      >
        Ver calendario completo
        <ChevronRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
