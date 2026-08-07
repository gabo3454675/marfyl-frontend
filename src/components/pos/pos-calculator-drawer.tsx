'use client';

import { useCallback, useEffect, useState } from 'react';
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

type Op = '+' | '-' | '*' | '/';

const KEYS = [
  ['C', '⌫', '%', '/'],
  ['7', '8', '9', '*'],
  ['4', '5', '6', '-'],
  ['1', '2', '3', '+'],
  ['0', '.', '='],
] as const;

function roundMoney(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100) / 100;
}

function formatDisplay(n: number): string {
  if (!Number.isFinite(n)) return 'Error';
  const rounded = roundMoney(n);
  // Evitar "12.00" cuando es entero; mantener decimales útiles
  if (Number.isInteger(rounded)) return String(rounded);
  return String(rounded);
}

function applyOp(a: number, op: Op, b: number): number {
  switch (op) {
    case '+':
      return a + b;
    case '-':
      return a - b;
    case '*':
      return a * b;
    case '/':
      return b === 0 ? NaN : a / b;
  }
}

type CalcState = {
  /** Valor mostrado / operando actual (string para permitir "12.") */
  current: string;
  /** Resultado parcial pendiente de un operador */
  acc: number | null;
  pendingOp: Op | null;
  /** Tras '=', el siguiente dígito empieza número nuevo */
  fresh: boolean;
  /** Expresión corta para la línea secundaria */
  tape: string;
};

const INITIAL: CalcState = {
  current: '0',
  acc: null,
  pendingOp: null,
  fresh: true,
  tape: '',
};

export function PosCalculatorDrawer({
  open,
  onOpenChange,
  onApplyAmount,
}: PosCalculatorDrawerProps) {
  const [state, setState] = useState<CalcState>(INITIAL);

  useEffect(() => {
    if (open) setState(INITIAL);
  }, [open]);

  const currentValue = () => {
    const n = parseFloat(state.current);
    return Number.isFinite(n) ? n : 0;
  };

  const handleKey = useCallback((key: string) => {
    setState((prev) => {
      if (key === 'C') return INITIAL;

      if (key === '⌫') {
        if (prev.fresh || prev.current === 'Error') {
          return { ...prev, current: '0', fresh: true };
        }
        const next = prev.current.length <= 1 ? '0' : prev.current.slice(0, -1);
        return { ...prev, current: next === '-' ? '0' : next };
      }

      if (key === '%') {
        const n = parseFloat(prev.current);
        if (!Number.isFinite(n)) return prev;
        // Con operador pendiente: 200 + 10% → 200 + (200*10/100)
        let pct: number;
        if (prev.acc != null && prev.pendingOp && (prev.pendingOp === '+' || prev.pendingOp === '-')) {
          pct = (prev.acc * n) / 100;
        } else {
          pct = n / 100;
        }
        return {
          ...prev,
          current: formatDisplay(pct),
          fresh: true,
        };
      }

      if (key === '+' || key === '-' || key === '*' || key === '/') {
        const op = key as Op;
        const cur = parseFloat(prev.current);
        if (!Number.isFinite(cur)) return INITIAL;

        let nextAcc = cur;
        let tape = prev.tape;

        if (prev.acc != null && prev.pendingOp && !prev.fresh) {
          nextAcc = applyOp(prev.acc, prev.pendingOp, cur);
          if (!Number.isFinite(nextAcc)) {
            return { ...INITIAL, current: 'Error', tape: 'Error' };
          }
          tape = `${formatDisplay(prev.acc)} ${prev.pendingOp} ${formatDisplay(cur)}`;
        } else if (prev.acc != null && prev.pendingOp && prev.fresh) {
          // Cambiar operador sin nuevo número: 12 + → 12 -
          return {
            ...prev,
            pendingOp: op,
            tape: `${formatDisplay(prev.acc)} ${op}`,
          };
        } else {
          tape = `${formatDisplay(cur)} ${op}`;
        }

        return {
          current: formatDisplay(nextAcc),
          acc: nextAcc,
          pendingOp: op,
          fresh: true,
          tape,
        };
      }

      if (key === '=') {
        const cur = parseFloat(prev.current);
        if (!Number.isFinite(cur)) return INITIAL;
        if (prev.acc == null || !prev.pendingOp) {
          return {
            ...prev,
            current: formatDisplay(cur),
            fresh: true,
            tape: formatDisplay(cur),
          };
        }
        const out = applyOp(prev.acc, prev.pendingOp, cur);
        if (!Number.isFinite(out)) {
          return { ...INITIAL, current: 'Error', tape: 'Error' };
        }
        return {
          current: formatDisplay(out),
          acc: null,
          pendingOp: null,
          fresh: true,
          tape: `${formatDisplay(prev.acc)} ${prev.pendingOp} ${formatDisplay(cur)} =`,
        };
      }

      // Dígito o punto
      if (key === '.') {
        if (prev.fresh || prev.current === 'Error') {
          return { ...prev, current: '0.', fresh: false };
        }
        if (prev.current.includes('.')) return prev;
        return { ...prev, current: `${prev.current}.`, fresh: false };
      }

      if (/^\d$/.test(key)) {
        if (prev.fresh || prev.current === 'Error' || prev.current === '0') {
          return { ...prev, current: key, fresh: false };
        }
        // Limitar longitud razonable para POS
        if (prev.current.replace('.', '').length >= 12) return prev;
        return { ...prev, current: prev.current + key, fresh: false };
      }

      return prev;
    });
  }, []);

  const result = roundMoney(currentValue());
  const canApply = Number.isFinite(result) && result > 0 && state.current !== 'Error';

  const handleApply = () => {
    if (!canApply) return;
    onApplyAmount?.(result);
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
            {state.tape || ' '}
          </p>
          <p className="text-3xl font-bold tabular-nums tracking-tight">{state.current}</p>
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
            disabled={!canApply}
          >
            Usar {canApply ? `$${result.toFixed(2)}` : 'monto'} en el cobro
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
