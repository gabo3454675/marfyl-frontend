'use client';



import { useEffect, useState } from 'react';

import apiClient from '@/lib/api';

import { Loader2 } from 'lucide-react';

import { cn } from '@/lib/utils';



type Metrics = {

  salesCount?: number;

  netIvaUsd?: number;

  periodLabel?: string;

};



export function AssistantSummaryCard({ compact = false }: { compact?: boolean }) {

  const [metrics, setMetrics] = useState<Metrics | null>(null);

  const [loading, setLoading] = useState(true);



  useEffect(() => {

    apiClient

      .get<{

        period: { label: string };

        metrics: { salesCount: number; netIvaUsd: number };

      }>('/fiscal/dashboard')

      .then((res) => {

        setMetrics({

          salesCount: res.data.metrics?.salesCount,

          netIvaUsd: res.data.metrics?.netIvaUsd,

          periodLabel: res.data.period?.label,

        });

      })

      .catch(() => setMetrics(null))

      .finally(() => setLoading(false));

  }, []);



  if (loading) {

    return (

      <div

        className={cn(

          'flex items-center justify-center',

          compact ? 'ai-metrics-inline py-3' : 'ai-summary-card py-8',

        )}

      >

        <Loader2 className="h-5 w-5 animate-spin text-white/50" />

      </div>

    );

  }



  const facturas = metrics?.salesCount ?? '—';

  const iva =

    metrics?.netIvaUsd != null

      ? `$${metrics.netIvaUsd.toLocaleString('es-VE', { maximumFractionDigits: 0 })}`

      : '—';

  const estado = metrics ? 'OK' : 'Config';



  if (compact) {

    return (

      <div className="ai-metrics-inline">

        <Metric label="Facturas" value={String(facturas)} compact />

        <Metric label="IVA neto" value={iva} compact />

        <Metric label="Estado" value={estado} highlight={!!metrics} compact />

      </div>

    );

  }



  return (

    <div className="ai-summary-card">

      <div className="grid grid-cols-3 gap-3">

        <Metric label="Facturas" value={String(facturas)} />

        <Metric label="IVA neto" value={iva} />

        <Metric label="Estado" value={estado} highlight={!!metrics} />

      </div>

      {metrics?.periodLabel && (

        <p className="mt-3 text-xs text-white/45 border-t border-white/10 pt-2">

          Período: {metrics.periodLabel}

        </p>

      )}

      {!metrics && (

        <p className="mt-3 text-xs text-white/45">Configure perfil fiscal para métricas en vivo.</p>

      )}

    </div>

  );

}



function Metric({

  label,

  value,

  highlight,

  compact,

}: {

  label: string;

  value: string;

  highlight?: boolean;

  compact?: boolean;

}) {

  return (

    <div className="min-w-0">

      <p className={cn('text-white/55', compact ? 'text-[10px]' : 'text-xs')}>{label}</p>

      <p

        className={cn(

          'font-bold tabular-nums truncate',

          compact ? 'mt-0.5 text-sm' : 'mt-1.5 text-lg',

          highlight ? 'text-emerald-300' : 'text-white',

        )}

      >

        {value}

      </p>

    </div>

  );

}


