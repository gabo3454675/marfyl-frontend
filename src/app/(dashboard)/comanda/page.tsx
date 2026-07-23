'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Loader2,
  Minus,
  Plus,
  Search,
  Send,
  ShoppingBag,
  X,
  UtensilsCrossed,
  Beer,
} from 'lucide-react';
import { toast } from 'sonner';
import { AdminPageShell } from '@/components/admin/admin-page-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import apiClient from '@/lib/api';
import {
  floorOrdersApi,
  floorOrderDestLabel,
  floorOrderTotal,
  type FloorOrder,
} from '@/lib/api/floor-orders';
import { useAuthStore } from '@/store/useAuthStore';
import { usePermission } from '@/hooks/usePermission';
import { useDisplayCurrency } from '@/hooks/useDisplayCurrency';
import { useDebounce } from '@/hooks/useDebounce';
import { useComandaSocket } from '@/hooks/useComandaSocket';
import {
  BOTTLES_PER_TOBO,
  formatBeerQty,
  inferStationClient,
  isBeerProduct,
} from '@/lib/liquor-units';
import { FloorServiceNav } from '@/components/floor/floor-service-nav';
import { FLOOR_COPY, FLOOR_STATUS_TONE, floorStatusLabel } from '@/lib/floor-ui';
import { cn } from '@/lib/utils';

type Product = {
  id: number;
  name: string;
  salePrice: number;
  stock: number;
  reservedStock?: number;
  availableStock?: number;
  imageUrl?: string | null;
  isActive?: boolean;
  isBundle?: boolean;
  isService?: boolean;
};

type CartLine = { product: Product; quantity: number; notes?: string };

function avail(p: Product) {
  if (typeof p.availableStock === 'number') return Math.max(0, p.availableStock);
  return Math.max(0, p.stock - (p.reservedStock ?? 0));
}

const STATUS_TONE = FLOOR_STATUS_TONE;

function sendButtonLabel(cart: CartLine[]): string {
  const stations = new Set(cart.map((l) => inferStationClient(l.product.name)));
  const hasBar = stations.has('BAR');
  const hasKitchen = stations.has('KITCHEN');
  if (hasBar && hasKitchen) return 'Enviar a cocina y barra';
  if (hasBar) return 'Enviar a barra';
  if (hasKitchen) return 'Enviar a cocina';
  return 'Enviar a preparación';
}

