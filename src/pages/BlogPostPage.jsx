import { useParams, Link, Navigate } from 'react-router-dom'
import { marked } from 'marked'
import { useMemo } from 'react'
import { getPostBySlug } from '../data/blogPosts'
import Footer from '../components/Footer'
import useDocumentMeta from '../utils/useDocumentMeta'

// Configure marked for safe rendering
marked.setOptions({
  breaks: false,
  gfm: true,
})

export default function BlogPostPage() {
  const { slug } = useParams()
  const post = getPostBySlug(slug)

  const contentHtml = useMemo(() => {
    if (!post) return ''
    return marked.parse(post.content)
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
      author: { '@type': 'Organization', name: 'PlacePage', url: 'https://www.placetopage.com' },
      publisher: { '@type': 'Organization', name: 'PlacePage', url: 'https://www.placetopage.com', logo: { '@type': 'ImageObject', url: 'https://www.placetopage.com/logo.png' } },
      mainEntityOfPage: { '@type': 'WebPage', '@id': `https://www.placetopage.com/blog/${post.slug}` },
      keywords: post.keywords.join(', '),
      ...(post.coverImage
        ? { image: [`${base}${post.coverImage}`] }
        : {}),
    }
  }, [post])

  useDocumentMeta(post ? {
    title: `${post.title} | PlacePage`,
    description: post.description,
    canonical: `https://www.placetopage.com/blog/${post.slug}`,
    ogTitle: post.title,
    ogDescription: post.description,
    ogType: 'article',
    ogImage: post.coverImage ? `https://www.placetopage.com${post.coverImage}` : undefined,
    jsonLd,
  } : {})

  if (!post) return <Navigate to="/blog" replace />

  return (
    <div className="min-h-dvh bg-background font-body text-on-background antialiased">
      {/* Header */}
      <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="PlacePage" className="h-8 w-8 rounded-lg object-contain" />
            <span className="font-manrope text-lg font-bold tracking-tight text-slate-900">PlacePage</span>
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

      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        {/* Back link */}
        <Link to="/blog" className="mb-8 inline-block text-sm text-slate-400 transition-colors hover:text-slate-600">
          &larr; All posts
        </Link>

        {/* Post header */}
        <header className="mb-10">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
              {post.category}
            </span>
            <span className="text-xs text-slate-400">{post.readTime}</span>
            <span className="text-xs text-slate-400">
              {new Date(post.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
          <h1 className="mb-4 font-headline text-2xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-3xl">
            {post.title}
          </h1>
          <p className="text-base leading-relaxed text-slate-500 sm:text-lg">{post.description}</p>
        </header>

        {post.coverImage ? (
          <figure className="mb-10 overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-50 shadow-sm">
            <img
              src={post.coverImage}
              alt={post.coverImageAlt || post.title}
              className="w-full object-cover"
              loading="eager"
              decoding="async"
            />
          </figure>
        ) : null}

        {/* Article content */}
        <article
          className="blog-content"
          dangerouslySetInnerHTML={{ __html: contentHtml }}
        />

        {/* CTA box */}
        <div className="mt-16 rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center">
          <h2 className="mb-2 font-headline text-xl font-bold text-slate-900">
            Ready to turn your Google Maps listing into a website?
          </h2>
          <p className="mb-6 text-sm text-slate-500">
            Paste your Google Maps link and get a fully designed, live website in under 60 seconds. Preview free — no credit card required.
          </p>
          <Link
            to="/register"
            className="inline-block rounded-full bg-primary px-6 py-3 text-sm font-bold text-on-primary shadow-md transition-all hover:brightness-110"
          >
            Generate my site free &rarr;
          </Link>
        </div>

        {/* More articles */}
        <div className="mt-12">
          <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-400">More articles</h3>
          <Link to="/blog" className="text-sm font-semibold text-primary hover:text-primary-container">
            View all posts &rarr;
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  )
}
