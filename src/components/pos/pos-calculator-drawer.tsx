'use client';

import { useCallback, useMemo, useState } from 'react';
import { Calculator, Delete, Equal } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type PosCalculatorDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Aplica el resultado al campo de monto del carrito (USD). */
  onApplyAmount?: (amount: number) => void;
};

const KEYS = [
  ['C', '⌫', '%', '/'],
  ['7', '8', '9', '*'],
  ['4', '5', '6', '-'],
  ['1', '2', '3', '+'],
  ['0', '.', '='],
] as const;

export function PosCalculatorDrawer({
  open,
  onOpenChange,
  onApplyAmount,
}: PosCalculatorDrawerProps) {
  const [expression, setExpression] = useState('');
  const [display, setDisplay] = useState('0');

  const result = useMemo(() => {
    if (!expression.trim()) return parseFloat(display) || 0;
    try {
      const sanitized = expression
        .replace(/%/g, '/100*')
        .replace(/[^0-9+\-*/().]/g, '');
      if (!sanitized) return parseFloat(display) || 0;
      // eslint-disable-next-line no-new-func
      const val = Function(`"use strict"; return (${sanitized})`)();
      return Number.isFinite(val) ? val : parseFloat(display) || 0;
    } catch {
      return parseFloat(display) || 0;
    }
  }, [expression, display]);

  const handleKey = useCallback(
    (key: string) => {
      if (key === 'C') {
        setExpression('');
        setDisplay('0');
        return;
      }
      if (key === '⌫') {
        setDisplay((d) => (d.length <= 1 ? '0' : d.slice(0, -1)));
        setExpression((e) => e.slice(0, -1));
        return;
      }
      if (key === '=') {
        const rounded = Math.round(result * 100) / 100;
        setDisplay(String(rounded));
        setExpression(String(rounded));
        return;
      }
      if (['+', '-', '*', '/', '%'].includes(key)) {
        setExpression((e) => `${e || display}${key === '%' ? '%' : key}`);
        return;
      }
      setDisplay((d) => {
        if (d === '0' && key !== '.') return key;
        if (key === '.' && d.includes('.')) return d;
        return d + key;
      });
      if (['+', '-', '*', '/'].every((op) => !expression.endsWith(op))) {
        setExpression((e) => `${e}${key}`);
      } else {
        setExpression((e) => e.slice(0, -1) + key);
      }
    },
    [display, expression, result],
  );

  const handleApply = () => {
    const amount = Math.round(result * 100) / 100;
    if (amount > 0) onApplyAmount?.(amount);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-2xl border-t border-border/80 bg-card/95 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-md"
      >
        <SheetHeader className="pb-2 text-left">
          <SheetTitle className="flex items-center gap-2 text-base">
            <Calculator className="h-5 w-5 text-primary" />
            Calculadora rápida
          </SheetTitle>
        </SheetHeader>
        <div className="rounded-xl border border-border/60 bg-muted/30 px-4 py-3 text-right">
          <p className="min-h-[1.25rem] truncate text-xs text-muted-foreground tabular-nums">
            {expression || ' '}
          </p>
          <p className="text-3xl font-bold tabular-nums tracking-tight">{display}</p>
        </div>
        <div className="mt-3 grid grid-cols-4 gap-2">
          {KEYS.flat().map((key, i) => (
            <Button
              key={`${key}-${i}`}
              type="button"
              variant={['+', '-', '*', '/', '%', '='].includes(key) ? 'secondary' : 'outline'}
              className={cn(
                'h-12 min-h-[48px] touch-manipulation text-lg font-semibold tabular-nums',
                key === '0' && 'col-span-2',
                key === '=' && 'col-span-2 bg-primary text-primary-foreground hover:bg-primary/90',
              )}
              onClick={() => handleKey(key)}
            >
              {key === '⌫' ? <Delete className="h-5 w-5" /> : key === '=' ? <Equal className="h-5 w-5" /> : key}
            </Button>
          ))}
        </div>
        {onApplyAmount ? (
          <Button
            type="button"
            className="mt-4 h-12 w-full touch-manipulation text-base font-semibold"
            onClick={handleApply}
            disabled={!(result > 0)}
          >
            Usar {result > 0 ? `$${result.toFixed(2)}` : 'monto'} en el cobro
          </Button>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

export function PosCalculatorFab({
  onClick,
  className,
}: {
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label="Abrir calculadora"
      onClick={onClick}
      className={cn(
        'fixed z-40 flex h-12 w-12 items-center justify-center rounded-full border border-primary/30 bg-primary text-primary-foreground shadow-lg shadow-primary/25 transition-transform active:scale-95 touch-manipulation',
        className,
      )}
    >
      <Calculator className="h-5 w-5" />
    </button>
  );
}
