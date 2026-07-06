'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  TabsContent,
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AdminCard, AdminTableWrap } from '@/components/admin/admin-card';
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Search,
  Package,
  Trash2,
  ShoppingCart,
  Plus,
} from 'lucide-react';
import { formatCurrency } from '../helpers';
import type { PurchaseLine } from '../types';
import type { ProductSearchResult, InvoiceConfirmResult } from '@/lib/api/invoice-upload';
import type { Supplier } from '@/lib/api/suppliers';

interface PurchaseEntryTabProps {
  // Lines data
  lines: PurchaseLine[];
  total: number;
  result: InvoiceConfirmResult | null;
  error: string | null;
  submitting: boolean;

  // Supplier
  suppliers: Supplier[];
  supplierId: string;

  // Metadata
  date: string;
  referenceNumber: string;

  // Search
  searchQuery: string;
  searchResults: ProductSearchResult[];
  searching: boolean;
  showDropdown: boolean;

  // Callbacks
  onAddProduct: (product: ProductSearchResult) => void;
  onLineChange: (index: number, field: 'quantity' | 'unitCostUsd', value: number) => void;
  onRemoveLine: (index: number) => void;
  onConfirm: () => void;
  onReset: () => void;
  onSearchChange: (value: string) => void;
  onSearchFocus: () => void;
  onSupplierChange: (value: string) => void;
  onDateChange: (value: string) => void;
  onReferenceChange: (value: string) => void;
  onOpenSupplierDialog: () => void;
  onDeleteSupplier: (id: number, name: string) => void;

  // Refs
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  dropdownRef: React.RefObject<HTMLDivElement | null>;
}

