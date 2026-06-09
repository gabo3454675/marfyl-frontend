import { MARFYL_BRAND, PRICING_TEASER } from './marketing-copy';

/** Colores de gradiente alineados al acento marketing (#0284C7 / hsl 210 100% 56%). */
export const MARFYL_GRADIENT_COLORS = ['#7DD3FC', '#0284C7', '#0C4A6E'] as const;

/** Organizaciones fundadoras — datos reales, no inventados. */
export const FOUNDING_CLIENTS = [
  {
    slug: 'el-rancho-de-german',
    name: 'El Rancho de Germán',
    sector: 'Restaurante, bar y club campestre multideportes',
  },
  {
    slug: 'monddy',
    name: 'Monddy Corp',
    sector: 'Bodegón y eventos',
  },
  {
    slug: 'davean',
    name: 'Davean',
    sector: 'Taller automotriz',
  },
] as const;

export const MARKETING_STATS = {
  tags: [
    { label: '¿Por qué MARFYL?', icon: 'chat' as const },
    { label: 'Producto', icon: 'wand' as const },
  ],
  title: 'Que hablen los números',
  subtitle:
    'Tres negocios reales operando ventas, inventario y cumplimiento fiscal en la misma plataforma.',
  cta: { label: 'Explorar características', href: '/caracteristicas' },
  items: [
    {
      value: '3',
      label: 'Negocios activos',
      detail: 'Restauración, bodegón, eventos y taller automotriz en Venezuela',
    },
    {
      value: '7',
      label: 'Módulos integrados',
      detail: 'POS, inventario, fiscal SENIAT, finanzas e IA',
    },
    {
      value: '100%',
      label: 'Datos por organización',
      detail: 'Multi-tenant con permisos por rol',
    },
  ],
} as const;

export const MARKETING_NAV = [
  { label: 'Inicio', href: '/empresa' },
  { label: 'Características', href: '/caracteristicas' },
  { label: 'Precios', href: '/precios' },
  { label: 'Blog', href: '/blog' },
] as const;

export const MARKETING_HOME = {
  hero: {
    eyebrow: 'SaaS B2B · Venezuela',
    title: 'Gestión operativa y fiscal en un solo sistema',
    subtitle:
      'POS táctil, inventario, facturación bimoneda y cumplimiento SENIAT para retail, distribución y servicios. Diseñado para dueños, cajeros y contadores.',
    primaryCta: { label: 'Iniciar sesión', href: '/login' },
    secondaryCta: { label: 'Solicitar demo', href: PRICING_TEASER.mailto },
  },
  features: [
    {
      title: 'POS y conciliación bimoneda',
      description:
        'Ventas en USD y Bs con Pago Móvil, Zelle y efectivo. Cierre de caja con conciliación por método y moneda.',
    },
    {
      title: 'Módulo fiscal SENIAT',
      description:
        'Calendario de obligaciones, libros de venta y compra, retenciones IVA, perfil RIF y alertas de cumplimiento.',
    },
    {
      title: 'Inventario y alertas',
      description:
        'Stock mínimo, movimientos, autoconsumo y avisos antes de quedarte sin productos críticos.',
    },
  ],
  highlights: [
    'Multi-rol: dueño, cajero y perfil fiscal',
    'Cuentas por cobrar y por pagar',
    'Tasa BCV y operaciones en bolívares',
    'Asistente IA para dudas fiscales operativas',
  ],
  trust: [
    { label: 'Enfoque Venezuela', detail: 'RIF, SENIAT y métodos de pago locales' },
    { label: 'Datos por organización', detail: 'Multi-tenant con permisos por rol' },
    { label: 'Normativa versionada', detail: 'Actualización de reglas sin reescribir la app' },
  ],
  cta: {
    title: '¿Listo para operar con más control?',
    subtitle: 'Agenda una demo o activa tu prueba con el equipo MARFYL.',
    primary: { label: 'Crear cuenta', href: '/register' },
    secondary: { label: PRICING_TEASER.contactLabel, href: PRICING_TEASER.mailto },
  },
} as const;

