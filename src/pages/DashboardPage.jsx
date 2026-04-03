import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getSites, softDeleteSite, updateSite } from '../api/client'
import { useAuth } from '../context/AuthContext'

const RECENT_SITES_VIEW_KEY = 'p2p-dashboard-recent-sites-view'

function siteDisplayUrl(site) {
  return site.subdomain || `${site.slug}.placetopage.app`
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function statusLabel(status) {
  const s = String(status || 'draft').toLowerCase()
  if (s === 'live') return 'Live'
  if (s === 'archived') return 'Archived'
  if (s === 'draft') return 'Draft'
  return status ? String(status) : 'Draft'
}

/** Card view only — background/text per site status */
function statusChipCardClass(status) {
  const s = String(status || 'draft').toLowerCase()
  if (s === 'live') {
    return 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-800/25 dark:bg-emerald-500 dark:ring-emerald-300/20'
  }
  if (s === 'archived') {
    return 'bg-slate-500 text-white shadow-sm ring-1 ring-slate-700/30 dark:bg-slate-600 dark:ring-slate-400/25'
  }
  return 'bg-amber-500 text-white shadow-sm ring-1 ring-amber-700/25 dark:bg-amber-600 dark:ring-amber-300/20'
}

function isSiteArchived(site) {
  return String(site?.status || '').toLowerCase() === 'archived'
}

/**
 * Live, or published footprint (Vercel / custom domain / production subdomain URL).
 * Used for archive + remove modals and must stay aligned with backend `siteHasPublicWebFootprint`.
 */
function siteHasOrHadPublicWebPresence(site) {
  if (!site) return false
  const st = String(site.status || '').toLowerCase()
  if (st === 'live') return true
  const sub = typeof site.subdomain === 'string' ? site.subdomain.trim() : ''
  if (sub.startsWith('http')) return true
  return Boolean(
    (site.deploymentUrl && String(site.deploymentUrl).trim()) ||
      (site.customSubdomain && String(site.customSubdomain).trim()) ||
      (site.vercelDeploymentId && String(site.vercelDeploymentId).trim()) ||
      (site.vercelProjectId && String(site.vercelProjectId).trim())
  )
}

function sitePublicUrlHint(site) {
  if (!site) return null
  const dep = typeof site.deploymentUrl === 'string' ? site.deploymentUrl.trim() : ''
  if (dep) return dep
  const cs = typeof site.customSubdomain === 'string' ? site.customSubdomain.trim() : ''
  if (cs) return `https://${cs}.placetopage.com`
  const sub = typeof site.subdomain === 'string' ? site.subdomain.trim() : ''
  if (sub) return sub.startsWith('http') ? sub : `https://${sub}`
  const host = siteDisplayUrl(site)
  if (host) return host.includes('://') ? host : `https://${host}`
  return null
}

function siteCarouselBucket(site) {
  const s = String(site.status || 'draft').toLowerCase()
  if (s === 'live') return 'live'
  if (s === 'archived') return 'archived'
  if (s === 'draft') return 'draft'
  return 'other'
}

function siteSearchText(site) {
  return [
    site.name,
    site.slug,
    site.subdomain,
    site.category,
    site.status,
    siteDisplayUrl(site),
    site._id != null ? String(site._id) : '',
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [sites, setSites] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [recentSitesView, setRecentSitesView] = useState(() => {
    const saved = localStorage.getItem(RECENT_SITES_VIEW_KEY)
    return saved === 'card' || saved === 'list' || saved === 'table' ? saved : 'card'
  })
  const [archivingId, setArchivingId] = useState(null)
  const [archiveModalSite, setArchiveModalSite] = useState(null)
  const [archiveModalError, setArchiveModalError] = useState('')
  const [deleteModalSite, setDeleteModalSite] = useState(null)
  const [deleteModalError, setDeleteModalError] = useState('')
  const [softDeletingId, setSoftDeletingId] = useState(null)

  const categoryOptions = useMemo(() => {
    const set = new Set()
    for (const s of sites) {
      const c = (s.category || '').trim()
      if (c) set.add(c)
    }
    return [...set].sort((a, b) => a.localeCompare(b))
  }, [sites])

  const filteredSites = useMemo(() => {
    let list = [...sites].sort(
      (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
    )
    if (statusFilter !== 'all') {
      list = list.filter(
        (site) => String(site.status || 'draft').toLowerCase() === statusFilter
      )
    }
    if (categoryFilter !== 'all') {
      list = list.filter((site) => (site.category || '').trim() === categoryFilter)
    }
    const q = searchQuery.trim().toLowerCase()
    if (q) {
      list = list.filter((site) => siteSearchText(site).includes(q))
    }
    return list
  }, [sites, searchQuery, statusFilter, categoryFilter])

  const sitesByCarouselRow = useMemo(() => {
    const draft = []
    const live = []
    const archived = []
    const other = []
    for (const site of filteredSites) {
      const b = siteCarouselBucket(site)
      if (b === 'live') live.push(site)
      else if (b === 'archived') archived.push(site)
      else if (b === 'draft') draft.push(site)
      else other.push(site)
    }
    return { draft, live, archived, other }
  }, [filteredSites])

  const carouselRows = useMemo(
    () => [
      { key: 'draft', label: 'Draft', sites: sitesByCarouselRow.draft },
      { key: 'live', label: 'Live', sites: sitesByCarouselRow.live },
      { key: 'archived', label: 'Archived', sites: sitesByCarouselRow.archived },
      { key: 'other', label: 'Other', sites: sitesByCarouselRow.other },
    ],
    [sitesByCarouselRow]
  )

  const filtersActive = statusFilter !== 'all' || categoryFilter !== 'all'

  function clearFilters() {
    setStatusFilter('all')
    setCategoryFilter('all')
    setSearchQuery('')
  }

  const closeArchiveModal = useCallback(() => {
    if (archivingId) return
    setArchiveModalSite(null)
    setArchiveModalError('')
  }, [archivingId])

  const closeDeleteModal = useCallback(() => {
    if (softDeletingId) return
    setDeleteModalSite(null)
    setDeleteModalError('')
  }, [softDeletingId])

  function openArchiveModal(site) {
    const id = site?._id
    if (id == null) return
    if (isSiteArchived(site)) return
    setDeleteModalSite(null)
    setDeleteModalError('')
    setArchiveModalError('')
    setArchiveModalSite(site)
  }

  function openDeleteModal(site) {
    const id = site?._id
    if (id == null) return
    if (!isSiteArchived(site)) return
    setArchiveModalSite(null)
    setArchiveModalError('')
    setDeleteModalError('')
    setDeleteModalSite(site)
  }

  function siteRowBusy(site) {
    const id = site?._id
    return id != null && (archivingId === id || softDeletingId === id)
  }

  async function confirmArchiveSite() {
    const site = archiveModalSite
    const id = site?._id
    if (id == null) return
    setError(null)
    setArchiveModalError('')
    setArchivingId(id)
    try {
      const data = await updateSite(id, { status: 'archived' })
      const { vercelPauseWarning, vercelPaused, ...sitePayload } = data || {}
      void vercelPaused
      setSites((prev) => prev.map((s) => (s._id === id ? { ...s, ...sitePayload } : s)))
      setArchiveModalSite(null)
      if (vercelPauseWarning) {
        setError(`Archived. Note: ${vercelPauseWarning}`)
      }
    } catch (e) {
      setArchiveModalError(e.message || 'Could not archive site')
    } finally {
      setArchivingId(null)
    }
  }

  async function confirmSoftDeleteSite() {
    const site = deleteModalSite
    const id = site?._id
    if (id == null) return
    setError(null)
    setDeleteModalError('')
    setSoftDeletingId(id)
    try {
      const result = await softDeleteSite(id)
      setSites((prev) => prev.filter((s) => s._id !== id))
      setDeleteModalSite(null)
      if (result?.vercelPauseWarning) {
        setError(`Removed from your dashboard. Note: ${result.vercelPauseWarning}`)
      }
    } catch (e) {
      setDeleteModalError(e.message || 'Could not remove site')
    } finally {
      setSoftDeletingId(null)
    }
  }

  useEffect(() => {
    const modalOpen = archiveModalSite || deleteModalSite
    if (!modalOpen) return
    const busy = archivingId || softDeletingId
    function onKey(e) {
      if (e.key === 'Escape' && !busy) {
        setArchiveModalSite(null)
        setArchiveModalError('')
        setDeleteModalSite(null)
        setDeleteModalError('')
      }
    }
    window.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [archiveModalSite, deleteModalSite, archivingId, softDeletingId])

  function emptyResultsMessage() {
    const hasSearch = Boolean(searchQuery.trim())
    if (hasSearch && filtersActive) {
      return `No sites match your search and filters.`
    }
    if (hasSearch) {
      return `No sites match "${searchQuery.trim()}". Try another search.`
    }
    if (filtersActive) {
      return 'No sites match the selected filters.'
    }
    return 'No sites to show.'
  }

  useEffect(() => {
    localStorage.setItem(RECENT_SITES_VIEW_KEY, recentSitesView)
  }, [recentSitesView])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const s = await getSites()
        if (!cancelled) setSites(Array.isArray(s) ? s : [])
      } catch (e) {
        if (!cancelled) setError(e.message || 'Could not load sites')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="flex min-h-[100dvh] flex-col bg-surface text-on-surface">
      <main className="flex min-h-0 flex-1 flex-col">
        <header className="shrink-0 border-b border-slate-200/70 bg-surface px-4 py-4 dark:border-slate-800 md:px-8 md:py-5">
          <div className="mb-4 space-y-1">
            <p className="text-sm text-on-surface-variant">
              Welcome back{user?.name ? `, ${user.name}` : ''}
            </p>
            <h1 className="font-headline text-2xl font-extrabold tracking-tight text-on-surface md:text-3xl">Dashboard</h1>
          </div>
          <label className="sr-only" htmlFor="dashboard-site-search">
            Search sites
          </label>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" aria-hidden>
                <span className="material-symbols-outlined text-[22px]">search</span>
              </span>
              <input
                id="dashboard-site-search"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, URL, category, or status…"
                autoComplete="off"
                className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-12 pr-4 text-sm text-on-surface shadow-sm outline-none transition-shadow placeholder:text-on-surface-variant focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-900 md:text-base"
              />
            </div>
            <Link
              to="/generator"
              title="New site"
              aria-label="Create new site"
              className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-2xl bg-primary text-on-primary shadow-sm transition-all hover:opacity-90 hover:shadow-md"
            >
              <span className="material-symbols-outlined text-[26px]" style={{ fontVariationSettings: "'FILL' 1" }}>add</span>
            </Link>
          </div>

          <div className="mt-4 flex flex-col gap-4 border-t border-slate-200/60 pt-4 dark:border-slate-800 sm:flex-row sm:flex-wrap sm:items-end sm:gap-x-6 sm:gap-y-3">
            <div className="min-w-0 flex-1 flex flex-col gap-2">
              <span id="filter-status-label" className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                Status
              </span>
              <div
                className="flex flex-wrap gap-2"
                role="group"
                aria-labelledby="filter-status-label"
              >
                {(
                  [
                    { id: 'all', label: 'All' },
                    { id: 'live', label: 'Live' },
                    { id: 'draft', label: 'Draft' },
                    { id: 'archived', label: 'Archived' },
                  ]
                ).map(({ id, label }) => (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={statusFilter === id}
                    onClick={() => setStatusFilter(id)}
                    className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
                      statusFilter === id
                        ? 'bg-primary text-on-primary shadow-sm'
                        : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700 dark:hover:bg-slate-800'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex w-full shrink-0 flex-col gap-3 sm:w-auto sm:flex-row sm:items-end sm:gap-3">
              <div className="min-w-0 sm:min-w-[11rem] sm:max-w-xs">
                <label
                  htmlFor="dashboard-category-filter"
                  className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant"
                >
                  Category
                </label>
                <select
                  id="dashboard-category-filter"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  disabled={categoryOptions.length === 0}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900"
                >
                  <option value="all">All categories</option>
                  {categoryOptions.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              {(filtersActive || searchQuery.trim()) && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="shrink-0 self-start rounded-full border border-slate-200 px-4 py-2 text-xs font-bold uppercase tracking-wider text-on-surface-variant transition-colors hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-800 sm:self-auto sm:pb-2.5"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>
        </header>

        {error && (
          <div className="shrink-0 border-b border-slate-200/70 bg-error-container/90 px-4 py-3 text-sm text-on-error-container dark:border-slate-800 md:px-8">
            {error}
          </div>
        )}

        <section id="recent-sites" className="flex min-h-0 flex-1 flex-col scroll-mt-24">
          <div className="flex min-h-0 flex-1 flex-col border-slate-200/60 bg-surface dark:border-slate-800/60">
            <div className="flex shrink-0 flex-col gap-4 border-b border-slate-200/60 px-4 py-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between md:px-8">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h2 className="font-headline text-lg font-bold text-on-surface">Your sites</h2>
                {!loading && sites.length > 0 && (
                  <span className="text-sm text-on-surface-variant">
                    {filteredSites.length === sites.length
                      ? `${sites.length} total`
                      : `${filteredSites.length} of ${sites.length}`}
                  </span>
                )}
              </div>
              <div
                className="inline-flex shrink-0 rounded-xl border border-slate-200/80 bg-white p-1 dark:border-slate-700 dark:bg-slate-900"
                role="group"
                aria-label="Sites layout"
              >
                <button
                  type="button"
                  onClick={() => setRecentSitesView('card')}
                  aria-pressed={recentSitesView === 'card'}
                  title="Card view"
                  className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
                    recentSitesView === 'card'
                      ? 'bg-primary text-on-primary shadow-sm'
                      : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">grid_view</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRecentSitesView('list')}
                  aria-pressed={recentSitesView === 'list'}
                  title="List view"
                  className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
                    recentSitesView === 'list'
                      ? 'bg-primary text-on-primary shadow-sm'
                      : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">view_list</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRecentSitesView('table')}
                  aria-pressed={recentSitesView === 'table'}
                  title="Table view"
                  className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
                    recentSitesView === 'table'
                      ? 'bg-primary text-on-primary shadow-sm'
                      : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">table_rows</span>
                </button>
              </div>
            </div>

            {recentSitesView === 'card' && (
              <div className="min-h-0 flex-1 overflow-auto px-4 py-6 md:px-8">
                {loading && <p className="py-12 text-center text-sm text-on-surface-variant">Loading…</p>}
                {!loading && sites.length === 0 && (
                  <p className="py-12 text-center text-sm text-on-surface-variant">
                    No sites yet.{' '}
                    <Link to="/generator" className="font-medium text-primary underline">
                      Create one
                    </Link>
                    .
                  </p>
                )}
                {!loading && sites.length > 0 && filteredSites.length === 0 && (
                  <p className="py-12 text-center text-sm text-on-surface-variant">{emptyResultsMessage()}</p>
                )}
                {!loading && filteredSites.length > 0 && (
                  <div className="space-y-10">
                    {carouselRows.map(({ key, label, sites: rowSites }) =>
                      rowSites.length === 0 ? null : (
                        <section key={key} aria-labelledby={`carousel-${key}-title`}>
                          <div className="mb-3 flex items-baseline justify-between gap-4 px-0.5">
                            <h3
                              id={`carousel-${key}-title`}
                              className="font-headline text-xs font-bold uppercase tracking-widest text-on-surface-variant"
                            >
                              {label}
                            </h3>
                            <span className="text-xs tabular-nums text-on-surface-variant">{rowSites.length}</span>
                          </div>
                          <div className="relative -mx-1">
                            <div
                              className="flex gap-4 overflow-x-auto overflow-y-visible px-1 pb-2 pt-1 [scrollbar-width:thin] snap-x snap-mandatory"
                              style={{ WebkitOverflowScrolling: 'touch' }}
                            >
                              {rowSites.map((site) => (
                                <div
                                  key={site._id}
                                  className="flex w-[min(calc(100vw-3rem),260px)] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all hover:border-primary/40 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 sm:w-64"
                                >
                                  <button
                                    type="button"
                                    onClick={() => navigate(`/dashboard/sites/${site._id}`)}
                                    className="group flex w-full flex-1 flex-col overflow-hidden text-left"
                                  >
                                    <div className="relative aspect-[16/10] overflow-hidden bg-surface-container-high">
                                      {site.thumbnailUrl ? (
                                        <img
                                          alt=""
                                          className="h-full w-full object-cover transition-transform group-hover:scale-[1.02]"
                                          src={site.thumbnailUrl}
                                        />
                                      ) : (
                                        <div className="flex h-full w-full items-center justify-center">
                                          <span className="material-symbols-outlined text-4xl text-on-surface-variant/50">
                                            image
                                          </span>
                                        </div>
                                      )}
                                      <span
                                        className={`absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${statusChipCardClass(site.status)}`}
                                      >
                                        {statusLabel(site.status)}
                                      </span>
                                    </div>
                                    <div className="flex flex-1 flex-col gap-2 p-4">
                                      <p className="line-clamp-2 font-headline text-sm font-bold text-on-surface">
                                        {site.name}
                                      </p>
                                      <p className="line-clamp-1 text-xs text-on-surface-variant">
                                        {siteDisplayUrl(site)}
                                      </p>
                                      <div className="mt-auto pt-2">
                                        <span className="inline-flex rounded-full bg-secondary-container px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-on-secondary-container">
                                          {site.category}
                                        </span>
                                      </div>
                                      <p className="text-[11px] text-on-surface-variant">{formatDate(site.createdAt)}</p>
                                    </div>
                                  </button>
                                  <div className="flex items-center justify-between gap-2 border-t border-slate-200/80 px-3 py-2 dark:border-slate-700/80">
                                    <div className="flex min-w-0 flex-1 items-center gap-1 text-xs font-medium tabular-nums text-on-surface">
                                      <span
                                        className="material-symbols-outlined shrink-0 text-[15px] text-on-surface-variant/80"
                                        aria-hidden
                                      >
                                        visibility
                                      </span>
                                      <span className="truncate">{site.pageViews?.toLocaleString?.() ?? 0} views</span>
                                    </div>
                                    <button
                                      type="button"
                                      aria-label={
                                        isSiteArchived(site)
                                          ? `Remove ${site.name || 'site'} from dashboard`
                                          : `Archive ${site.name || 'site'}`
                                      }
                                      title={isSiteArchived(site) ? 'Remove from dashboard' : 'Archive'}
                                      disabled={siteRowBusy(site)}
                                      onClick={() =>
                                        isSiteArchived(site) ? openDeleteModal(site) : openArchiveModal(site)
                                      }
                                      className="group flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-transparent bg-transparent text-slate-400/70 transition-all duration-200 hover:border-red-200/70 hover:bg-red-50 hover:shadow-sm disabled:opacity-35 dark:text-slate-500/55 dark:hover:border-red-900/40 dark:hover:bg-red-950/35"
                                    >
                                      <span
                                        className="material-symbols-outlined text-[15px] opacity-45 transition-all duration-200 group-hover:scale-110 group-hover:text-[18px] group-hover:text-red-600 group-hover:opacity-100 dark:group-hover:text-red-400"
                                        aria-hidden
                                      >
                                        delete
                                      </span>
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </section>
                      )
                    )}
                  </div>
                )}
              </div>
            )}

            {recentSitesView === 'list' && (
              <div className="min-h-0 flex-1 overflow-auto">
                {loading && <p className="py-12 text-center text-sm text-on-surface-variant">Loading…</p>}
                {!loading && sites.length === 0 && (
                  <p className="px-4 py-12 text-center text-sm text-on-surface-variant md:px-8">
                    No sites yet.{' '}
                    <Link to="/generator" className="font-medium text-primary underline">
                      Create one
                    </Link>
                    .
                  </p>
                )}
                {!loading && sites.length > 0 && filteredSites.length === 0 && (
                  <p className="px-4 py-12 text-center text-sm text-on-surface-variant md:px-8">{emptyResultsMessage()}</p>
                )}
                {!loading && filteredSites.length > 0 && (
                  <ul className="divide-y divide-slate-200 dark:divide-slate-800">
                    {filteredSites.map((site) => (
                      <li key={site._id} className="flex items-stretch">
                        <button
                          type="button"
                          onClick={() => navigate(`/dashboard/sites/${site._id}`)}
                          className="flex min-w-0 flex-1 flex-col gap-3 px-4 py-4 text-left transition-colors hover:bg-surface-container-low sm:flex-row sm:items-center sm:gap-4 md:px-8"
                        >
                          <div className="flex min-w-0 flex-1 items-center gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-surface-container-high">
                              {site.thumbnailUrl ? (
                                <img alt="" className="h-full w-full object-cover" src={site.thumbnailUrl} />
                              ) : (
                                <span className="material-symbols-outlined text-on-surface-variant">image</span>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-semibold text-on-surface">{site.name}</p>
                              <p className="truncate text-xs text-on-surface-variant">{siteDisplayUrl(site)}</p>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                            <span className="rounded-full bg-secondary-container px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-on-secondary-container">
                              {site.category}
                            </span>
                            <span className="text-sm tabular-nums text-on-surface">{site.pageViews?.toLocaleString?.() ?? 0} views</span>
                            <span className="text-sm text-on-surface-variant">{formatDate(site.createdAt)}</span>
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-fixed px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-on-primary-fixed">
                              <span className="h-1 w-1 animate-pulse rounded-full bg-on-primary-fixed" />
                              {site.status === 'live' ? 'Live' : site.status}
                            </span>
                          </div>
                        </button>
                        <button
                          type="button"
                          aria-label={
                            isSiteArchived(site)
                              ? `Remove ${site.name || 'site'} from dashboard`
                              : `Archive ${site.name || 'site'}`
                          }
                          title={isSiteArchived(site) ? 'Remove from dashboard' : 'Archive'}
                          disabled={siteRowBusy(site)}
                          onClick={() =>
                            isSiteArchived(site) ? openDeleteModal(site) : openArchiveModal(site)
                          }
                          className="group flex shrink-0 items-center justify-center border-l border-slate-200 px-3 text-slate-400/70 transition-all duration-200 hover:bg-red-50 disabled:opacity-35 dark:border-slate-800 dark:hover:bg-red-950/35"
                        >
                          <span
                            className="material-symbols-outlined text-[16px] opacity-45 transition-all duration-200 group-hover:scale-110 group-hover:text-[20px] group-hover:text-red-600 group-hover:opacity-100 dark:group-hover:text-red-400"
                            aria-hidden
                          >
                            delete
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {recentSitesView === 'table' && (
              <div className="min-h-0 flex-1 overflow-auto">
                <table className="w-full min-w-[640px] border-collapse text-left">
                  <thead>
                    <tr className="bg-surface-container-low">
                      <th className="sticky top-0 z-10 bg-surface-container-low px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant md:px-8">
                        Site
                      </th>
                      <th className="sticky top-0 z-10 bg-surface-container-low px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant md:px-8">
                        Category
                      </th>
                      <th className="sticky top-0 z-10 bg-surface-container-low px-6 py-3 text-center text-[10px] font-bold uppercase tracking-widest text-on-surface-variant md:px-8">
                        Views
                      </th>
                      <th className="sticky top-0 z-10 bg-surface-container-low px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant md:px-8">
                        Created
                      </th>
                      <th className="sticky top-0 z-10 bg-surface-container-low px-6 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-on-surface-variant md:px-8">
                        Status
                      </th>
                      <th className="sticky top-0 z-10 w-14 bg-surface-container-low px-3 py-3 text-center text-[10px] font-bold uppercase tracking-widest text-on-surface-variant md:px-4">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container">
                    {loading && (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-on-surface-variant">
                          Loading…
                        </td>
                      </tr>
                    )}
                    {!loading && sites.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-on-surface-variant md:px-8">
                          No sites yet.{' '}
                          <Link to="/generator" className="font-medium text-primary underline">
                            Create one
                          </Link>
                          .
                        </td>
                      </tr>
                    )}
                    {!loading && sites.length > 0 && filteredSites.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-on-surface-variant md:px-8">
                          {emptyResultsMessage()}
                        </td>
                      </tr>
                    )}
                    {!loading &&
                      filteredSites.map((site) => (
                        <tr
                          key={site._id}
                          role="link"
                          tabIndex={0}
                          className="cursor-pointer transition-colors hover:bg-surface-container-low"
                          onClick={() => navigate(`/dashboard/sites/${site._id}`)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault()
                              navigate(`/dashboard/sites/${site._id}`)
                            }
                          }}
                        >
                          <td className="px-6 py-4 md:px-8">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-surface-container-high">
                                {site.thumbnailUrl ? (
                                  <img alt="" className="h-full w-full object-cover" src={site.thumbnailUrl} />
                                ) : (
                                  <span className="material-symbols-outlined text-on-surface-variant">image</span>
                                )}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-on-surface">{site.name}</p>
                                <p className="text-xs text-on-surface-variant">{siteDisplayUrl(site)}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 md:px-8">
                            <span className="rounded-full bg-secondary-container px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-on-secondary-container">
                              {site.category}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center md:px-8">
                            <p className="text-sm font-medium text-on-surface">{site.pageViews?.toLocaleString?.() ?? 0}</p>
                          </td>
                          <td className="px-6 py-4 md:px-8">
                            <p className="text-sm text-on-surface-variant">{formatDate(site.createdAt)}</p>
                          </td>
                          <td className="px-6 py-4 text-right md:px-8">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-fixed px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-on-primary-fixed">
                              <span className="h-1 w-1 animate-pulse rounded-full bg-on-primary-fixed" />
                              {site.status === 'live' ? 'Live' : site.status}
                            </span>
                          </td>
                          <td
                            className="px-2 py-4 text-center md:px-3"
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              aria-label={
                                isSiteArchived(site)
                                  ? `Remove ${site.name || 'site'} from dashboard`
                                  : `Archive ${site.name || 'site'}`
                              }
                              title={isSiteArchived(site) ? 'Remove from dashboard' : 'Archive'}
                              disabled={siteRowBusy(site)}
                              onClick={(e) => {
                                e.stopPropagation()
                                if (isSiteArchived(site)) openDeleteModal(site)
                                else openArchiveModal(site)
                              }}
                              className="group inline-flex h-8 w-8 items-center justify-center rounded-lg border border-transparent text-slate-400/70 transition-all duration-200 hover:border-red-200/70 hover:bg-red-50 disabled:opacity-35 dark:hover:border-red-900/40 dark:hover:bg-red-950/35"
                            >
                              <span
                                className="material-symbols-outlined text-[15px] opacity-45 transition-all duration-200 group-hover:scale-110 group-hover:text-[18px] group-hover:text-red-600 group-hover:opacity-100 dark:group-hover:text-red-400"
                                aria-hidden
                              >
                                delete
                              </span>
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </main>

      {archiveModalSite ? (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" role="presentation">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px] dark:bg-black/55"
            aria-label="Close dialog"
            disabled={!!archivingId}
            onClick={closeArchiveModal}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="archive-site-modal-title"
            className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/15 text-amber-800 dark:bg-amber-400/20 dark:text-amber-200">
              <span className="material-symbols-outlined text-[26px]" aria-hidden>
                archive
              </span>
            </div>
            <h2
              id="archive-site-modal-title"
              className="font-headline text-xl font-bold tracking-tight text-slate-900 dark:text-white"
            >
              {siteHasOrHadPublicWebPresence(archiveModalSite)
                ? 'Archive and take the site offline?'
                : 'Archive this site?'}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                &ldquo;
                {(archiveModalSite.name || 'This site').trim() || 'This site'}
                &rdquo;
              </span>{' '}
              {siteHasOrHadPublicWebPresence(archiveModalSite) ? (
                <>
                  is <span className="font-medium text-slate-800 dark:text-slate-200">Live</span> or was
                  published. If you continue, we move it to{' '}
                  <span className="font-medium text-slate-800 dark:text-slate-200">Archived</span> and pause the
                  project on Vercel so the public URL stops serving this site.
                  {sitePublicUrlHint(archiveModalSite) ? (
                    <span className="mt-2 block font-mono text-xs text-slate-500 dark:text-slate-400">
                      {sitePublicUrlHint(archiveModalSite)}
                    </span>
                  ) : null}
                </>
              ) : (
                <>
                  will move to your{' '}
                  <span className="font-medium text-slate-800 dark:text-slate-200">Archived</span> section. You
                  can still open and manage it from the dashboard filters.
                </>
              )}
            </p>
            {archiveModalError ? (
              <p className="mt-4 rounded-xl border border-red-200/80 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
                {archiveModalError}
              </p>
            ) : null}
            <div className="mt-8 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={closeArchiveModal}
                disabled={!!archivingId}
                className="rounded-full border border-slate-300 px-5 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void confirmArchiveSite()}
                disabled={!!archivingId}
                className="rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-on-primary shadow-md transition-colors hover:bg-primary-container disabled:opacity-60"
              >
                {archivingId
                  ? 'Archiving…'
                  : siteHasOrHadPublicWebPresence(archiveModalSite)
                    ? 'OK — archive and remove from internet'
                    : 'Archive site'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {deleteModalSite ? (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" role="presentation">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px] dark:bg-black/55"
            aria-label="Close dialog"
            disabled={!!softDeletingId}
            onClick={closeDeleteModal}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-site-modal-title"
            className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/12 text-red-700 dark:bg-red-500/20 dark:text-red-300">
              <span className="material-symbols-outlined text-[26px]" aria-hidden>
                delete
              </span>
            </div>
            <h2
              id="delete-site-modal-title"
              className="font-headline text-xl font-bold tracking-tight text-slate-900 dark:text-white"
            >
              {siteHasOrHadPublicWebPresence(deleteModalSite)
                ? 'Remove live site from the internet?'
                : 'Remove from dashboard?'}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                &ldquo;
                {(deleteModalSite.name || 'This site').trim() || 'This site'}
                &rdquo;
              </span>{' '}
              {siteHasOrHadPublicWebPresence(deleteModalSite) ? (
                <>
                  was published and may still be reachable on the web. If you continue, we pause the project on
                  Vercel so the live URL stops serving this site. You can restore it from the recycle bin later;
                  restore attempts to unpause the project on Vercel.
                  {sitePublicUrlHint(deleteModalSite) ? (
                    <>
                      {' '}
                      <span className="mt-2 block font-mono text-xs text-slate-500 dark:text-slate-400">
                        {sitePublicUrlHint(deleteModalSite)}
                      </span>
                    </>
                  ) : null}
                </>
              ) : (
                <>
                  will disappear from your dashboard. It stays stored on the server (soft delete) but won&apos;t
                  show in your site list anymore.
                </>
              )}
            </p>
            {deleteModalError ? (
              <p className="mt-4 rounded-xl border border-red-200/80 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
                {deleteModalError}
              </p>
            ) : null}
            <div className="mt-8 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={!!softDeletingId}
                className="rounded-full border border-slate-300 px-5 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void confirmSoftDeleteSite()}
                disabled={!!softDeletingId}
                className="rounded-full bg-red-600 px-5 py-2.5 text-sm font-bold text-white shadow-md transition-colors hover:bg-red-700 disabled:opacity-60 dark:bg-red-600 dark:hover:bg-red-500"
              >
                {softDeletingId
                  ? 'Removing…'
                  : siteHasOrHadPublicWebPresence(deleteModalSite)
                    ? 'OK — remove from internet'
                    : 'Remove from dashboard'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
