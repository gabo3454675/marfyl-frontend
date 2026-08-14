/**
 * Feature flags de producto. Todo lo que no es operación diaria es OPT-IN
 * (`=true` para encender). Concierto sigue el flag existente (opt-out) + org.
 */
export type ProductFeature =
  | 'payroll'
  | 'licores'
  | 'combos'
  | 'tasks'
  | 'cajaOficina'
  | 'accountsPayable'
  | 'credits'
  | 'tasas'
  | 'suppliersNav'
  | 'fiscal'
  | 'gallery'
  | 'customers';

function envTrue(key: string): boolean {
  return process.env[key] === 'true';
}

export function isProductFeatureEnabled(feature: ProductFeature): boolean {
  switch (feature) {
    case 'payroll':
      return envTrue('NEXT_PUBLIC_FEATURE_PAYROLL');
    case 'licores':
    case 'combos':
      return true;
    case 'customers':
      return envTrue('NEXT_PUBLIC_FEATURE_CUSTOMERS');
    case 'tasks':
      return envTrue('NEXT_PUBLIC_FEATURE_TASKS');
    case 'cajaOficina':
      return envTrue('NEXT_PUBLIC_FEATURE_CAJA_OFICINA');
    case 'accountsPayable':
      return envTrue('NEXT_PUBLIC_FEATURE_ACCOUNTS_PAYABLE');
    case 'credits':
      return envTrue('NEXT_PUBLIC_FEATURE_CREDITS');
    case 'tasas':
      return envTrue('NEXT_PUBLIC_FEATURE_TASAS');
    case 'suppliersNav':
      return envTrue('NEXT_PUBLIC_FEATURE_SUPPLIERS');
    case 'fiscal':
      return envTrue('NEXT_PUBLIC_FEATURE_FISCAL');
    case 'gallery':
      return envTrue('NEXT_PUBLIC_FEATURE_MODULE_GALLERY');
    default:
      return false;
  }
}

/** Rutas que quedan detrás de un flag. Si el flag está off, RouteGuard manda al inicio. */
export function getFeatureForPath(pathname: string): ProductFeature | null {
  if (pathname.startsWith('/nomina')) return 'payroll';
  if (pathname.startsWith('/customers')) return 'customers';
  if (pathname.startsWith('/caja-oficina')) return 'cajaOficina';
  if (pathname.startsWith('/accounts-payable')) return 'accountsPayable';
  if (pathname.startsWith('/credits')) return 'credits';
  if (pathname.startsWith('/tasas')) return 'tasas';
  if (pathname.startsWith('/suppliers')) return 'suppliersNav';
  if (
    pathname === '/fiscal' ||
    pathname.startsWith('/fiscal/') ||
    pathname === '/assistant' ||
    pathname.startsWith('/assistant/')
  ) {
    return 'fiscal';
  }
  return null;
}