export const CARACTERISTICAS_PAGE = {
  header: {
    title: 'Todas las herramientas para operar y cumplir en Venezuela',
    subtitle: 'Sin complicaciones. Un solo sistema para la operación diaria y el respaldo fiscal.',
  },
  sections: [
    {
      id: 'pos',
      title: 'POS táctil',
      bullets: [
        'Ventas rápidas con carrito y categorías',
        'USD, Bs, Pago Móvil, Zelle y tarjeta',
        'Cierre de caja con conciliación bimoneda',
      ],
    },
    {
      id: 'inventory',
      title: 'Inventario dinámico',
      bullets: [
        'Tablas densas para operación diaria',
        'Alertas de stock bajo y productos críticos',
        'Movimientos, servicios, combos y autoconsumo',
      ],
    },
    {
      id: 'billing',
      title: 'Facturación y ventas',
      bullets: [
        'Emisión y consulta de facturas',
        'Historial detallado y reimpresión',
        'Exportación para respaldo contable',
      ],
    },
    {
      id: 'finance',
      title: 'Finanzas simples',
      bullets: [
        'Cuentas por cobrar y por pagar',
        'Gastos, proveedores y flujo de caja',
        'Tasa BCV del día para montos en Bs',
      ],
    },
    {
      id: 'fiscal',
      title: 'Módulo fiscal',
      bullets: [
        'Calendario SENIAT según perfil y RIF',
        'Libros de ventas y compras exportables',
        'Retenciones IVA y pre-declaración',
        'Alertas con severidad y modo diagnóstico',
      ],
    },
    {
      id: 'ai',
      title: 'Asistente IA fiscal',
      bullets: [
        'Ayuda contextual en lenguaje claro',
        'Explicación de reglas y vencimientos',
        'Guía para evitar errores antes de cerrar período',
      ],
    },
    {
      id: 'team',
      title: 'Gestión de equipo',
      bullets: [
        'Dueño, cajero y contador con permisos distintos',
        'Invitaciones y roles por organización',
        'Historial de actividad en acciones sensibles',
      ],
    },
  ],
  stats: {
    title: 'Confiabilidad operativa',
    items: [
      { label: 'Sincronización normativa', detail: 'Reglas fiscales versionadas por vigencia' },
      { label: 'Soporte local', detail: 'Acompañamiento en implementación Venezuela' },
      { label: 'Seguridad multi-tenant', detail: 'Datos aislados por organización' },
    ],
  },
} as const;

export type PricingPlan = {
  id: string;
  name: string;
  description: string;
  priceUsd: string;
  priceNote: string;
  highlighted?: boolean;
  features: string[];
};

export const PRICING_PAGE = {
  header: {
    title: 'Planes y precios',
    subtitle:
      'Elige el plan operativo y fiscal que se adapta a tu negocio en Venezuela. Referencia en USD; facturación del servicio según acuerdo comercial.',
  },
  plans: [
    {
      id: 'starter',
      name: 'Operación',
      description: 'Para negocios que empiezan a digitalizar ventas e inventario.',
      priceUsd: 'Consultar',
      priceNote: 'Referencia Bs según tasa del día',
      features: [
        'POS y cierre de caja',
        'Inventario y alertas de stock',
        'Facturas e historial',
        '1 organización · hasta 3 usuarios',
      ],
    },
    {
      id: 'pro',
      name: 'Cumplimiento',
      description: 'Operación completa más módulo fiscal SENIAT.',
      priceUsd: 'Consultar',
      priceNote: 'Incluye calendario y libros',
      highlighted: true,
      features: [
        'Todo en Operación',
        'Calendario y alertas fiscales',
        'Libros venta/compra y retenciones',
        'Asistente IA fiscal',
        'Usuarios ilimitados según contrato',
      ],
    },
    {
      id: 'enterprise',
      name: 'Empresa',
      description: 'Multi-sucursal, soporte prioritario e implementación asistida.',
      priceUsd: 'Consultar',
      priceNote: 'Cotización a medida',
      features: [
        'Todo en Cumplimiento',
        'Onboarding y capacitación',
        'Soporte prioritario',
        'Integraciones a convenir',
      ],
    },
  ] satisfies PricingPlan[],
  comparisonRows: [
    { feature: 'POS bimoneda', starter: true, pro: true, enterprise: true },
    { feature: 'Inventario y alertas', starter: true, pro: true, enterprise: true },
    { feature: 'Módulo fiscal SENIAT', starter: false, pro: true, enterprise: true },
    { feature: 'Asistente IA fiscal', starter: false, pro: true, enterprise: true },
    { feature: 'Exportación libros', starter: false, pro: true, enterprise: true },
    { feature: 'Soporte prioritario', starter: false, pro: false, enterprise: true },
  ],
} as const;

