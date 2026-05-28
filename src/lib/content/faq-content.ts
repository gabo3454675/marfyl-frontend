export type FaqItem = {
  id: string;
  question: string;
  answer: string;
};

export const FISCAL_FAQ: FaqItem[] = [
  {
    id: 'rif',
    question: '¿Por qué debo completar el RIF y la razón social?',
    answer:
      'El motor fiscal usa esos datos para aplicar el calendario SENIAT, la terminación de RIF en IVA ordinario y las obligaciones según su tipo de contribuyente. Sin perfil completo, el sistema entra en modo diagnóstico.',
  },
  {
    id: 'sync',
    question: '¿Qué hace “Sincronizar reglas SENIAT”?',
    answer:
      'Descarga las plantillas de obligaciones y vencimientos desde la normativa configurada en MARFYL. No sustituye asesoría profesional: verifique siempre contra la gaceta o portal oficial antes de declarar.',
  },
  {
    id: 'alerts',
    question: '¿Qué significan las alertas info, atención y crítico?',
    answer:
      'Info: recordatorio sin urgencia inmediata. Atención: vencimiento cercano o dato por revisar. Crítico: riesgo de multa, incumplimiento o bloqueo de una operación hasta corregir.',
  },
  {
    id: 'books',
    question: '¿Los libros de venta y compra sustituyen la declaración?',
    answer:
      'No. MARFYL organiza la información operativa para exportar y preparar declaraciones. La presentación ante SENIAT es responsabilidad del contribuyente o de su contador.',
  },
  {
    id: 'retention',
    question: '¿Cuándo aplico retenciones de IVA?',
    answer:
      'Depende de si su organización actúa como agente de retención y si el proveedor es sujeto pasivo. Configure el perfil fiscal y revise cada compra en el libro correspondiente.',
  },
  {
    id: 'security',
    question: '¿Quién puede ver datos fiscales?',
    answer:
      'Solo usuarios con rol fiscal o administrador de la organización. Las acciones sensibles quedan registradas en el historial de actividad.',
  },
];

export const GENERAL_FAQ: FaqItem[] = [
  {
    id: 'payments',
    question: '¿Qué métodos de pago soporta el POS?',
    answer:
      'Efectivo en USD y Bs, Pago Móvil, Zelle y tarjeta según configuración. El cierre de caja concilia montos por moneda y método.',
  },
  {
    id: 'bcv',
    question: '¿Cómo se usa la tasa BCV?',
    answer:
      'Actualice la tasa del día en Tasas BCV. Las operaciones en bolívares y alertas de montos usan la última tasa registrada para su organización.',
  },
  {
    id: 'roles',
    question: '¿Puedo tener varios usuarios?',
    answer:
      'Sí. Dueño, cajero y perfil fiscal con permisos distintos. Invite al equipo desde Configuración → Equipo.',
  },
  {
    id: 'support',
    question: '¿Cómo obtengo ayuda?',
    answer:
      'Use el asistente fiscal dentro del módulo SENIAT para dudas operativas. Para planes, facturación del servicio o demo, contacte a soporte comercial.',
  },
];

export const INVENTORY_FAQ: FaqItem[] = [
  {
    id: 'min-stock',
    question: '¿Cómo se generan las alertas de inventario?',
    answer:
      'Cuando el stock actual queda por debajo del mínimo definido en el producto, tras ventas, autoconsumos o ajustes manuales.',
  },
  {
    id: 'fix',
    question: '¿Qué hago si un producto aparece en alerta?',
    answer:
      'Revise compras pendientes, ajuste el mínimo si era incorrecto o reponga stock desde movimientos de inventario.',
  },
];
