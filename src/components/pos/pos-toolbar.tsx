'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogOut, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { OrganizationSwitcher } from '@/components/organization-switcher';
import { useAuthStore } from '@/store/useAuthStore';
import { usePermission } from '@/hooks/usePermission';

export function PosToolbar() {
  const router = useRouter();
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const { canManageInventory } = usePermission();

  const handleLogout = () => {
    clearAuth();
    router.push('/login');
  };

  return (
    <div className="flex items-center justify-between border-b bg-muted/30 px-3 py-1.5 sm:px-4 sm:py-2">
      <OrganizationSwitcher variant="topbar" />
      <div className="flex items-center gap-1">
        {canManageInventory && (
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="h-8 gap-1.5 text-xs text-muted-foreground cursor-pointer"
          >
            <Link href="/sales/import">
              <Upload className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Importar ventas</span>
            </Link>
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-destructive cursor-pointer"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Salir</span>
        </Button>
      </div>
    </div>
  );
}
