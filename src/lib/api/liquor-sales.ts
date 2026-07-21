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

export type LiquorProductLine = {
  productId: number;
  sku: string | null;
  name: string;
  quantity: number;
  usd: number;
  bucket: string;
  opening?: number;
  remainingTheoretical?: number;
  pack: LiquorPack | null;
  packOpening?: LiquorPack | null;
  packRemaining?: LiquorPack | null;
  bucketLabel: string;
  beerStyleLabel?: string | null;
};

export type LiquorBucketBlock = {
  key: string;
  label: string;
  bottles: number;
  usd: number;
  opening?: number;
  remainingTheoretical?: number;
  pack: LiquorPack;
  packOpening?: LiquorPack;
  packRemaining?: LiquorPack;
  products: {
    productId: number;
    sku: string | null;
    name: string;
    quantity: number;
    usd: number;
    bucket: string;
    opening?: number;
    remainingTheoretical?: number;
  }[];
};

export type LiquorSalesReport = {
  day: string;
  requestedDay?: string;
  usedFallback?: boolean;
  organizationId?: number;
  openingMode?: 'automatic';
  rules: {
    bottlesPerTobo: number;
    tobosPerCase: number;
    bottlesPerCase: number;
    note: string;
  };
  beer: LiquorPack & {
    bottles: number;
    opening?: number;
    remainingTheoretical?: number;
    packOpening?: LiquorPack;
    packRemaining?: LiquorPack;
    light: LiquorBucketBlock;
    negra: LiquorBucketBlock;
    byStyle?: {
      key: string;
      label: string;
      bottles: number;
      usd: number;
      opening?: number;
      remainingTheoretical?: number;
      pack: LiquorPack;
      packOpening?: LiquorPack;
      packRemaining?: LiquorPack;
    }[];
  };
  whisky: LiquorBucketBlock;
  otros: LiquorBucketBlock;
  products: LiquorProductLine[];
};

export const liquorSalesApi = {
  getDaily: (day?: string) =>
    apiClient
      .get<LiquorSalesReport>('/invoices/liquor-sales', {
        params: day ? { day } : undefined,
      })
      .then((r) => r.data),
};
