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
  variantId?: number;
  variantName?: string;
  variantUnitQuantity?: number;
  unitPrice: number;
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
  /** Si true (ej. El Rancho), no se muestra ni aplica IVA. */
  ivaDisabled?: boolean;
  tasaBcv: number;
  splitEquivalentUsd: number;
  processing: boolean;
  formatCurrency: (amount: number, forceCurrency?: CurrencyMode) => string;
  sellableUnits: (product: PosProduct) => number;
  onUpdateQuantity: (productId: number, delta: number, variantId?: number) => void;
  onRemoveFromCart: (productId: number, variantId?: number) => void;
  onCheckout: () => void;
  showCheckoutButton?: boolean;
  compact?: boolean;
  className?: string;
}

export function PosCartPanel({
  cart,
  currencyMode,
  onCurrencyModeChange,
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
  ivaDisabled = false,
  tasaBcv,
  splitEquivalentUsd,
  processing,
  formatCurrency,
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
        compact ? 'flex' : 'hidden md:flex',
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
      className={cn('admin-pos-panel h-full min-h-0 max-h-full', className)}
      bodyClassName={cn(
        'admin-pos-cart-body flex min-h-0 flex-1 flex-col overflow-hidden',
        compact ? 'p-3' : 'p-3 sm:p-4',
      )}
      headerClassName={cn('admin-pos-cart-header shrink-0', compact && 'hidden')}
      elevation="sm"
    >
      {/*
        Stack: controles (shrink-0) -> lista (flex-1 scroll) -> footer (shrink-0).
        min-h-0 + overflow-hidden evita que controles aplasten .admin-pos-cart-scroll.
      */}
      <div className="admin-pos-cart-stack flex min-h-0 flex-1 flex-col overflow-hidden">
        <div
          className={cn(
            'admin-pos-cart-controls shrink-0',
            splitPayment && 'admin-pos-cart-controls--split',
          )}
        >
          <div>
            <Label className="admin-pos-cart-field-label">Moneda de pago</Label>
            <div className="admin-pos-currency-toggle flex gap-2">
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

          <div className="space-y-1.5">
            <Label className="admin-pos-cart-field-label">Modalidades de pago</Label>
            <div className="flex min-h-[36px] items-center justify-between gap-3 rounded-lg border border-border/60 bg-card/50 px-2.5 py-1.5">
              <Label
                htmlFor={compact ? 'split-pay-mobile' : 'split-pay'}
                className="cursor-pointer text-sm font-normal leading-tight"
              >
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

            {paymentMethod === 'CREDIT' && customerCredit && (
              <p className="text-xs text-muted-foreground">
                Límite disponible:{' '}
                <span
                  className={cn(
                    'font-semibold tabular-nums',
                    total > customerCredit.available
                      ? 'text-destructive'
                      : 'text-emerald-600 dark:text-emerald-400',
                  )}
                >
                  ${customerCredit.available.toFixed(2)}
                </span>
                {total > customerCredit.available && (
                  <span className="ml-1.5 text-destructive">· insuficiente</span>
                )}
              </p>
            )}

            {splitPayment ? (
              <div className="space-y-2 rounded-xl border border-border/80 bg-muted/20 p-2.5">
                <p className="text-[11px] leading-relaxed text-muted-foreground/80">
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
                      className="admin-pos-cart-select min-w-0 flex-1"
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
                        className="admin-pos-cart-amount-input w-28 pl-8"
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
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-card text-muted-foreground/50 transition-all duration-150 ease-out hover:border-destructive/30 hover:text-destructive active:scale-95 disabled:opacity-30 touch-manipulation"
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
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border/60 py-2 text-sm font-medium text-muted-foreground/70 transition-all duration-150 ease-out hover:border-primary/30 hover:text-primary active:scale-[0.98] touch-manipulation"
                  disabled={splitLines.length >= 6}
                  onClick={() => onSplitLinesChange([...splitLines, { method: 'ZELLE', amount: '' }])}
                >
                  + Añadir línea
                </button>
                <div className="flex items-center justify-between rounded-lg bg-background/80 px-2.5 py-1.5 text-xs tabular-nums">
                  <span className="text-muted-foreground/70">Cobrado</span>
                  <span
                    className={cn(
                      'font-semibold',
                      Math.abs(splitEquivalentUsd - total) <= 0.02
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-destructive',
                    )}
                  >
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
                    { id: 'CASH_USD', label: 'Efectivo $' },
                    { id: 'CASH_BS', label: 'Efectivo Bs' },
                    { id: 'PAGO_MOVIL', label: 'Pago Móvil' },
                    { id: 'ZELLE', label: 'Zelle' },
                    { id: 'CARD', label: 'Tarjeta' },
                    { id: 'CREDIT', label: 'Crédito' },
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

        {/* Scroll principal: ítems del carrito */}
        <div
          className={cn(
            'admin-pos-cart-scroll min-h-0 flex-1',
            compact && 'admin-pos-cart-scroll--compact',
          )}
        >
          {cart.length === 0 ? (
            <div className="flex h-full min-h-[6rem] flex-col items-center justify-center py-6 text-center">
              <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-2xl bg-muted/50">
                <ShoppingCart className="h-5 w-5 text-muted-foreground/50" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">El carrito está vacío</p>
              <p className="mt-1 text-xs text-muted-foreground/60">Selecciona productos del catálogo</p>
            </div>
          ) : (
            <div className="space-y-2">
              {cart.map((item, idx) => (
                <div
                  key={`${item.product.id}-${item.variantId ?? ''}`}
                  className="admin-pos-cart-item rounded-xl border border-border/80 bg-card p-3 shadow-sm transition-all duration-200 ease-out"
                  style={{
                    animation: `cartItemIn 300ms ease-out both`,
                    animationDelay: `${idx * 40}ms`,
                  }}
                >
                  <div className="mb-2.5 flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-semibold leading-snug text-foreground/90">
                        {item.product.name}
                        {item.variantName && (
                          <span className="ml-1.5 text-xs font-normal text-muted-foreground/70">
                            · {item.variantName}
                            {item.variantUnitQuantity && item.variantUnitQuantity > 1 && (
                              <span className="ml-1 inline-flex items-center rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold uppercase leading-none text-primary">
                                x{item.variantUnitQuantity}
                              </span>
                            )}
                          </span>
                        )}
                      </h4>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {formatCurrency(item.unitPrice)} c/u
                      </p>
                    </div>
                    <button
                      type="button"
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-card text-muted-foreground/60 transition-all duration-150 ease-out hover:border-destructive/30 hover:bg-destructive/5 hover:text-destructive active:scale-95 touch-manipulation"
                      onClick={() => onRemoveFromCart(item.product.id, item.variantId)}
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
                        onClick={() => onUpdateQuantity(item.product.id, -1, item.variantId)}
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
                        onClick={() => onUpdateQuantity(item.product.id, 1, item.variantId)}
                        disabled={item.quantity >= sellableUnits(item.product)}
                        aria-label="Aumentar cantidad"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <span className="text-sm font-bold tabular-nums text-foreground">
                      {formatCurrency(round2(item.unitPrice * item.quantity))}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer fijo: totales + COBRAR */}
        <div className="admin-pos-cart-bottom shrink-0">
          <div className="admin-pos-cart-footer">
            <div className="admin-pos-cart-total-row">
              <span className="admin-pos-cart-total-label">Subtotal</span>
              <span className="admin-pos-cart-total-value">{formatCurrency(subtotal)}</span>
            </div>
            {!ivaDisabled && (
              <div className="admin-pos-cart-total-row">
                <span className="admin-pos-cart-total-label">IVA (16%)</span>
                <span className="admin-pos-cart-total-value">{formatCurrency(ivaAmount)}</span>
              </div>
            )}
            <div className="admin-pos-cart-total-row admin-pos-cart-total-row--final">
              <span className="admin-pos-cart-total-label--final">Total a cobrar</span>
              <span className="admin-pos-cart-total-value--final">{formatCurrency(total)}</span>
            </div>
            {(paymentMethod === 'CASH_BS' || paymentMethod === 'PAGO_MOVIL') && !splitPayment && (
              <p className="admin-pos-cart-equiv">
                Equiv. Bs:{' '}
                <span className="font-semibold tabular-nums text-foreground/80">
                  {new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2 }).format(
                    round2(total * tasaBcv),
                  )}
                </span>
              </p>
            )}
          </div>
          {compact ? (
            <div className="admin-pos-checkout-sticky">{checkoutButton}</div>
          ) : checkoutButton ? (
            <div className="admin-pos-checkout-desktop">{checkoutButton}</div>
          ) : null}
        </div>
      </div>
    </AdminCard>
  );
}
