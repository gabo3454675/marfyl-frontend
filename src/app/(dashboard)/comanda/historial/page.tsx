import { redirect } from 'next/navigation';

export default function ComandaHistorialPage() {
  redirect('/comanda?tab=auditoria');
}
