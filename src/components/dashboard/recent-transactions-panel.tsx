'use client';

import { MoreVertical } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AdminPanel } from '@/components/admin/admin-panel';
import type { DashboardSummary } from './types';

function formatDate(dateString: string) {
  try {
    return new Intl.DateTimeFormat('es-VE', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString));
  } catch {
    return '';
  }
}

interface RecentTransactionsPanelProps {
  transactions: DashboardSummary['recentTransactions'];
  formatForDisplay: (value: number) => string;
}

export function RecentTransactionsPanel({
  transactions,
  formatForDisplay,
}: RecentTransactionsPanelProps) {
  return (
    <AdminPanel className="overflow-hidden">
      <div className="p-4 sm:p-6">
        <div className="flex flex-row items-center justify-between gap-3 mb-4">
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-semibold">Transacciones Recientes</h2>
            <p className="text-xs sm:text-sm text-muted-foreground">Últimas facturas y pagos</p>
          </div>
          <Button variant="ghost" size="icon" className="hover:bg-secondary shrink-0 h-9 w-9 cursor-pointer">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
        <div className="space-y-3 sm:space-y-4">
          {transactions.length > 0 ? (
            transactions.map((transaction) => {
              const initials = (transaction.customerName || '')
                .split(' ')
                .map((n) => n[0] || '')
                .filter(Boolean)
                .join('')
                .toUpperCase()
                .slice(0, 2) || 'C';
              return (
                <div
                  key={transaction.id}
                   className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 sm:p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors duration-200 min-w-0"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <Avatar className="h-9 w-9 sm:h-10 sm:w-10 shrink-0">
                      <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-xs sm:text-sm">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-medium text-foreground text-sm sm:text-base truncate">
                        {transaction.customerName || 'Cliente'}
                      </p>
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">
                        {formatForDisplay(transaction.amount)} • {formatDate(transaction.createdAt)}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={transaction.status === 'PAID' ? 'default' : 'secondary'}
                    className={
                      transaction.status === 'PAID'
                        ? 'bg-green-500/20 text-green-400 border-green-500/30'
                        : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                    }
                  >
                    {transaction.status === 'PAID'
                      ? 'Pagado'
                      : transaction.status === 'PENDING'
                        ? 'Pendiente'
                        : 'Cancelado'}
                  </Badge>
                </div>
              );
            })
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">No hay transacciones recientes</p>
          )}
        </div>
      </div>
    </AdminPanel>
  );
}
