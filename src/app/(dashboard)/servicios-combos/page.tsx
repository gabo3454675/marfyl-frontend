import { redirect } from 'next/navigation';

export default function ServiciosCombosPage() {
  redirect('/licores?tab=combos');
}
