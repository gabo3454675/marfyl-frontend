import { apiClient } from '@/lib/api';

export type LiquorPack = {
  bottles: number;
  tobos: number;
  looseBottles: number;
  cajas: number;
  tobosSueltos: number;
  tobosExact: number;
  cajasExact: number;
};

export type LiquorBucketBlock = {
  key: string;
  label: string;
  bottles: number;
  usd: number;
  pack: LiquorPack;
  products: {
    productId: number;
    sku: string | null;
    name: string;
    quantity: number;
    usd: number;
    bucket: string;
  }[];
};

export type LiquorSalesReport = {
  day: string;
  requestedDay?: string;
  usedFallback?: boolean;
  organizationId?: number;
  rules: {
    bottlesPerTobo: number;
    tobosPerCase: number;
    bottlesPerCase: number;
    note: string;
  };
  beer: LiquorPack & {
    bottles: number;
    light: LiquorBucketBlock;
    negra: LiquorBucketBlock;
  };
  whisky: LiquorBucketBlock;
  otros: LiquorBucketBlock;
  products: {
    productId: number;
    sku: string | null;
    name: string;
    quantity: number;
    usd: number;
    bucket: string;
    bucketLabel: string;
    pack: LiquorPack | null;
  }[];
};

export const liquorSalesApi = {
  getDaily: (day?: string) =>
    apiClient
      .get<LiquorSalesReport>('/invoices/liquor-sales', {
        params: day ? { day } : undefined,
      })
      .then((r) => r.data),
};