export const BLOG_POSTS = [
  {
    slug: 'calendario-seniat-pymes',
    title: 'Calendario SENIAT: qué debe controlar una PYME cada mes',
    excerpt:
      'IVA, retenciones y cierres: cómo organizar vencimientos sin depender de hojas sueltas.',
    author: 'Equipo MARFYL',
    date: '2026-05-15',
    category: 'Fiscalidad',
  },
  {
    slug: 'cierre-caja-bimoneda',
    title: 'Cierre de caja en USD y Bs sin diferencias ocultas',
    excerpt:
      'Conciliación por método de pago y tasa BCV para cuadrar caja al final del turno.',
    author: 'Equipo MARFYL',
    date: '2026-05-08',
    category: 'Operaciones',
  },
  {
    slug: 'alertas-inventario-retail',
    title: 'Alertas de inventario antes de perder ventas',
    excerpt:
      'Stock mínimo, autoconsumo y movimientos: señales que el dueño debe ver a tiempo.',
    author: 'Equipo MARFYL',
    date: '2026-04-28',
    category: 'Inventario',
  },
] as const;

export function getBlogPost(slug: string) {
  return BLOG_POSTS.find((p) => p.slug === slug);
}

export const BLOG_POST_BODIES: Record<string, string[]> = {
  'calendario-seniat-pymes': [
    'Las PYME en Venezuela suelen perder plazos no por falta de ganas, sino por dispersar obligaciones entre chat, Excel y memoria.',
    'Un calendario fiscal útil debe responder tres preguntas: qué vence, cuándo vence y qué pasa si el perfil del negocio está incompleto.',
    'MARFYL vincula RIF, tipo de contribuyente y reglas versionadas para mostrar vencimientos con severidad y acción recomendada — sin sustituir el criterio de su contador.',
  ],
  'cierre-caja-bimoneda': [
    'Cobrar en USD y Bs en el mismo turno exige separar métodos: efectivo, Pago Móvil, Zelle y tarjeta.',
    'Al cierre, la caja debe cuadrar por moneda y por método; cualquier diferencia debe quedar visible el mismo día.',
    'Registrar la tasa BCV del momento ayuda a explicar montos en bolívares ante auditoría interna o revisión del dueño.',
  ],
  'alertas-inventario-retail': [
    'El stock mínimo no es burocracia: es la señal de que un producto puede agotarse antes de la próxima compra.',
    'Ventas, autoconsumos y ajustes deben actualizar alertas en tiempo real para el encargado de inventario.',
    'Priorice productos de alta rotación y margen: una alerta tardía en esos ítems cuesta más que en referencias de baja demanda.',
  ],
};

export const MARKETING_FAQ_HOME = [
  {
    id: 'fiscal-ve',
    question: '¿MARFYL sustituye a mi contador?',
    answer:
      'No. Organiza la operación y el cumplimiento diario; la declaración ante SENIAT y el criterio profesional siguen siendo responsabilidad de su equipo o contador.',
  },
  {
    id: 'data',
    question: '¿Mis datos están separados por negocio?',
    answer:
      'Sí. Cada organización es un tenant aislado con usuarios y permisos propios.',
  },
  {
    id: 'payments',
    question: '¿Qué formas de pago del servicio aceptan?',
    answer:
      'Según contrato: transferencia, Pago Móvil, Zelle u otras vías acordadas con el equipo comercial.',
  },
] as const;

export { MARFYL_BRAND };
