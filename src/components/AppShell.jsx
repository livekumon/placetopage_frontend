import { useEffect, useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const STORAGE_KEY = 'p2p-app-nav-expanded'
const COLLAPSED_PX = 64
const EXPANDED_PX = 256

function itemClass(active, expanded) {
  const base = expanded
    ? 'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors'
    : 'flex items-center justify-center rounded-xl p-2.5 transition-colors'
  const state = active
    ? 'bg-primary text-on-primary shadow-sm'
    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/80'
  return `${base} ${state}`
}

export default function AppShell() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const [expanded, setExpanded] = useState(() => localStorage.getItem(STORAGE_KEY) === 'true')

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, expanded ? 'true' : 'false')
  }, [expanded])

  const railPx = expanded ? EXPANDED_PX : COLLAPSED_PX
  const isAuthOnly = !user && (pathname === '/login' || pathname === '/register')
  const dashboardActive = pathname === '/dashboard' || pathname.startsWith('/dashboard/sites/')
  const recycleBinActive = pathname === '/recycle-bin'
  const generatorActive = pathname === '/generator'
  const purchaseTokensActive = pathname === '/purchase-tokens'
  const loginActive = pathname === '/login'
  const registerActive = pathname === '/register'

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <aside
        className="fixed left-0 top-0 z-[100] flex h-screen flex-col border-r border-slate-200/60 bg-slate-50 transition-[width] duration-200 ease-out dark:border-slate-800/60 dark:bg-slate-950"
        style={{ width: railPx }}
      >
        <div className={`flex shrink-0 items-center border-b border-slate-200/60 py-3 dark:border-slate-800/60 ${expanded ? 'justify-between px-3' : 'flex-col gap-2 px-2'}`}>
          <Link
            to="/"
            className={`flex min-w-0 items-center gap-2 rounded-lg p-1 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 ${expanded ? '' : 'justify-center'}`}
            title="Back to home"
            aria-label="Back to home"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary">
              <span className="material-symbols-outlined text-lg text-white" style={{ fontVariationSettings: "'FILL' 1" }}>
                magic_button
              </span>
            </div>
            {expanded && (
              <span className="truncate font-manrope text-base font-bold tracking-tighter text-slate-900 dark:text-white">
                Place to Page
              </span>
            )}
          </Link>
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200/80 text-slate-600 transition-colors hover:bg-white dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            title={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
            aria-expanded={expanded}
            aria-label={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            <span className="material-symbols-outlined text-[22px]">{expanded ? 'chevron_left' : 'chevron_right'}</span>
          </button>
        </div>

        <nav className="mt-4 flex flex-1 flex-col gap-0.5 overflow-y-auto px-2 pb-4" aria-label="App navigation">
          {isAuthOnly ? (
            <>
              <Link to="/login" title="Log in" className={itemClass(loginActive, expanded)}>
                <span className="material-symbols-outlined shrink-0 text-[22px]">login</span>
                {expanded && <span>Log in</span>}
              </Link>
              <Link to="/register" title="Sign up" className={itemClass(registerActive, expanded)}>
                <span className="material-symbols-outlined shrink-0 text-[22px]">person_add</span>
                {expanded && <span>Sign up</span>}
              </Link>
            </>
          ) : (
            user && (
              <>
                <Link to="/dashboard" title="Dashboard" className={itemClass(dashboardActive, expanded)}>
                  <span className="material-symbols-outlined shrink-0 text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    dashboard
                  </span>
                  {expanded && <span>Dashboard</span>}
                </Link>
                <Link to="/generator" title="New site" className={itemClass(generatorActive, expanded)}>
                  <span className="material-symbols-outlined shrink-0 text-[22px]">add_circle</span>
                  {expanded && <span>New site</span>}
                </Link>
                <Link to="/purchase-tokens" title="Purchase tokens" className={itemClass(purchaseTokensActive, expanded)}>
                  <span className="material-symbols-outlined shrink-0 text-[22px]">toll</span>
                  {expanded && <span>Purchase tokens</span>}
                </Link>
                <Link to="/recycle-bin" title="Recycle bin" className={itemClass(recycleBinActive, expanded)}>
                  <span className="material-symbols-outlined shrink-0 text-[22px]">delete_sweep</span>
                  {expanded && <span>Recycle bin</span>}
                </Link>
              </>
            )
          )}
        </nav>

        {user && (
          <div className="mt-auto space-y-2 border-t border-slate-200/60 px-2 py-3 dark:border-slate-800/60">
            {expanded ? (
              <div className="flex items-center gap-3 rounded-xl bg-white/90 px-3 py-2.5 dark:bg-slate-900/80">
                {user.picture ? (
                  <img src={user.picture} alt="" className="h-9 w-9 shrink-0 rounded-full border border-slate-200 object-cover dark:border-slate-700" />
                ) : (
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-container-high text-xs font-bold text-on-surface">
                    {(user.name || user.email || '?').charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-slate-900 dark:text-white">{user.name || 'Account'}</p>
                  <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">{user.email}</p>
                </div>
              </div>
            ) : (
              <div className="flex justify-center px-1">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-surface-container-high text-sm font-bold text-slate-800 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                  title={[user.name, user.email].filter(Boolean).join(' · ') || 'Account'}
                  aria-label={user.email ? `Signed in as ${user.email}` : 'Account'}
                >
                  {(user.name || user.email || '?').charAt(0).toUpperCase()}
                </div>
              </div>
            )}
            <button
              type="button"
              title="Sign out"
              onClick={() => {
                logout()
                navigate('/', { replace: true })
              }}
              className={
                expanded
                  ? 'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/80'
                  : 'flex w-full items-center justify-center rounded-xl p-2.5 text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/80'
              }
            >
              <span className="material-symbols-outlined shrink-0 text-[22px]">logout</span>
              {expanded && <span>Sign out</span>}
            </button>
          </div>
        )}
      </aside>

      <div
        className="min-h-screen transition-[padding] duration-200 ease-out"
        style={{ paddingLeft: railPx }}
      >
        <Outlet />
      </div>
    </div>
  )
}
