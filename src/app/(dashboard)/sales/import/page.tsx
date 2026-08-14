import { redirect } from 'next/navigation';

export default function SalesImportPage() {
  redirect('/importar?tipo=ventas');
}
