'use client';

import { Button } from '@/components/ui/button';
import { TabsContent } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2, History, Info, DollarSign, Trash2 } from 'lucide-react';
import { AdminCard, AdminTableWrap } from '@/components/admin/admin-card';
import { type InvoiceHistoryItem, type InvoiceHistoryResponse } from '@/lib/api/invoice-upload';
import { formatCurrency, formatDate } from '../helpers';

interface InvoiceHistoryTabProps {
  history: InvoiceHistoryResponse | null;
  historyLoading: boolean;
  onOpenDetails: (item: InvoiceHistoryItem) => void;
  onOpenPayment: (item: { id: number }) => void;
  onDeleteExpense: (id: number) => void;
  onPageChange: (page: number) => void;
}

export default function InvoiceHistoryTab({
  history,
  historyLoading,
  onOpenDetails,
  onOpenPayment,
  onDeleteExpense,
  onPageChange,
}: InvoiceHistoryTabProps) {
  return (
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
                            onClick={() => onOpenDetails(item)}
                          >
                            <Info className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 cursor-pointer text-green-600 hover:text-green-700 hover:bg-green-50"
                            title="Registrar abono"
                            onClick={() => onOpenPayment(item)}
                          >
                            <DollarSign className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                            onClick={() => onDeleteExpense(item.id)}
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
                    onClick={() => onPageChange(Math.max(1, history.page - 1))}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="cursor-pointer"
                    disabled={history.page >= history.pages}
                    onClick={() => onPageChange(history.page + 1)}
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
  );
}
