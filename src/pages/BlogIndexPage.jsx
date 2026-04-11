import { Link } from 'react-router-dom'
import { getAllPosts } from '../data/blogPosts'
import Footer from '../components/Footer'
import useDocumentMeta from '../utils/useDocumentMeta'

const CATEGORY_COLORS = {
  'How-to':    { bg: 'bg-emerald-50',  text: 'text-emerald-700' },
  'Industry':  { bg: 'bg-violet-50',   text: 'text-violet-700' },
  'Local SEO': { bg: 'bg-amber-50',    text: 'text-amber-700' },
  'AI Tools':  { bg: 'bg-sky-50',      text: 'text-sky-700' },
}

function catColor(category) {
  return CATEGORY_COLORS[category] || { bg: 'bg-blue-50', text: 'text-blue-700' }
}

export default function BlogIndexPage() {
  const posts = getAllPosts()

  useDocumentMeta({
    title: 'Blog — Local SEO & AI Website Tips for Business Owners | placetopage.com',
    description: 'Practical guides on Google Maps SEO, local business websites, and AI tools. Written for business owners who want more customers from Google.',
    canonical: 'https://www.placetopage.com/blog',
    ogTitle: 'Blog | placetopage.com',
    ogDescription: 'Practical guides on Google Maps SEO, local business websites, and AI tools.',
  })

  return (
    <div className="min-h-dvh bg-background font-body text-on-background antialiased">
      {/* Header */}
      <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="placetopage.com" className="h-8 w-8 rounded-lg object-contain" />
            <span className="font-manrope text-lg font-bold tracking-tight text-slate-900">placetopage.com</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link to="/" className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">Home</Link>
            <Link
              to="/register"
              className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-container"
            >
              Get started free
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
        <h1 className="mb-3 font-headline text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          Blog
        </h1>
        <p className="mb-12 text-lg text-slate-500">
          Practical guides on local SEO, Google Maps, and AI tools for business owners.
        </p>

        <div className="grid gap-8 sm:grid-cols-2">
          {posts.map((post) => (
            <article
              key={post.slug}
              className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all hover:border-slate-300 hover:shadow-md"
            >
              <Link
                to={`/blog/${post.slug}`}
                className="relative block aspect-[3/4] w-full shrink-0 overflow-hidden bg-slate-100"
              >
                {post.cardImage || post.coverImage ? (
                  <img
                    src={post.cardImage || post.coverImage}
                    alt={(post.cardImage ? post.cardImageAlt : post.coverImageAlt) || ''}
                    className="h-full w-full object-cover object-center transition duration-300 ease-out group-hover:scale-[1.03]"
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-slate-100 via-slate-50 to-sky-50 px-6 text-center">
                    <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm ring-1 ring-slate-200/80">
                      {post.category}
                    </span>
                    <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                      Image coming soon
                    </span>
                  </div>
                )}
              </Link>
              <div className="flex flex-1 flex-col p-6 sm:p-7">
                <div className="mb-3 flex flex-wrap items-center gap-3">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${catColor(post.category).bg} ${catColor(post.category).text}`}>
                    {post.category}
                  </span>
                  <span className="text-xs text-slate-400">{post.readTime}</span>
                  <span className="text-xs text-slate-400">
                    {new Date(post.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                </div>
                <h2 className="mb-2 font-headline text-xl font-bold leading-snug text-slate-900">
                  <Link
                    to={`/blog/${post.slug}`}
                    className="transition-colors group-hover:text-primary"
                  >
                    {post.title}
                  </Link>
                </h2>
                <p className="mb-4 flex-1 text-sm leading-relaxed text-slate-500">{post.description}</p>
                <Link
                  to={`/blog/${post.slug}`}
                  className="text-sm font-semibold text-primary transition-colors hover:text-primary-container"
                >
                  Read article &rarr;
                </Link>
              </div>
            </article>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  )
}
