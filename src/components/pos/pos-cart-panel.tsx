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
        'h-12 w-full touch-manipulation text-base font-semibold sm:text-lg',
        compact ? 'flex' : 'mt-3 hidden lg:flex',
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
        'COBRAR'
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
          <Label className="mb-2 block">Moneda de pago</Label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant={currencyMode === 'BS' ? 'default' : 'outline'}
              size="sm"
              className="min-h-[44px] flex-1 touch-manipulation"
              onClick={() => onCurrencyModeChange('BS')}
            >
              Bolívares
            </Button>
            <Button
              type="button"
              variant={currencyMode === 'USD' ? 'default' : 'outline'}
              size="sm"
              className="min-h-[44px] flex-1 touch-manipulation"
              onClick={() => onCurrencyModeChange('USD')}
            >
              Dólares
            </Button>
          </div>
        </div>

        <div>
          <Label htmlFor={compact ? 'customer-mobile' : 'customer'}>Cliente</Label>
          <select
            id={compact ? 'customer-mobile' : 'customer'}
            value={selectedCustomerId || ''}
            onChange={(e) => onCustomerChange(e.target.value ? Number(e.target.value) : null)}
            className="mt-1 min-h-[44px] w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Cliente Genérico</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
              </option>
            ))}
          </select>
          {paymentMethod === 'CREDIT' && customerCredit && (
            <p className="mt-1 text-xs text-muted-foreground">
              Límite disponible: ${customerCredit.available.toFixed(2)}
              {total > customerCredit.available && (
                <span className="ml-1 text-destructive">(insuficiente)</span>
              )}
            </p>
          )}
        </div>

        <div className="space-y-3">
          <Label className="block text-sm font-medium">Modalidades de pago</Label>
          <div className="flex min-h-[44px] items-center justify-between gap-2">
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
            <div className="space-y-2 rounded-lg border border-border p-3">
              <p className="text-xs text-muted-foreground">
                Montos en USD ($, Zelle, tarjeta) o Bs (efectivo Bs, Pago Móvil). Tasa {tasaBcv.toFixed(2)}.
              </p>
              {splitLines.map((line, idx) => (
                <div key={idx} className="flex flex-wrap items-center gap-2">
                  <select
                    value={line.method}
                    onChange={(e) => {
                      const next = [...splitLines];
                      next[idx] = { ...next[idx], method: e.target.value as PaymentMethod };
                      onSplitLinesChange(next);
                    }}
                    className="h-11 min-h-[44px] min-w-0 flex-1 rounded-md border border-input bg-background px-2 text-sm"
                  >
                    {(Object.keys(PAYMENT_LABELS) as PaymentMethod[])
                      .filter((m) => m !== 'CREDIT')
                      .map((m) => (
                        <option key={m} value={m}>
                          {PAYMENT_LABELS[m]}
                        </option>
                      ))}
                  </select>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder={BS_PAYMENT_METHODS.includes(line.method) ? 'Bs' : 'USD'}
                    className="h-11 min-h-[44px] w-24 shrink-0"
                    value={line.amount}
                    onChange={(e) => {
                      const next = [...splitLines];
                      next[idx] = { ...next[idx], amount: e.target.value };
                      onSplitLinesChange(next);
                    }}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-11 w-11 shrink-0 touch-manipulation"
                    disabled={splitLines.length <= 2}
                    onClick={() => onSplitLinesChange(splitLines.filter((_, i) => i !== idx))}
                    aria-label="Quitar línea"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full min-h-[44px] touch-manipulation"
                disabled={splitLines.length >= 6}
                onClick={() => onSplitLinesChange([...splitLines, { method: 'ZELLE', amount: '' }])}
              >
                Añadir línea
              </Button>
              <p className="text-xs tabular-nums">
                Cobrado: <span className="font-semibold">{splitEquivalentUsd.toFixed(2)} USD</span>
                {' · '}
                Venta: <span className="font-semibold">{total.toFixed(2)} USD</span>
                {Math.abs(splitEquivalentUsd - total) > 0.02 && (
                  <span className="ml-1 text-destructive">— debe coincidir</span>
                )}
              </p>
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
                <Button
                  key={id}
                  type="button"
                  variant={paymentMethod === id ? 'default' : 'outline'}
                  size="sm"
                  className="min-h-[44px] shrink-0 touch-manipulation"
                  onClick={() => onPaymentMethodChange(id)}
                >
                  {label}
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className={cn('admin-pos-cart-scroll', compact && 'min-h-[4rem]')}>
        {cart.length === 0 ? (
          <div className="py-10 text-center text-muted-foreground">
            <ShoppingCart className="mx-auto mb-2 h-12 w-12 opacity-50" />
            <p className="text-sm">El carrito está vacío</p>
          </div>
        ) : (
          <div className="space-y-2">
            {cart.map((item) => (
              <div key={item.product.id} className="rounded-lg border border-border bg-secondary/50 p-3">
                <div className="mb-2 flex items-start justify-between">
                  <div className="min-w-0 flex-1 pr-2">
                    <h4 className="text-sm font-semibold leading-snug">{item.product.name}</h4>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(getUnitPriceDisplay(item.product))} c/u
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 shrink-0 touch-manipulation"
                    onClick={() => onRemoveFromCart(item.product.id)}
                    aria-label="Quitar del carrito"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-11 w-11 touch-manipulation"
                      onClick={() => onUpdateQuantity(item.product.id, -1)}
                      aria-label="Reducir cantidad"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-8 text-center font-semibold tabular-nums">{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-11 w-11 touch-manipulation"
                      onClick={() => onUpdateQuantity(item.product.id, 1)}
                      disabled={item.quantity >= sellableUnits(item.product)}
                      aria-label="Aumentar cantidad"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <span className="font-bold tabular-nums">
                    {formatCurrency(round2(getUnitPriceDisplay(item.product) * item.quantity))}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="admin-pos-cart-footer space-y-2 text-sm">
        <div className="flex justify-between text-muted-foreground">
          <span>Subtotal</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>IVA (16%)</span>
          <span>{formatCurrency(ivaAmount)}</span>
        </div>
        <div className="flex justify-between pt-1 text-lg font-bold">
          <span>Total a cobrar</span>
          <span>{formatCurrency(total)}</span>
        </div>
        {(paymentMethod === 'CASH_BS' || paymentMethod === 'PAGO_MOVIL') && !splitPayment && (
          <p className="text-xs text-muted-foreground">
            Equiv. Bs:{' '}
            {new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2 }).format(round2(total * tasaBcv))}
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
