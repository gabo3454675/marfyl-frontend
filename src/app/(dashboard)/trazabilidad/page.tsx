'use client';

import { useMemo, useState, Fragment } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  FileText,
  Loader2,
  Package,
  Search,
  Shield,
  Tag,
  ScrollText,
  ExternalLink,
} from 'lucide-react';
import { AdminPageShell } from '@/components/admin/admin-page-shell';
import { AdminCard, AdminTableWrap } from '@/components/admin/admin-card';
import { AdminStatCard } from '@/components/admin/admin-stat-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import apiClient from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { usePermission } from '@/hooks/usePermission';
import {
  TRACE_CATEGORIES,
  formatTraceDate,
  formatTraceValue,
  traceActionLabel,
  traceCategory,
  traceDiffLines,
  traceEntityHref,
  type TraceCategory,
  type TraceEvent,
} from '@/lib/traceability';

type ActivityLogRow = {
  id: number;
  action: string;
  entityType: string;
  entityId: string;
  oldValue: unknown;
  newValue: unknown;
  summary: string | null;
  createdAt: string;
  user?: { id: number; email: string; fullName: string | null } | null;
};

type AuditLogRow = {
  id: number;
  action: string;
  entityType: string | null;
  entityId: string | null;
  oldValue: unknown;
  newValue: unknown;
  actorEmail: string | null;
  targetSummary: string | null;
  createdAt: string;
};

