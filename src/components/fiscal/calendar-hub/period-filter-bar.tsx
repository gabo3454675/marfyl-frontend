'use client';

import { motion } from 'framer-motion';
import { Calendar, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { periodLabel } from '@/lib/fiscal/calendar-hub-mapper';
import { cn } from '@/lib/utils';

const MONTHS = [
  { v: '1', label: 'Enero' },
  { v: '2', label: 'Febrero' },
  { v: '3', label: 'Marzo' },
  { v: '4', label: 'Abril' },
  { v: '5', label: 'Mayo' },
  { v: '6', label: 'Junio' },
  { v: '7', label: 'Julio' },
  { v: '8', label: 'Agosto' },
  { v: '9', label: 'Septiembre' },
  { v: '10', label: 'Octubre' },
  { v: '11', label: 'Noviembre' },
  { v: '12', label: 'Diciembre' },
];

const YEARS = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 1 + i);

export function PeriodFilterBar({
  year,
  month,
  onYearChange,
  onMonthChange,
  onRefresh,
  loading,
}: {
  year: number;
  month: number;
  onYearChange: (y: number) => void;
  onMonthChange: (m: number) => void;
  onRefresh: () => void;
  loading?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="fiscal-hub-filter flex flex-wrap items-end gap-3 rounded-xl border border-border/50 bg-muted/20 px-4 py-3 dark:bg-slate-900/40"
    >
      <div className="flex items-center gap-2 text-sm text-muted-foreground mr-auto">
        <Calendar className="h-4 w-4 shrink-0 text-primary" />
        <span className="font-medium text-foreground">{periodLabel(year, month)}</span>
      </div>
      <div className="flex flex-wrap items-end gap-2">
        <div className="space-y-1">
          <label className="text-[10px] uppercase tracking-wide text-muted-foreground">Año</label>
          <Select value={String(year)} onValueChange={(v) => onYearChange(Number(v))}>
            <SelectTrigger className="w-[100px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {YEARS.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] uppercase tracking-wide text-muted-foreground">Mes</label>
          <Select value={String(month)} onValueChange={(v) => onMonthChange(Number(v))}>
            <SelectTrigger className="w-[130px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((m) => (
                <SelectItem key={m.v} value={m.v}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button type="button" variant="outline" size="sm" className="h-9" onClick={onRefresh} disabled={loading}>
          <RefreshCw className={cn('h-4 w-4 mr-1.5', loading && 'animate-spin')} />
          Actualizar
        </Button>
      </div>
    </motion.div>
  );
}
