import { redirect } from 'next/navigation';

export default function PurchasesImportPage() {
  redirect('/importar?tipo=compras');
}
