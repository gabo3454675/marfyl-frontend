'use client';

import { isModuleGalleryEnabled } from '@/lib/gallery/feature';
import { DashboardLegacy } from '@/components/dashboard/dashboard-legacy';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function PanelGeneralPage() {
  return (
    <div>
      {isModuleGalleryEnabled() && (
        <div className="mb-4">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Volver a la galería
            </Button>
          </Link>
        </div>
      )}
      <DashboardLegacy />
    </div>
  );
}
