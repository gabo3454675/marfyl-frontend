export interface PurchaseLine {
  productId: number;
  name: string;
  sku: string | null;
  quantity: number;
  unitCostUsd: number;
  currentSalePrice: number;
  currentStock: number;
}
