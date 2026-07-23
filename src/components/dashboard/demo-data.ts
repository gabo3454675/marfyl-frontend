import type { DashboardDiagnosis, DashboardHealth, DashboardStrategy, DashboardSummary } from './types';

export const EMPTY_HEALTH: DashboardHealth = {
  ticketPromedio: 0,
  ticketPromedioPrev: 0,
  crecimientoMensual: 0,
  totalVentasMes: 0,
  dailySalesGoal: 0,
  estimatedNetProfit: 0,
  estimatedNetProfitPrev: 0,
};

export const EMPTY_SUMMARY: DashboardSummary = {
  totalSalesToday: 0,
  totalSalesYesterday: 0,
  productsCount: 0,
  lowStockCount: 0,
  recentTransactions: [],
};

export const EMPTY_DIAGNOSIS: DashboardDiagnosis = {
  marginErosion: [],
  debtAgeByCustomer: [],
};

export const EMPTY_STRATEGY: DashboardStrategy = {
  frictionFunnel: {
    totalCreadas: 0,
    totalPagadas: 0,
    tiempoPromedioHoras: 0,
    tiempoPromedioDias: 0,
    cuelloDeBotella: null,
    mensajeAlerta: null,
  },
  insights: [],
};

/** Datos de demostración atractivos cuando el estado real está en cero. */
export const DEMO_SUMMARY: DashboardSummary = {
  totalSalesToday: 1240,
  totalSalesYesterday: 980,
  productsCount: 156,
  lowStockCount: 3,
  recentTransactions: [
    { id: 1, customerName: 'María González', amount: 85.5, status: 'PAID', createdAt: new Date().toISOString() },
    { id: 2, customerName: 'Carlos Ruiz', amount: 142, status: 'PENDING', createdAt: new Date().toISOString() },
    { id: 3, customerName: 'Ana Pérez', amount: 67.25, status: 'PAID', createdAt: new Date().toISOString() },
  ],
};

export const DEMO_HEALTH: DashboardHealth = {
  ticketPromedio: 42.5,
  ticketPromedioPrev: 38.2,
  crecimientoMensual: 12.4,
  totalVentasMes: 18500,
  dailySalesGoal: 1500,
  estimatedNetProfit: 4625,
  estimatedNetProfitPrev: 3850,
};

export const DEMO_DIAGNOSIS: DashboardDiagnosis = {
  marginErosion: [
    { productId: 1, productName: 'Harina PAN', costPrice: 2.1, salePrice: 2.4, marginPct: 12.5, marginCritical: true },
    { productId: 2, productName: 'Aceite 1L', costPrice: 4.8, salePrice: 5.5, marginPct: 12.7, marginCritical: true },
    { productId: 3, productName: 'Queso Llanero', costPrice: 6.2, salePrice: 7.5, marginPct: 17.3, marginCritical: false },
    { productId: 4, productName: 'Pollo Entero', costPrice: 8.5, salePrice: 11.0, marginPct: 22.7, marginCritical: false },
  ],
  debtAgeByCustomer: [],
};

export const DEMO_STRATEGY: DashboardStrategy = {
  frictionFunnel: {
    totalCreadas: 48,
    totalPagadas: 42,
    tiempoPromedioHoras: 18,
    tiempoPromedioDias: 0.75,
    cuelloDeBotella: null,
    mensajeAlerta: null,
  },
  insights: [
    { tipo: 'producto_margen', texto: 'Revisa precios de productos con margen bajo por fluctuación BCV.' },
  ],
};

export function withDemoSummary(data: DashboardSummary, useDemo: boolean): DashboardSummary {
  if (!useDemo) return data;
  const hasData =
    data.totalSalesToday > 0 ||
    data.productsCount > 0 ||
    data.recentTransactions.length > 0;
  return hasData ? data : DEMO_SUMMARY;
}

export function withDemoHealth(data: DashboardHealth, useDemo: boolean): DashboardHealth {
  if (!useDemo) return data;
  const hasData =
    data.totalVentasMes > 0 ||
    data.estimatedNetProfit !== 0;
  return hasData ? data : DEMO_HEALTH;
}

export function withDemoDiagnosis(data: DashboardDiagnosis, useDemo: boolean): DashboardDiagnosis {
  if (!useDemo) return data;
  return data.marginErosion.length > 0 ? data : DEMO_DIAGNOSIS;
}

export function withDemoStrategy(data: DashboardStrategy, useDemo: boolean): DashboardStrategy {
  if (!useDemo) return data;
  return data.frictionFunnel.totalCreadas > 0 || data.insights.length > 0 ? data : DEMO_STRATEGY;
}

export function pctChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

export function generateSparkline(value: number, points = 6): number[] {
  return Array.from({ length: points }, (_, i) => {
    const factor = 0.75 + i * 0.05 + (Math.sin(i) * 0.05);
    return Math.max(0, Math.round(value * factor));
  });
}
