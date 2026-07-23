export interface DashboardSummary {
  totalSalesToday: number;
  totalSalesYesterday: number;
  productsCount: number;
  lowStockCount: number;
  recentTransactions: {
    id: number;
    customerName: string;
    amount: number;
    status: string;
    createdAt: string;
  }[];
}

export interface DashboardHealth {
  ticketPromedio: number;
  ticketPromedioPrev: number;
  crecimientoMensual: number;
  totalVentasMes: number;
  dailySalesGoal: number;
  estimatedNetProfit: number;
  estimatedNetProfitPrev: number;
}

export interface MarginErosionProduct {
  productId: number;
  productName: string;
  costPrice: number;
  salePrice: number;
  marginPct: number;
  marginCritical: boolean;
}

export interface DebtAgeCustomer {
  customerId: number;
  customerName: string;
  aTiempo: number;
  vencidas1_15: number;
  criticas30: number;
}

export interface DashboardDiagnosis {
  marginErosion: MarginErosionProduct[];
  debtAgeByCustomer: DebtAgeCustomer[];
}

export interface FrictionFunnel {
  totalCreadas: number;
  totalPagadas: number;
  tiempoPromedioHoras: number;
  tiempoPromedioDias: number;
  cuelloDeBotella: 'cobranza' | 'despacho' | null;
  mensajeAlerta: string | null;
}

export interface StrategyInsight {
  tipo: string;
  texto: string;
  entidad?: string;
}

export interface DashboardStrategy {
  frictionFunnel: FrictionFunnel;
  insights: StrategyInsight[];
}

export interface PendingTask {
  id: number;
  title: string;
  description?: string | null;
  status: string;
  priority: string;
  createdAt: string;
  dueDate?: string | null;
  createdBy: { id: number; fullName: string | null; email: string };
  organization: { id: number; nombre: string };
  invoice?: { id: number; totalAmount: unknown; status: string } | null;
}

export interface CreatedByMeTask {
  id: number;
  title: string;
  description?: string | null;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
  assignedTo: { id: number; fullName: string | null; email: string };
  organization: { id: number; nombre: string };
  invoice?: { id: number; totalAmount: unknown; status: string } | null;
}

export type TrendDirection = 'positive' | 'negative' | 'neutral';
