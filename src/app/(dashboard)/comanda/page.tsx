'use client';

import { useMemo, useState } from 'react';
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
  const { canTakeFloorOrder } = usePermission();
  const { formatUsdAmount } = useDisplayCurrency();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const debounced = useDebounce(search, 200);
  const [tableLabel, setTableLabel] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartOpen, setCartOpen] = useState(false);

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
    mutationFn: () => {
      const mesa = tableLabel.trim();
      const cliente = customerName.trim();
      if (!mesa) throw new Error('Indica la mesa o zona');
      if (!cliente) throw new Error('Indica el nombre del cliente');
      return floorOrdersApi.create({
        tableLabel: mesa,
        customerName: cliente,
        notes: orderNotes.trim() || undefined,
        sendNow: true,
        items: cart.map((l) => ({
          productId: l.product.id,
          quantity: l.quantity,
          notes: l.notes,
        })),
      });
    },
    onSuccess: (order) => {
      const dest = floorOrderDestLabel(order);
      const cliente = order.customerName || customerName.trim();
      toast.success(
        `Pedido #${order.id} → ${dest} · ${order.tableLabel}${cliente ? ` · ${cliente}` : ''}`,
        {
          description: `${cliente || 'Cliente'}: pedido pendiente hasta que caja cobre. Caja ya puede verlo en la cola.`,
          duration: 8_000,
        },
      );
      setCart([]);
      setOrderNotes('');
      setCartOpen(false);
      void queryClient.invalidateQueries({ queryKey: ['products'] });
      void queryClient.invalidateQueries({ queryKey: ['floor-orders'] });
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
      actions={
        <Button
          type="button"
          className="h-10 min-h-12 sm:min-h-10 gap-2"
          onClick={() => setCartOpen(true)}
        >
          <ShoppingBag className="h-4 w-4" />
          Pedido ({cartCount})
        </Button>
      }
    >
      <FloorServiceNav />
      <div className="space-y-4">
        <div className="rounded-2xl border border-border/70 bg-card/60 px-3.5 py-3 sm:px-4">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Tu estación · {FLOOR_COPY.host.short}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Elige productos → envía a preparación → caja cobra cuando esté lista.
          </p>
          {myPendingCharge.length > 0 && (
            <div className="mt-3 rounded-xl border border-amber-500/35 bg-amber-500/10 px-3 py-2.5">
              <p className="text-sm font-medium text-amber-100">
                {myPendingCharge.length} pedido
                {myPendingCharge.length === 1 ? '' : 's'} pendiente
                {myPendingCharge.length === 1 ? '' : 's'} de cobro
              </p>
              <p className="mt-0.5 text-xs text-amber-100/80">
                El cliente ya tiene el pedido; caja debe cobrarlo en el POS.
              </p>
            </div>
          )}
          {myOpenOrders.length > 0 && (
            <div className="mt-3 space-y-2">
              <p className="text-xs text-muted-foreground">Mis pedidos en curso</p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {myOpenOrders.map((o) => (
                  <div
                    key={o.id}
                    className={cn(
                      'min-w-[10.5rem] shrink-0 rounded-xl border px-3 py-2',
                      STATUS_TONE[o.status] ?? 'border-border bg-muted/40',
                    )}
                  >
                    <p className="truncate text-sm font-semibold">
                      {o.tableLabel}
                      {o.customerName ? ` · ${o.customerName}` : ''}
                    </p>
                    <p className="text-[11px] opacity-90">
                      #{o.id} · {floorStatusLabel(o.status)}
                    </p>
                    <p className="text-[10px] opacity-75">{floorOrderDestLabel(o)}</p>
                    <p className="mt-0.5 text-xs tabular-nums opacity-80">
                      {formatUsdAmount(floorOrderTotal(o))}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {myOpenOrders.length === 0 && (
            <p className="mt-2 text-xs text-muted-foreground inline-flex items-center gap-1.5">
              <UtensilsCrossed className="h-3.5 w-3.5" />
              Sin pedidos abiertos. Arma uno desde el menú.
            </p>
          )}
        </div>

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
          <div className="grid grid-cols-1 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="mesa">Mesa / zona *</Label>
              <Input
                id="mesa"
                value={tableLabel}
                onChange={(e) => setTableLabel(e.target.value)}
                placeholder="Ej. Mesa 4 · Terraza"
                className="h-12 text-base"
                autoComplete="off"
              />
            </div>
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
            {sendButtonLabel(cart)}
          </Button>
          <p className="text-center text-[11px] text-muted-foreground leading-snug">
            Tú no cobras. Queda pendiente hasta que caja cierre el cobro en el POS.
          </p>
        </div>
      </aside>
    </AdminPageShell>
  );
}
