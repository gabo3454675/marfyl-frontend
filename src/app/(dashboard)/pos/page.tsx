'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { AdminPageShell } from '@/components/admin/admin-page-shell';
import { AdminCard } from '@/components/admin/admin-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  ShoppingCart,
  Package,
  CheckCircle2,
  Loader2,
  Printer,
  Layers,
  Sparkles,
  Search,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import apiClient, { invoiceService } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { usePermission } from '@/hooks/usePermission';
import { FiscalIntegrationStrip } from '@/components/fiscal/v2/fiscal-integration-strip';
import { useDebounce } from '@/hooks/useDebounce';
import { useExchangeRate } from '@/hooks/useExchangeRate';
import { db } from '@/lib/db';
import { toast } from 'sonner';
import { round2 } from '@/lib/currencyConversion';
import { computeCartIva } from '@/lib/tax-calculator';
import { PosCartPanel } from '@/components/pos/pos-cart-panel';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

interface Product {
  id: number;
  name: string;
  sku?: string | null;
  barcode?: string | null;
  costPrice: number;
  salePrice: number;
  /** Moneda en que está registrado el precio: USD o VES. Por defecto USD. */
  salePriceCurrency?: string | null;
  stock: number;
  imageUrl?: string | null;
  minStock: number;
  isExempt?: boolean;
  isBundle?: boolean;
  isService?: boolean;
  bundleComponents?: { productId: number; quantity: number }[] | null;
}

/** Servicio sin insumos: el backend no usa stock del ítem; el POS permite cantidad alta. */
const SERVICE_POS_MAX_QTY = 999_999;

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

interface Customer {
  id: number;
  name: string;
  taxId?: string | null;
  email?: string | null;
  phone?: string | null;
}

interface CartItem {
  product: Product;
  quantity: number;
}

interface TicketSummary {
  invoiceId?: number | null;
  /** Número consecutivo por organización (para mostrar en ticket) */
  consecutiveNumber?: number | null;
  customerName: string;
  createdAt: string;
  items: Array<{ name: string; quantity: number; unitPrice: number }>;
  totalUsd: number;
  totalBs: number;
  currencyMode: CurrencyMode;
  paymentMethod: PaymentMethod | 'MIXED';
  /** Texto multilínea para ticket cuando hay pago combinado */
  paymentDetail?: string;
}

