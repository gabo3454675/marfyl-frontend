'use client';

import { useParams } from 'next/navigation';
import { GALLERY_MODULES, resolveModuleItems, type GalleryModuleConfig } from '@/config/modules';
import { usePermission } from '@/hooks/usePermission';
import { AdminPanel } from '@/components/admin/admin-panel';
import { BackToGalleryButton } from '@/components/gallery/back-to-gallery-button';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { LayoutGrid } from 'lucide-react';

function getModuleBySlug(slug: string): GalleryModuleConfig | undefined {
  return GALLERY_MODULES.find((m) => m.id === slug);
}

export default function ModuleOverviewPage() {
  const params = useParams();
  const slug = params.slug as string;
  const permissions = usePermission();

  const mod = getModuleBySlug(slug);

  if (!mod) {
    return (
      <AdminPanel className="p-6 md:p-8">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50 mb-5">
            <LayoutGrid className="h-8 w-8 text-muted-foreground/40" />
          </div>
          <h2 className="text-xl font-semibold text-muted-foreground">Módulo no encontrado</h2>
          <BackToGalleryButton variant="page" className="mt-6 text-primary hover:underline" />
        </div>
      </AdminPanel>
    );
  }

  // Roles estación no pueden acceder a módulos de la galería
  if (permissions.isPosOnlySeller || permissions.isWaiterOnly || permissions.isKitchenOnly) {
    return (
      <AdminPanel className="p-6 md:p-8">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <h2 className="text-xl font-semibold text-muted-foreground">Acceso no disponible</h2>
          <p className="text-sm text-muted-foreground/60 mt-2">Tu rol no tiene acceso a esta sección</p>
          <BackToGalleryButton variant="page" className="mt-6" label="Volver" />
        </div>
      </AdminPanel>
    );
  }

  const hasAccess = mod.requiredPermissions.some((perm) => permissions[perm] === true);
  if (!hasAccess) {
    return (
      <AdminPanel className="p-6 md:p-8">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <h2 className="text-xl font-semibold text-muted-foreground">Sin acceso</h2>
          <p className="text-sm text-muted-foreground/60 mt-2">No tienes permisos para ver este módulo</p>
          <BackToGalleryButton variant="page" className="mt-6 text-primary hover:underline" />
        </div>
      </AdminPanel>
    );
  }

  // Verificar feature flag si el módulo lo requiere
  if (mod.featureFlag && !mod.featureFlag()) {
    return (
      <AdminPanel className="p-6 md:p-8">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <h2 className="text-xl font-semibold text-muted-foreground">Módulo no disponible</h2>
          <p className="text-sm text-muted-foreground/60 mt-2">Este módulo no está habilitado actualmente</p>
          <BackToGalleryButton variant="page" className="mt-6 text-primary hover:underline" />
        </div>
      </AdminPanel>
    );
  }

  const items = resolveModuleItems(mod);

  return (
    <AdminPanel className="p-6 md:p-8 lg:p-10">
      <div className="mb-8">
        <BackToGalleryButton variant="page" label="Galería de módulos" />
      </div>

      <div className="mb-10">
        <div className="flex items-center gap-5">
          <div
            className={cn(
              'flex h-16 w-16 items-center justify-center rounded-2xl',
              'bg-gradient-to-br shadow-lg shadow-black/5',
              mod.accentGradient,
            )}
          >
            <mod.icon className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{mod.label}</h1>
            <p className="text-muted-foreground mt-1">{mod.description}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item, index) => {
          // Usar color del item si existe, si no el del módulo
          const itemGradient = item.itemAccentGradient || mod.accentGradient;
          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                'group relative flex items-center gap-4 rounded-2xl border border-border/60 p-5',
                'bg-card/80 backdrop-blur-sm overflow-hidden',
                'transition-all duration-300 ease-out',
                'hover:shadow-lg hover:shadow-black/5 hover:-translate-y-0.5',
              )}
            >
              {/* Barra de color lateral */}
              <div className={cn(
                'absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl',
                'bg-gradient-to-b opacity-60 group-hover:opacity-100 transition-opacity duration-300',
                itemGradient,
              )} />

              {/* Icono con color individual */}
              <div
                className={cn(
                  'relative flex h-11 w-11 items-center justify-center rounded-xl shrink-0',
                  'bg-gradient-to-br shadow-md shadow-black/5',
                  itemGradient,
                )}
              >
                <item.icon className="h-5 w-5 text-white" />
              </div>

              {/* Texto */}
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-foreground truncate">
                  {item.label}
                </h3>
                {item.hint && (
                  <p className="text-xs text-muted-foreground/60 mt-0.5 truncate">
                    {item.hint}
                  </p>
                )}
              </div>

              {/* Número de orden con color */}
              <div className={cn(
                'flex h-7 w-7 items-center justify-center rounded-full shrink-0',
                'text-xs font-bold',
                'bg-gradient-to-br text-white/90 shadow-sm',
                itemGradient,
              )}>
                {index + 1}
              </div>
            </Link>
          );
        })}
      </div>
    </AdminPanel>
  );
}
