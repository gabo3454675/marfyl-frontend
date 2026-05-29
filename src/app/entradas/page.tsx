import { redirect } from 'next/navigation';
import { CONCERT_DEFAULT_SLUG } from '@/lib/concert/feature';

/** Atajo público para compartir: tudominio.com/entradas */
export default function EntradasRedirectPage() {
  redirect(`/evento/${CONCERT_DEFAULT_SLUG}`);
}
