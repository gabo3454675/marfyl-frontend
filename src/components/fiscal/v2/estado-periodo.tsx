'use client';

import { useId } from 'react';
import { AlertCircle } from 'lucide-react';

export function FiscalEstadoPeriodo({
  porcentaje,
  label,
  descripcion,
}: {
  porcentaje: number;
  label: string;
  descripcion?: string;
}) {
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (Math.min(100, Math.max(0, porcentaje)) / 100) * circumference;
  const gradId = useId();

  return (
    <div className="fiscal-v0-panel p-6 flex flex-col items-center gap-4 fiscal-v2-fade-in h-full">
      <div className="relative w-40 h-40">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="45" stroke="hsl(var(--muted))" strokeWidth="8" fill="none" opacity={0.35} />
          <circle
            cx="60"
            cy="60"
            r="45"
            stroke={`url(#${gradId})`}
            strokeWidth="8"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-700"
          />
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(var(--fiscal-accent))" />
              <stop offset="100%" stopColor="#0284c7" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex items-center justify-center flex-col">
          <p className="text-3xl font-bold font-mono text-foreground">{Math.round(porcentaje)}%</p>
          <p className="text-[10px] uppercase tracking-widest fiscal-v0-muted">completado</p>
        </div>
      </div>
      <p className="text-lg font-semibold text-center">{label}</p>
      {descripcion && (
        <div className="flex items-start gap-2 text-xs bg-amber-500/10 border border-amber-500/25 rounded-lg p-3 text-amber-900 dark:text-amber-100 max-w-xs">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <p>{descripcion}</p>
        </div>
      )}
    </div>
  );
}
