import Link from 'next/link';
import { BLOG_POSTS } from '@/lib/content/marketing-pages';

export default function BlogPage() {
  return (
    <>
      <header className="marketing-page-header marketing-container">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight leading-tight text-[#f0f0f0]">
          Blog MARFYL
        </h1>
        <p className="mt-4 text-lg text-[#f0f0f0]/55 max-w-2xl mx-auto">
          Recursos para negocios venezolanos: operatividad, fiscalidad y buenas prácticas con el sistema.
        </p>
      </header>

      <section className="marketing-container pb-20">
        <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {BLOG_POSTS.map((post) => (
            <li key={post.slug}>
              <Link
                href={`/blog/${post.slug}`}
                className="block h-full rounded-2xl border p-6 transition-all duration-300 hover:translate-y-[-2px]"
                style={{ borderColor: 'rgba(255,255,255,0.06)', background: '#131418' }}
              >
                <span className="text-[10px] font-bold uppercase tracking-wide text-[#34d399]">
                  {post.category}
                </span>
                <h2 className="font-semibold text-lg mt-2 line-clamp-2 text-[#f0f0f0]">{post.title}</h2>
                <p className="text-sm mt-2 line-clamp-3" style={{ color: 'rgba(240,240,240,0.5)' }}>{post.excerpt}</p>
                <p className="text-xs mt-4" style={{ color: 'rgba(240,240,240,0.3)' }}>
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
