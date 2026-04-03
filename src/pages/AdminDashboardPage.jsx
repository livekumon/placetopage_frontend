import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { adminLogin, getAdminMetrics, getAdminToken, getAuthToken, setAdminToken } from '../api/client'
import { useAuth } from '../context/AuthContext'

function StatCard({ label, value, hint }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-2 font-headline text-3xl font-extrabold tabular-nums text-slate-900 dark:text-white">{value}</p>
      {hint ? <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{hint}</p> : null}
    </div>
  )
}

export default function AdminDashboardPage() {
  const { user, loading: authLoading, logout, refreshUser } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [busy, setBusy] = useState(false)
  const [pwAdminToken, setPwAdminToken] = useState(() => getAdminToken())
  const [metrics, setMetrics] = useState(null)
  const [loadError, setLoadError] = useState('')

  const canAccess = Boolean(user?.isAdmin || pwAdminToken)

  useEffect(() => {
    if (!getAuthToken()) return
    refreshUser().catch(() => {})
  }, [refreshUser])

  const loadMetrics = useCallback(async () => {
    setLoadError('')
    try {
      const m = await getAdminMetrics()
      setMetrics(m)
    } catch (e) {
      if (e.code === 'admin_auth') {
        setAdminToken(null)
        setPwAdminToken(null)
        setMetrics(null)
      }
      setLoadError(e.message || 'Failed to load metrics')
    }
  }, [])

  useEffect(() => {
    if (!canAccess) return
    loadMetrics()
  }, [canAccess, loadMetrics])

  async function handlePasswordLogin(e) {
    e.preventDefault()
    setLoginError('')
    setBusy(true)
    try {
      const data = await adminLogin(email.trim(), password)
      setAdminToken(data.token)
      setPwAdminToken(data.token)
      setPassword('')
    } catch (err) {
      setLoginError(err.message || 'Login failed')
    } finally {
      setBusy(false)
    }
  }

  function handleSignOut() {
    setAdminToken(null)
    setPwAdminToken(null)
    setMetrics(null)
    if (user) logout()
  }

  if (authLoading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-surface-container-lowest text-on-surface-variant">
        Loading…
      </div>
    )
  }

  if (!canAccess) {
    if (user && !user.isAdmin && !pwAdminToken) {
      return (
        <div className="min-h-[100dvh] bg-surface-container-lowest px-6 py-16 font-body text-on-surface">
          <div className="mx-auto max-w-md text-center">
            <h1 className="font-headline text-2xl font-extrabold">Access denied</h1>
            <p className="mt-3 text-on-surface-variant">This account does not have admin access.</p>
            <Link to="/" className="mt-8 inline-block font-medium text-primary underline-offset-2 hover:underline">
              Back to site
            </Link>
          </div>
        </div>
      )
    }

    return (
      <div className="min-h-[100dvh] bg-surface-container-lowest font-body text-on-surface">
        <div className="mx-auto flex min-h-[100dvh] max-w-md flex-col justify-center px-6 py-16">
          <div className="mb-8 text-center">
            <span
              className="material-symbols-outlined mb-3 inline-block text-4xl text-primary"
              style={{ fontVariationSettings: "'FILL' 1" }}
              aria-hidden
            >
              admin_panel_settings
            </span>
            <h1 className="font-headline text-2xl font-extrabold tracking-tight">Admin</h1>
            <p className="mt-2 text-sm text-on-surface-variant">
              Sign in with your admin Google account, or use the operator password if configured on the API.
            </p>
          </div>
          <div className="space-y-4 rounded-2xl border border-outline-variant/20 bg-surface p-6 shadow-sm">
            <p className="text-center text-sm font-semibold text-on-surface">Google (SSO)</p>
            <Link
              to="/login"
              state={{ from: '/admin' }}
              className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-slate-200 py-3.5 text-sm font-bold transition-colors hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-800"
            >
              <span className="material-symbols-outlined text-[20px]" aria-hidden>
                login
              </span>
              Continue to sign in
            </Link>
          </div>
          <div className="mt-8 space-y-4 rounded-2xl border border-outline-variant/20 bg-surface p-6 shadow-sm">
            <p className="text-center text-sm font-semibold text-on-surface">Operator password</p>
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div>
                <label htmlFor="admin-email" className="mb-1.5 block text-sm font-semibold">
                  Email
                </label>
                <input
                  id="admin-email"
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(ev) => setEmail(ev.target.value)}
                  className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-primary dark:border-slate-600 dark:bg-slate-900"
                  required
                />
              </div>
              <div>
                <label htmlFor="admin-password" className="mb-1.5 block text-sm font-semibold">
                  Password
                </label>
                <input
                  id="admin-password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(ev) => setPassword(ev.target.value)}
                  className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-primary dark:border-slate-600 dark:bg-slate-900"
                  required
                />
              </div>
              {loginError ? <p className="text-sm font-medium text-red-600 dark:text-red-400">{loginError}</p> : null}
              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-full bg-primary py-3.5 text-sm font-bold text-on-primary transition-opacity disabled:opacity-60"
              >
                {busy ? 'Signing in…' : 'Sign in with password'}
              </button>
            </form>
          </div>
          <p className="mt-8 text-center text-sm text-on-surface-variant">
            <Link to="/" className="font-medium text-primary underline-offset-2 hover:underline">
              Back to site
            </Link>
          </p>
        </div>
      </div>
    )
  }

  const u = metrics?.users
  const s = metrics?.sites
  const p = metrics?.purchases
  const l = metrics?.logins

  return (
    <div className="min-h-[100dvh] bg-surface text-on-surface">
      <header className="border-b border-slate-200/70 bg-surface px-4 py-4 dark:border-slate-800 md:px-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-headline text-xl font-extrabold tracking-tight md:text-2xl">Admin overview</h1>
            {user?.isAdmin ? (
              <p className="text-sm text-on-surface-variant">{user.email}</p>
            ) : null}
            {metrics?.generatedAt ? (
              <p className="text-sm text-on-surface-variant">
                Updated {new Date(metrics.generatedAt).toLocaleString()}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => loadMetrics()}
              className="rounded-full border border-slate-300 px-4 py-2 text-xs font-bold uppercase tracking-wider text-on-surface transition-colors hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-800"
            >
              Refresh
            </button>
            <button
              type="button"
              onClick={handleSignOut}
              className="rounded-full border border-slate-300 px-4 py-2 text-xs font-bold uppercase tracking-wider text-on-surface-variant transition-colors hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-800"
            >
              Sign out
            </button>
            <Link
              to="/"
              className="rounded-full bg-primary px-4 py-2 text-xs font-bold uppercase tracking-wider text-on-primary transition-colors hover:bg-primary-container"
            >
              Site home
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 md:px-8">
        {loadError ? (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
            {loadError}
          </div>
        ) : null}

        <section className="mb-10">
          <h2 className="mb-4 font-headline text-sm font-bold uppercase tracking-widest text-on-surface-variant">Users</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total users" value={u != null ? u.total : '—'} />
            <StatCard
              label="New (7 days)"
              value={u != null ? u.registeredLast7Days : '—'}
              hint="Accounts created in the last 7 days"
            />
            <StatCard
              label="New (30 days)"
              value={u != null ? u.registeredLast30Days : '—'}
              hint="Accounts created in the last 30 days"
            />
            <StatCard
              label="Login events (total)"
              value={l != null ? l.totalEvents : '—'}
              hint="Successful sign-ins since tracking started"
            />
          </div>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 font-headline text-sm font-bold uppercase tracking-widest text-on-surface-variant">Websites</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <StatCard label="Total sites" value={s != null ? s.total : '—'} />
            <StatCard label="Draft" value={s != null ? s.draft : '—'} />
            <StatCard label="Published (live)" value={s != null ? s.live : '—'} />
            <StatCard label="Archived" value={s != null ? s.archived : '—'} />
            <StatCard label="Created (7 days)" value={s != null ? s.createdLast7Days : '—'} />
          </div>
        </section>

        <section>
          <h2 className="mb-4 font-headline text-sm font-bold uppercase tracking-widest text-on-surface-variant">Purchases</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              label="Completed payments"
              value={p != null ? p.completedCount : '—'}
              hint="PayPal captures with status completed"
            />
            <StatCard
              label="Revenue (USD)"
              value={p != null ? `$${p.completedRevenueUsd.toFixed(2)}` : '—'}
              hint="Sum of completed payment amounts"
            />
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                By status
              </p>
              <ul className="mt-3 space-y-2 text-sm">
                {(p?.byStatus || []).map((row) => (
                  <li key={row.status} className="flex justify-between gap-4 tabular-nums">
                    <span className="text-on-surface-variant">{row.status}</span>
                    <span className="font-semibold">{row.count}</span>
                  </li>
                ))}
                {!p?.byStatus?.length ? <li className="text-on-surface-variant">—</li> : null}
              </ul>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
