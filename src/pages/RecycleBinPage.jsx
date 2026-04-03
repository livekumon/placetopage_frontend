import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getRecycleBinSites, restoreSiteFromRecycleBin } from '../api/client'
import { useAuth } from '../context/AuthContext'

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function RecycleBinPage() {
  const { user } = useAuth()
  const [sites, setSites] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [restoringId, setRestoringId] = useState(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      const list = await getRecycleBinSites()
      setSites(Array.isArray(list) ? list : [])
    } catch (e) {
      setError(e.message || 'Could not load recycle bin')
      setSites([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function handleRestore(siteId) {
    if (siteId == null) return
    setError(null)
    setRestoringId(siteId)
    try {
      await restoreSiteFromRecycleBin(siteId)
      setSites((prev) => prev.filter((s) => s._id !== siteId))
    } catch (e) {
      setError(e.message || 'Could not restore site')
    } finally {
      setRestoringId(null)
    }
  }

  return (
    <div className="flex min-h-[100dvh] flex-col bg-surface text-on-surface">
      <main className="flex min-h-0 flex-1 flex-col">
        <header className="shrink-0 border-b border-slate-200/70 bg-surface px-4 py-4 dark:border-slate-800 md:px-8 md:py-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="text-sm text-on-surface-variant">
                {user?.name ? `Hi, ${user.name}` : 'Your account'}
              </p>
              <h1 className="font-headline text-2xl font-extrabold tracking-tight text-on-surface md:text-3xl">
                Recycle bin
              </h1>
              <p className="max-w-xl text-sm text-on-surface-variant">
                Sites you removed from the dashboard appear here. Restore a site to edit and publish it again.
              </p>
            </div>
            <Link
              to="/dashboard"
              className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-full border border-slate-200/80 px-5 py-2.5 text-sm font-semibold text-on-surface transition-colors hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800 sm:self-auto"
            >
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
              Back to dashboard
            </Link>
          </div>
        </header>

        <div className="flex-1 px-4 py-6 md:px-8 md:py-8">
          {loading && (
            <p className="text-sm text-on-surface-variant">Loading…</p>
          )}
          {!loading && error && (
            <div className="rounded-xl border border-red-200/80 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
              {error}
            </div>
          )}
          {!loading && !error && sites.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-200/80 bg-surface-container-low/40 px-6 py-12 text-center dark:border-slate-700">
              <span className="material-symbols-outlined mb-3 text-4xl text-on-surface-variant/60">
                delete_outline
              </span>
              <p className="font-headline text-lg font-semibold text-on-surface">Recycle bin is empty</p>
              <p className="mt-1 text-sm text-on-surface-variant">
                Removed sites will show up here until you restore them.
              </p>
            </div>
          )}
          {!loading && sites.length > 0 && (
            <ul className="divide-y divide-slate-200/70 overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-sm dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-950">
              {sites.map((site) => {
                const id = site._id
                const busy = restoringId === id
                return (
                  <li
                    key={id}
                    className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-on-surface">{site.name || 'Untitled'}</p>
                      <p className="truncate text-sm text-on-surface-variant">
                        {site.slug ? `${site.slug}.placetopage.app` : '—'}
                      </p>
                      <p className="mt-1 text-xs text-on-surface-variant">
                        Removed {formatDate(site.deletedAt)}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleRestore(id)}
                      className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-on-primary shadow-sm transition-opacity disabled:opacity-60"
                    >
                      <span className="material-symbols-outlined text-[18px]">restore_from_trash</span>
                      {busy ? 'Restoring…' : 'Restore'}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </main>
    </div>
  )
}
