'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { AdminPageShell } from '@/components/admin/admin-page-shell';
import { AdminCard, AdminTableWrap } from '@/components/admin/admin-card';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Search,
  Package,
  AlertCircle,
  History,
  Trash2,
  ShoppingCart,
  Plus,
  DollarSign,
  Info,
} from 'lucide-react';
import apiClient from '@/lib/api';
import { expenseService } from '@/lib/api/expenses';
import { useAuthStore } from '@/store/useAuthStore';
import { usePermission } from '@/hooks/usePermission';
import { useDebounce } from '@/hooks/useDebounce';
import {
  invoiceUploadService,
  type InvoiceConfirmResult,
  type ProductSearchResult,
  type InvoiceHistoryResponse,
  type InvoiceHistoryItem,
  type InvoiceHistoryDetail,
} from '@/lib/api/invoice-upload';
import { supplierService, type Supplier } from '@/lib/api/suppliers';

/* ─────────── Currency / Date helpers ─────────── */

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('es-VE', { style: 'currency', currency: 'USD' }).format(amount);

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString('es-VE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

interface PurchaseLine {
  productId: number;
  name: string;
  sku: string | null;
  quantity: number;
  unitCostUsd: number;
  currentSalePrice: number;
  currentStock: number;
}

/* ─────────── Main Page ─────────── */

export default function InvoiceUploadPage() {
  const { selectedCompanyId } = useAuthStore();
  const { canManageInventory } = usePermission();

  /* ── Purchase entry state ── */
  const [lines, setLines] = useState<PurchaseLine[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ProductSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [supplierId, setSupplierId] = useState<string>('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<InvoiceConfirmResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  /* ── Supporting state ── */
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [activeTab, setActiveTab] = useState('entry');
  const [history, setHistory] = useState<InvoiceHistoryResponse | null>(null);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [isSupplierDialogOpen, setIsSupplierDialogOpen] = useState(false);
  const [supplierFormData, setSupplierFormData] = useState({
    name: '',
    taxId: '',
    email: '',
    phone: '',
    address: '',
  });
  const [supplierSubmitting, setSupplierSubmitting] = useState(false);

  /* ── Payment dialog state ── */
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentTarget, setPaymentTarget] = useState<{ id: number; amount: number; amountPaid: number } | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState<{ id: number; amount: number; paidAt: string; notes: string | null }[]>([]);

  /* ── Details dialog state ── */
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsTarget, setDetailsTarget] = useState<InvoiceHistoryDetail | null>(null);

  /* ── Refs ── */
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  /* ── Fetch suppliers ── */
  const fetchSuppliers = useCallback(async () => {
    if (!selectedCompanyId) return;
    try {
      const data = await supplierService.getAll();
      setSuppliers(data);
    } catch {
      // non-critical
    }
  }, [selectedCompanyId]);

  /* ── Fetch history ── */
  const fetchHistory = useCallback(async (page = 1) => {
    if (!selectedCompanyId) return;
    setHistoryLoading(true);
    try {
      const data = await invoiceUploadService.getHistory({ page, limit: 15 });
      setHistory(data);
    } catch {
      // non-critical
    } finally {
      setHistoryLoading(false);
    }
  }, [selectedCompanyId]);

  /* ── Supplier dialog handlers ── */
  const handleOpenSupplierDialog = () => {
    setSupplierFormData({ name: '', taxId: '', email: '', phone: '', address: '' });
    setIsSupplierDialogOpen(true);
  };

  const handleSaveSupplier = async () => {
    if (!supplierFormData.name) {
      alert('El nombre es requerido');
      return;
    }
    setSupplierSubmitting(true);
    try {
      const newSupplier = await supplierService.create(supplierFormData);
      alert('Proveedor creado exitosamente');
      setIsSupplierDialogOpen(false);
      // Add the new supplier to the list and select it
      setSuppliers((prev) => [...prev, newSupplier].sort((a, b) => a.name.localeCompare(b.name)));
      setSupplierId(String(newSupplier.id));
    } catch (error: any) {
      console.error('Error saving supplier:', error);
      alert(error.response?.data?.message || 'Error al guardar el proveedor');
    } finally {
      setSupplierSubmitting(false);
    }
  };

  const handleDeleteExpense = async (id: number) => {
    if (!confirm('¿Eliminar esta factura importada? Se revertirá el stock de los productos.')) return;
    try {
      await apiClient.delete(`/expenses/${id}`);
      alert('Factura eliminada y stock revertido');
      fetchHistory(historyPage);
    } catch (error: any) {
      console.error('Error deleting expense:', error);
      alert(error.response?.data?.message || 'Error al eliminar la factura');
    }
  };

  // Called from table row — needs to fetch detail first
  const openPaymentDialogFromTable = async (item: { id: number }) => {
    setPaymentLoading(true);
    setPaymentDialogOpen(true);
    try {
      const detail = await invoiceUploadService.getHistoryDetail(item.id);
      const remaining = Math.max(0, detail.amount - detail.amountPaid);
      setPaymentTarget({ id: item.id, amount: detail.amount, amountPaid: detail.amountPaid });
      setPaymentHistory(detail.payments);
      setPaymentAmount(remaining > 0 ? String(remaining.toFixed(2)) : '');
      setPaymentNotes('');
    } catch (error) {
      console.error('Error loading detail for payment:', error);
      setPaymentDialogOpen(false);
    } finally {
      setPaymentLoading(false);
    }
  };

  // Called from details dialog — data already available, instant open
  const openPaymentDialogFromDetail = (detail: InvoiceHistoryDetail) => {
    const remaining = Math.max(0, detail.amount - detail.amountPaid);
    setPaymentTarget({ id: detail.id, amount: detail.amount, amountPaid: detail.amountPaid });
    setPaymentHistory(detail.payments);
    setPaymentAmount(remaining > 0 ? String(remaining.toFixed(2)) : '');
    setPaymentNotes('');
    setDetailsDialogOpen(false);
    setPaymentDialogOpen(true);
  };

  const openDetailsDialog = async (item: InvoiceHistoryItem) => {
    setDetailsDialogOpen(true);
    setDetailsLoading(true);
    try {
      const detail = await invoiceUploadService.getHistoryDetail(item.id);
      setDetailsTarget(detail);
    } catch (error) {
      console.error('Error loading detail:', error);
      setDetailsDialogOpen(false);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleRegisterPayment = async () => {
    if (!paymentTarget || !paymentAmount) return;
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) return;

    setPaymentLoading(true);
    try {
      await expenseService.registerPayment(paymentTarget.id, {
        amount,
        notes: paymentNotes || undefined,
      });
      setPaymentDialogOpen(false);
      setPaymentHistory([]);
      fetchHistory(historyPage);
    } catch (error) {
      console.error('Error registering payment:', error);
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleDeleteSupplier = async (id: number, name: string) => {
    if (!confirm(`¿Eliminar el proveedor "${name}"?`)) return;
    try {
      await supplierService.remove(id);
      alert('Proveedor eliminado exitosamente');
      setSuppliers((prev) => prev.filter((s) => s.id !== id));
      // If the deleted supplier was selected, clear the selection
      if (supplierId === String(id)) {
        setSupplierId('');
      }
    } catch (error: any) {
      console.error('Error deleting supplier:', error);
      alert(error.response?.data?.message || 'Error al eliminar el proveedor');
    }
  };

  useEffect(() => {
    if (selectedCompanyId && canManageInventory) {
      fetchSuppliers();
    }
  }, [selectedCompanyId, canManageInventory, fetchSuppliers]);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory(historyPage);
    }
  }, [activeTab, historyPage, fetchHistory]);

  /* ── Product search effect (debounced) ── */
  useEffect(() => {
    if (debouncedSearchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    let cancelled = false;
    setSearching(true);
    setShowDropdown(true);
    invoiceUploadService
      .searchProducts(debouncedSearchQuery)
      .then((results) => {
        if (!cancelled) {
          // Filter out bundles and services
          setSearchResults(
            results.filter((p) => !p.isBundle && !p.isService)
          );
        }
      })
      .catch(() => {
        if (!cancelled) setSearchResults([]);
      })
      .finally(() => {
        if (!cancelled) setSearching(false);
      });
    return () => { cancelled = true; };
  }, [debouncedSearchQuery]);

  /* ── Close dropdown on outside click ── */
  useEffect(() => {
    if (!showDropdown) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showDropdown]);

  /* ═══════════════════════════════════════════════
     Handlers
     ═══════════════════════════════════════════════ */

  const handleAddProduct = (product: ProductSearchResult) => {
    // If product already exists in the list, increment quantity
    const existingIndex = lines.findIndex((l) => l.productId === product.id);
    if (existingIndex >= 0) {
      setLines((prev) =>
        prev.map((line, i) =>
          i === existingIndex
            ? { ...line, quantity: line.quantity + 1 }
            : line
        )
      );
    } else {
      setLines((prev) => [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          sku: product.sku,
          quantity: 1,
          unitCostUsd: product.costPrice,
          currentSalePrice: product.salePrice,
          currentStock: product.stock,
        },
      ]);
    }
    setSearchQuery('');
    setSearchResults([]);
    setShowDropdown(false);
    // Focus back on search input for quick entry
    setTimeout(() => searchInputRef.current?.focus(), 50);
  };

  const handleLineChange = (index: number, field: 'quantity' | 'unitCostUsd', value: number) => {
    setLines((prev) =>
      prev.map((line, i) =>
        i === index ? { ...line, [field]: value } : line
      )
    );
  };

  const handleRemoveLine = (index: number) => {
    setLines((prev) => prev.filter((_, i) => i !== index));
  };

  const handleConfirm = async () => {
    if (lines.length === 0) return;
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        lines: lines.map((l) => ({
          productId: l.productId,
          quantity: l.quantity,
          unitCostUsd: l.unitCostUsd,
          originalName: l.name,
        })),
        supplierId: supplierId ? parseInt(supplierId) : undefined,
        date,
        referenceNumber: referenceNumber || undefined,
        description: `Compra de inventario - ${lines.length} productos`,
        createExpense: true,
      };

      const data = await invoiceUploadService.confirm(payload);
      setResult(data);
      // Reset form
      setLines([]);
      setSupplierId('');
      setDate(new Date().toISOString().split('T')[0]);
      setReferenceNumber('');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Error al registrar la compra');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setLines([]);
    setResult(null);
    setError(null);
    setSearchQuery('');
    setSupplierId('');
    setDate(new Date().toISOString().split('T')[0]);
    setReferenceNumber('');
  };

  /* ═══════════════════════════════════════════════
     Permission Gate
     ═══════════════════════════════════════════════ */

  if (!canManageInventory) {
    return (
      <AdminPageShell eyebrow="Inventario" title="Entrada de Compra" maxWidth="wide">
        <AdminCard>
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <AlertCircle className="h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">No tienes permisos para acceder a esta sección.</p>
          </div>
        </AdminCard>
      </AdminPageShell>
    );
  }

  /* ═══════════════════════════════════════════════
     Derived values
     ═══════════════════════════════════════════════ */

  const total = lines.reduce((sum, l) => sum + l.quantity * l.unitCostUsd, 0);

  /* ═══════════════════════════════════════════════
     Render
     ═══════════════════════════════════════════════ */

  return (
    <AdminPageShell
      eyebrow="Inventario"
      title="Entrada de Compra"
      subtitle="Registra productos comprados y actualiza el inventario"
      maxWidth="wide"
    >
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="entry">Registrar compra</TabsTrigger>
          <TabsTrigger value="history">Historial</TabsTrigger>
        </TabsList>

        {/* ════════════ ENTRY TAB ════════════ */}
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
                <Button variant="outline" className="cursor-pointer" onClick={handleReset}>
                  Nueva compra
                </Button>
              </div>
            </AdminCard>
          )}

          {/* ── Entry form ── */}
          {!result && (
            <>
              {/* ── Search & metadata section ── */}
              <AdminCard title="Buscar Producto" description="Busca por nombre, SKU o código de barras para agregar productos a la compra">
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
                          setSearchQuery(e.target.value);
                          if (e.target.value.length >= 2) {
                            setShowDropdown(true);
                          }
                        }}
                        onFocus={() => {
                          if (searchQuery.length >= 2) {
                            setShowDropdown(true);
                          }
                        }}
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
                          {!searching && searchResults.map((product) => (
                            <button
                              key={product.id}
                              type="button"
                              className="w-full text-left px-3 py-2 hover:bg-accent cursor-pointer border-b border-border last:border-0"
                              onClick={() => handleAddProduct(product)}
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
                            onClick={handleOpenSupplierDialog}
                            className="cursor-pointer shrink-0"
                          >
                            <Plus className="mr-1 h-3 w-3" />
                            Agregar
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Select value={supplierId} onValueChange={setSupplierId} className="flex-1">
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
                                  if (selected) handleDeleteSupplier(selected.id, selected.name);
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
                        onChange={(e) => setDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Referencia (opcional)</Label>
                      <Input
                        value={referenceNumber}
                        onChange={(e) => setReferenceNumber(e.target.value)}
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
                                    handleLineChange(index, 'quantity', parseInt(e.target.value) || 1)
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
                                    handleLineChange(index, 'unitCostUsd', parseFloat(e.target.value) || 0)
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
                                  onClick={() => handleRemoveLine(index)}
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
                    onClick={handleConfirm}
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

        {/* ════════════ HISTORY TAB ════════════ */}
        <TabsContent value="history" className="space-y-4">
          <AdminCard
            title={
              <span className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Historial de Importaciones
              </span>
            }
          >
            {historyLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : !history || history.items.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No hay importaciones registradas
              </div>
            ) : (
              <>
                <AdminTableWrap>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Proveedor</TableHead>
                        <TableHead className="text-right">Monto</TableHead>
                        <TableHead>Referencia</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {history.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{formatDate(item.date)}</TableCell>
                          <TableCell>{item.supplier?.name || '—'}</TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatCurrency(item.amount)}
                          </TableCell>
                          <TableCell>{item.referenceNumber || '—'}</TableCell>
                          <TableCell>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                item.status === 'PAID'
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                  : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                              }`}
                            >
                              {item.status === 'PAID' ? 'Pagado' : 'Pendiente'}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 cursor-pointer text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                title="Ver detalles"
                                onClick={() => openDetailsDialog(item)}
                              >
                                <Info className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 cursor-pointer text-green-600 hover:text-green-700 hover:bg-green-50"
                                title="Registrar abono"
                                onClick={() => openPaymentDialogFromTable(item)}
                              >
                                <DollarSign className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                                onClick={() => handleDeleteExpense(item.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </AdminTableWrap>

                {/* Pagination */}
                {history.pages > 1 && (
                  <div className="flex items-center justify-between pt-4">
                    <p className="text-sm text-muted-foreground">
                      Página {history.page} de {history.pages}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="cursor-pointer"
                        disabled={history.page <= 1}
                        onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                      >
                        Anterior
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="cursor-pointer"
                        disabled={history.page >= history.pages}
                        onClick={() => setHistoryPage((p) => p + 1)}
                      >
                        Siguiente
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </AdminCard>
        </TabsContent>
      </Tabs>

      {/* Dialog para Crear Proveedor */}
      <Dialog open={isSupplierDialogOpen} onOpenChange={setIsSupplierDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo Proveedor</DialogTitle>
            <DialogDescription>Registra un nuevo proveedor en el sistema</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="supplier-name">Nombre *</Label>
              <Input
                id="supplier-name"
                value={supplierFormData.name}
                onChange={(e) => setSupplierFormData({ ...supplierFormData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplier-taxId">RIF/ID</Label>
              <Input
                id="supplier-taxId"
                value={supplierFormData.taxId}
                onChange={(e) => setSupplierFormData({ ...supplierFormData, taxId: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplier-email">Email</Label>
              <Input
                id="supplier-email"
                type="email"
                value={supplierFormData.email}
                onChange={(e) => setSupplierFormData({ ...supplierFormData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplier-phone">Teléfono</Label>
              <Input
                id="supplier-phone"
                value={supplierFormData.phone}
                onChange={(e) => setSupplierFormData({ ...supplierFormData, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplier-address">Dirección</Label>
              <Input
                id="supplier-address"
                value={supplierFormData.address}
                onChange={(e) => setSupplierFormData({ ...supplierFormData, address: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="cursor-pointer" onClick={() => setIsSupplierDialogOpen(false)}>
              Cancelar
            </Button>
            <Button className="cursor-pointer" onClick={handleSaveSupplier} disabled={supplierSubmitting}>
              {supplierSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Crear'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] sm:w-full max-w-md p-4 sm:p-6">
          {paymentLoading ? (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Cargando información…</p>
            </div>
          ) : paymentTarget ? (
            (() => {
              const remaining = paymentTarget.amount - paymentTarget.amountPaid;
              const isFullyPaid = remaining <= 0.01;

              if (isFullyPaid) {
                return (
                  <>
                    <DialogHeader>
                      <DialogTitle className="text-green-500">Factura Completamente Pagada</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col items-center justify-center py-4 gap-3">
                      <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                        <CheckCircle2 className="h-7 w-7 text-green-500" />
                      </div>
                      <p className="text-sm text-center text-muted-foreground">
                        Esta factura ya fue pagada en su totalidad.
                      </p>
                    </div>
                    {paymentHistory.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-muted-foreground text-xs font-medium">Registro de pagos ({paymentHistory.length})</span>
                        <div className="space-y-1 max-h-[200px] overflow-y-auto">
                          {paymentHistory.map((p) => (
                            <div key={p.id} className="flex items-center justify-between text-xs bg-muted/50 rounded px-3 py-1.5">
                              <span className="text-muted-foreground">{new Date(p.paidAt).toLocaleDateString('es-VE')}</span>
                              <span className="font-medium">{formatCurrency(p.amount)}</span>
                              {p.notes && <span className="text-muted-foreground italic truncate max-w-[120px]">{p.notes}</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>
                        Cerrar
                      </Button>
                    </DialogFooter>
                  </>
                );
              }

              return (
                <>
                  <DialogHeader>
                    <DialogTitle>Registrar Abono</DialogTitle>
                    <DialogDescription asChild>
                      <div className="flex flex-col gap-1 mt-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total</span>
                          <span className="font-semibold">{formatCurrency(paymentTarget.amount)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Pagado</span>
                          <span className="font-semibold text-green-500">{formatCurrency(paymentTarget.amountPaid)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Saldo</span>
                          <span className="font-semibold text-red-500">{formatCurrency(remaining)}</span>
                        </div>
                      </div>
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 pt-2">
                    <div className="space-y-2">
                      <Label htmlFor="paymentAmount">Monto a abonar</Label>
                      <Input
                        id="paymentAmount"
                        type="number"
                        step="0.01"
                        min="0.01"
                        max={remaining}
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="paymentNotes">Notas (opcional)</Label>
                      <Input
                        id="paymentNotes"
                        value={paymentNotes}
                        onChange={(e) => setPaymentNotes(e.target.value)}
                        placeholder="Referencia de pago, banco, etc."
                      />
                    </div>
                  </div>
                  {paymentHistory.length > 0 && (
                    <div className="space-y-2 pt-2 border-t">
                      <span className="text-muted-foreground text-xs font-medium">Pagos anteriores ({paymentHistory.length})</span>
                      <div className="space-y-1 max-h-[150px] overflow-y-auto">
                        {paymentHistory.map((p) => (
                          <div key={p.id} className="flex items-center justify-between text-xs bg-muted/50 rounded px-3 py-1.5">
                            <span className="text-muted-foreground">{new Date(p.paidAt).toLocaleDateString('es-VE')}</span>
                            <span className="font-medium">{formatCurrency(p.amount)}</span>
                            {p.notes && <span className="text-muted-foreground italic text-[10px] sm:text-xs truncate max-w-[80px] sm:max-w-[120px]">{p.notes}</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleRegisterPayment}
                      disabled={paymentLoading || !paymentAmount || parseFloat(paymentAmount) <= 0}
                    >
                      {paymentLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Registrar Pago
                    </Button>
                  </DialogFooter>
                </>
              );
            })()
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] sm:w-full max-w-lg p-0 max-h-[90dvh] flex flex-col">
          <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-0">
            <DialogTitle>Detalles de la Importación</DialogTitle>
            <DialogDescription>
              {detailsTarget?.supplier?.name || detailsTarget?.category?.name || '—'} · {detailsTarget ? formatDate(detailsTarget.date) : ''}
            </DialogDescription>
          </DialogHeader>
          {detailsLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Cargando detalles…</p>
            </div>
          ) : detailsTarget ? (
            <div className="overflow-y-auto px-4 sm:px-6 pb-4 sm:pb-6 space-y-4 text-sm">
              {/* General info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <span className="text-muted-foreground text-xs">Descripción</span>
                  <p className="font-medium break-words">{detailsTarget.description}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Estado</span>
                  <p>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      detailsTarget.status === 'PAID'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                    }`}>
                      {detailsTarget.status === 'PAID' ? 'Pagado' : 'Pendiente'}
                    </span>
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Categoría</span>
                  <p className="font-medium">{detailsTarget.category?.name || '—'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Referencia</span>
                  <p className="font-medium">{detailsTarget.referenceNumber || '—'}</p>
                </div>
                {detailsTarget.supplierInvoiceNumber && (
                  <div>
                    <span className="text-muted-foreground text-xs">No. Factura</span>
                    <p className="font-medium">{detailsTarget.supplierInvoiceNumber}</p>
                  </div>
                )}
                {detailsTarget.supplierControlNumber && (
                  <div>
                    <span className="text-muted-foreground text-xs">No. Control</span>
                    <p className="font-medium">{detailsTarget.supplierControlNumber}</p>
                  </div>
                )}
              </div>

              {/* Supplier */}
              {detailsTarget.supplier && (
                <div className="border rounded-lg p-3 space-y-1">
                  <span className="text-muted-foreground text-xs">Proveedor</span>
                  <p className="font-medium">{detailsTarget.supplier.name}</p>
                  {detailsTarget.supplier.taxId && (
                    <p className="text-xs text-muted-foreground">RIF: {detailsTarget.supplier.taxId}</p>
                  )}
                </div>
              )}

              {/* Products */}
              {detailsTarget.products.length > 0 && (
                <div className="border rounded-lg p-3 space-y-2">
                  <span className="text-muted-foreground text-xs font-medium">Productos ({detailsTarget.products.length})</span>
                  <div className="overflow-x-auto -mx-1 px-1">
                    <Table className="min-w-[380px]">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">Producto</TableHead>
                          <TableHead className="text-xs hidden sm:table-cell">SKU</TableHead>
                          <TableHead className="text-xs text-right">Cant.</TableHead>
                          <TableHead className="text-xs text-right">Costo</TableHead>
                          <TableHead className="text-xs text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {detailsTarget.products.map((p) => (
                          <TableRow key={p.productId}>
                            <TableCell className="text-xs font-medium">{p.productName}</TableCell>
                            <TableCell className="text-xs text-muted-foreground hidden sm:table-cell">{p.productSku || '—'}</TableCell>
                            <TableCell className="text-xs text-right">{p.quantity}</TableCell>
                            <TableCell className="text-xs text-right">{p.unitCost != null ? formatCurrency(p.unitCost) : '—'}</TableCell>
                            <TableCell className="text-xs text-right font-semibold">{p.total != null ? formatCurrency(p.total) : '—'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {/* Totals */}
              <div className="border rounded-lg p-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Total:</span>
                  <span className="font-bold">{formatCurrency(detailsTarget.amount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Pagado:</span>
                  <span className="font-medium text-green-500">{formatCurrency(detailsTarget.amountPaid)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Saldo:</span>
                  <span className={`font-medium ${(detailsTarget.amount - detailsTarget.amountPaid) > 0 ? 'text-red-500' : 'text-green-500'}`}>
                    {formatCurrency(detailsTarget.amount - detailsTarget.amountPaid)}
                  </span>
                </div>
              </div>

              {/* Payments */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-xs font-medium">
                    Pagos {detailsTarget.payments.length > 0 ? `(${detailsTarget.payments.length})` : ''}
                  </span>
                  {detailsTarget.amount - detailsTarget.amountPaid > 0.01 && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs cursor-pointer"
                      onClick={() => {
                        if (detailsTarget) openPaymentDialogFromDetail(detailsTarget);
                      }}
                    >
                      <DollarSign className="h-3 w-3 mr-1" />
                      Abonar
                    </Button>
                  )}
                </div>
                {detailsTarget.payments.length > 0 ? (
                  <div className="space-y-1">
                    {detailsTarget.payments.map((p) => (
                      <div key={p.id} className="flex items-center justify-between text-xs bg-muted/50 rounded px-3 py-1.5">
                        <span className="text-muted-foreground">{new Date(p.paidAt).toLocaleDateString('es-VE')}</span>
                        <span className="font-medium">{formatCurrency(p.amount)}</span>
                        {p.notes && <span className="text-muted-foreground italic text-[10px] sm:text-xs truncate max-w-[80px] sm:max-w-[120px]">{p.notes}</span>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">Sin abonos registrados</p>
                )}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </AdminPageShell>
  );
}