export default function ComandaMenuPage() {
  const { selectedOrganizationId, selectedCompanyId, user } = useAuthStore();
  const orgId = selectedOrganizationId || selectedCompanyId;
  const userId = user?.id;
  const { canTakeFloorOrder, canAccessPOS } = usePermission();
  const { formatUsdAmount } = useDisplayCurrency();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const debounced = useDebounce(search, 200);
  const [tableLabel, setTableLabel] = useState('');
  const [tableId, setTableId] = useState<number | null>(null);
  const [newTableLabel, setNewTableLabel] = useState('');
  const [newTableZone, setNewTableZone] = useState('Salón principal');
  const [tablePaymentAmount, setTablePaymentAmount] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [paymentMode, setPaymentMode] = useState<'INMEDIATO' | 'CUENTA_ABIERTA'>('INMEDIATO');
  const [zone, setZone] = useState('');
  const [customerTaxId, setCustomerTaxId] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerFirstName, setCustomerFirstName] = useState('');
  const [customerLastName, setCustomerLastName] = useState('');
  const [foundCustomer, setFoundCustomer] = useState<{ id: number; name: string; taxId: string | null; phone: string | null } | null>(null);
  const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);

  // Search customer by taxId with debounce
  const debouncedTaxId = useDebounce(customerTaxId, 300);

  useEffect(() => {
    if (paymentMode !== 'CUENTA_ABIERTA' || !debouncedTaxId.trim()) {
      setFoundCustomer(null);
      return;
    }

    let cancelled = false;
    setIsSearchingCustomer(true);

    floorOrdersApi.findCustomerByTaxId(debouncedTaxId.trim())
      .then((result) => {
        if (!cancelled) {
          setFoundCustomer(result);
          setIsSearchingCustomer(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setFoundCustomer(null);
          setIsSearchingCustomer(false);
        }
      });

    return () => { cancelled = true; };
  }, [debouncedTaxId, paymentMode]);

  useComandaSocket({ enabled: canTakeFloorOrder && !!orgId });

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products', 'comanda', orgId],
    queryFn: async () => {
      const { data } = await apiClient.get<Product[]>('/products');
      return (data ?? []).filter(
        (p) =>
          p.isActive !== false &&
          !p.isBundle &&
          !p.isService &&
          avail(p) > 0,
      );
    },
    enabled: !!orgId && canTakeFloorOrder,
    staleTime: 20_000,
  });

  const { data: liveOrders = [] } = useQuery({
    queryKey: ['floor-orders', orgId, 'host'],
    queryFn: () => floorOrdersApi.list(),
    enabled: !!orgId && canTakeFloorOrder,
    refetchInterval: 20_000,
  });
  const { data: tables = [] } = useQuery({
    queryKey: ['floor-tables', orgId],
    queryFn: () => floorOrdersApi.listTables(),
    enabled: !!orgId && canTakeFloorOrder,
    refetchInterval: 20_000,
  });

  const myOpenOrders = useMemo(() => {
    return (liveOrders as FloorOrder[])
      .filter((o) => ['SENT', 'IN_PREP', 'READY'].includes(o.status))
      .filter((o) => (userId ? o.createdBy?.id === userId : true))
      .slice(0, 12);
  }, [liveOrders, userId]);

  const myPendingCharge = myOpenOrders.filter((o) => o.status === 'READY');

  const filtered = useMemo(() => {
    const q = debounced.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => p.name.toLowerCase().includes(q));
  }, [products, debounced]);

  const cartCount = cart.reduce((s, l) => s + l.quantity, 0);
  const cartTotal = cart.reduce(
    (s, l) => s + Number(l.product.salePrice) * l.quantity,
    0,
  );

  const add = (product: Product, step = 1) => {
    const max = avail(product);
    if (max < step) {
      toast.error(
        step >= BOTTLES_PER_TOBO
          ? `No hay stock para 1 tobo (faltan ${BOTTLES_PER_TOBO - max} bot)`
          : 'Sin disponibilidad',
      );
      return;
    }
    setCart((prev) => {
      const i = prev.findIndex((l) => l.product.id === product.id);
      if (i >= 0) {
        const next = [...prev];
        const q = Math.min(max, next[i].quantity + step);
        next[i] = { ...next[i], quantity: q };
        return next;
      }
      return [...prev, { product, quantity: Math.min(max, step) }];
    });
    setCartOpen(true);
  };

  const setQty = (productId: number, quantity: number) => {
    setCart((prev) =>
      prev
        .map((l) => {
          if (l.product.id !== productId) return l;
          const max = avail(l.product);
          return { ...l, quantity: Math.min(max, Math.max(0, quantity)) };
        })
        .filter((l) => l.quantity > 0),
    );
  };

  const sendMutation = useMutation({
    mutationFn: async () => {
      const mesa = tableLabel.trim();
      if (!mesa) throw new Error('Indica la mesa o zona');

      if (paymentMode === 'CUENTA_ABIERTA') {
        // Cuenta abierta: requiere cliente identificado por cédula
        if (!customerTaxId.trim()) throw new Error('Indica la cédula del cliente');

        let customerId = foundCustomer?.id;

        // Si no se encontró el cliente, registrar rápido
        if (!customerId) {
          if (!customerPhone.trim()) throw new Error('Indica el teléfono del cliente');
          if (!customerFirstName.trim()) throw new Error('Indica el nombre del cliente');
          if (!customerLastName.trim()) throw new Error('Indica el apellido del cliente');

          const registered = await floorOrdersApi.quickRegisterCustomer({
            taxId: customerTaxId.trim(),
            phone: customerPhone.trim(),
            firstName: customerFirstName.trim(),
            lastName: customerLastName.trim(),
          });
          customerId = registered.id;
        }

        return floorOrdersApi.create({
          tableId: tableId ?? undefined,
          tableLabel: mesa,
          zone: zone.trim() || undefined,
          customerId,
          notes: orderNotes.trim() || undefined,
          sendNow: true,
          paymentMode: 'CUENTA_ABIERTA',
          items: cart.map((l) => ({
            productId: l.product.id,
            quantity: l.quantity,
            notes: l.notes,
          })),
        });
      } else {
        // Pago inmediato: comportamiento actual
        const cliente = customerName.trim();
        if (!cliente) throw new Error('Indica el nombre del cliente');

        return floorOrdersApi.create({
          tableId: tableId ?? undefined,
          tableLabel: mesa,
          zone: zone.trim() || undefined,
          customerName: cliente,
          notes: orderNotes.trim() || undefined,
          sendNow: true,
          items: cart.map((l) => ({
            productId: l.product.id,
            quantity: l.quantity,
            notes: l.notes,
          })),
        });
      }
    },
    onSuccess: (order) => {
    const dest = floorOrderDestLabel(order);
    const cliente = order.customerName || customerName.trim();
    const modeLabel = paymentMode === 'CUENTA_ABIERTA' ? 'Cuenta abierta' : 'Pago inmediato';
    toast.success(
      `Pedido #${order.id} → ${dest} · ${order.tableLabel}${cliente ? ` · ${cliente}` : ''}`,
      {
        description: `${modeLabel}${cliente ? ` · ${cliente}` : ''}. ${paymentMode === 'CUENTA_ABIERTA' ? 'Se agregó a la cuenta abierta.' : 'Caja ya puede verlo en la cola.'}`,
        duration: 8_000,
      },
    );
    // Reset form
    setCart([]);
    setOrderNotes('');
    setCartOpen(false);
    setCustomerTaxId('');
    setCustomerPhone('');
    setCustomerFirstName('');
    setCustomerLastName('');
    setFoundCustomer(null);
    setZone('');
    if (paymentMode === 'INMEDIATO') setCustomerName('');
    void queryClient.invalidateQueries({ queryKey: ['products'] });
    void queryClient.invalidateQueries({ queryKey: ['floor-orders'] });
    void queryClient.invalidateQueries({ queryKey: ['floor-tables'] });
  },
  onError: (err: unknown) => {
    const msg =
      err instanceof Error
        ? err.message
        : (err as { response?: { data?: { message?: string } } })?.response
            ?.data?.message || 'No se pudo enviar el pedido';
    toast.error(typeof msg === 'string' ? msg : 'No se pudo enviar el pedido');
  },
});

  const createTableMutation = useMutation({
    mutationFn: () => floorOrdersApi.createTable({
      label: newTableLabel.trim(),
      zone: newTableZone.trim() || undefined,
    }),
    onSuccess: (table) => {
      setNewTableLabel('');
      setTableId(table.id);
      setTableLabel(table.label);
      void queryClient.invalidateQueries({ queryKey: ['floor-tables'] });
    },
    onError: () => toast.error('No se pudo crear la mesa'),
  });
  const selectedTable = tables.find((table) => table.id === tableId);
  const refreshTables = () => void queryClient.invalidateQueries({ queryKey: ['floor-tables'] });
  const paymentMutation = useMutation({
    mutationFn: () => {
      if (!selectedTable?.accountId) throw new Error('Selecciona una mesa ocupada');
      return floorOrdersApi.recordTablePayment(selectedTable.accountId, {
        amount: Number(tablePaymentAmount),
        method: 'CASH_USD',
        currency: 'USD',
      });
    },
    onSuccess: () => {
      setTablePaymentAmount('');
      refreshTables();
      toast.success('Abono registrado en la cuenta de la mesa');
    },
    onError: () => toast.error('No se pudo registrar el abono'),
  });
  const closeTableMutation = useMutation({
    mutationFn: () => {
      if (!selectedTable?.accountId) throw new Error('Selecciona una mesa ocupada');
      return floorOrdersApi.closeTableAccount(selectedTable.accountId, {
        payments: [{ method: 'CASH_USD', amount: selectedTable.balanceUsd, currency: 'USD' }],
      });
    },
    onSuccess: () => {
      refreshTables();
      toast.success('Mesa cobrada y cerrada');
      setTableId(null);
    },
    onError: () => toast.error('No se pudo cerrar la mesa'),
  });

  if (!canTakeFloorOrder) {
    return (
      <AdminPageShell title="Tomar pedido" subtitle="Sin permiso">
        <p className="text-sm text-muted-foreground">
          Este puesto no toma pedidos. Usa el rol Anfitrión (WAITER) o pide acceso a un admin.
        </p>
      </AdminPageShell>
    );
  }

  return (
    <AdminPageShell
      eyebrow={FLOOR_COPY.module}
      title={FLOOR_COPY.host.title}
      subtitle={FLOOR_COPY.host.blurb}
      actions={undefined}
    >
      {/* Floating Pedido button */}
      <div className="sticky top-0 z-30 -mx-4 px-4 py-2 sm:-mx-6 sm:px-6">
        <div className="flex justify-end">
          <Button
            type="button"
            className="gap-2 rounded-xl shadow-md"
            onClick={() => setCartOpen(true)}
          >
            <ShoppingBag className="h-4 w-4" />
            Pedido
            {cartCount > 0 && (
              <span className="ml-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-xs font-bold text-primary-foreground">
                {cartCount}
              </span>
            )}
          </Button>
        </div>
      </div>
      <FloorServiceNav />
      {!tableId ? (
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Selecciona una mesa</h2>
            <p className="text-sm text-muted-foreground">
              El pedido y la cuenta se acumularán en la mesa seleccionada.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {tables.map((table) => (
              <button
                key={table.id}
                type="button"
                onClick={() => {
                  setTableId(table.id);
                  setTableLabel(table.label);
                  setZone(table.zone || '');
                }}
                className={cn(
                  'min-h-28 rounded-2xl border p-4 text-left transition',
                  table.status === 'OCCUPIED'
                    ? 'border-amber-500/50 bg-amber-500/10 hover:bg-amber-500/15'
                    : 'border-border bg-card hover:border-primary/60 hover:bg-primary/5',
                )}
              >
                <span className="block text-base font-semibold">{table.label}</span>
                <span className="mt-1 block text-xs text-muted-foreground">{table.zone || 'Sin área'}</span>
                <span className="mt-3 block text-sm tabular-nums">
                  {table.status === 'OCCUPIED' ? `Saldo ${formatUsdAmount(table.balanceUsd)}` : 'Libre'}
                </span>
              </button>
            ))}
          </div>
          <div className="grid gap-2 rounded-xl border border-dashed p-3 sm:grid-cols-[1fr_1fr_auto]">
            <Input value={newTableLabel} onChange={(event) => setNewTableLabel(event.target.value)} placeholder="Nombre de mesa" />
            <Input value={newTableZone} onChange={(event) => setNewTableZone(event.target.value)} placeholder="Área: terraza, barra..." />
            <Button type="button" disabled={!newTableLabel.trim() || createTableMutation.isPending} onClick={() => createTableMutation.mutate()}>
              Crear mesa
            </Button>
          </div>
        </section>
      ) : (
      <div className="space-y-2">
        <Button type="button" variant="ghost" size="sm" onClick={() => setTableId(null)}>
          ← Cambiar mesa
        </Button>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar producto…"
            className="h-12 pl-9 text-base"
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {filtered.map((p) => {
              const a = avail(p);
              const beer = isBeerProduct(p.name);
              return (
                <div
                  key={p.id}
                  className={cn(
                    'group flex min-h-[7.5rem] flex-col overflow-hidden rounded-2xl border border-border/70',
                    'bg-card/80 text-left',
                    a === 0 && 'opacity-50',
                  )}
                >
                  <button
                    type="button"
                    onClick={() => add(p, 1)}
                    className={cn(
                      'flex flex-1 flex-col overflow-hidden text-left transition hover:bg-card',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                    )}
                  >
                    <div className="relative aspect-[4/3] w-full bg-muted/40">
                      {p.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.imageUrl}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                          Sin foto
                        </div>
                      )}
                      <span className="absolute bottom-1.5 right-1.5 rounded-md bg-background/90 px-1.5 py-0.5 text-[11px] tabular-nums">
                        {beer
                          ? `${a} bot · ${Math.floor(a / BOTTLES_PER_TOBO)} tob`
                          : `${a} disp.`}
                      </span>
                    </div>
                    <div className="flex flex-1 flex-col gap-1 p-2.5 pb-1">
                      <p className="line-clamp-2 text-sm font-medium leading-snug">
                        {p.name}
                      </p>
                      <p className="mt-auto text-sm tabular-nums text-muted-foreground">
                        {formatUsdAmount(Number(p.salePrice))}
                        {beer ? ' / bot' : ''}
                      </p>
                    </div>
                  </button>
                  {beer && (
                    <div className="grid grid-cols-2 gap-1 border-t border-border/50 p-1.5">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-9 text-[11px] font-semibold"
                        disabled={a < 1}
                        onClick={() => add(p, 1)}
                      >
                        +1 bot
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        className="h-9 gap-1 text-[11px] font-semibold"
                        disabled={a < BOTTLES_PER_TOBO}
                        onClick={() => add(p, BOTTLES_PER_TOBO)}
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
        )}
      </div>
      )}

      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/50 transition',
          cartOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={() => setCartOpen(false)}
        aria-hidden={!cartOpen}
      />
      <aside
        className={cn(
          'fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-2xl border border-border bg-background p-4 shadow-2xl transition-transform sm:inset-y-0 sm:left-auto sm:right-0 sm:max-h-none sm:w-[22rem] sm:rounded-none sm:border-l',
          cartOpen
            ? 'translate-y-0 sm:translate-x-0'
            : 'translate-y-full sm:translate-y-0 sm:translate-x-full',
        )}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Pedido</h2>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-12 w-12"
            onClick={() => setCartOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="space-y-3">
          {/* Payment Mode Toggle */}
          <div className="space-y-1.5">
            <Label>Modo de pago</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMode('INMEDIATO')}
                className={cn(
                  'rounded-xl border px-3 py-2.5 text-sm font-medium transition',
                  paymentMode === 'INMEDIATO'
                    ? 'border-emerald-500 bg-emerald-500/15 text-emerald-400'
                    : 'border-border bg-muted/40 text-muted-foreground hover:bg-muted/60',
                )}
              >
                💵 Pago inmediato
              </button>
              <button
                type="button"
                onClick={() => setPaymentMode('CUENTA_ABIERTA')}
                className={cn(
                  'rounded-xl border px-3 py-2.5 text-sm font-medium transition',
                  paymentMode === 'CUENTA_ABIERTA'
                    ? 'border-blue-500 bg-blue-500/15 text-blue-400'
                    : 'border-border bg-muted/40 text-muted-foreground hover:bg-muted/60',
                )}
              >
                📋 Cuenta abierta
              </button>
            </div>
          </div>

          {tables.length > 0 && (
            <div className="space-y-2">
              <Label>Selecciona una mesa</Label>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {tables.map((table) => (
                  <button
                    key={table.id}
                    type="button"
                    onClick={() => {
                      setTableId(table.id);
                      setTableLabel(table.label);
                      setZone(table.zone || '');
                    }}
                    className={cn(
                      'rounded-xl border p-3 text-left transition-colors',
                      tableId === table.id
                        ? 'border-primary bg-primary/10'
                        : table.status === 'OCCUPIED'
                          ? 'border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/15'
                          : 'border-border bg-muted/30 hover:bg-muted/60',
                    )}
                  >
                    <span className="block text-sm font-semibold">{table.label}</span>
                    <span className="block text-xs text-muted-foreground">
                      {table.status === 'OCCUPIED'
                        ? `Saldo $${table.balanceUsd.toFixed(2)}`
                        : 'Libre'}
                    </span>
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newTableLabel}
                  onChange={(event) => setNewTableLabel(event.target.value)}
                  placeholder="Nueva mesa, ej. Mesa 8"
                  className="h-10"
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={!newTableLabel.trim() || createTableMutation.isPending}
                  onClick={() => createTableMutation.mutate()}
                >
                  Crear
                </Button>
              </div>
              {canAccessPOS && selectedTable?.accountId && (
                <div className="rounded-xl border border-primary/30 bg-primary/5 p-3">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-medium">{selectedTable.label} · cuenta abierta</span>
                    <span className="tabular-nums">
                      Total {formatUsdAmount(selectedTable.totalUsd)} · saldo {formatUsdAmount(selectedTable.balanceUsd)}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={tablePaymentAmount}
                      onChange={(event) => setTablePaymentAmount(event.target.value)}
                      placeholder="Abono USD"
                      className="h-10 max-w-36"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      disabled={!Number(tablePaymentAmount) || paymentMutation.isPending}
                      onClick={() => paymentMutation.mutate()}
                    >
                      Registrar abono
                    </Button>
                    <Button
                      type="button"
                      disabled={selectedTable.balanceUsd <= 0 || closeTableMutation.isPending}
                      onClick={() => {
                        if (confirm(`¿Cobrar ${formatUsdAmount(selectedTable.balanceUsd)} y cerrar ${selectedTable.label}?`)) {
                          closeTableMutation.mutate();
                        }
                      }}
                    >
                      Cobrar todo y cerrar
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="mesa">Mesa *</Label>
                <Input
                  id="mesa"
                  value={tableLabel}
                  onChange={(e) => setTableLabel(e.target.value)}
                  placeholder="Ej. Mesa 4"
                  className="h-12 text-base"
                  autoComplete="off"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="zona">Zona</Label>
                <Input
                  id="zona"
                  value={zone}
                  onChange={(e) => setZone(e.target.value)}
                  placeholder="Ej. Terraza"
                  className="h-12 text-base"
                  autoComplete="off"
                />
              </div>
            </div>

            {paymentMode === 'CUENTA_ABIERTA' ? (
              <>
                {/* Cuenta abierta: búsqueda por cédula */}
                <div className="space-y-1.5">
                  <Label htmlFor="cedula">Cédula *</Label>
                  <Input
                    id="cedula"
                    value={customerTaxId}
                    onChange={(e) => setCustomerTaxId(e.target.value)}
                    placeholder="V-12345678"
                    className="h-12 text-base"
                    autoComplete="off"
                  />
                  {isSearchingCustomer && (
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Loader2 className="h-3 w-3 animate-spin" /> Buscando cliente…
                    </p>
                  )}
                  {foundCustomer && (
                    <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2">
                      <span className="text-sm">✅</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-emerald-400">
                          {foundCustomer.name}
                        </p>
                        <p className="text-xs text-emerald-400/70">
                          {foundCustomer.taxId}{foundCustomer.phone ? ` · ${foundCustomer.phone}` : ''}
                        </p>
                      </div>
                    </div>
                  )}
                  {!foundCustomer && !isSearchingCustomer && customerTaxId.trim().length >= 3 && (
                    <div className="space-y-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2.5">
                      <p className="text-xs font-medium text-amber-400">
                        Cliente no encontrado. Regístralo:
                      </p>
                      <Input
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="Teléfono"
                        className="h-10 text-sm"
                        autoComplete="tel"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          value={customerFirstName}
                          onChange={(e) => setCustomerFirstName(e.target.value)}
                          placeholder="Nombre"
                          className="h-10 text-sm"
                          autoComplete="given-name"
                        />
                        <Input
                          value={customerLastName}
                          onChange={(e) => setCustomerLastName(e.target.value)}
                          placeholder="Apellido"
                          className="h-10 text-sm"
                          autoComplete="family-name"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* Pago inmediato: nombre libre */
              <div className="space-y-1.5">
                <Label htmlFor="cliente">Cliente *</Label>
                <Input
                  id="cliente"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Nombre del cliente"
                  className="h-12 text-base"
                  autoComplete="name"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="notas">Notas (opcional)</Label>
              <textarea
                id="notas"
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                placeholder="Sin cebolla, bien fría…"
                rows={2}
                className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
          </div>

          {cart.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Toca productos para armar el pedido. En cerveza usa +1 tobo (= 12 bot).
            </p>
          ) : (
            <ul className="space-y-2">
              {cart.map((l) => {
                const beer = isBeerProduct(l.product.name);
                return (
                  <li
                    key={l.product.id}
                    className="rounded-xl border border-border/60 px-2.5 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {l.product.name}
                        </p>
                        <p className="text-xs tabular-nums text-muted-foreground">
                          {formatUsdAmount(Number(l.product.salePrice))}
                          {beer ? ` · ${formatBeerQty(l.quantity)}` : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          className="h-11 w-11"
                          onClick={() => setQty(l.product.id, l.quantity - 1)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="min-w-10 text-center text-xs tabular-nums font-medium leading-tight">
                          {beer ? formatBeerQty(l.quantity) : l.quantity}
                        </span>
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          className="h-11 w-11"
                          onClick={() => setQty(l.product.id, l.quantity + 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {beer && (
                      <div className="mt-1.5 flex gap-1">
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="h-8 flex-1 text-[11px]"
                          onClick={() => setQty(l.product.id, l.quantity + 1)}
                        >
                          +1 bot
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          className="h-8 flex-1 text-[11px]"
                          onClick={() =>
                            setQty(l.product.id, l.quantity + BOTTLES_PER_TOBO)
                          }
                        >
                          +1 tobo
                        </Button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          <div className="flex items-center justify-between border-t border-border pt-3">
            <span className="text-sm text-muted-foreground">Total</span>
            <span className="text-lg font-semibold tabular-nums">
              {formatUsdAmount(cartTotal)}
            </span>
          </div>

          <Button
            type="button"
            className="h-12 w-full gap-2 text-base"
            disabled={cart.length === 0 || sendMutation.isPending}
            onClick={() => sendMutation.mutate()}
          >
            {sendMutation.isPending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
            {paymentMode === 'CUENTA_ABIERTA' ? 'Agregar a cuenta abierta' : sendButtonLabel(cart)}
          </Button>
          {paymentMode === 'CUENTA_ABIERTA' ? (
            <p className="text-center text-[11px] text-muted-foreground leading-snug">
              La orden se agregará a la cuenta abierta del cliente. Caja cobra al final.
            </p>
          ) : (
            <p className="text-center text-[11px] text-muted-foreground leading-snug">
              Tú no cobras. Queda pendiente hasta que caja cierre el cobro en el POS.
            </p>
          )}
        </div>
      </aside>
    </AdminPageShell>
  );
}
