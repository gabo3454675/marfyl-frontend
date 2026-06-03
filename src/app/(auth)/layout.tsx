import { ProductHighlights } from '@/components/help/product-highlights';
import { AuthLayoutChrome } from '@/components/auth/auth-layout-chrome';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthLayoutChrome>
      <ProductHighlights />
      <div className="w-full max-w-md mx-auto lg:mx-0 lg:ml-auto">{children}</div>
    </AuthLayoutChrome>
  );
}
