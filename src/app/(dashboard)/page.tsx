'use client';

import { isModuleGalleryEnabled } from '@/lib/gallery/feature';
import { ModuleGallery } from '@/components/gallery/module-gallery';
import { DashboardLegacy } from '@/components/dashboard/dashboard-legacy';

export default function DashboardPage() {
  if (isModuleGalleryEnabled()) {
    return <ModuleGallery />;
  }
  return <DashboardLegacy />;
}