export default function PurchaseEntryTab({
  // Lines data
  lines,
  total,
  result,
  error,
  submitting,
  // Supplier
  suppliers,
  supplierId,
  // Metadata
  date,
  referenceNumber,
  // Search
  searchQuery,
  searchResults,
  searching,
  showDropdown,
  // Callbacks
  onAddProduct,
  onLineChange,
  onRemoveLine,
  onConfirm,
  onReset,
  onSearchChange,
  onSearchFocus,
  onSupplierChange,
  onDateChange,
  onReferenceChange,
  onOpenSupplierDialog,
  onDeleteSupplier,
  // Refs
  searchInputRef,
  dropdownRef,
}: PurchaseEntryTabProps) {
  return (
    <TabsContent value="entry" className="space-y-4">
      {/* ── Success result ── */}
      {result && (
        <AdminCard>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-lg font-semibold">Compra registrada exitosamente</p>
                <p className="text-sm text-muted-foreground">
                  Se crearon {result.movementsCreated} movimientos y se actualizaron{' '}
                  {result.productsUpdated} productos.
                </p>
              </div>
            </div>
            <AdminTableWrap>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead className="text-right">Cantidad Añadida</TableHead>
                    <TableHead className="text-right">Stock Nuevo</TableHead>
                    <TableHead className="text-right">Costo Unitario</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.lines.map((line) => (
                    <TableRow key={line.productId}>
                      <TableCell>{line.productName}</TableCell>
                      <TableCell className="text-right">+{line.quantityAdded}</TableCell>
                      <TableCell className="text-right">{line.newStock}</TableCell>
                      <TableCell className="text-right">{formatCurrency(line.unitCost)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </AdminTableWrap>
            <div className="flex items-center justify-between rounded-lg bg-muted p-3">
              <span className="text-sm font-medium">Total de la compra</span>
              <span className="text-lg font-bold">{formatCurrency(result.totalAmount)}</span>
            </div>
            {result.expenseId && (
              <p className="text-sm text-muted-foreground">
                Se creó el gasto #{result.expenseId} asociado.
              </p>
            )}
            <Button variant="outline" className="cursor-pointer" onClick={onReset}>
              Nueva compra
            </Button>
          </div>
        </AdminCard>
      )}

      {/* ── Entry form ── */}
      {!result && (
        <>
          {/* ── Search & metadata section ── */}
          <AdminCard
            title="Buscar Producto"
            description="Busca por nombre, SKU o código de barras para agregar productos a la compra"
          >
            <div className="space-y-4">
              {/* Product search autocomplete */}
              <div className="relative" ref={dropdownRef}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    ref={searchInputRef}
                    placeholder="Buscar producto..."
                    value={searchQuery}
                    onChange={(e) => {
                      onSearchChange(e.target.value);
                    }}
                    onFocus={onSearchFocus}
                    className="pl-9"
                  />
                </div>

                {/* Search dropdown */}
                {showDropdown && searchQuery.length >= 2 && (
                  <div className="absolute z-50 top-full left-0 right-0 mt-1 rounded-md border bg-popover shadow-md">
                    <div className="max-h-64 overflow-y-auto">
                      {searching && (
                        <div className="flex items-center justify-center py-6">
                          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        </div>
                      )}
                      {!searching && searchResults.length === 0 && (
                        <p className="py-6 text-center text-sm text-muted-foreground">
                          Sin resultados para &ldquo;{searchQuery}&rdquo;
                        </p>
                      )}
                      {!searching &&
                        searchResults.map((product) => (
                          <button
                            key={product.id}
                            type="button"
                            className="w-full text-left px-3 py-2 hover:bg-accent cursor-pointer border-b border-border last:border-0"
                            onClick={() => onAddProduct(product)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium truncate">{product.name}</p>
                                <div className="flex gap-3 text-xs text-muted-foreground mt-0.5">
                                  {product.sku && <span>SKU: {product.sku}</span>}
                                  {product.barcode && <span>Cód: {product.barcode}</span>}
                                </div>
                              </div>
                              <div className="text-right text-xs text-muted-foreground shrink-0 ml-3">
                                <p>Costo: {formatCurrency(product.costPrice)}</p>
                                <p>Venta: {formatCurrency(product.salePrice)}</p>
                                <p>Stock: {product.stock}</p>
                              </div>
                            </div>
                          </button>
                        ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Metadata row */}
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Proveedor</Label>
                  {suppliers.length === 0 ? (
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-muted-foreground">No hay proveedores</p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={onOpenSupplierDialog}
                        className="cursor-pointer shrink-0"
                      >
                        <Plus className="mr-1 h-3 w-3" />
                        Agregar
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Select value={supplierId} onValueChange={onSupplierChange} className="flex-1">
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar proveedor" />
                          </SelectTrigger>
                          <SelectContent>
                            {suppliers.map((s) => (
                              <SelectItem key={s.id} value={String(s.id)}>
                                {s.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {supplierId && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 text-destructive hover:text-destructive hover:bg-destructive/10 cursor-pointer shrink-0"
                            onClick={() => {
                              const selected = suppliers.find((s) => String(s.id) === supplierId);
                              if (selected) onDeleteSupplier(selected.id, selected.name);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Fecha</Label>
                  <Input
                    type="date"
                    value={date}
                    onChange={(e) => onDateChange(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Referencia (opcional)</Label>
                  <Input
                    value={referenceNumber}
                    onChange={(e) => onReferenceChange(e.target.value)}
                    placeholder="N° factura o referencia"
                  />
                </div>
              </div>
            </div>
          </AdminCard>

          {/* ── Lines table ── */}
          <AdminCard title={`Productos (${lines.length})`}>
            {lines.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
                <Package className="h-10 w-10" />
                <p>No hay productos agregados</p>
                <p className="text-xs">Busca un producto arriba para comenzar</p>
              </div>
            ) : (
              <div className="space-y-4">
                <AdminTableWrap>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[200px]">Producto</TableHead>
                        <TableHead className="text-right min-w-[80px]">Cant</TableHead>
                        <TableHead className="text-right min-w-[100px]">Costo/U</TableHead>
                        <TableHead className="text-right min-w-[100px]">P.Venta</TableHead>
                        <TableHead className="text-right min-w-[80px]">Stock</TableHead>
                        <TableHead className="text-right min-w-[100px]">Subtotal</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lines.map((line, index) => (
                        <TableRow key={line.productId}>
                          {/* Producto */}
                          <TableCell>
                            <div className="space-y-0.5">
                              <p className="text-sm font-medium">{line.name}</p>
                              {line.sku && (
                                <p className="text-xs text-muted-foreground">
                                  SKU: {line.sku}
                                </p>
                              )}
                            </div>
                          </TableCell>

                          {/* Cantidad */}
                          <TableCell className="text-right">
                            <Input
                              type="number"
                              min={1}
                              step={1}
                              value={line.quantity}
                              onChange={(e) =>
                                onLineChange(index, 'quantity', parseInt(e.target.value) || 1)
                              }
                              className="h-8 w-20 text-right text-sm"
                            />
                          </TableCell>

                          {/* Costo/Unidad */}
                          <TableCell className="text-right">
                            <Input
                              type="number"
                              min={0}
                              step={0.01}
                              value={line.unitCostUsd}
                              onChange={(e) =>
                                onLineChange(index, 'unitCostUsd', parseFloat(e.target.value) || 0)
                              }
                              className="h-8 w-24 text-right text-sm"
                            />
                          </TableCell>

                          {/* P.Venta */}
                          <TableCell className="text-right text-sm">
                            {formatCurrency(line.currentSalePrice)}
                          </TableCell>

                          {/* Stock */}
                          <TableCell className="text-right text-sm">
                            {line.currentStock}
                          </TableCell>

                          {/* Subtotal */}
                          <TableCell className="text-right font-semibold text-sm">
                            {formatCurrency(line.quantity * line.unitCostUsd)}
                          </TableCell>

                          {/* Acciones */}
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                              onClick={() => onRemoveLine(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </AdminTableWrap>

                {/* Summary */}
                <div className="flex items-center justify-between rounded-lg bg-muted p-3">
                  <div className="flex items-center gap-3">
                    <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      {lines.length} producto{lines.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <span className="text-lg font-bold">{formatCurrency(total)}</span>
                </div>
              </div>
            )}
          </AdminCard>

          {/* ── Error display ── */}
          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              <XCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {/* ── Confirm button ── */}
          {lines.length > 0 && (
            <div className="flex justify-end">
              <Button
                className="cursor-pointer"
                onClick={onConfirm}
                disabled={submitting}
              >
                {submitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                )}
                Registrar Compra
              </Button>
            </div>
          )}
        </>
      )}
    </TabsContent>
  );
}
