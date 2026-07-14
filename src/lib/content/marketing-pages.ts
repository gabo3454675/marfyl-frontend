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
    eyebrow: 'MARFYL · Inteligencia Fiscal Proactiva',
    title: 'Blindaje fiscal proactivo para empresas en Venezuela.',
    subtitle:
      'Monitoreo automatizado del COT y normativas del SENIAT que detecta riesgos antes de que se conviertan en multas. Respuestas con precisión legal en milisegundos.',
    primaryCta: { label: 'Comenzar ahora', href: '/register' },
    secondaryCta: { label: 'Solicitar demo', href: PRICING_TEASER.mailto },
  },
  features: [
    {
      title: 'Calendario de Contribuyentes Especiales',
      description:
        'Monitoreo automatizado de vencimientos según perfil RIF. Alertas preventivas con severidad y acción recomendada.',
    },
    {
      title: 'Auditoría preventiva Providencia 0071',
      description:
        'Validación continua de facturación electrónica. Detección de riesgo de clausura antes de una fiscalización.',
    },
    {
      title: 'Cálculo inmediato de sanciones',
      description:
        'Indexación BCV actualizada. Simulación de multas en USD y Bs con base en el COT vigente.',
    },
  ],
  highlights: [
    'RAG sincronizado con COT y Gacetas Oficiales',
    'Respuestas con citas legales exactas en milisegundos',
    'Cero alucinaciones: 100% apego a la normativa',
    'Asesor proactivo: advierte antes de la multa',
  ],
  trust: [
    { label: 'Precisión quirúrgica', detail: 'Citas textuales al artículo y parágrafo del COT' },
    { label: 'Velocidad Groq', detail: 'Inferencia promedio de 140ms por consulta' },
    { label: 'Arquitectura RAG', detail: 'Conocimiento sincronizado con Gacetas Oficiales' },
  ],
  painPoints: [
    {
      title: 'Calendario de Contribuyentes Especiales automatizado',
      description: 'Olvídate de llevar planillas Excel. Marfyl monitorea los vencimientos según tu perfil RIF y te alerta con antelación.',
      metric: '100%',
      metricLabel: 'Alertas preventivas',
    },
    {
      title: 'Auditoría preventiva Providencia 0071',
      description: 'Validación automática del formato de facturación electrónica. Detecta riesgos de clausura antes de una fiscalización.',
      metric: '0',
      metricLabel: 'Riesgos de multas por forma',
    },
    {
      title: 'Cálculo de sanciones en moneda real',
      description: 'Indexa automáticamente las multas al tipo de cambio oficial BCV de mayor valor, sin aproximaciones.',
      metric: 'BCV',
      metricLabel: 'Tasa oficial en tiempo real',
    },
    {
      title: 'Simulador de escenarios fiscales',
      description: 'Evalúa el impacto financiero de distintas decisiones tributarias antes de ejecutarlas.',
      metric: '< 200ms',
      metricLabel: 'Por consulta',
    },
  ],
  simulatorQuestions: [
    '¿Qué sanción aplica por declarar IVA con 3 días de retraso siendo Contribuyente Especial?',
    '¿Puedo emitir facturas en Excel sin máquina fiscal bajo la Providencia 0071?',
    '¿Qué pasa si no retengo el ISLR a mi proveedor?',
  ],
  architecture: {
    title: 'Arquitectura técnica',
    subtitle: 'Sincronizado nativamente con el Código Orgánico Tributario y Gacetas Oficiales. Cero alucinaciones, 100% apego legal.',
    steps: [
      { label: 'Gacetas Oficiales', description: 'Ingesta automatizada de normativas' },
      { label: 'Embeddings Cohere', description: 'Vectorización semántica multilingual 1024d' },
      { label: 'pgvector + HNSW', description: 'Búsqueda por similitud coseno en ms' },
      { label: 'Groq Llama 3.3', description: 'Inferencia con contexto legal preciso' },
    ],
  },
  cta: {
    title: 'Blinda tu empresa antes de la próxima multa',
    subtitle: 'Agenda una demo técnica o activa tu prueba inmediata con el equipo MARFYL.',
    primary: { label: 'Activar prueba', href: '/register' },
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

type FeatureSpan = 'small' | 'large';

/** ============================================================
 *  LANDING PAGE — Datos para la landing page principal
 * ============================================================ */

export const LANDING_PAGE = {
  hero: {
    eyebrow: 'MARFYL · Gestión Fiscal y Operativa',
    title: 'Blindaje fiscal y control operativo en una sola plataforma.',
    subtitle:
      'POS táctil, inventario en tiempo real, facturación automatizada y cumplimiento SENIAT — todo lo que tu negocio necesita para operar sin sorpresas.',
    primaryCta: { label: 'Comenzar ahora', href: '/register' },
    secondaryCta: { label: 'Ver demo', href: '/caracteristicas' },
  },

  stats: [
    { value: 3, suffix: '', label: 'Negocios activos', detail: 'Restauración, bodegón y eventos en Venezuela' },
    { value: 7, suffix: '', label: 'Módulos integrados', detail: 'POS, inventario, fiscal, finanzas e IA' },
    { value: 100, suffix: '%', label: 'Datos por organización', detail: 'Multi-tenant con permisos por rol' },
    { value: 140, suffix: 'ms', label: 'Respuesta IA promedio', detail: 'Inferencia con contexto legal preciso' },
  ],

  featuresBento: [
    {
      id: 'pos',
      icon: 'ShoppingCart',
      title: 'POS táctil',
      description: 'Ventas rápidas con carrito, categorías y múltiples métodos de pago bimoneda.',
      metric: 'USD + Bs',
      metricLabel: 'Bimoneda nativa',
      span: 'large' as FeatureSpan,
    },
    {
      id: 'inventory',
      icon: 'Package',
      title: 'Inventario dinámico',
      description: 'Tablas densas, alertas de stock bajo, movimientos y autoconsumo en tiempo real.',
      metric: 'Tiempo real',
      metricLabel: 'Alertas instantáneas',
      span: 'small' as const,
    },
    {
      id: 'billing',
      icon: 'FileText',
      title: 'Facturación automatizada',
      description: 'Emisión, consulta y reimpresión de facturas con exportación para respaldo contable.',
      metric: '100%',
      metricLabel: 'Cumplimiento SENIAT',
      span: 'small' as const,
    },
    {
      id: 'fiscal',
      icon: 'Scale',
      title: 'Módulo fiscal SENIAT',
      description: 'Calendario de contribuyentes, libros de venta/compra, retenciones y pre-declaración.',
      metric: 'Automático',
      metricLabel: 'Alertas con severidad',
      span: 'small' as const,
    },
    {
      id: 'ai',
      icon: 'Bot',
      title: 'Asistente IA fiscal',
      description: 'Ayuda contextual con citas legales exactas. Respuestas en milisegundos, cero alucinaciones.',
      metric: '140ms',
      metricLabel: 'Inferencia Groq',
      span: 'small' as const,
    },
  ],

  testimonials: [
    {
      quote: 'MARFYL eliminó las sorpresas fiscales en nuestro restaurante. El calendario de vencimientos y las alertas nos dan tranquilidad para enfocarnos en el negocio.',
      author: 'Carlos Mendoza',
      role: 'Dueño',
      company: 'El Rancho de Germán',
      metric: '0',
      metricLabel: 'Multas por vencimiento',
    },
    {
      quote: 'Pasamos de controlar inventario en Excel a tener alertas automáticas y cierre de caja bimoneda. La operación diaria es mucho más ágil.',
      author: 'María Fernández',
      role: 'Gerente de Operaciones',
      company: 'Monddy Corp',
      metric: '3h',
      metricLabel: 'Ahorradas por semana',
    },
    {
      quote: 'El módulo fiscal es como tener un contador vigilante 24/7. Detecta riesgos antes de que se conviertan en problemas con el SENIAT.',
      author: 'Roberto Silva',
      role: 'Director Financiero',
      company: 'Davean',
      metric: '100%',
      metricLabel: 'Alertas preventivas',
    },
  ],

  cta: {
    title: 'Opera con confianza. Cumple sin estrés.',
    subtitle: 'Activa tu prueba gratuita o agenda una demo con el equipo MARFYL.',
    primary: { label: 'Comenzar gratis', href: '/register' },
    secondary: { label: 'Agendar demo', href: 'mailto:demo@marfyl.com' },
  },

  trust: [
    { label: 'Precisión fiscal', detail: 'Citas textuales al artículo y parágrafo del COT' },
    { label: 'Velocidad Groq', detail: 'Inferencia promedio de 140ms por consulta' },
    { label: 'Arquitectura RAG', detail: 'Conocimiento sincronizado con Gacetas Oficiales' },
  ],

  architecture: {
    title: 'Arquitectura técnica',
    subtitle: 'Sincronizado nativamente con el Código Orgánico Tributario y Gacetas Oficiales.',
    steps: [
      { label: 'Gacetas Oficiales', description: 'Ingesta automatizada de normativas' },
      { label: 'Embeddings Cohere', description: 'Vectorización semántica multilingual 1024d' },
      { label: 'pgvector + HNSW', description: 'Búsqueda por similitud coseno en ms' },
      { label: 'Groq Llama 3.3', description: 'Inferencia con contexto legal preciso' },
    ],
  },
} as const;

export { MARFYL_BRAND };
