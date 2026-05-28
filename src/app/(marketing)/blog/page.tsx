import Link from 'next/link';
import { BLOG_POSTS } from '@/lib/content/marketing-pages';

export default function BlogPage() {
  return (
    <>
      <header className="marketing-page-header marketing-container">
        <h1 className="marketing-hero-title">Blog MARFYL</h1>
        <p className="text-muted-foreground mt-4 text-lg">
          Recursos para negocios venezolanos: operatividad, fiscalidad y buenas prácticas con el sistema.
        </p>
      </header>

      <section className="marketing-container pb-20">
        <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {BLOG_POSTS.map((post) => (
            <li key={post.slug}>
              <Link
                href={`/blog/${post.slug}`}
                className="block h-full marketing-feature-card hover:border-[hsl(var(--marketing-accent)/0.4)]"
              >
                <span className="text-[10px] font-bold uppercase tracking-wide text-[hsl(var(--marketing-accent))]">
                  {post.category}
                </span>
                <h2 className="font-semibold text-lg mt-2 line-clamp-2">{post.title}</h2>
                <p className="text-sm text-muted-foreground mt-2 line-clamp-3">{post.excerpt}</p>
                <p className="text-xs text-muted-foreground mt-4">
                  {post.author} · {new Date(post.date).toLocaleDateString('es-VE', { dateStyle: 'long' })}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
