import { useParams, Link, Navigate } from 'react-router-dom'
import { marked } from 'marked'
import { useMemo } from 'react'
import { getPostBySlug, getAllPosts } from '../data/blogPosts'
import Footer from '../components/Footer'
import useDocumentMeta from '../utils/useDocumentMeta'

marked.setOptions({
  breaks: false,
  gfm: true,
})

const CATEGORY_COLORS = {
  'How-to':    { bg: 'bg-emerald-50',  text: 'text-emerald-700',  border: 'border-emerald-200' },
  'Industry':  { bg: 'bg-violet-50',   text: 'text-violet-700',   border: 'border-violet-200' },
  'Local SEO': { bg: 'bg-amber-50',    text: 'text-amber-700',    border: 'border-amber-200' },
  'AI Tools':  { bg: 'bg-sky-50',      text: 'text-sky-700',      border: 'border-sky-200' },
}

function catColor(category) {
  return CATEGORY_COLORS[category] || { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' }
}

export default function BlogPostPage() {
  const { slug } = useParams()
  const post = getPostBySlug(slug)

  const contentHtml = useMemo(() => {
    if (!post) return ''
    return marked.parse(post.content)
  }, [post])

  const relatedPosts = useMemo(() => {
    if (!post) return []
    return getAllPosts()
      .filter((p) => p.slug !== post.slug)
      .slice(0, 3)
  }, [post])

  const jsonLd = useMemo(() => {
    if (!post) return null
    const base = 'https://www.placetopage.com'
    return {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: post.title,
      description: post.description,
      datePublished: post.publishedAt,
      dateModified: post.publishedAt,
      author: { '@type': 'Organization', name: 'placetopage.com', url: 'https://www.placetopage.com' },
      publisher: { '@type': 'Organization', name: 'placetopage.com', url: 'https://www.placetopage.com', logo: { '@type': 'ImageObject', url: 'https://www.placetopage.com/logo.png' } },
      mainEntityOfPage: { '@type': 'WebPage', '@id': `https://www.placetopage.com/blog/${post.slug}` },
      keywords: post.keywords.join(', '),
      ...(post.coverImage ? { image: [`${base}${post.coverImage}`] } : {}),
    }
  }, [post])

  useDocumentMeta(post ? {
    title: `${post.title} | placetopage.com`,
    description: post.description,
    canonical: `https://www.placetopage.com/blog/${post.slug}`,
    ogTitle: post.title,
    ogDescription: post.description,
    ogType: 'article',
    ogImage: post.coverImage ? `https://www.placetopage.com${post.coverImage}` : undefined,
    jsonLd,
  } : {})

  if (!post) return <Navigate to="/blog" replace />

  const cc = catColor(post.category)

  return (
    <div className="min-h-dvh bg-gradient-to-b from-slate-50 via-white to-slate-50 font-body text-on-background antialiased">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="placetopage.com" className="h-8 w-8 rounded-lg object-contain" />
            <span className="font-manrope text-lg font-bold tracking-tight text-slate-900">placetopage.com</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link to="/blog" className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">Blog</Link>
            <Link
              to="/register"
              className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-container"
            >
              Get started free
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        {/* Breadcrumb */}
        <nav className="mb-8 flex items-center gap-2 text-sm text-slate-400">
          <Link to="/" className="hover:text-slate-600 transition-colors">Home</Link>
          <span>/</span>
          <Link to="/blog" className="hover:text-slate-600 transition-colors">Blog</Link>
          <span>/</span>
          <span className="truncate text-slate-600">{post.title}</span>
        </nav>

        {/* Post header */}
        <header className="mb-10">
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${cc.bg} ${cc.text}`}>
              {post.category}
            </span>
            <span className="flex items-center gap-1.5 text-xs text-slate-400">
              <span className="material-symbols-outlined text-[14px]">schedule</span>
              {post.readTime}
            </span>
            <span className="flex items-center gap-1.5 text-xs text-slate-400">
              <span className="material-symbols-outlined text-[14px]">calendar_today</span>
              {new Date(post.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
          <h1 className="mb-5 font-headline text-3xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-4xl">
            {post.title}
          </h1>
          <p className="text-lg leading-relaxed text-slate-500">{post.description}</p>

          {/* Keywords as tags */}
          <div className="mt-5 flex flex-wrap gap-2">
            {post.keywords.map((kw) => (
              <span key={kw} className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
                {kw}
              </span>
            ))}
          </div>
        </header>

        {/* Decorative divider */}
        <div className="mb-10 flex items-center gap-4">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
          <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${cc.bg} ${cc.text}`}>
            Article
          </span>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
        </div>

        {/* Article content */}
        <article
          className="blog-content"
          dangerouslySetInnerHTML={{ __html: contentHtml }}
        />

        {/* CTA box */}
        <div className="mt-16 overflow-hidden rounded-2xl bg-gradient-to-br from-primary/5 via-primary/10 to-sky-50 p-1">
          <div className="rounded-xl bg-white/80 p-8 text-center backdrop-blur-sm sm:p-10">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <span className="material-symbols-outlined text-3xl text-primary">rocket_launch</span>
            </div>
            <h2 className="mb-2 font-headline text-xl font-bold text-slate-900 sm:text-2xl">
              Ready to turn your Google Maps listing into a website?
            </h2>
            <p className="mx-auto mb-6 max-w-md text-sm leading-relaxed text-slate-500">
              Paste your Google Maps link and get a fully designed, live website in under 60 seconds. Preview free — no credit card required.
            </p>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-bold text-on-primary shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30 hover:brightness-110"
            >
              Generate my site free
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </Link>
          </div>
        </div>

        {/* Related articles */}
        {relatedPosts.length > 0 && (
          <div className="mt-16">
            <div className="mb-6 flex items-center gap-4">
              <div className="h-px flex-1 bg-slate-200" />
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Keep reading</h3>
              <div className="h-px flex-1 bg-slate-200" />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {relatedPosts.map((rp) => {
                const rcc = catColor(rp.category)
                return (
                  <Link
                    key={rp.slug}
                    to={`/blog/${rp.slug}`}
                    className="group flex flex-col rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm transition-all hover:border-slate-300 hover:shadow-md"
                  >
                    <div className="flex flex-1 flex-col">
                      <span className={`mb-2 inline-block w-fit rounded-full px-2 py-0.5 text-[10px] font-bold ${rcc.bg} ${rcc.text}`}>
                        {rp.category}
                      </span>
                      <h4 className="mb-1 text-sm font-bold leading-snug text-slate-900 transition-colors group-hover:text-primary">
                        {rp.title}
                      </h4>
                      <span className="mt-auto pt-2 text-xs text-slate-400">{rp.readTime}</span>
                    </div>
                  </Link>
                )
              })}
            </div>
            <div className="mt-6 text-center">
              <Link to="/blog" className="text-sm font-semibold text-primary hover:text-primary-container">
                View all posts &rarr;
              </Link>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
