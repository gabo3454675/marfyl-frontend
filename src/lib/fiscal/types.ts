/** Tipos UI del módulo fiscal (diseño v0 / SENIAT). */
export interface Documento {
  id: string;
  nro_op: string;
  fecha: string;
  rif: string;
  razonSocial: string;
  nro_factura: string;
  nro_control: string;
  base_imponible: number;
  iva_causado: number;
  total: number;
  tipo?: 'venta' | 'compra';
}
