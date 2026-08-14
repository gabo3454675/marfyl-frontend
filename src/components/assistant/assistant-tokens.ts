/** Paleta del diseño Flutter SENIAT Assistant → CSS/Tailwind */
export const ASSISTANT_QUICK_PROMPTS = [
  'Cómo vamos hoy',
  'Qué está por agotarse',
  'Cómo está la caja',
  'Qué debo comprar',
] as const;

export const FISCAL_QUICK_PROMPTS = [
  'Emitir factura',
  'Validar IVA',
  'Cierre mensual',
  'Alertas fiscales',
] as const;

export const ASSISTANT_STARTER =
  'Soy **MARFYL**. Te ayudo con el día a día del local: ventas, caja, stock, piso y compras. Si tienes una foto de factura, ve a Inventario → Compras → Foto/PDF. ¿Cómo va el turno?';

export function buildAssistantContext(pathname: string): string {
  if (pathname.startsWith('/fiscal')) return 'Usuario en módulo Fiscal MARFYL';
  if (pathname.startsWith('/pos')) return 'Usuario en POS';
  if (pathname.startsWith('/invoices')) return 'Usuario en Facturas';
  if (pathname.startsWith('/inventory')) return 'Usuario en Inventario / Compras';
  if (pathname.startsWith('/cierre-caja')) return 'Usuario en Cierre de caja';
  if (pathname.startsWith('/licores')) return 'Usuario en Licores';
  if (pathname.startsWith('/comanda')) return 'Usuario en Comanda / piso';
  if (pathname.startsWith('/expenses')) return 'Usuario en Gastos';
  if (pathname.startsWith('/alertas-stock')) return 'Usuario en Alertas de stock';
  if (pathname.startsWith('/assistant')) return 'Usuario en pantalla dedicada del Asistente IA';
  return 'Usuario en dashboard MARFYL';
}
