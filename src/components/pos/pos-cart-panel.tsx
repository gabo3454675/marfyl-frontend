'use client';

import { AdminCard } from '@/components/admin/admin-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Loader2, Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { round2 } from '@/lib/currencyConversion';

type CurrencyMode = 'BS' | 'USD';
type PaymentMethod = 'CASH_USD' | 'CASH_BS' | 'PAGO_MOVIL' | 'ZELLE' | 'CARD' | 'CREDIT';

const BS_PAYMENT_METHODS: PaymentMethod[] = ['CASH_BS', 'PAGO_MOVIL'];

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  CASH_USD: 'Efectivo USD',
  CASH_BS: 'Efectivo Bs',
  PAGO_MOVIL: 'Pago Móvil',
  ZELLE: 'Zelle',
  CARD: 'Tarjeta',
  CREDIT: 'Crédito',
};

interface PosProduct {
  id: number;
  name: string;
  salePrice: number;
  stock: number;
  isBundle?: boolean;
  isService?: boolean;
  bundleComponents?: { productId: number; quantity: number }[] | null;
}

interface Customer {
  id: number;
  name: string;
}

interface CartItem {
  product: PosProduct;
  quantity: number;
}

export interface PosCartPanelProps {
  cart: CartItem[];
  currencyMode: CurrencyMode;
  onCurrencyModeChange: (mode: CurrencyMode) => void;
  customers: Customer[];
  selectedCustomerId: number | null;
  onCustomerChange: (id: number | null) => void;
  paymentMethod: PaymentMethod;
  onPaymentMethodChange: (method: PaymentMethod) => void;
  splitPayment: boolean;
  onSplitPaymentChange: (value: boolean) => void;
  splitLines: Array<{ method: PaymentMethod; amount: string }>;
  onSplitLinesChange: (lines: Array<{ method: PaymentMethod; amount: string }>) => void;
  customerCredit: {
    limitAmount: number;
    currentBalance: number;
    status: string;
    available: number;
  } | null;
  total: number;
  subtotal: number;
  ivaAmount: number;
  tasaBcv: number;
  splitEquivalentUsd: number;
  processing: boolean;
  formatCurrency: (amount: number, forceCurrency?: CurrencyMode) => string;
  getUnitPriceDisplay: (product: PosProduct) => number;
  sellableUnits: (product: PosProduct) => number;
  onUpdateQuantity: (productId: number, delta: number) => void;
  onRemoveFromCart: (productId: number) => void;
  onCheckout: () => void;
  showCheckoutButton?: boolean;
  compact?: boolean;
  className?: string;
}

