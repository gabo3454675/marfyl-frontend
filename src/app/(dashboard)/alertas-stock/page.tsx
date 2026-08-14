import { redirect } from 'next/navigation';

export default function AlertasStockPage() {
  redirect('/products?stock=bajo');
}
