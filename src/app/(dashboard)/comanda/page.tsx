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
} from 'lucide-react';
import { toast } from 'sonner';
import { AdminPageShell } from '@/components/admin/admin-page-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import apiClient from '@/lib/api';
import {
  floorOrdersApi,
  floorOrderStatusLabel,
  floorOrderTotal,
  type FloorOrder,
} from '@/lib/api/floor-orders';
import { useAuthStore } from '@/store/useAuthStore';
import { usePermission } from '@/hooks/usePermission';
import { useDisplayCurrency } from '@/hooks/useDisplayCurrency';
import { useDebounce } from '@/hooks/useDebounce';
import { useComandaSocket } from '@/hooks/useComandaSocket';
import { cn } from '@/lib/utils';
import Link from 'next/link';

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

const STATUS_TONE: Record<string, string> = {
  SENT: 'bg-sky-500/15 text-sky-200 border-sky-500/30',
  IN_PREP: 'bg-amber-500/15 text-amber-200 border-amber-500/30',
  READY: 'bg-emerald-500/15 text-emerald-200 border-emerald-500/30',
};

export default function ComandaMenuPage() {
  const { selectedOrganizationId, selectedCompanyId } = useAuthStore();
  const orgId = selectedOrganizationId || selectedCompanyId;
  const { canTakeFloorOrder, canViewKitchenQueue } = usePermission();
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
      .slice(0, 10);
  }, [liveOrders]);

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

  const add = (product: Product) => {
    const max = avail(product);
    setCart((prev) => {
      const i = prev.findIndex((l) => l.product.id === product.id);
      if (i >= 0) {
        const next = [...prev];
        const q = Math.min(max, next[i].quantity + 1);
        next[i] = { ...next[i], quantity: q };
        return next;
      }
      return [...prev, { product, quantity: 1 }];
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
      toast.success(
        `Comanda #${order.id} enviada · ${order.tableLabel}${order.customerName ? ` · ${order.customerName}` : ''}`,
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
              ?.data?.message || 'No se pudo enviar la comanda';
      toast.error(typeof msg === 'string' ? msg : 'No se pudo enviar la comanda');
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
      eyebrow="Servicio en piso"
      title="Tomar pedido"
      subtitle="1 Pedido → 2 Cocina prepara → 3 Caja cobra en el POS. Tú solo tomas y envías."
      actions={
        <div className="flex flex-wrap gap-2">
          {canViewKitchenQueue && (
            <Button asChild variant="outline" className="h-10 min-h-12 sm:min-h-10">
              <Link href="/comanda/cocina">Cola cocina</Link>
            </Button>
          )}
          <Button
            type="button"
            className="h-10 min-h-12 sm:min-h-10 gap-2"
            onClick={() => setCartOpen(true)}
          >
            <ShoppingBag className="h-4 w-4" />
            Pedido ({cartCount})
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Flujo + mis pedidos abiertos */}
        <div className="rounded-2xl border border-border/70 bg-card/60 px-3.5 py-3 sm:px-4">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Flujo
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            <span className="text-foreground font-medium">Menú</span>
            {' → '}
            <span className="text-foreground font-medium">Cocina / barra</span>
            {' → '}
            <span className="text-foreground font-medium">POS cobra</span>
          </p>
          {myOpenOrders.length > 0 && (
            <div className="mt-3 space-y-2">
              <p className="text-xs text-muted-foreground">Pedidos en curso</p>
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
                      #{o.id} · {floorOrderStatusLabel(o.status)}
                    </p>
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
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => add(p)}
                  className={cn(
                    'group flex min-h-[7.5rem] flex-col overflow-hidden rounded-2xl border border-border/70',
                    'bg-card/80 text-left transition hover:border-primary/40 hover:bg-card',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                    a === 0 && 'opacity-50',
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
                      {a} disp.
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col gap-1 p-2.5">
                    <p className="line-clamp-2 text-sm font-medium leading-snug">
                      {p.name}
                    </p>
                    <p className="mt-auto text-sm tabular-nums text-muted-foreground">
                      {formatUsdAmount(Number(p.salePrice))}
                    </p>
                  </div>
                </button>
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
              Toca productos para armar el pedido.
            </p>
          ) : (
            <ul className="space-y-2">
              {cart.map((l) => (
                <li
                  key={l.product.id}
                  className="flex items-center gap-2 rounded-xl border border-border/60 px-2.5 py-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{l.product.name}</p>
                    <p className="text-xs tabular-nums text-muted-foreground">
                      {formatUsdAmount(Number(l.product.salePrice))}
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
                    <span className="w-8 text-center tabular-nums font-medium">
                      {l.quantity}
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
                </li>
              ))}
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
            Enviar a cocina
          </Button>
          <p className="text-center text-[11px] text-muted-foreground">
            No cobra aquí. Caja cobra en el POS cuando esté lista.
          </p>
        </div>
      </aside>
    </AdminPageShell>
  );
}