export function PosCartPanel({
  cart,
  currencyMode,
  onCurrencyModeChange,
  customers,
  selectedCustomerId,
  onCustomerChange,
  paymentMethod,
  onPaymentMethodChange,
  splitPayment,
  onSplitPaymentChange,
  splitLines,
  onSplitLinesChange,
  customerCredit,
  total,
  subtotal,
  ivaAmount,
  tasaBcv,
  splitEquivalentUsd,
  processing,
  formatCurrency,
  getUnitPriceDisplay,
  sellableUnits,
  onUpdateQuantity,
  onRemoveFromCart,
  onCheckout,
  showCheckoutButton = true,
  compact = false,
  className,
}: PosCartPanelProps) {
  const cartUnits = cart.reduce((sum, item) => sum + item.quantity, 0);

  const checkoutButton = showCheckoutButton ? (
    <Button
      className={cn(
        'admin-pos-checkout-btn h-14 w-full touch-manipulation text-base font-bold tracking-wide sm:text-lg rounded-xl',
        compact ? 'flex' : 'mt-3 hidden lg:flex',
        cart.length === 0 || processing ? '' : 'shadow-lg shadow-primary/20',
      )}
      onClick={onCheckout}
      disabled={cart.length === 0 || processing}
    >
      {processing ? (
        <>
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Procesando...
        </>
      ) : (
        <>
          <ShoppingCart className="mr-2 h-5 w-5" />
          Cobrar · {formatCurrency(total)}
        </>
      )}
    </Button>
  ) : null;

  return (
    <AdminCard
      title={
        <span className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          Carrito de Venta
          {cart.length > 0 ? (
            <Badge variant="secondary" className="ml-1 tabular-nums">
              {cartUnits}
            </Badge>
          ) : null}
        </span>
      }
      className={cn('admin-pos-panel h-full max-h-[inherit]', className)}
      bodyClassName={cn('admin-pos-cart-body', compact ? 'flex min-h-0 flex-1 flex-col p-3' : 'p-4 sm:p-5')}
      elevation="sm"
    >
      <div
        className={cn(
          'admin-pos-cart-controls',
          splitPayment && 'max-h-[min(36dvh,17rem)] overflow-y-auto overscroll-y-contain pr-1',
        )}
      >
        <div>
          <Label className="mb-2 block text-sm font-medium">Moneda de pago</Label>
          <div className="flex gap-2">
            <button
              type="button"
              className={cn(
                'admin-pos-pay-method-btn flex-1',
                currencyMode === 'BS' && 'admin-pos-pay-method-btn--active',
              )}
              onClick={() => onCurrencyModeChange('BS')}
            >
              Bs. Bolívares
            </button>
            <button
              type="button"
              className={cn(
                'admin-pos-pay-method-btn flex-1',
                currencyMode === 'USD' && 'admin-pos-pay-method-btn--active',
              )}
              onClick={() => onCurrencyModeChange('USD')}
            >
              $ Dólares
            </button>
          </div>
        </div>

        <div>
          <Label htmlFor={compact ? 'customer-mobile' : 'customer'} className="block text-sm font-medium mb-1.5">Cliente</Label>
          <select
            id={compact ? 'customer-mobile' : 'customer'}
            value={selectedCustomerId || ''}
            onChange={(e) => onCustomerChange(e.target.value ? Number(e.target.value) : null)}
            className="h-11 min-h-[44px] w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm shadow-sm transition-all duration-150 ease-out focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/15"
          >
            <option value="">Cliente Genérico</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
              </option>
            ))}
          </select>
          {paymentMethod === 'CREDIT' && customerCredit && (
            <p className="mt-1.5 text-xs text-muted-foreground">
              Límite disponible:{' '}
              <span className={cn(
                'font-semibold tabular-nums',
                total > customerCredit.available ? 'text-destructive' : 'text-emerald-600 dark:text-emerald-400',
              )}>
                ${customerCredit.available.toFixed(2)}
              </span>
              {total > customerCredit.available && (
                <span className="ml-1.5 text-destructive">· insuficiente</span>
              )}
            </p>
          )}
        </div>

        <div className="space-y-3">
          <Label className="block text-sm font-medium">Modalidades de pago</Label>
          <div className="flex min-h-[44px] items-center justify-between gap-3 rounded-xl border border-border/60 bg-card/50 px-4 py-2.5">
            <Label htmlFor={compact ? 'split-pay-mobile' : 'split-pay'} className="cursor-pointer text-sm font-normal leading-tight">
              Pago combinado
            </Label>
            <Switch
              id={compact ? 'split-pay-mobile' : 'split-pay'}
              checked={splitPayment}
              onCheckedChange={(v) => {
                onSplitPaymentChange(v);
                if (v && paymentMethod === 'CREDIT') onPaymentMethodChange('CASH_USD');
              }}
            />
          </div>

          {splitPayment ? (
            <div className="space-y-3 rounded-xl border border-border/80 bg-muted/20 p-3.5">
              <p className="text-xs text-muted-foreground/80 leading-relaxed">
                Montos en USD ($, Zelle, tarjeta) o Bs (efectivo Bs, Pago Móvil). Tasa{' '}
                <span className="font-semibold text-foreground/70">{tasaBcv.toFixed(2)}</span>.
              </p>
              {splitLines.map((line, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <select
                    value={line.method}
                    onChange={(e) => {
                      const next = [...splitLines];
                      next[idx] = { ...next[idx], method: e.target.value as PaymentMethod };
                      onSplitLinesChange(next);
                    }}
                    className="h-11 min-h-[44px] min-w-0 flex-1 rounded-xl border border-border bg-background px-3 text-sm shadow-sm transition-all duration-150 ease-out focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/15"
                  >
                    {(Object.keys(PAYMENT_LABELS) as PaymentMethod[])
                      .filter((m) => m !== 'CREDIT')
                      .map((m) => (
                        <option key={m} value={m}>
                          {PAYMENT_LABELS[m]}
                        </option>
                      ))}
                  </select>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground/60">
                      {BS_PAYMENT_METHODS.includes(line.method) ? 'Bs' : '$'}
                    </span>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      className="h-11 min-h-[44px] w-28 rounded-xl pl-8 text-sm shadow-sm"
                      value={line.amount}
                      onChange={(e) => {
                        const next = [...splitLines];
                        next[idx] = { ...next[idx], amount: e.target.value };
                        onSplitLinesChange(next);
                      }}
                    />
                  </div>
                  <button
                    type="button"
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-card text-muted-foreground/50 transition-all duration-150 ease-out hover:border-destructive/30 hover:text-destructive active:scale-95 disabled:opacity-30 touch-manipulation"
                    disabled={splitLines.length <= 2}
                    onClick={() => onSplitLinesChange(splitLines.filter((_, i) => i !== idx))}
                    aria-label="Quitar línea"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-border/60 py-2.5 text-sm font-medium text-muted-foreground/70 transition-all duration-150 ease-out hover:border-primary/30 hover:text-primary active:scale-[0.98] touch-manipulation"
                disabled={splitLines.length >= 6}
                onClick={() => onSplitLinesChange([...splitLines, { method: 'ZELLE', amount: '' }])}
              >
                + Añadir línea
              </button>
              <div className="flex items-center justify-between rounded-lg bg-background/80 px-3 py-2 text-xs tabular-nums">
                <span className="text-muted-foreground/70">Cobrado</span>
                <span className={cn(
                  'font-semibold',
                  Math.abs(splitEquivalentUsd - total) <= 0.02 ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive',
                )}>
                  {splitEquivalentUsd.toFixed(2)} USD
                </span>
                <span className="text-muted-foreground/40">·</span>
                <span className="text-muted-foreground/70">Venta</span>
                <span className="font-semibold">{total.toFixed(2)} USD</span>
              </div>
            </div>
          ) : (
            <div className="admin-pos-pay-methods">
              {(
                [
                  { id: 'CASH_USD', label: 'Efectivo $', icon: '$' },
                  { id: 'CASH_BS', label: 'Efectivo Bs', icon: 'Bs' },
                  { id: 'PAGO_MOVIL', label: 'Pago Móvil', icon: '📱' },
                  { id: 'ZELLE', label: 'Zelle', icon: 'Z' },
                  { id: 'CARD', label: 'Tarjeta', icon: '💳' },
                  { id: 'CREDIT', label: 'Crédito', icon: '📋' },
                ] as const
              ).map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  className={cn(
                    'admin-pos-pay-method-btn rounded-xl',
                    paymentMethod === id && 'admin-pos-pay-method-btn--active',
                  )}
                  onClick={() => onPaymentMethodChange(id)}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className={cn('admin-pos-cart-scroll', compact && 'min-h-[4rem]')}>
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/50">
              <ShoppingCart className="h-7 w-7 text-muted-foreground/50" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">El carrito está vacío</p>
            <p className="mt-1 text-xs text-muted-foreground/60">Selecciona productos del catálogo</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {cart.map((item, idx) => (
              <div
                key={item.product.id}
                className="admin-pos-cart-item rounded-xl border border-border/80 bg-card p-3 shadow-sm transition-all duration-200 ease-out"
                style={{
                  animation: `cartItemIn 300ms ease-out both`,
                  animationDelay: `${idx * 40}ms`,
                }}
              >
                <div className="mb-2.5 flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-semibold leading-snug text-foreground/90">{item.product.name}</h4>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatCurrency(getUnitPriceDisplay(item.product))} c/u
                    </p>
                  </div>
                  <button
                    type="button"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-card text-muted-foreground/60 transition-all duration-150 ease-out hover:border-destructive/30 hover:bg-destructive/5 hover:text-destructive active:scale-95 touch-manipulation"
                    onClick={() => onRemoveFromCart(item.product.id)}
                    aria-label="Quitar del carrito"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      className="flex h-10 w-10 items-center justify-center rounded-lg border border-border/60 bg-card text-muted-foreground transition-all duration-150 ease-out hover:border-primary/30 hover:text-primary active:scale-95 touch-manipulation"
                      onClick={() => onUpdateQuantity(item.product.id, -1)}
                      aria-label="Reducir cantidad"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="flex h-10 min-w-[2.5rem] items-center justify-center rounded-lg bg-muted/50 px-2 text-sm font-bold tabular-nums text-foreground">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      className="flex h-10 w-10 items-center justify-center rounded-lg border border-border/60 bg-card text-muted-foreground transition-all duration-150 ease-out hover:border-primary/30 hover:text-primary active:scale-95 touch-manipulation"
                      onClick={() => onUpdateQuantity(item.product.id, 1)}
                      disabled={item.quantity >= sellableUnits(item.product)}
                      aria-label="Aumentar cantidad"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <span className="text-sm font-bold tabular-nums text-foreground">
                    {formatCurrency(round2(getUnitPriceDisplay(item.product) * item.quantity))}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="admin-pos-cart-footer space-y-1.5 px-1">
        <div className="admin-pos-cart-total-row">
          <span className="admin-pos-cart-total-label">Subtotal</span>
          <span className="admin-pos-cart-total-value">{formatCurrency(subtotal)}</span>
        </div>
        <div className="admin-pos-cart-total-row">
          <span className="admin-pos-cart-total-label">IVA (16%)</span>
          <span className="admin-pos-cart-total-value">{formatCurrency(ivaAmount)}</span>
        </div>
        <div className="admin-pos-cart-total-row admin-pos-cart-total-row--final">
          <span className="admin-pos-cart-total-label--final">Total a cobrar</span>
          <span className="admin-pos-cart-total-value--final">{formatCurrency(total)}</span>
        </div>
        {(paymentMethod === 'CASH_BS' || paymentMethod === 'PAGO_MOVIL') && !splitPayment && (
          <p className="pt-1 text-xs text-muted-foreground/70">
            Equiv. Bs:{' '}
            <span className="font-semibold tabular-nums text-foreground/80">
              {new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2 }).format(round2(total * tasaBcv))}
            </span>
          </p>
        )}
      </div>

      {compact ? (
        <div className="admin-pos-checkout-sticky">{checkoutButton}</div>
      ) : (
        checkoutButton
      )}
    </AdminCard>
  );
}
