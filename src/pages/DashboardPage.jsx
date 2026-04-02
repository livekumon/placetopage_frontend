import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { getDashboardStats, getSites } from '../api/client'
import { useAuth } from '../context/AuthContext'

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function formatViews(n) {
  if (n == null) return '—'
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

const sideLink =
  'flex items-center gap-3 py-2 px-4 font-inter text-sm font-medium text-slate-500 transition-all hover:translate-x-1 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-900/50'
const sideActive =
  'flex items-center gap-3 rounded-lg bg-white py-2 px-4 font-inter text-sm font-medium text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white'

export default function DashboardPage() {
  const { hash } = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [sites, setSites] = useState([])
  const [stats, setStats] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [s, st] = await Promise.all([getSites(), getDashboardStats()])
        if (!cancelled) {
          setSites(Array.isArray(s) ? s : [])
          setStats(st)
        }
      } catch (e) {
        if (!cancelled) setError(e.message || 'Could not load dashboard')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="bg-surface text-on-surface">
      <aside className="fixed left-0 top-0 z-50 flex h-screen w-64 flex-col gap-2 border-r border-slate-200/50 bg-slate-50 p-4 dark:border-slate-800/50 dark:bg-slate-950">
        <div className="mb-8 px-4 py-2">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-primary">
              <span className="material-symbols-outlined text-sm text-white" style={{ fontVariationSettings: "'FILL' 1" }}>
                magic_button
              </span>
            </div>
            <Link to="/" className="font-manrope text-xl font-bold tracking-tighter text-slate-900 dark:text-white">
              Place to Page
            </Link>
          </div>
          <p className="mt-1 px-1 text-[10px] font-medium uppercase tracking-widest text-slate-400">Management Console</p>
          {user && (
            <div className="mt-4 flex items-center gap-3 rounded-lg bg-white/80 px-2 py-2 dark:bg-slate-900/80">
              {user.picture ? (
                <img src={user.picture} alt="" className="h-10 w-10 rounded-full object-cover" />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-high text-sm font-bold text-on-surface">
                  {(user.name || user.email || '?').charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{user.name || 'Account'}</p>
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
              </div>
            </div>
          )}
        </div>
        <nav className="flex-1 space-y-1" aria-label="Console">
          <Link
            to="/dashboard"
            className={!hash || hash === '#overview' ? sideActive : sideLink}
          >
            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              dashboard
            </span>
            Overview
          </Link>
          <Link to="/generator" className={sideLink}>
            <span className="material-symbols-outlined text-[20px]">add_circle</span>
            New site
          </Link>
          <Link
            to="/dashboard#recent-sites"
            className={hash === '#recent-sites' ? sideActive : sideLink}
          >
            <span className="material-symbols-outlined text-[20px]">language</span>
            My Sites
          </Link>
          <Link
            to="/dashboard#dashboard-stats"
            className={hash === '#dashboard-stats' ? sideActive : sideLink}
          >
            <span className="material-symbols-outlined text-[20px]">bar_chart</span>
            Analytics
          </Link>
          <Link
            to="/dashboard#domains"
            className={hash === '#domains' ? sideActive : sideLink}
          >
            <span className="material-symbols-outlined text-[20px]">dns</span>
            Domains
          </Link>
          <Link
            to="/dashboard#api-keys"
            className={hash === '#api-keys' ? sideActive : sideLink}
          >
            <span className="material-symbols-outlined text-[20px]">key</span>
            API keys
          </Link>
        </nav>
        <div className="mt-auto space-y-3 rounded-xl bg-surface-container-low p-4">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Credits Left</p>
              <p className="font-headline text-xl font-extrabold leading-none text-on-surface">
                {stats?.creditsRemaining?.toLocaleString() ?? '—'}
              </p>
            </div>
            <span className="material-symbols-outlined text-primary-container opacity-20">database</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-container">
            <div className="h-full w-[65%] rounded-full bg-primary" />
          </div>
          <button
            type="button"
            className="w-full rounded-full bg-primary py-2 text-[11px] font-bold uppercase tracking-widest text-white transition-all hover:bg-primary-container active:scale-95"
          >
            Buy More
          </button>
        </div>
        <div className="mt-4 space-y-1 border-t border-slate-200/50 pt-4">
          <Link
            to="/dashboard#account"
            className={hash === '#account' ? sideActive : `${sideLink} hover:translate-x-0`}
          >
            <span className="material-symbols-outlined text-[20px]">person</span>
            Account
          </Link>
          <button
            type="button"
            onClick={() => {
              logout()
              navigate('/', { replace: true })
            }}
            className={`${sideLink} w-full rounded-lg text-left hover:translate-x-0`}
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
            Sign out
          </button>
        </div>
      </aside>

      <main className="ml-64 min-h-screen space-y-12 p-8 md:p-12">
        <header id="overview" className="scroll-mt-28 flex items-end justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium tracking-wide text-on-surface-variant">
              Welcome back{stats?.displayName ? `, ${stats.displayName}` : ''}
            </p>
            <h2 className="font-headline text-4xl font-extrabold tracking-tight text-on-surface">Dashboard</h2>
          </div>
          <Link
            to="/generator"
            className="flex items-center gap-2 rounded-full bg-primary px-8 py-3 font-headline text-sm font-bold text-on-primary shadow-lg shadow-primary/10 transition-all hover:bg-primary-container"
          >
            <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              magic_button
            </span>
            Generate Site
          </Link>
        </header>

        {error && (
          <div className="rounded-xl bg-error-container px-4 py-3 text-sm text-on-error-container">
            {error} — ensure MongoDB is running, the API is up, and you are signed in. For setup, run{' '}
            <code className="rounded bg-white/50 px-1">npm run dev</code> from the repo root.
          </div>
        )}

        <section id="dashboard-stats" className="grid scroll-mt-28 grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2 rounded-xl bg-surface-container-lowest p-6">
            <p className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">Total sites</p>
            <div className="flex items-baseline gap-3">
              <span className="font-headline text-3xl font-extrabold text-on-surface">
                {loading ? '…' : sites.length}
              </span>
              <span className="rounded bg-primary-fixed px-1.5 py-0.5 text-[11px] font-bold text-on-primary-container">
                +2
              </span>
            </div>
          </div>
          <div className="space-y-2 rounded-xl bg-surface-container-lowest p-6">
            <p className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">Page views</p>
            <div className="flex items-baseline gap-3">
              <span className="font-headline text-3xl font-extrabold text-on-surface">
                {loading ? '…' : formatViews(stats?.pageViewsTotal)}
              </span>
              <span className="rounded bg-primary-fixed px-1.5 py-0.5 text-[11px] font-bold text-on-primary-container">
                +14%
              </span>
            </div>
          </div>
          <div className="space-y-2 rounded-xl bg-surface-container-lowest p-6">
            <p className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">CTA clicks</p>
            <div className="flex items-baseline gap-3">
              <span className="font-headline text-3xl font-extrabold text-on-surface">
                {loading ? '…' : stats?.ctaClicks?.toLocaleString() ?? '—'}
              </span>
              <span className="rounded bg-primary-fixed px-1.5 py-0.5 text-[11px] font-bold text-on-primary-container">
                +5.2%
              </span>
            </div>
          </div>
          <div className="space-y-2 rounded-xl bg-surface-container-lowest p-6">
            <p className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">Credits remaining</p>
            <div className="flex items-baseline gap-3">
              <span className="font-headline text-3xl font-extrabold text-on-surface">
                {loading ? '…' : stats?.creditsRemaining?.toLocaleString() ?? '—'}
              </span>
              <span className="rounded bg-surface-container px-1.5 py-0.5 text-[11px] font-bold text-on-surface-variant">
                Used 65%
              </span>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-12 gap-8">
          <section id="recent-sites" className="col-span-12 scroll-mt-28">
            <div className="overflow-hidden rounded-xl bg-surface-container-lowest">
              <div className="flex items-center justify-between bg-surface-container-lowest px-8 py-6">
                <h3 className="font-headline text-xl font-bold tracking-tight">Recent Sites</h3>
                <Link
                  to="/dashboard#recent-sites"
                  className="text-xs font-bold uppercase tracking-widest text-on-surface-variant transition-colors hover:text-primary"
                >
                  View All
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-surface-container-low">
                      <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                        Site name and URL
                      </th>
                      <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                        Category
                      </th>
                      <th className="px-8 py-4 text-center text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                        Page views
                      </th>
                      <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                        Date created
                      </th>
                      <th className="px-8 py-4 text-right text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container">
                    {loading && (
                      <tr>
                        <td colSpan={5} className="px-8 py-8 text-center text-on-surface-variant">
                          Loading sites…
                        </td>
                      </tr>
                    )}
                    {!loading && sites.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-8 py-8 text-center text-on-surface-variant">
                          No sites yet.{' '}
                          <Link to="/generator" className="font-medium text-on-primary-container underline">
                            Generate one
                          </Link>
                          .
                        </td>
                      </tr>
                    )}
                    {!loading &&
                      sites.map((site) => (
                        <tr key={site._id} className="group transition-colors hover:bg-surface-container-low">
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-4">
                              <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-surface-container-high">
                                {site.thumbnailUrl ? (
                                  <img alt="" className="h-full w-full object-cover" src={site.thumbnailUrl} />
                                ) : (
                                  <span className="material-symbols-outlined text-on-surface-variant">image</span>
                                )}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-on-surface">{site.name}</p>
                                <p className="text-xs text-on-surface-variant">{site.subdomain || `${site.slug}.placetopage.app`}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <span className="rounded-full bg-secondary-container px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-on-secondary-container">
                              {site.category}
                            </span>
                          </td>
                          <td className="px-8 py-6 text-center">
                            <p className="text-sm font-medium text-on-surface">{site.pageViews?.toLocaleString?.() ?? 0}</p>
                          </td>
                          <td className="px-8 py-6">
                            <p className="text-sm text-on-surface-variant">{formatDate(site.createdAt)}</p>
                          </td>
                          <td className="px-8 py-6 text-right">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-fixed px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-on-primary-fixed">
                              <span className="h-1 w-1 animate-pulse rounded-full bg-on-primary-fixed" />
                              {site.status === 'live' ? 'Live' : site.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <section
            id="domains"
            className="col-span-12 scroll-mt-28 rounded-xl bg-surface-container-lowest p-8 md:col-span-6"
          >
            <h3 className="mb-2 font-headline text-lg font-bold tracking-tight">Domains</h3>
            <p className="text-sm leading-relaxed text-on-surface-variant">
              Point your own domain at any live site. DNS and SSL steps appear in site settings after you publish.
            </p>
          </section>
          <section
            id="api-keys"
            className="col-span-12 scroll-mt-28 rounded-xl bg-surface-container-lowest p-8 md:col-span-6"
          >
            <h3 className="mb-2 font-headline text-lg font-bold tracking-tight">API keys</h3>
            <p className="text-sm leading-relaxed text-on-surface-variant">
              Programmatic access for agencies and integrations. Key management will live here in a future release.
            </p>
          </section>

          <section id="account" className="col-span-12 scroll-mt-28 rounded-xl border border-slate-200/80 bg-slate-50/50 p-8 dark:border-slate-800 dark:bg-slate-900/30">
            <h3 className="mb-2 font-headline text-lg font-bold tracking-tight">Account</h3>
            <p className="text-sm leading-relaxed text-on-surface-variant">
              Profile, billing, and team access. Connect your identity provider when you move to production.
            </p>
          </section>

          <section className="col-span-12">
            <div className="relative flex flex-col items-center justify-between gap-12 overflow-hidden rounded-xl bg-primary-container p-12 md:flex-row md:p-16">
              <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-20">
                <div className="absolute -right-10 -top-10 h-96 w-96 rounded-full bg-primary-fixed blur-[100px]" />
                <div className="absolute -bottom-10 -left-10 h-96 w-96 rounded-full bg-on-tertiary-container blur-[120px]" />
              </div>
              <div className="relative z-10 max-w-xl space-y-6">
                <h3 className="font-headline text-4xl font-extrabold leading-tight text-on-primary md:text-5xl">
                  Ready to scale your digital presence?
                </h3>
                <p className="font-body text-lg leading-relaxed text-primary-fixed-dim">
                  Launch your next highly-optimized landing page in seconds. Our AI handles the design, copy, and deployment so you can focus on your business.
                </p>
                <div className="pt-4">
                  <Link
                    to="/generator"
                    className="inline-block rounded-full bg-white px-10 py-4 font-headline text-sm font-extrabold text-primary shadow-xl shadow-black/20 transition-all hover:scale-105"
                  >
                    Start Generating Now
                  </Link>
                </div>
              </div>
              <div className="relative z-10 aspect-video w-full rotate-2 overflow-hidden rounded-2xl border border-white/10 bg-surface-container-lowest/10 shadow-2xl backdrop-blur-xl transition-transform duration-700 group-hover:rotate-0 md:w-1/3 md:aspect-square">
                <img
                  alt=""
                  className="h-full w-full object-cover opacity-80 mix-blend-overlay"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAizs11p8W-3XkcgnLO7A0FUmTmh5gjn1y-NCVOXYhYewifz6F68U7ngwCOeMQcHPTq4TN5cU1-03tcy6-DwctK-XCQxLObWZZEitfK8g3gl7gIhFUc0t_8jTIU2Y0zEpTkRA1awlbOuUqnD9RApG3ktw23i__nBSvVZXUCDZd84pwFKF9Zaqql_K20si36C6T364H1JSVxryWrYQ3MTDaceioVsJyoHUuDQw1kWkqnKQbwQ8q8XofOaWMNLlLjmr7ehWD3WdTtts4"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/30 bg-white/20 backdrop-blur-md">
                    <span className="material-symbols-outlined text-3xl text-white">play_arrow</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <footer className="w-full border-t border-slate-100 py-12 dark:border-slate-800">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-6 px-6">
            <p className="font-inter text-xs uppercase tracking-widest text-slate-400">© 2026 Place to Page. All rights reserved.</p>
            <nav className="flex flex-wrap gap-8">
              <Link
                to="/#terms"
                className="font-inter text-xs uppercase tracking-widest text-slate-400 transition-colors hover:text-slate-900 dark:hover:text-white"
              >
                Terms
              </Link>
              <Link
                to="/#privacy"
                className="font-inter text-xs uppercase tracking-widest text-slate-400 transition-colors hover:text-slate-900 dark:hover:text-white"
              >
                Privacy
              </Link>
              <a
                className="font-inter text-xs uppercase tracking-widest text-slate-400 transition-colors hover:text-slate-900 dark:hover:text-white"
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                Twitter
              </a>
              <a
                className="font-inter text-xs uppercase tracking-widest text-slate-400 transition-colors hover:text-slate-900 dark:hover:text-white"
                href="https://www.linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                LinkedIn
              </a>
            </nav>
          </div>
        </footer>
      </main>
    </div>
  )
}