function categoryBadgeClass(category: Exclude<TraceCategory, 'all'>): string {
  switch (category) {
    case 'invoices':
      return 'bg-sky-500/15 text-sky-700 dark:text-sky-300';
    case 'inventory':
      return 'bg-amber-500/15 text-amber-800 dark:text-amber-300';
    case 'prices':
      return 'bg-violet-500/15 text-violet-700 dark:text-violet-300';
    case 'team':
      return 'bg-rose-500/15 text-rose-700 dark:text-rose-300';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

export default function TrazabilidadPage() {
  const { isSuperAdmin } = usePermission();
  const selectedOrganizationId = useAuthStore((s) => s.selectedOrganizationId);
  const selectedCompanyId = useAuthStore((s) => s.selectedCompanyId);
  const organizationId = selectedOrganizationId || selectedCompanyId;
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<TraceCategory>('all');
  const [openId, setOpenId] = useState<string | null>(null);

  const activityQuery = useQuery({
    queryKey: ['activity-log', organizationId],
    queryFn: () =>
      apiClient
        .get<ActivityLogRow[]>('/tenants/organization/activity-log', {
          params: { limit: 200 },
        })
        .then((res) => res.data ?? []),
    enabled: !!organizationId && isSuperAdmin,
  });

  const auditQuery = useQuery({
    queryKey: ['audit-log', organizationId],
    queryFn: () =>
      apiClient
        .get<AuditLogRow[]>('/tenants/organization/audit-log', {
          params: { limit: 200 },
        })
        .then((res) => res.data ?? []),
    enabled: !!organizationId && isSuperAdmin,
  });

  const events = useMemo<TraceEvent[]>(() => {
    const fromActivity: TraceEvent[] = (activityQuery.data ?? []).map((row) => ({
      id: `op-${row.id}`,
      source: 'operacion',
      action: row.action,
      createdAt: row.createdAt,
      actor: row.user?.fullName?.trim() || row.user?.email || 'Sistema',
      summary: row.summary?.trim() || traceActionLabel(row.action),
      entityType: row.entityType ?? null,
      entityId: row.entityId ?? null,
      oldValue: row.oldValue,
      newValue: row.newValue,
    }));
    const fromAudit: TraceEvent[] = (auditQuery.data ?? []).map((row) => ({
      id: `eq-${row.id}`,
      source: 'equipo',
      action: row.action,
      createdAt: row.createdAt,
      actor: row.actorEmail || 'Sistema',
      summary: row.targetSummary?.trim() || traceActionLabel(row.action),
      entityType: row.entityType,
      entityId: row.entityId,
      oldValue: row.oldValue,
      newValue: row.newValue,
    }));
    return [...fromActivity, ...fromAudit].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [activityQuery.data, auditQuery.data]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return events.filter((event) => {
      if (category !== 'all' && traceCategory(event.action) !== category) return false;
      if (!q) return true;
      const haystack = [
        traceActionLabel(event.action),
        event.action,
        event.actor,
        event.summary,
        event.entityId ?? '',
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [events, search, category]);

  const counts = useMemo(() => {
    const tally = { invoices: 0, inventory: 0, prices: 0, team: 0 };
    for (const event of events) {
      const cat = traceCategory(event.action);
      if (cat in tally) tally[cat as keyof typeof tally] += 1;
    }
    return tally;
  }, [events]);

  const loading = activityQuery.isLoading || auditQuery.isLoading;

  if (!isSuperAdmin) {
    return (
      <AdminPageShell eyebrow="Sistema" title="Trazabilidad" subtitle="Acceso restringido">
        <AdminCard>
          <p className="py-8 text-center text-muted-foreground">
            Esta bitácora es solo para Super Admin.
          </p>
        </AdminCard>
      </AdminPageShell>
    );
  }

  return (
    <AdminPageShell
      eyebrow="Sistema"
      title="Trazabilidad"
      subtitle="Quién cambió qué en este local: facturas, precios, inventario y equipo. Cambia de organización arriba para ver otro rancho."
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <AdminStatCard title="Facturas" value={counts.invoices} icon={FileText} hint="Edits, anulaciones, montos" />
        <AdminStatCard title="Inventario" value={counts.inventory} icon={Package} hint="Autoconsumo, ajustes, compras" />
        <AdminStatCard title="Precios" value={counts.prices} icon={Tag} hint="Venta y costo" />
        <AdminStatCard title="Equipo" value={counts.team} icon={Shield} hint="Roles y desactivaciones" />
      </div>

      <AdminCard
        title={
          <span className="flex items-center gap-2">
            <ScrollText className="h-5 w-5" />
            Bitácora
          </span>
        }
        description="Últimos 200 eventos de operación y 200 de equipo. El detalle muestra el valor anterior y el nuevo."
        headerActions={
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por persona, factura o texto"
                className="pl-9"
              />
            </div>
            <Select value={category} onValueChange={(v) => setCategory(v as TraceCategory)}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TRACE_CATEGORIES.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
      >
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="py-12 text-center text-muted-foreground">
            {events.length === 0
              ? 'Aún no hay registros en este local.'
              : 'Ningún evento coincide con el filtro.'}
          </p>
        ) : (
          <>
            <div className="space-y-3 md:hidden">
              {filtered.map((event) => {
                const cat = traceCategory(event.action);
                const href = traceEntityHref(event);
                const open = openId === event.id;
                const diffs = traceDiffLines(event.oldValue, event.newValue);
                return (
                  <div key={event.id} className="rounded-lg border bg-card p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-2">
                      <Badge variant="secondary" className={categoryBadgeClass(cat)}>
                        {traceActionLabel(event.action)}
                      </Badge>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {formatTraceDate(event.createdAt)}
                      </span>
                    </div>
                    <p className="mt-2 text-sm font-medium">{event.actor}</p>
                    <p className="mt-1 text-sm text-muted-foreground break-words">{event.summary}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(diffs.length > 0 || event.oldValue != null || event.newValue != null) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setOpenId(open ? null : event.id)}
                        >
                          {open ? 'Ocultar detalle' : 'Ver detalle'}
                        </Button>
                      )}
                      {href && (
                        <Button variant="outline" size="sm" asChild>
                          <Link href={href}>
                            Abrir
                            <ExternalLink className="ml-1 h-3.5 w-3.5" />
                          </Link>
                        </Button>
                      )}
                    </div>
                    {open && <TraceDetail event={event} diffs={diffs} />}
                  </div>
                );
              })}
            </div>

            <div className="hidden md:block">
              <AdminTableWrap>
                <Table className="min-w-[860px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Quién</TableHead>
                      <TableHead>Acción</TableHead>
                      <TableHead>Detalle</TableHead>
                      <TableHead className="text-right">Ver</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((event) => {
                      const cat = traceCategory(event.action);
                      const href = traceEntityHref(event);
                      const open = openId === event.id;
                      const diffs = traceDiffLines(event.oldValue, event.newValue);
                      const hasDetail =
                        diffs.length > 0 || event.oldValue != null || event.newValue != null;
                      return (
                        <Fragment key={event.id}>
                          <TableRow>
                            <TableCell className="whitespace-nowrap text-muted-foreground">
                              {formatTraceDate(event.createdAt)}
                            </TableCell>
                            <TableCell className="font-medium">{event.actor}</TableCell>
                            <TableCell>
                              <Badge variant="secondary" className={categoryBadgeClass(cat)}>
                                {traceActionLabel(event.action)}
                              </Badge>
                            </TableCell>
                            <TableCell className="max-w-md text-sm text-muted-foreground">
                              <span className="line-clamp-2">{event.summary}</span>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                {hasDetail && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setOpenId(open ? null : event.id)}
                                  >
                                    {open ? 'Ocultar' : 'Detalle'}
                                  </Button>
                                )}
                                {href && (
                                  <Button variant="ghost" size="sm" asChild>
                                    <Link href={href}>Abrir</Link>
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                          {open && (
                            <TableRow>
                              <TableCell colSpan={5} className="bg-muted/40">
                                <TraceDetail event={event} diffs={diffs} />
                              </TableCell>
                            </TableRow>
                          )}
                        </Fragment>
                      );
                    })}
                  </TableBody>
                </Table>
              </AdminTableWrap>
            </div>
          </>
        )}
      </AdminCard>
    </AdminPageShell>
  );
}

function TraceDetail({
  event,
  diffs,
}: {
  event: TraceEvent;
  diffs: { key: string; from: string; to: string }[];
}) {
  return (
    <div className="mt-3 space-y-2 text-sm md:mt-0">
      <p className="text-xs text-muted-foreground">
        Origen: {event.source === 'operacion' ? 'Operación' : 'Equipo'}
        {event.entityType ? ` · ${event.entityType} ${event.entityId ?? ''}` : ''}
      </p>
      {diffs.length > 0 ? (
        <div className="grid gap-2">
          {diffs.map((line) => (
            <div key={line.key} className="rounded-md border bg-background px-3 py-2">
              <p className="text-xs font-medium text-muted-foreground">{line.key}</p>
              <p className="mt-1 break-all">
                <span className="text-muted-foreground">{line.from}</span>
                <span className="mx-2 text-muted-foreground">→</span>
                <span className="font-medium">{line.to}</span>
              </p>
            </div>
          ))}
        </div>
      ) : (
        <pre className="overflow-x-auto rounded-md border bg-background p-3 text-xs">
          {formatTraceValue(event.newValue ?? event.oldValue)}
        </pre>
      )}
    </div>
  );
}