export default function POSPage() {
  const { selectedOrganizationId, selectedCompanyId, getCurrentOrganization } = useAuthStore();
  const selectedId = selectedOrganizationId || selectedCompanyId;
  const { canManageCustomers, canManageFiscal } = usePermission();
  const rawRate = useExchangeRate();
  const tasaBcv = Number.isFinite(rawRate) && rawRate > 0 ? rawRate : 1;
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  /** Ver todo el catálogo o acotar a combos/servicios (más rápido de encontrar). */
  const [catalogFilter, setCatalogFilter] = useState<'all' | 'special'>('all');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [lastInvoiceId, setLastInvoiceId] = useState<number | null>(null);
  const [lastTicket, setLastTicket] = useState<TicketSummary | null>(null);
  const [currencyMode, setCurrencyMode] = useState<CurrencyMode>('USD');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH_USD');
  /** Varios medios en un solo cobro (ej. parte en $ y parte en pago móvil Bs). */
  const [splitPayment, setSplitPayment] = useState(false);
  const [splitLines, setSplitLines] = useState<Array<{ method: PaymentMethod; amount: string }>>([
    { method: 'CASH_USD', amount: '' },
    { method: 'PAGO_MOVIL', amount: '' },
  ]);
  const [customerCredit, setCustomerCredit] = useState<{
    limitAmount: number;
    currentBalance: number;
    status: string;
    available: number;
  } | null>(null);
  const [mobileCartOpen, setMobileCartOpen] = useState(false);

  const cartUnits = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);

  const needsPaymentSetup = splitPayment || paymentMethod === 'CREDIT';
  const fetchProducts = useCallback(async () => {
    if (!selectedId) return;

    try {
      setLoading(true);
      const response = await apiClient.get<Product[]>('/products');
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedId]);

  // Cargar clientes
  const fetchCustomers = useCallback(async () => {
    if (!selectedId) return;

    try {
      const response = await apiClient.get<Customer[]>('/customers');
      setCustomers(response.data);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  }, [selectedId]);

  useEffect(() => {
    fetchProducts();
    fetchCustomers();
  }, [fetchProducts, fetchCustomers]);

  // Al elegir cliente, cargar crédito si existe (para mostrar límite disponible al elegir Crédito)
  useEffect(() => {
    if (!selectedCustomerId) {
      setCustomerCredit(null);
      return;
    }
    apiClient
      .get(`/credits/customer/${selectedCustomerId}`)
      .then((res) => {
        const c = res.data;
        const limit = Number(c.limitAmount ?? 0);
        const balance = Number(c.currentBalance ?? 0);
        setCustomerCredit({
          limitAmount: limit,
          currentBalance: balance,
          status: c.status,
          available: limit - balance,
        });
      })
      .catch(() => setCustomerCredit(null));
  }, [selectedCustomerId]);

  // Catálogo: opcional solo combos/servicios + búsqueda con debounce
  const filteredProducts = useMemo(() => {
    let list =
      catalogFilter === 'special'
        ? products.filter((p) => p.isBundle || p.isService)
        : products;
    if (!debouncedSearchQuery) return list;
    const query = debouncedSearchQuery.toLowerCase();
    return list.filter(
      (product) =>
        product.name.toLowerCase().includes(query) ||
        product.sku?.toLowerCase().includes(query) ||
        product.barcode?.toLowerCase().includes(query),
    );
  }, [products, debouncedSearchQuery, catalogFilter]);

  /** Máx. unidades según receta (combo o servicio con insumos). */
  const sellableUnitsFromRecipe = useCallback(
    (components: { productId: number; quantity: number }[] | null | undefined): number => {
      if (!components?.length) return 0;
      let min = Infinity;
      for (const comp of components) {
        const child = products.find((p) => p.id === comp.productId);
        if (!child) return 0;
        const per = Math.max(1, comp.quantity ?? 1);
        min = Math.min(min, Math.floor(child.stock / per));
      }
      return min === Infinity ? 0 : min;
    },
    [products],
  );

  /** Unidades que se pueden vender en POS (producto sueltos, combos, servicios). */
  const sellableUnits = useCallback(
    (product: Product): number => {
      if (product.isBundle) {
        if (!product.bundleComponents?.length) return product.stock;
        return sellableUnitsFromRecipe(product.bundleComponents);
      }
      if (product.isService) {
        if (product.bundleComponents?.length) return sellableUnitsFromRecipe(product.bundleComponents);
        return SERVICE_POS_MAX_QTY;
      }
      return product.stock;
    },
    [sellableUnitsFromRecipe],
  );

  // Agregar producto al carrito
  const addToCart = (product: Product) => {
    const maxQ = sellableUnits(product);
    if (maxQ < 1) {
      toast.error('Sin disponibilidad para este producto');
      return;
    }
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.product.id === product.id);
      if (existingItem) {
        if (existingItem.quantity >= maxQ) return prevCart;
        return prevCart.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      return [...prevCart, { product, quantity: 1 }];
    });
  };

  // Actualizar cantidad en el carrito
  const updateQuantity = (productId: number, delta: number) => {
    setCart((prevCart) => {
      return prevCart
        .map((item) => {
          if (item.product.id === productId) {
            const newQuantity = item.quantity + delta;
            if (newQuantity <= 0) return null;
            const maxQ = sellableUnits(item.product);
            if (newQuantity > maxQ) return item;
            return { ...item, quantity: newQuantity };
          }
          return item;
        })
        .filter((item): item is CartItem => item !== null);
    });
  };

  // Remover item del carrito
  const removeFromCart = (productId: number) => {
    setCart((prevCart) => prevCart.filter((item) => item.product.id !== productId));
  };

  const { subtotal, ivaAmount, total } = useMemo(() => {
    const lines = cart.map((item) => ({
      amount: Number(item.product.salePrice) * item.quantity,
      isExempt: item.product.isExempt,
    }));
    return computeCartIva(lines);
  }, [cart]);

  /** Suma de líneas de pago combinado en equivalente USD (validación vs total). */
  const splitEquivalentUsd = useMemo(() => {
    let usd = 0;
    let ves = 0;
    for (const line of splitLines) {
      const a = parseFloat(line.amount);
      if (!Number.isFinite(a) || a <= 0) continue;
      if (BS_PAYMENT_METHODS.includes(line.method)) ves += a;
      else usd += a;
    }
    return round2(usd + ves / tasaBcv);
  }, [splitLines, tasaBcv]);

  /** Precio unitario para mostrar (en moneda seleccionada: USD o Bs según tasa). */
  const getUnitPriceDisplay = (product: Product) => {
    const usd = Number(product.salePrice);
    return currencyMode === 'BS' ? round2(usd * tasaBcv) : usd;
  };

  // Procesar venta (online → API; offline → IndexedDB para sincronizar después)
  const handleCheckout = async () => {
    if (cart.length === 0) return;

    if (splitPayment) {
      if (paymentMethod === 'CREDIT') {
        toast.error('El crédito no se divide con otros medios en el mismo cobro. Desactive "Pago combinado".');
        return;
      }
      let positiveLines = 0;
      for (const line of splitLines) {
        const a = parseFloat(line.amount);
        if (Number.isFinite(a) && a > 0) positiveLines += 1;
      }
      if (positiveLines < 2) {
        toast.error('En pago combinado indique al menos dos montos (o desactive la opción).');
        return;
      }
      if (Math.abs(splitEquivalentUsd - total) > 0.02) {
        toast.error(
          `El total cobrado (${splitEquivalentUsd.toFixed(2)} USD eq.) debe igualar la venta (${total.toFixed(2)} USD).`,
        );
        return;
      }
    } else if (paymentMethod === 'CREDIT') {
      if (!selectedCustomerId) {
        toast.error('Seleccione un cliente para venta a crédito');
        return;
      }
      if (customerCredit?.status !== 'ACTIVE' || (customerCredit?.available ?? 0) < total) {
        toast.error('Crédito insuficiente o cliente sin crédito activo. Verifique el límite en Cuentas por Cobrar.');
        return;
      }
    }

    setProcessing(true);
    setSuccess(false);

    const amountUsd = total;
    const amountBs = round2(total * tasaBcv);

    let payments: { method: PaymentMethod; amount: number; currency: 'USD' | 'VES' }[];
    let paymentDetail: string | undefined;

    if (splitPayment) {
      payments = [];
      for (const line of splitLines) {
        const a = parseFloat(line.amount);
        if (!Number.isFinite(a) || a <= 0) continue;
        const isBs = BS_PAYMENT_METHODS.includes(line.method);
        payments.push({
          method: line.method,
          amount: a,
          currency: isBs ? 'VES' : 'USD',
        });
      }
      paymentDetail = payments
        .map((p) => {
          const label = PAYMENT_LABELS[p.method];
          if (p.currency === 'VES') {
            return `${label}: ${new Intl.NumberFormat('es-VE', { style: 'currency', currency: 'VES' }).format(p.amount)}`;
          }
          return `${label}: ${new Intl.NumberFormat('es-VE', { style: 'currency', currency: 'USD' }).format(p.amount)}`;
        })
        .join('\n');
    } else {
      payments =
        paymentMethod === 'CASH_BS' || paymentMethod === 'PAGO_MOVIL'
          ? [{ method: paymentMethod, amount: amountBs, currency: 'VES' as const }]
          : [{ method: paymentMethod, amount: amountUsd, currency: 'USD' as const }];
    }

    const invoiceData = {
      customerId: selectedCustomerId || undefined,
      paymentMethod: splitPayment ? 'MIXED' : paymentMethod === 'CREDIT' ? 'CREDIT' : paymentMethod,
      payments,
      items: cart.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
      })),
    };

    const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;

    try {
      const customer =
        selectedCustomerId != null
          ? customers.find((c) => c.id === selectedCustomerId) ?? null
          : null;

      const ticketBase: TicketSummary = {
        invoiceId: null,
        customerName: customer?.name ?? 'Cliente General',
        createdAt: new Date().toLocaleString('es-VE'),
        items: cart.map((item) => ({
          name: item.product.name,
          quantity: item.quantity,
          unitPrice: Number(item.product.salePrice),
        })),
        totalUsd: amountUsd,
        totalBs: amountBs,
        currencyMode,
        paymentMethod: splitPayment ? 'MIXED' : paymentMethod,
        paymentDetail,
      };

      if (isOffline) {
        // Modo offline: guardar en IndexedDB (Dexie) para sincronizar al volver online
        await db.pendingInvoices.add({
          payload: invoiceData,
          createdAt: Date.now(),
          synced: false,
        });
        setLastTicket(ticketBase);
        setCart([]);
        setSelectedCustomerId(null);
        setSuccess(true);
        setMobileCartOpen(false);
        toast.info('Venta guardada localmente', {
          description: 'Se enviará al servidor cuando haya conexión.',
        });
        setTimeout(() => setSuccess(false), 8000);
      } else {
        const created = await invoiceService.create(invoiceData);
        setLastTicket({
          ...ticketBase,
          invoiceId: created.id,
          consecutiveNumber: (created as { consecutiveNumber?: number }).consecutiveNumber ?? null,
        });
        setCart([]);
        setSelectedCustomerId(null);
        setSuccess(true);
        setMobileCartOpen(false);
        setLastInvoiceId(created.id);
        toast.success('¡Venta procesada!');
        await fetchProducts();
        setTimeout(() => {
          setSuccess(false);
          setLastInvoiceId(null);
        }, 10000);
      }
    } catch (error: unknown) {
      const msg =
        error &&
        typeof error === 'object' &&
        'response' in error &&
        (error as { response?: { data?: { message?: string } } }).response?.data?.message
          ? String((error as { response?: { data?: { message?: string } } }).response?.data?.message)
          : 'Error al procesar la venta';
      toast.error(msg);
      console.error('Error processing sale:', error);
    } finally {
      setProcessing(false);
    }
  };

  const formatCurrency = (amount: number, forceCurrency?: CurrencyMode) => {
    const mode = forceCurrency ?? currencyMode;
    return new Intl.NumberFormat('es-VE', {
      style: 'currency',
      currency: mode === 'BS' ? 'VES' : 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const handlePrintTicket = () => {
    if (!lastTicket) return;

    const org = getCurrentOrganization();
    const headerName = org?.name ? `${org.name.toUpperCase()} - TICKET DE VENTA` : 'TICKET DE VENTA';
    const rif =
      org && 'taxId' in org && (org as any).taxId
        ? String((org as any).taxId)
        : undefined;

    const lines: string[] = [];
    lines.push(headerName);
    if (rif) {
      lines.push(`RIF: ${rif}`);
    }
    const facturaNum = lastTicket.consecutiveNumber ?? lastTicket.invoiceId;
    if (facturaNum != null) {
      lines.push(`Venta #${facturaNum}`);
    }
    lines.push(`Fecha: ${lastTicket.createdAt}`);
    lines.push(`Cliente: ${lastTicket.customerName}`);
    lines.push('--------------------------------');
    lastTicket.items.forEach((item) => {
      const lineTotal = round2(item.unitPrice * item.quantity);
      lines.push(
        `${item.quantity} x ${item.name}`.slice(0, 40),
      );
      lines.push(
        `   ${formatCurrency(item.unitPrice, 'USD').padEnd(12)}  ${formatCurrency(
          lineTotal,
          'USD',
        )}`,
      );
    });
    lines.push('--------------------------------');
    lines.push(`TOTAL USD: ${formatCurrency(lastTicket.totalUsd, 'USD')}`);
    lines.push(`TOTAL Bs:  ${formatCurrency(lastTicket.totalBs, 'BS')}`);
    lines.push('');
    if (lastTicket.paymentDetail) {
      lines.push('Pago:');
      lastTicket.paymentDetail.split('\n').forEach((ln) => lines.push(`  ${ln}`));
    } else {
      lines.push(`Pago: ${lastTicket.paymentMethod}`);
    }
    lines.push('');
    lines.push('Gracias por su compra');

    const ticketText = lines.join('\n');
    const w = window.open('', '_blank');
    if (w) {
      w.document.write(
        `<pre style="font-family: monospace; white-space: pre-wrap; padding: 8px; font-size: 12px;">${ticketText}</pre>`,
      );
      w.document.close();
    }
  };

  const handleBarCheckout = () => {
    if (cart.length === 0) return;
    if (needsPaymentSetup) {
      setMobileCartOpen(true);
      toast.message('Configura el pago en el carrito', {
        description: splitPayment ? 'Pago combinado requiere montos por línea.' : 'Selecciona cliente y verifica crédito.',
      });
      return;
    }
    void handleCheckout();
  };

  const cartPanelProps = {
    cart,
    currencyMode,
    onCurrencyModeChange: setCurrencyMode,
    customers,
    selectedCustomerId,
    onCustomerChange: setSelectedCustomerId,
    paymentMethod,
    onPaymentMethodChange: setPaymentMethod,
    splitPayment,
    onSplitPaymentChange: setSplitPayment,
    splitLines,
    onSplitLinesChange: setSplitLines,
    customerCredit,
    total,
    subtotal,
    ivaAmount,
    tasaBcv,
    splitEquivalentUsd,
    processing,
    formatCurrency,
    getUnitPriceDisplay: (product: { salePrice: number }) => getUnitPriceDisplay(product as Product),
    sellableUnits: (product: { id: number; stock: number }) => sellableUnits(product as Product),
    onUpdateQuantity: updateQuantity,
    onRemoveFromCart: removeFromCart,
    onCheckout: async () => {
      await handleCheckout();
      setMobileCartOpen(false);
    },
  };

  if (!canManageCustomers) {
    return (
      <AdminPageShell eyebrow="Ventas" title="Punto de Venta" subtitle="Acceso restringido" animate={false}>
        <AdminCard>
          <p className="py-8 text-center text-muted-foreground">
            No tienes permisos para acceder a esta sección.
          </p>
        </AdminCard>
      </AdminPageShell>
    );
  }

  return (
    <AdminPageShell
      animate={false}
      eyebrow="Ventas"
      title="Punto de Venta"
      subtitle={
        <>
          {canManageFiscal && (
            <FiscalIntegrationStrip variant="pos" className="mb-2 hidden sm:block md:mb-3" />
          )}
          <span className="hidden text-sm md:text-base sm:block">Procesa ventas rápidamente</span>
        </>
      }
      className="admin-pos-shell admin-pos-mobile-pad flex min-h-0 flex-1 flex-col"
      contentClassName="admin-pos-page-body flex min-h-0 flex-1 flex-col gap-0 !space-y-0"
      headerClassName="admin-pos-page-header mb-2 sm:mb-5 md:mb-6 shrink-0"
    >

      {/* Barra fija móvil/tablet: carrito + COBRAR rápido */}
      <div
        className={cn('admin-pos-checkout-bar lg:hidden', mobileCartOpen && 'pointer-events-none opacity-0')}
        role="region"
        aria-label="Resumen de cobro"
        aria-hidden={mobileCartOpen}
      >
        <button
          type="button"
          className="admin-pos-checkout-summary touch-manipulation"
          onClick={() => setMobileCartOpen(true)}
          aria-label="Abrir carrito"
        >
          <span className="flex items-center gap-2 text-left">
            <span className="relative inline-flex">
              <ShoppingCart className="h-5 w-5 text-primary" />
              {cart.length > 0 ? (
                <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                  {cartUnits}
                </span>
              ) : null}
            </span>
            <span className="min-w-0">
              <span className="block text-[11px] leading-none text-muted-foreground">
                {cart.length > 0 ? 'Ver carrito' : 'Carrito vacío'}
              </span>
              <span className="block truncate text-lg font-bold tabular-nums">{formatCurrency(total)}</span>
            </span>
          </span>
        </button>
        <Button
          className="h-11 min-h-[44px] min-w-[6.5rem] shrink-0 touch-manipulation px-4 text-base font-semibold"
          onClick={handleBarCheckout}
          disabled={cart.length === 0 || processing}
        >
          {processing ? <Loader2 className="h-5 w-5 animate-spin" /> : 'COBRAR'}
        </Button>
      </div>

      {success && (
        <div className="mb-3 shrink-0 rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-900/20 sm:mb-4 sm:p-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1 md:flex-row md:items-center md:gap-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                <span className="text-green-800 dark:text-green-200 font-medium">
                  ¡Venta procesada exitosamente!
                </span>
              </div>
              <div className="flex flex-wrap gap-2 mt-2 md:mt-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrintTicket}
                  disabled={!lastTicket}
                  className="bg-white dark:bg-gray-800"
                >
                  <Printer className="mr-2 h-4 w-4" />
                  Imprimir Ticket
                </Button>
                {lastInvoiceId && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={async () => {
                      try {
                        const response = await invoiceService.getPdf(lastInvoiceId);
                        const contentType = String(response.headers?.['content-type'] ?? '');
                        if (contentType.includes('application/json')) {
                          const text = await (response.data as Blob).text();
                          const data = JSON.parse(text);
                          toast.error(data?.message ?? 'Error al descargar la factura');
                          return;
                        }
                        const blob = new Blob([response.data], { type: 'application/pdf' });
                        const url = window.URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.href = url;
                        link.target = '_blank';
                        link.download = `venta-${lastInvoiceId}.pdf`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        window.URL.revokeObjectURL(url);
                      } catch (error: any) {
                        console.error('Error downloading PDF:', error);
                        toast.error(
                          (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
                            'Error al descargar la factura',
                        );
                      }
                    }}
                  >
                    <Printer className="mr-2 h-4 w-4" />
                    PDF de la venta
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="admin-pos-grid grid min-h-0 flex-1 grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-3 lg:gap-6">
        {/* Catálogo — pantalla completa en móvil */}
        <div className="admin-pos-catalog order-1 flex min-h-0 flex-1 flex-col lg:col-span-2">
          <AdminCard
            title="Catálogo de Productos"
            className="admin-pos-panel admin-pos-catalog-card min-h-0 flex-1"
            bodyClassName="flex min-h-0 flex-1 flex-col overflow-hidden"
            headerClassName="shrink-0 py-3 sm:py-4"
            elevation="sm"
          >
              {/* Filtro rápido + búsqueda */}
              <div className="mb-3 space-y-2 shrink-0 sm:mb-4 sm:space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={catalogFilter === 'all' ? 'default' : 'outline'}
                    className="min-h-[44px] touch-manipulation text-xs"
                    onClick={() => setCatalogFilter('all')}
                  >
                    Todo el inventario
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={catalogFilter === 'special' ? 'default' : 'outline'}
                    className="min-h-[44px] gap-1.5 touch-manipulation text-xs"
                    onClick={() => setCatalogFilter('special')}
                  >
                    <Layers className="h-3.5 w-3.5" />
                    Combos y servicios
                  </Button>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar producto, SKU o código de barras..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="min-h-[44px] pl-10"
                  />
                </div>
              </div>

              {/* Lista de productos */}
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="admin-pos-catalog-scroll min-h-0 flex-1 overflow-y-auto overscroll-y-contain">
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-2 sm:gap-3 md:grid-cols-3 md:gap-4">
                    {filteredProducts.map((product) => (
                      <div
                        key={product.id}
                        role="button"
                        tabIndex={sellableUnits(product) > 0 ? 0 : -1}
                        className={cn(
                          'admin-pos-product-tile',
                          product.isBundle &&
                            'border-amber-500/45 bg-gradient-to-br from-amber-500/[0.07] to-transparent',
                          product.isService &&
                            !product.isBundle &&
                            'border-sky-500/40 bg-gradient-to-br from-sky-500/[0.07] to-transparent',
                          sellableUnits(product) === 0 && 'opacity-60 cursor-not-allowed',
                        )}
                        onClick={() => sellableUnits(product) > 0 && addToCart(product)}
                        onKeyDown={(e) => {
                          if (sellableUnits(product) > 0 && (e.key === 'Enter' || e.key === ' ')) {
                            e.preventDefault();
                            addToCart(product);
                          }
                        }}
                      >
                          <div className="mb-1.5 flex min-h-[18px] items-center justify-between gap-1">
                            {product.isBundle ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                                <Layers className="h-3.5 w-3.5" />
                                Combo
                              </span>
                            ) : product.isService ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-sky-700 dark:text-sky-300">
                                <Sparkles className="h-3.5 w-3.5" />
                                Servicio
                              </span>
                            ) : (
                              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                                Producto
                              </span>
                            )}
                          </div>
                          <div className="mb-1.5 flex items-center justify-center">
                            <Package className="h-8 w-8 text-muted-foreground/80 sm:h-10 sm:w-10" />
                          </div>
                          <h3 className="mb-1 line-clamp-2 text-xs font-semibold leading-snug sm:text-sm">{product.name}</h3>
                          <div className="mb-1 flex items-center justify-between gap-1">
                            <span className="text-base font-bold tabular-nums text-primary sm:text-lg">
                              {formatCurrency(getUnitPriceDisplay(product))}
                            </span>
                            <Badge
                              variant={sellableUnits(product) > 0 ? 'default' : 'destructive'}
                              className="text-[10px] shrink-0 max-w-[120px] justify-center"
                            >
                              {product.isBundle
                                ? `${sellableUnits(product)} disp.`
                                : product.isService
                                  ? product.bundleComponents?.length
                                    ? `${sellableUnits(product)} disp.`
                                    : 'Cobro'
                                  : `Stock ${product.stock}`}
                            </Badge>
                          </div>
                          {sellableUnits(product) === 0 && (
                            <p className="text-xs text-destructive">Sin disponibilidad</p>
                          )}
                      </div>
                    ))}
                  </div>
                  {filteredProducts.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      No se encontraron productos
                    </div>
                  )}
                </div>
              )}
          </AdminCard>
        </div>

        {/* Carrito desktop — en móvil va en sheet inferior */}
        <div className="admin-pos-cart hidden lg:flex">
          <PosCartPanel {...cartPanelProps} />
        </div>
      </div>

      <Sheet open={mobileCartOpen} onOpenChange={setMobileCartOpen}>
        <SheetContent
          side="bottom"
          className="admin-pos-cart-sheet flex max-h-[min(92dvh,720px)] flex-col gap-0 p-0 pb-0 md:pb-[calc(env(safe-area-inset-bottom,0px)+0.5rem)] max-md:pb-[calc(var(--app-bottom-chrome)+0.5rem)]"
        >
          <SheetHeader className="shrink-0 border-b px-4 py-3 text-left">
            <SheetTitle className="flex items-center gap-2 text-base">
              <ShoppingCart className="h-5 w-5" />
              Carrito y pago
              {cartUnits > 0 ? (
                <Badge variant="secondary" className="tabular-nums">
                  {cartUnits}
                </Badge>
              ) : null}
            </SheetTitle>
          </SheetHeader>
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-1">
            <PosCartPanel {...cartPanelProps} compact showCheckoutButton className="min-h-0 flex-1 border-0 shadow-none" />
          </div>
        </SheetContent>
      </Sheet>
    </AdminPageShell>
  );
}
