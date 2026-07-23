'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
  PackagePlus,
  Calculator,
  Beer,
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
import { BOTTLES_PER_TOBO, isBeerProduct } from '@/lib/liquor-units';
import { round2 } from '@/lib/currencyConversion';
import { computeCartIva } from '@/lib/tax-calculator';
import { PosCartPanel } from '@/components/pos/pos-cart-panel';
import { QuickProductSheet, type QuickProductResult } from '@/components/pos/quick-product-sheet';
import { PosCalculatorDrawer, PosCalculatorFab } from '@/components/pos/pos-calculator-drawer';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { PosToolbar } from '@/components/pos/pos-toolbar';
import { PosComandaQueue } from '@/components/pos/pos-comanda-queue';
import { VariantSelector } from '@/components/pos/variant-selector';
import { variantService } from '@/lib/api/product-variants';
import type { ProductVariant } from '@/lib/api/product-variants';
import { PosOpenTabs } from '@/components/pos/pos-open-tabs';

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
  reservedStock?: number;
  availableStock?: number;
  imageUrl?: string | null;
  minStock: number;
  isExempt?: boolean;
  isActive?: boolean;
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
  variantId?: number;
  variantName?: string;
  variantUnitQuantity?: number;
  /** Precio efectivo por unidad (precio de variante si aplica, o salePrice del producto). */
  unitPrice: number;
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
  const { canManageInvoices, canManageFiscal, canAccessPOS, canManageCustomers, canManageProducts, isPosOnlySeller } = usePermission();
  const rawRate = useExchangeRate();
  const tasaBcv = Number.isFinite(rawRate) && rawRate > 0 ? rawRate : 1;
  const queryClient = useQueryClient();

  const { data: products = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ['products', 'pos-catalog'],
    queryFn: () => apiClient.get<Product[]>('/products').then((r) => r.data),
    staleTime: 5 * 60 * 1000,
    enabled: !!selectedId,
  });

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ['customers', 'pos-catalog'],
    queryFn: () => apiClient.get<Customer[]>('/customers').then((r) => r.data),
    staleTime: 60 * 1000,
    enabled: !!selectedId,
  });

  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  /** Filtro de inventario: con stock primero (menos errores al cobrar). */
  const [catalogFilter, setCatalogFilter] = useState<'all' | 'special' | 'instock'>('instock');
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
  const [quickProductOpen, setQuickProductOpen] = useState(false);
  const [calculatorOpen, setCalculatorOpen] = useState(false);

  // Variant selection state
  const [variantDialogOpen, setVariantDialogOpen] = useState(false);
  const [variantDialogProduct, setVariantDialogProduct] = useState<Product | null>(null);
  const [variantDialogVariants, setVariantDialogVariants] = useState<ProductVariant[]>([]);
  const [variantDialogLoading, setVariantDialogLoading] = useState(false);
  const variantDialogCancelledRef = useRef(false);

  const cartUnits = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);

  const needsPaymentSetup = splitPayment || paymentMethod === 'CREDIT';

  const handleQuickProductCreated = (product: QuickProductResult, quantity: number) => {
    const mapped: Product = {
      id: product.id,
      name: product.name,
      costPrice: product.costPrice,
      salePrice: product.salePrice,
      stock: product.stock,
      minStock: 5,
      sku: product.sku,
      isExempt: product.isExempt,
    };
    queryClient.invalidateQueries({ queryKey: ['products', 'pos-catalog'] });
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id && !i.variantId);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id && !i.variantId
            ? { ...i, quantity: i.quantity + quantity }
            : i,
        );
      }
      return [...prev, { product: mapped, quantity, unitPrice: Number(product.salePrice) }];
    });
    toast.success(`${product.name} agregado al carrito`);
  };

  const handleCalculatorApply = (amount: number) => {
    if (splitPayment) {
      setSplitLines((lines) => {
        const next = [...lines];
        if (next[0]) next[0] = { ...next[0], amount: amount.toFixed(2) };
        return next;
      });
    } else if (currencyMode === 'BS') {
      setPaymentMethod('CASH_BS');
      setSplitLines([{ method: 'CASH_BS', amount: round2(amount * tasaBcv).toFixed(2) }]);
    } else {
      setPaymentMethod('CASH_USD');
      setSplitLines([{ method: 'CASH_USD', amount: amount.toFixed(2) }]);
    }
    setMobileCartOpen(true);
  };

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

  // Inventario vendible (activo) + filtros + búsqueda
  const filteredProducts = useMemo(() => {
    let list = products.filter((p) => p.isActive !== false);
    if (catalogFilter === 'special') {
      list = list.filter((p) => p.isBundle || p.isService);
    } else if (catalogFilter === 'instock') {
      list = list.filter((p) => {
        if (p.isService && !p.bundleComponents?.length) return true;
        const avail =
          typeof p.availableStock === 'number'
            ? p.availableStock
            : Math.max(0, p.stock - (p.reservedStock ?? 0));
        return avail > 0 || !!p.isBundle;
      });
    }
    if (debouncedSearchQuery) {
      const query = debouncedSearchQuery.toLowerCase();
      list = list.filter(
        (product) =>
          product.name.toLowerCase().includes(query) ||
          product.sku?.toLowerCase().includes(query) ||
          product.barcode?.toLowerCase().includes(query),
      );
    }
    // Con stock primero, luego alfabético
    list.sort((a, b) => {
      const availA =
        typeof a.availableStock === 'number'
          ? a.availableStock
          : Math.max(0, a.stock - (a.reservedStock ?? 0));
      const availB =
        typeof b.availableStock === 'number'
          ? b.availableStock
          : Math.max(0, b.stock - (b.reservedStock ?? 0));
      if ((availA > 0) !== (availB > 0)) return availA > 0 ? -1 : 1;
      return a.name.localeCompare(b.name, 'es');
    });
    return list;
  }, [products, debouncedSearchQuery, catalogFilter]);

  /** Máx. unidades según receta (combo o servicio con insumos). Usa stock disponible neto. */
  const sellableUnitsFromRecipe = useCallback(
    (components: { productId: number; quantity: number }[] | null | undefined): number => {
      if (!components?.length) return 0;
      let min = Infinity;
      for (const comp of components) {
        const child = products.find((p) => p.id === comp.productId);
        if (!child) return 0;
        const per = Math.max(1, comp.quantity ?? 1);
        const childAvail =
          typeof child.availableStock === 'number'
            ? child.availableStock
            : Math.max(0, child.stock - (child.reservedStock ?? 0));
        min = Math.min(min, Math.floor(childAvail / per));
      }
      return min === Infinity ? 0 : min;
    },
    [products],
  );

  /** Unidades que se pueden vender en POS (stock − reservado por comandas). */
  const sellableUnits = useCallback(
    (product: Product): number => {
      if (product.isBundle) {
        if (!product.bundleComponents?.length) {
          return typeof product.availableStock === 'number'
            ? product.availableStock
            : Math.max(0, product.stock - (product.reservedStock ?? 0));
        }
        return sellableUnitsFromRecipe(product.bundleComponents);
      }
      if (product.isService) {
        if (product.bundleComponents?.length) return sellableUnitsFromRecipe(product.bundleComponents);
        return SERVICE_POS_MAX_QTY;
      }
      if (typeof product.availableStock === 'number') return Math.max(0, product.availableStock);
      return Math.max(0, product.stock - (product.reservedStock ?? 0));
    },
    [sellableUnitsFromRecipe],
  );

  // Agregar producto al carrito (con o sin variante, qtyStep: 12 = 1 tobo de cerveza)
  const addToCart = (product: Product, qtyStepOrVariant: number | ProductVariant = 1) => {
    const isVariant = typeof qtyStepOrVariant === 'object' && qtyStepOrVariant !== null;
    const variant = isVariant ? qtyStepOrVariant : undefined;
    const qtyStep = isVariant ? 1 : qtyStepOrVariant;
    const maxQ = sellableUnits(product);
    const step = Math.max(1, qtyStep);
    if (maxQ < step) {
      toast.error(
        step >= 12
          ? `Sin stock para 1 tobo (disp. ${maxQ === Infinity ? 0 : maxQ} bot)`
          : 'Sin disponibilidad para este producto',
      );
      return;
    }
    const unitPrice = variant ? variant.salePrice : product.salePrice;
    const variantId = variant?.id;
    const variantName = variant?.name;
    const variantUnitQuantity = variant?.unitQuantity;

    setCart((prevCart) => {
      const existingItem = prevCart.find(
        (item) => item.product.id === product.id && item.variantId === variantId,
      );
      if (existingItem) {
        if (existingItem.quantity + step > maxQ) {
          toast.error('No hay más unidades disponibles');
          return prevCart;
        }
        return prevCart.map((item) =>
          item.product.id === product.id && item.variantId === variantId
            ? { ...item, quantity: item.quantity + step }
            : item,
        );
      }
      return [...prevCart, { product, quantity: Math.min(maxQ, step), variantId, variantName, variantUnitQuantity, unitPrice }];
    });
  };

  // Manejar click en producto: verificar variantes antes de agregar
  const handleProductClick = async (product: Product) => {
    const available = sellableUnits(product);
    if (available < 1) {
      toast.error('Sin disponibilidad para este producto');
      return;
    }

    // Resetear flag de cancelación
    variantDialogCancelledRef.current = false;

    // Abrir diálogo con loading inmediatamente para feedback visual
    setVariantDialogProduct(product);
    setVariantDialogVariants([]);
    setVariantDialogLoading(true);
    setVariantDialogOpen(true);

    try {
      const variants = await queryClient.fetchQuery({
        queryKey: ['product-variants', product.id],
        queryFn: () => variantService.getByProduct(product.id),
        staleTime: 5 * 60 * 1000,
      });

      // Si el usuario ya cerró el diálogo, no continuar
      if (variantDialogCancelledRef.current) return;

      const activeVariants = variants.filter((v) => v.isActive);

      if (activeVariants.length <= 1) {
        // 0 o 1 variante → agregar directamente y cerrar
        setVariantDialogOpen(false);
        addToCart(product, activeVariants[0]);
      } else {
        // Múltiples variantes → mostrar selector con datos
        setVariantDialogVariants(activeVariants);
      }
    } catch {
      if (variantDialogCancelledRef.current) return;
      // Si falla la consulta, cerrar diálogo y agregar sin variante
      setVariantDialogOpen(false);
      addToCart(product);
    } finally {
      setVariantDialogLoading(false);
    }
  };

  const handleVariantSelect = (variant: ProductVariant) => {
    if (variantDialogProduct) {
      addToCart(variantDialogProduct, variant);
    }
    setVariantDialogProduct(null);
    setVariantDialogVariants([]);
  };

  // Actualizar cantidad en el carrito
  const updateQuantity = (productId: number, delta: number, variantId?: number) => {
    setCart((prevCart) => {
      return prevCart
        .map((item) => {
          if (item.product.id === productId && item.variantId === variantId) {
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
  const removeFromCart = (productId: number, variantId?: number) => {
    setCart((prevCart) =>
      prevCart.filter(
        (item) => !(item.product.id === productId && item.variantId === variantId),
      ),
    );
  };

  const { subtotal, ivaAmount, total } = useMemo(() => {
    const lines = cart.map((item) => ({
      amount: Number(item.unitPrice) * item.quantity,
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
        ...(item.variantId ? { variantId: item.variantId } : {}),
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
          name: item.variantName ? `${item.product.name} - ${item.variantName}` : item.product.name,
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice),
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
        toast.success('¡Venta procesada!', {
          description: 'Inventario actualizado automáticamente.',
        });
        queryClient.invalidateQueries({ queryKey: ['products', 'pos-catalog'] });
        setTimeout(() => {
          setSuccess(false);
          setLastInvoiceId(null);
        }, 8000);
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
    sellableUnits: (product: { id: number; stock: number }) => sellableUnits(product as Product),
    onUpdateQuantity: updateQuantity,
    onRemoveFromCart: removeFromCart,
    onCheckout: async () => {
      await handleCheckout();
      setMobileCartOpen(false);
    },
  };

  if (!canManageInvoices && !canAccessPOS) {
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
    <>
      {isPosOnlySeller && <PosToolbar />}
      <AdminPageShell
      animate={false}
      eyebrow={isPosOnlySeller ? undefined : 'Ventas'}
      title={isPosOnlySeller ? 'Caja · inventario' : 'Punto de Venta'}
      subtitle={
        isPosOnlySeller ? (
          <span className="text-xs text-muted-foreground sm:text-sm">
            Vende del inventario · solo lectura · sin editar productos
          </span>
        ) : (
          <>
            {canManageFiscal && (
              <FiscalIntegrationStrip variant="pos" className="mb-2 hidden sm:block md:mb-3" />
            )}
            <span className="hidden text-sm md:text-base sm:block">
              Catálogo = inventario disponible. Toca para vender.
            </span>
          </>
        )
      }
      className="admin-pos-shell admin-pos-mobile-pad flex min-h-0 flex-1 flex-col"
      contentClassName="admin-pos-page-body flex min-h-0 flex-1 flex-col gap-0 !space-y-0"
      headerClassName="admin-pos-page-header mb-2 sm:mb-5 md:mb-6 shrink-0"
    >

      <PosComandaQueue className="mb-3 shrink-0 sm:mb-4" />
      <PosOpenTabs className="mb-3 shrink-0 sm:mb-4" />

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

      {success && !isPosOnlySeller && (
        <div className="mb-3 shrink-0 rounded-xl border border-emerald-200 bg-emerald-50 p-3 shadow-sm dark:border-emerald-800 dark:bg-emerald-900/20 sm:mb-4 sm:p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-800/40">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <span className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">
                  ¡Venta procesada exitosamente!
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrintTicket}
                  disabled={!lastTicket}
                  className="h-9 bg-white/80 text-xs font-semibold dark:bg-gray-800"
                >
                  <Printer className="mr-1.5 h-3.5 w-3.5" />
                  Ticket
                </Button>
                {lastInvoiceId && (
                  <Button
                    variant="outline"
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
                    className="h-9 bg-white/80 text-xs font-semibold dark:bg-gray-800"
                  >
                    <Printer className="mr-1.5 h-3.5 w-3.5" />
                    PDF
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
            title="Inventario para vender"
            className="admin-pos-panel admin-pos-catalog-card min-h-0 flex-1"
            bodyClassName="flex min-h-0 flex-1 flex-col overflow-hidden"
            headerClassName="shrink-0 py-3 sm:py-4"
            elevation="sm"
          >
              {/* Filtro rápido + búsqueda */}
              <div className="mb-3 space-y-2 shrink-0 sm:mb-4 sm:space-y-3">
                <div className="admin-pos-toolbar flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={catalogFilter === 'all' ? 'default' : 'outline'}
                    className="min-h-[44px] touch-manipulation text-xs font-semibold rounded-xl"
                    onClick={() => setCatalogFilter('all')}
                  >
                    Todo
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={catalogFilter === 'instock' ? 'default' : 'outline'}
                    className="min-h-[44px] touch-manipulation text-xs font-semibold rounded-xl"
                    onClick={() => setCatalogFilter('instock')}
                  >
                    Con stock
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={catalogFilter === 'special' ? 'default' : 'outline'}
                    className="min-h-[44px] gap-1.5 touch-manipulation text-xs font-semibold rounded-xl"
                    onClick={() => setCatalogFilter('special')}
                  >
                    <Layers className="h-3.5 w-3.5" />
                    Combos
                  </Button>
                  {canManageProducts && (
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      className="min-h-[44px] gap-1.5 touch-manipulation text-xs font-semibold rounded-xl"
                      onClick={() => setQuickProductOpen(true)}
                    >
                      <PackagePlus className="h-3.5 w-3.5" />
                      Nuevo
                    </Button>
                  )}
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="min-h-[44px] gap-1.5 touch-manipulation text-xs font-semibold rounded-xl lg:hidden"
                    onClick={() => setCalculatorOpen(true)}
                  >
                    <Calculator className="h-3.5 w-3.5" />
                    Calc
                  </Button>
                </div>
                <div className="admin-pos-search-wrap">
                  <Search className="admin-pos-search-icon h-5 w-5" />
                  <input
                    type="text"
                    placeholder="Buscar en inventario (nombre, SKU, código)…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="admin-pos-search-input"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground px-0.5">
                  {filteredProducts.length} producto{filteredProducts.length === 1 ? '' : 's'} ·
                  stock disponible (resta reservas de comanda)
                </p>
              </div>

              {/* Lista de productos */}
              {productsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="admin-pos-catalog-scroll min-h-0 flex-1 overflow-y-auto overscroll-y-contain">
                  <div className="admin-pos-product-grid">
                    {filteredProducts.map((product) => {
                      const available = sellableUnits(product);
                      const beer = isBeerProduct(product.name);
                      const stockLevel =
                        available === Infinity
                          ? 'full'
                          : available > product.minStock
                            ? 'full'
                            : available > 0
                              ? 'low'
                              : 'empty';
                      const stockDotClass =
                        stockLevel === 'full'
                          ? 'admin-pos-stock-dot--full'
                          : stockLevel === 'low'
                            ? 'admin-pos-stock-dot--low'
                            : 'admin-pos-stock-dot--empty';

                      return (
                      <div
                        key={product.id}
                        className={cn(
                          'admin-pos-product-tile',
                          product.isBundle &&
                            'border-amber-500/45 bg-gradient-to-br from-amber-500/[0.07] to-transparent',
                          product.isService &&
                            !product.isBundle &&
                            'border-sky-500/40 bg-gradient-to-br from-sky-500/[0.07] to-transparent',
                          beer &&
                            'border-amber-400/35 bg-gradient-to-br from-amber-400/[0.06] to-transparent',
                          available === 0 && 'opacity-60',
                        )}
                        onClick={() => available > 0 && handleProductClick(product)}
                        onKeyDown={(e) => {
                          if (available > 0 && (e.key === 'Enter' || e.key === ' ')) {
                            e.preventDefault();
                            handleProductClick(product);
                          }
                        }}
                      >
                        <button
                          type="button"
                          disabled={available < 1}
                          className="flex w-full flex-1 flex-col text-left disabled:cursor-not-allowed"
                          onClick={() => available > 0 && addToCart(product, 1)}
                        >
                          <div className="mb-2 flex min-h-[20px] items-center justify-between gap-1">
                            {product.isBundle ? (
                              <span className="admin-pos-type-badge admin-pos-type-badge--combo">
                                <Layers className="h-3 w-3" />
                                Combo
                              </span>
                            ) : product.isService ? (
                              <span className="admin-pos-type-badge admin-pos-type-badge--service">
                                <Sparkles className="h-3 w-3" />
                                Servicio
                              </span>
                            ) : beer ? (
                              <span className="admin-pos-type-badge admin-pos-type-badge--product">
                                Cerveza
                              </span>
                            ) : (
                              <span className="admin-pos-type-badge admin-pos-type-badge--product">
                                Inventario
                              </span>
                            )}
                            {!product.isService || product.bundleComponents?.length ? (
                              <span className="inline-flex items-center gap-1 rounded-md bg-muted/70 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums">
                                <span className={cn('admin-pos-stock-dot', stockDotClass)} />
                                {available === Infinity
                                  ? '∞'
                                  : beer
                                    ? `${available} bot`
                                    : `${available} disp.`}
                              </span>
                            ) : null}
                          </div>
                          <div className="mb-2 flex items-center justify-center">
                            {product.imageUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={product.imageUrl}
                                alt=""
                                className="h-14 w-14 rounded-lg object-cover sm:h-16 sm:w-16"
                              />
                            ) : (
                              <Package className="h-10 w-10 text-muted-foreground/60 sm:h-12 sm:w-12" />
                            )}
                          </div>
                          <h3 className="mb-1.5 line-clamp-2 text-sm font-semibold leading-snug text-foreground/90 sm:text-[15px]">
                            {product.name}
                          </h3>
                          <div className="mt-auto flex items-end justify-between gap-1">
                            <span className="text-lg font-bold tabular-nums text-primary sm:text-xl">
                              {formatCurrency(getUnitPriceDisplay(product))}
                              {beer ? (
                                <span className="ml-1 text-xs font-medium text-muted-foreground">
                                  /bot
                                </span>
                              ) : null}
                            </span>
                          </div>
                          {available === 0 && (
                            <p className="mt-1 text-xs font-medium text-destructive">Sin disponibilidad</p>
                          )}
                        </button>
                        {beer && available > 0 && (
                          <div className="mt-2 grid grid-cols-2 gap-1.5 border-t border-border/40 pt-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="h-9 text-[11px] font-semibold"
                              onClick={(e) => {
                                e.stopPropagation();
                                addToCart(product, 1);
                              }}
                            >
                              +1 bot
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              className="h-9 gap-1 text-[11px] font-semibold"
                              disabled={available < BOTTLES_PER_TOBO}
                              onClick={(e) => {
                                e.stopPropagation();
                                addToCart(product, BOTTLES_PER_TOBO);
                              }}
                            >
                              <Beer className="h-3 w-3" />
                              +1 tobo
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                    })}
                  </div>
                  {filteredProducts.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/60">
                        <Package className="h-7 w-7 text-muted-foreground/50" />
                      </div>
                      <p className="text-sm font-medium text-muted-foreground">No se encontraron productos</p>
                      <p className="mt-1 text-xs text-muted-foreground/60">
                        {searchQuery ? 'Intenta con otro término de búsqueda' : 'El catálogo está vacío'}
                      </p>
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

      <PosCalculatorFab
        className="admin-pos-fab-calc lg:bottom-6 lg:left-6"
        onClick={() => setCalculatorOpen(true)}
      />
      <PosCalculatorDrawer
        open={calculatorOpen}
        onOpenChange={setCalculatorOpen}
        onApplyAmount={handleCalculatorApply}
      />
      <QuickProductSheet
        open={canManageProducts && quickProductOpen}
        onOpenChange={setQuickProductOpen}
        onCreated={handleQuickProductCreated}
      />
      <VariantSelector
        open={variantDialogOpen}
        onOpenChange={(open) => {
          setVariantDialogOpen(open);
          if (!open) {
            variantDialogCancelledRef.current = true;
            setVariantDialogProduct(null);
            setVariantDialogVariants([]);
          }
        }}
        productName={variantDialogProduct?.name ?? ''}
        variants={variantDialogVariants}
        loading={variantDialogLoading}
        onSelect={handleVariantSelect}
      />
    </AdminPageShell>
    </>
  );
}
