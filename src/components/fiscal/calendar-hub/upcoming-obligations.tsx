'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { FiscalCalendarHubViewModel } from '@/types/fiscal-calendar-hub';
import { FiscalHubCard, FiscalHubSectionTitle } from './fiscal-hub-card';
import { ComplianceBadge } from './severity-badge';
import { FiscalOnboardingState } from './fiscal-onboarding-state';
import { cn } from '@/lib/utils';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-VE', { day: 'numeric', month: 'short', year: 'numeric' });
}

function daysLabel(days: number) {
  if (days < 0) return `Venció hace ${Math.abs(days)} d`;
  if (days === 0) return 'Hoy';
  if (days === 1) return 'Mañana';
  return `${days} días`;
}

export function UpcomingObligations({
  data,
  onSync,
  syncing,
}: {
  data: FiscalCalendarHubViewModel;
  onSync: () => void;
  syncing?: boolean;
}) {
  const empty = data.obligations.length === 0;

  if (empty) {
    return (
      <FiscalOnboardingState
        profileConfigured={data.profile.configured}
        onSync={onSync}
        syncing={syncing}
      />
    );
  }

  return (
    <FiscalHubCard delay={0.12}>
      <FiscalHubSectionTitle
        title="Próximos vencimientos"
        description="Obligaciones del período ordenadas por urgencia. Priorice las marcadas en rojo o ámbar."
        action={
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <CalendarDays className="h-3.5 w-3.5" />
            {data.obligations.length} activas
          </span>
        }
      />

      <div className="hidden md:block rounded-xl border border-border/40 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Obligación</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Plazo</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acción</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.obligations.map((o) => (
              <TableRow
                key={o.id}
                className={cn(
                  'transition-colors hover:bg-muted/30',
                  o.daysLeft < 0 && 'bg-red-500/5',
                  o.daysLeft >= 0 && o.daysLeft <= 7 && 'bg-amber-500/5',
                )}
              >
                <TableCell>
                  <p className="font-medium text-sm">{o.name}</p>
                  <p className="text-xs text-muted-foreground">{o.code}</p>
                </TableCell>
                <TableCell className="text-sm">{formatDate(o.dueDate)}</TableCell>
                <TableCell>
                  <span
                    className={cn(
                      'text-sm font-medium',
                      o.daysLeft < 0 && 'text-red-500',
                      o.daysLeft <= 7 && o.daysLeft >= 0 && 'text-amber-600 dark:text-amber-400',
                    )}
                  >
                    {daysLabel(o.daysLeft)}
                  </span>
                </TableCell>
                <TableCell>
                  <ComplianceBadge compliance={o.compliance} />
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" asChild className="h-8">
                    <Link href={o.actionHref}>
                      {o.actionLabel}
                      <ArrowRight className="h-3.5 w-3.5 ml-1" />
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="md:hidden space-y-2">
        {data.obligations.map((o, i) => (
          <motion.div
            key={o.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className={cn(
              'rounded-xl border border-border/50 p-4 space-y-3',
              o.daysLeft < 0 && 'border-red-500/30',
            )}
          >
            <div className="flex justify-between gap-2">
              <div>
                <p className="font-medium text-sm">{o.name}</p>
                <p className="text-xs text-muted-foreground">{formatDate(o.dueDate)} · {daysLabel(o.daysLeft)}</p>
              </div>
              <ComplianceBadge compliance={o.compliance} />
            </div>
            <Button variant="outline" size="sm" className="w-full" asChild>
              <Link href={o.actionHref}>{o.actionLabel}</Link>
            </Button>
          </motion.div>
        ))}
      </div>
    </FiscalHubCard>
  );
}
