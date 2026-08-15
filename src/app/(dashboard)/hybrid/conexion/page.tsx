'use client';

import { useCallback, useEffect, useState } from 'react';
import { Cable, Loader2, RefreshCw, Shield } from 'lucide-react';
import { AdminPageShell } from '@/components/admin/admin-page-shell';
import { AdminCard } from '@/components/admin/admin-card';
import { AdminStatCard } from '@/components/admin/admin-stat-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { usePermission } from '@/hooks/usePermission';
import { useHybridPageGate } from '@/hooks/useHybridPageGate';
import {
  getHybridConnection,
  getHybridErrorMessage,
  type HybridConnectionStatus,
} from '@/lib/api/hybrid';

function formatCheckedAt(iso: string | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('es-VE');
}

export default function HybridConexionPage() {
  const { ready, allowed } = useHybridPageGate();
  const { isSuperAdmin } = usePermission();
  const [status, setStatus] = useState<HybridConnectionStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!isSuperAdmin || !allowed) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getHybridConnection();
      setStatus(data);
    } catch (err) {
      setStatus(null);
      setError(getHybridErrorMessage(err, 'No se pudo verificar la conexión Hybrid'));
    } finally {
      setLoading(false);
    }
  }, [isSuperAdmin, allowed]);

  useEffect(() => {
    if (!isSuperAdmin || !allowed) return;
    void load();
  }, [isSuperAdmin, allowed, load]);

  if (!ready || !allowed) {
    return (
      <AdminPageShell
        loading
        loadingLabel="Verificando acceso…"
        title="Hybrid POS"
      />
    );
  }

  if (!isSuperAdmin) {
    return (
      <AdminPageShell eyebrow="Sistema" title="Hybrid POS" subtitle="Acceso restringido">
        <AdminCard>
          <p className="py-8 text-center text-muted-foreground">
            Este diagnóstico es solo para Super Admin.
          </p>
        </AdminCard>
      </AdminPageShell>
    );
  }

  const reachable = status?.reachable === true;
  const configured = status?.configured === true;

  return (
    <AdminPageShell
      eyebrow="Sistema"
      title="Hybrid POS"
      subtitle="Diagnóstico de conexión con la API Hybrid (solo lectura)."
      actions={
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="cursor-pointer"
          onClick={() => void load()}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          Probar conexión
        </Button>
      }
    >
      {error ? (
        <div
          role="alert"
          className="mb-4 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-4 sm:mb-6">
        <AdminStatCard
          title="Configurado"
          value={configured ? 'Sí' : 'No'}
          icon={Shield}
          hint="URL + token en backend"
        />
        <AdminStatCard
          title="Alcanzable"
          value={reachable ? 'Sí' : 'No'}
          icon={Cable}
          hint={status?.baseUrlHost ?? 'Sin host'}
        />
        <AdminStatCard
          title="Latencia"
          value={
            status?.latencyMs != null ? `${Math.round(status.latencyMs)} ms` : '—'
          }
          icon={RefreshCw}
          hint="GET /health"
        />
        <AdminStatCard
          title="Tablas Hybrid"
          value={
            status?.health?.tablas != null
              ? String(status.health.tablas)
              : '—'
          }
          icon={Cable}
          hint={
            status?.health?.solo_lectura === true
              ? 'Solo lectura'
              : status?.health
                ? 'Health recibido'
                : 'Sin health'
          }
        />
      </div>

      <AdminCard
        title="Estado de conexión"
        description="Solo lectura. El token nunca se muestra en pantalla ni en la respuesta."
      >
        {loading && !status ? (
          <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground justify-center">
            <Loader2 className="h-5 w-5 animate-spin" />
            Probando conexión…
          </div>
        ) : (
          <dl className="grid gap-3 sm:grid-cols-2 text-sm">
            <div>
              <dt className="text-xs text-muted-foreground">Host</dt>
              <dd className="font-medium">{status?.baseUrlHost || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Comprobado</dt>
              <dd className="font-medium">
                {formatCheckedAt(status?.checkedAt)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Estado</dt>
              <dd className="font-medium flex flex-wrap gap-2 items-center">
                <Badge variant={configured ? 'default' : 'secondary'}>
                  {configured ? 'Configurado' : 'Sin configurar'}
                </Badge>
                <Badge variant={reachable ? 'default' : 'destructive'}>
                  {reachable ? 'Online' : 'Offline'}
                </Badge>
                {status?.health?.ok === true ? (
                  <Badge variant="outline">Health OK</Badge>
                ) : null}
                {status?.health?.solo_lectura === true ? (
                  <Badge variant="outline">Solo lectura</Badge>
                ) : null}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Detalle</dt>
              <dd className="font-medium text-muted-foreground">
                {status?.error ||
                  (reachable
                    ? 'Conexión Hybrid POS operativa.'
                    : 'Sin respuesta del upstream.')}
              </dd>
            </div>
          </dl>
        )}
      </AdminCard>
    </AdminPageShell>
  );
}
