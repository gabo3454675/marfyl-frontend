import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { MarketingCtaBand } from '@/components/marketing/marketing-cta-band';
import {
  BLOG_POST_BODIES,
  BLOG_POSTS,
  getBlogPost,
  MARKETING_HOME,
} from '@/lib/content/marketing-pages';

export function generateStaticParams() {
  return BLOG_POSTS.map((p) => ({ slug: p.slug }));
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = getBlogPost(params.slug);
  if (!post) notFound();

  const paragraphs = BLOG_POST_BODIES[params.slug] ?? [post.excerpt];

  return (
    <article className="marketing-container max-w-3xl pb-20">
      <Link href="/blog" className="text-sm text-[hsl(var(--marketing-accent))] hover:underline">
        ← Volver al blog
      </Link>
      <header className="mt-6">
        <span className="text-xs font-bold uppercase tracking-wide text-[hsl(var(--marketing-accent))]">
          {post.category}
        </span>
        <h1 className="marketing-hero-title text-3xl md:text-4xl mt-2">{post.title}</h1>
        <p className="text-sm text-muted-foreground mt-4">
          {post.author} · {new Date(post.date).toLocaleDateString('es-VE', { dateStyle: 'long' })}
        </p>
      </header>
      <div className="mt-10 space-y-5 text-muted-foreground leading-relaxed">
        {paragraphs.map((p) => (
          <p key={p.slice(0, 24)}>{p}</p>
        ))}
      </div>
      <div className="mt-12">
        <Button variant="outline" asChild>
          <Link href="/blog">Más artículos</Link>
        </Button>
      </div>
      <MarketingCtaBand
        title="¿Quieres aplicar esto en tu negocio?"
        subtitle="Prueba MARFYL con POS, inventario y módulo fiscal integrados."
        primary={{ label: 'Agendar demo', href: MARKETING_HOME.cta.secondary.href }}
        secondary={{ label: 'Crear cuenta', href: '/register' }}
      />
    </article>
  );
}
