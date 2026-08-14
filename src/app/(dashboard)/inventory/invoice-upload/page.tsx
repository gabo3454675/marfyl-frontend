'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdminPageShell } from '@/components/admin/admin-page-shell';
import { AdminCard } from '@/components/admin/admin-card';
import { AlertCircle, Upload } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import apiClient from '@/lib/api';

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
import type { PurchaseLine } from './types';

// Components
import PurchaseEntryTab from './components/PurchaseEntryTab';
import InvoiceFileImportTab from './components/InvoiceFileImportTab';
import InvoiceHistoryTab from './components/InvoiceHistoryTab';
import { CreateSupplierDialog } from './components/CreateSupplierDialog';
import { PaymentDialog } from './components/PaymentDialog';
import { InvoiceDetailsDialog } from './components/InvoiceDetailsDialog';

const PURCHASE_TABS = new Set(['entry', 'import', 'history']);

function tabFromSearch(params: { get: (key: string) => string | null }): string {
  const t = params.get('tab');
  return t && PURCHASE_TABS.has(t) ? t : 'entry';
}

/* ─────────── Main Page ─────────── */

export default function InvoiceUploadPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
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
  const [activeTab, setActiveTab] = useState(() => tabFromSearch(searchParams));
  const [history, setHistory] = useState<InvoiceHistoryResponse | null>(null);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [isSupplierDialogOpen, setIsSupplierDialogOpen] = useState(false);

  /* ── Payment dialog state ── */
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentTarget, setPaymentTarget] = useState<{ id: number; amount: number; amountPaid: number } | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<{ id: number; amount: number; paidAt: string; notes: string | null }[]>([]);
  const [paymentLoading, setPaymentLoading] = useState(false);

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

  /* ── Delete expense ── */
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

  /* ── Open payment from table row — fetches detail first ── */
  const openPaymentDialogFromTable = async (item: { id: number }) => {
    setPaymentLoading(true);
    setPaymentDialogOpen(true);
    try {
      const detail = await invoiceUploadService.getHistoryDetail(item.id);
      setPaymentTarget({ id: item.id, amount: detail.amount, amountPaid: detail.amountPaid });
      setPaymentHistory(detail.payments);
    } catch (error) {
      console.error('Error loading detail for payment:', error);
      setPaymentDialogOpen(false);
    } finally {
      setPaymentLoading(false);
    }
  };

  /* ── Open payment from details dialog — data already available, instant open ── */
  const openPaymentDialogFromDetail = (detail: InvoiceHistoryDetail) => {
    setPaymentTarget({ id: detail.id, amount: detail.amount, amountPaid: detail.amountPaid });
    setPaymentHistory(detail.payments);
    setDetailsDialogOpen(false);
    setPaymentDialogOpen(true);
  };

  /* ── Open details dialog ── */
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

  /* ── Delete supplier ── */
  const handleDeleteSupplier = async (id: number, name: string) => {
    if (!confirm(`¿Eliminar el proveedor "${name}"?`)) return;
    try {
      await supplierService.remove(id);
      alert('Proveedor eliminado exitosamente');
      setSuppliers((prev) => prev.filter((s) => s.id !== id));
      if (supplierId === String(id)) {
        setSupplierId('');
      }
    } catch (error: any) {
      console.error('Error deleting supplier:', error);
      alert(error.response?.data?.message || 'Error al eliminar el proveedor');
    }
  };

  /* ── Effects ── */

  useEffect(() => {
    if (selectedCompanyId && canManageInventory) {
      fetchSuppliers();
    }
  }, [selectedCompanyId, canManageInventory, fetchSuppliers]);

  useEffect(() => {
    if (searchParams.get('tab') === 'excel') {
      router.replace('/importar?tipo=compras');
    }
  }, [searchParams, router]);

  useEffect(() => {
    const next = tabFromSearch(searchParams);
    setActiveTab(next);
  }, [searchParams]);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory(historyPage);
    }
  }, [activeTab, historyPage, fetchHistory]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    const href =
      value === 'entry'
        ? '/inventory/invoice-upload'
        : `/inventory/invoice-upload?tab=${value}`;
    router.replace(href, { scroll: false });
  };

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
      subtitle="Registra a mano, sube un PDF o importa Excel"
      maxWidth="wide"
      actions={
        <Button variant="outline" asChild className="h-11 w-full cursor-pointer sm:w-auto">
          <Link href="/importar?tipo=compras">
            <Upload className="mr-2 h-4 w-4" />
            Importar Excel
          </Link>
        </Button>
      }
    >
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="flex h-auto w-full flex-wrap gap-1">
          <TabsTrigger value="entry" className="min-h-10 flex-1">A mano</TabsTrigger>
          <TabsTrigger value="import" className="min-h-10 flex-1">PDF</TabsTrigger>
          <TabsTrigger value="history" className="min-h-10 flex-1">Historial</TabsTrigger>
        </TabsList>

        <PurchaseEntryTab
          lines={lines}
          total={total}
          result={result}
          error={error}
          submitting={submitting}
          suppliers={suppliers}
          supplierId={supplierId}
          date={date}
          referenceNumber={referenceNumber}
          searchQuery={searchQuery}
          searchResults={searchResults}
          searching={searching}
          showDropdown={showDropdown}
          onAddProduct={handleAddProduct}
          onLineChange={handleLineChange}
          onRemoveLine={handleRemoveLine}
          onConfirm={handleConfirm}
          onReset={handleReset}
          onSearchChange={setSearchQuery}
          onSearchFocus={() => { if (searchQuery.length >= 2) setShowDropdown(true); }}
          onSupplierChange={setSupplierId}
          onDateChange={setDate}
          onReferenceChange={setReferenceNumber}
          onOpenSupplierDialog={() => setIsSupplierDialogOpen(true)}
          onDeleteSupplier={handleDeleteSupplier}
          searchInputRef={searchInputRef}
          dropdownRef={dropdownRef}
        />

        <InvoiceFileImportTab
          suppliers={suppliers}
          onOpenSupplierDialog={() => setIsSupplierDialogOpen(true)}
          onImportSuccess={() => {
            if (activeTab === 'history') fetchHistory(historyPage);
          }}
        />

        <InvoiceHistoryTab
          history={history}
          historyLoading={historyLoading}
          onOpenDetails={openDetailsDialog}
          onOpenPayment={openPaymentDialogFromTable}
          onDeleteExpense={handleDeleteExpense}
          onPageChange={setHistoryPage}
        />
      </Tabs>

      <CreateSupplierDialog
        open={isSupplierDialogOpen}
        onOpenChange={setIsSupplierDialogOpen}
        onCreated={() => {
          supplierService.getAll().then(setSuppliers).catch(() => {});
        }}
      />

      <PaymentDialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        target={paymentTarget}
        history={paymentHistory}
        loading={paymentLoading}
        onPaymentRegistered={() => {
          fetchHistory(historyPage);
        }}
      />

      <InvoiceDetailsDialog
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        loading={detailsLoading}
        target={detailsTarget}
        onPay={openPaymentDialogFromDetail}
      />
    </AdminPageShell>
  );
}
