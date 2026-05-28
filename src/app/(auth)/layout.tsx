import { ProductHighlights } from '@/components/help/product-highlights';
import { DmAmbientMotion } from '@/components/ui/dm-ambient-motion';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden px-4 py-12 dark"
      style={{
        backgroundColor: 'hsl(var(--dm-b-base))',
        backgroundImage:
          'radial-gradient(ellipse 90% 60% at 20% 0%, hsl(var(--dm-b-accent) / 0.18), transparent 55%), radial-gradient(ellipse 70% 50% at 100% 100%, hsl(var(--dm-b-accent) / 0.08), transparent 50%)',
      }}
    >
      <DmAmbientMotion palette="b" intensity="subtle" />
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none dm-surface-noise z-0" aria-hidden />

      <div className="relative z-[1] w-full max-w-5xl grid lg:grid-cols-[1fr_minmax(0,28rem)] gap-10 lg:gap-14 items-center">
        <ProductHighlights />
        <div className="w-full max-w-md mx-auto lg:mx-0 lg:ml-auto">{children}</div>
      </div>
    </div>
  );
}
