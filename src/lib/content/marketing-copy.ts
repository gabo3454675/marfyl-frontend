/**
 * Copy derivado del sitemap Relume — reutilizable en auth, empty states y ayuda in-app.
 * No incluir testimonios ni KPIs inventados.
 */

export const MARFYL_BRAND = {
  name: 'MARFYL',
  tagline: 'Opera y cumple en Venezuela',
  description:
    'SaaS B2B para retail, distribución y servicios: POS, inventario, facturación y cumplimiento fiscal SENIAT en un solo lugar.',
} as const;

export const MARKETING_HOME_PATH = '/empresa' as const;

export const LOGIN_COPY = {
  title: 'Bienvenido a MARFYL',
  subtitle: 'Ingresa tus credenciales para gestionar ventas, inventario y obligaciones fiscales.',
  demoCta: 'Solicitar demo',
  demoHint: '¿Primera vez?',
  learnMoreLabel: 'Conoce MARFYL',
  learnMoreHref: MARKETING_HOME_PATH,
} as const;

export const PRODUCT_FEATURES = [
  {
    id: 'pos',
    title: 'POS y caja bimoneda',
    description: 'Ventas rápidas, USD/Bs, Pago Móvil y Zelle con conciliación al cierre.',
    href: '/pos',
  },
  {
    id: 'inventory',
    title: 'Inventario con alertas',
    description: 'Stock mínimo, movimientos y productos críticos antes de quedarte sin unidades.',
    href: '/alertas-stock',
  },
  {
    id: 'fiscal',
    title: 'Módulo fiscal SENIAT',
    description: 'Calendario, libros, retenciones IVA y perfil RIF con alertas de cumplimiento.',
    href: '/fiscal/calendario',
  },
  {
    id: 'finance',
    title: 'Finanzas del negocio',
    description: 'Cuentas por cobrar y pagar, gastos y tasa BCV actualizada.',
    href: '/tasas',
  },
] as const;

export const EMPTY_STATES = {
  stockAlerts: {
    title: 'Sin alertas de stock',
    description:
      'Ningún producto está por debajo del mínimo configurado. Sigue revisando movimientos y autoconsumos para mantener el inventario sano.',
    tips: [
      'Define stock mínimo en cada producto del inventario.',
      'Las alertas aparecen cuando un ajuste deja el stock bajo el umbral.',
    ],
    primaryCta: { label: 'Ir al inventario', href: '/products' },
    secondaryCta: { label: 'Ver movimientos', href: '/inventory/movements' },
  },
  fiscalCalendar: {
    title: 'Calendario en configuración',
    description:
      'Complete el perfil fiscal y sincronice las reglas SENIAT para ver vencimientos según su RIF y régimen.',
    primaryCta: { label: 'Completar perfil', href: '/fiscal/perfil' },
  },
} as const;

export const HELP_CENTER_INTRO =
  'Todas las herramientas para operar y cumplir en Venezuela, sin complicaciones. Use los accesos rápidos según su rol: dueño, cajero o contador.';

export const PRICING_TEASER = {
  title: 'Planes adaptados a tu negocio',
  description:
    'POS, inventario, facturación y módulo fiscal según el tamaño de tu operación. Precios en USD con referencia en Bs.',
  contactLabel: 'Consultar planes',
  mailto: 'mailto:hola@marfyl.com?subject=Planes%20MARFYL',
} as const;
