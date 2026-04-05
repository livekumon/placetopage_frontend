import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  loginWithEmail,
  loginWithGoogleCredential,
  registerWithEmail,
  registerWithGoogleCredential,
} from '../api/client'
import { useAuth } from '../context/AuthContext'
import { trackAuth, trackFormSubmit, trackClick } from '../utils/analytics'

// ── Small reusable field component ────────────────────────────────────────────

function Field({ id, label, type = 'text', placeholder, value, onChange, error, autoComplete, autoFocus, right }) {
  const [show, setShow] = useState(false)
  const isPassword = type === 'password'
  const inputType = isPassword ? (show ? 'text' : 'password') : type

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-on-surface">
        {label}
      </label>
      <div className={`flex items-center rounded-xl border-2 bg-white transition-colors focus-within:border-primary ${error ? 'border-red-400' : 'border-slate-200'}`}>
        <input
          id={id}
          type={inputType}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          className="min-w-0 flex-1 rounded-xl border-none bg-transparent px-4 py-3 text-sm text-on-surface placeholder:text-outline-variant focus:ring-0"
        />
        {isPassword && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShow((s) => !s)}
            className="pr-4 text-outline-variant hover:text-on-surface"
          >
            <span className="material-symbols-outlined text-xl">{show ? 'visibility_off' : 'visibility'}</span>
          </button>
        )}
        {right && !isPassword && <div className="pr-3">{right}</div>}
      </div>
      {error && <p className="mt-1.5 text-xs font-medium text-red-500">{error}</p>}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AuthPage({ mode }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { loginWithSession } = useAuth()

  const isLogin = mode === 'login'

  // ── Form state
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [fieldErrors, setFieldErrors] = useState({})
  const [globalError, setGlobalError] = useState('')
  const [busy, setBusy] = useState(false)

  // ── Google SSO state
  const buttonRef = useRef(null)
  const [scriptReady, setScriptReady] = useState(false)
  const modeRef = useRef(mode)
  modeRef.current = mode
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

  // Clear errors when switching modes
  useEffect(() => {
    setFieldErrors({})
    setGlobalError('')
    setForm({ name: '', email: '', password: '', confirm: '' })
  }, [mode])

  // ── Redirect helper
  const redirectAfterAuth = useCallback(() => {
    // If the landing page stored a pending Maps URL, always go to the generator
    // regardless of where the user navigated from — the generator consumes it.
    if (sessionStorage.getItem('pendingMapsUrl')) {
      navigate('/generator', { replace: true })
      return
    }
    const from = location.state?.from
    navigate(typeof from === 'string' && from.startsWith('/') ? from : '/dashboard', { replace: true })
  }, [location.state?.from, navigate])

  // ── Email / password submit
  async function handleSubmit(e) {
    e.preventDefault()
    setFieldErrors({})
    setGlobalError('')

    // Client-side validation
    const errs = {}
    if (!isLogin && !form.name.trim()) errs.name = 'Full name is required.'
    if (!form.email.trim()) errs.email = 'Email is required.'
    if (!form.password) errs.password = 'Password is required.'
    if (!isLogin && form.password && form.password.length < 8) errs.password = 'Password must be at least 8 characters.'
    if (!isLogin && form.password !== form.confirm) errs.confirm = 'Passwords do not match.'
    if (Object.keys(errs).length) {
      setFieldErrors(errs)
      trackFormSubmit(isLogin ? 'login_email' : 'register_email', { result: 'validation_error' })
      return
    }

    trackFormSubmit(isLogin ? 'login_email' : 'register_email', { result: 'submitted' })
    setBusy(true)
    try {
      const data = isLogin
        ? await loginWithEmail(form.email, form.password)
        : await registerWithEmail(form.name, form.email, form.password)
      loginWithSession(data.token, data.user)
      trackAuth('email', isLogin ? 'login' : 'register')
      redirectAfterAuth()
    } catch (err) {
      if (err.field) {
        setFieldErrors({ [err.field]: err.message })
      } else {
        setGlobalError(err.message || 'Something went wrong. Please try again.')
      }
    } finally {
      setBusy(false)
    }
  }

  // ── Google SSO
  const handleGoogleCredential = useCallback(
    async (response) => {
      setGlobalError('')
      setBusy(true)
      trackClick(`Google SSO — ${modeRef.current === 'register' ? 'Sign up' : 'Sign in'}`)
      try {
        const cred = response?.credential
        if (!cred) { setGlobalError('No credential received from Google.'); return }
        const data = modeRef.current === 'register'
          ? await registerWithGoogleCredential(cred)
          : await loginWithGoogleCredential(cred)
        loginWithSession(data.token, data.user)
        trackAuth('google', modeRef.current === 'register' ? 'register' : 'login')
        redirectAfterAuth()
      } catch (err) {
        setGlobalError(err.message || 'Google sign-in failed.')
      } finally {
        setBusy(false)
      }
    },
    [loginWithSession, redirectAfterAuth]
  )

  // Load Google GSI script
  useEffect(() => {
    if (!clientId) return
    const existing = document.querySelector('script[src="https://accounts.google.com/gsi/client"]')
    if (existing) { if (window.google?.accounts?.id) setScriptReady(true); return }
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => setScriptReady(true)
    document.body.appendChild(script)
  }, [clientId])

  // Render Google button
  useEffect(() => {
    if (!scriptReady || !clientId || !buttonRef.current || !window.google?.accounts?.id) return
    window.google.accounts.id.initialize({ client_id: clientId, callback: handleGoogleCredential, auto_select: false })
    buttonRef.current.innerHTML = ''
    const containerWidth = buttonRef.current.offsetWidth || 360
    window.google.accounts.id.renderButton(buttonRef.current, {
      type: 'standard', theme: 'outline', size: 'large',
      width: Math.min(360, containerWidth),
      text: isLogin ? 'signin_with' : 'signup_with', shape: 'rectangular',
    })
  }, [scriptReady, clientId, isLogin, handleGoogleCredential])

  const set = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }))
    setFieldErrors((f) => ({ ...f, [field]: '' }))
    setGlobalError('')
  }

  // ── Render
  return (
    <div className="min-h-screen bg-slate-50 font-body text-on-surface antialiased">
      <main className="flex min-h-screen items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-8 shadow-xl shadow-slate-200/60 sm:px-8 sm:py-10">

            {/* Title */}
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-on-primary shadow-lg">
                <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  {isLogin ? 'lock_open' : 'person_add'}
                </span>
              </div>
              <h1 className="font-headline text-2xl font-extrabold tracking-tight text-slate-900">
                {isLogin ? 'Sign in to your account' : 'Create your account'}
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                {isLogin
                  ? 'Welcome back! Enter your details below.'
                  : 'Start building pages from Google Maps listings.'}
              </p>
            </div>

            {/* Global error */}
            {globalError && (
              <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <span className="material-symbols-outlined mt-0.5 flex-shrink-0 text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
                <span>{globalError}</span>
              </div>
            )}

            {/* Email / password form */}
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              {!isLogin && (
                <Field
                  id="name"
                  label="Full name"
                  placeholder="Jane Smith"
                  value={form.name}
                  onChange={set('name')}
                  error={fieldErrors.name}
                  autoComplete="name"
                  autoFocus
                />
              )}

              <Field
                id="email"
                label="Email address"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={set('email')}
                error={fieldErrors.email}
                autoComplete="email"
                autoFocus={isLogin}
              />

              <Field
                id="password"
                label="Password"
                type="password"
                placeholder={isLogin ? '••••••••' : 'At least 8 characters'}
                value={form.password}
                onChange={set('password')}
                error={fieldErrors.password}
                autoComplete={isLogin ? 'current-password' : 'new-password'}
              />

              {!isLogin && (
                <Field
                  id="confirm"
                  label="Confirm password"
                  type="password"
                  placeholder="••••••••"
                  value={form.confirm}
                  onChange={set('confirm')}
                  error={fieldErrors.confirm}
                  autoComplete="new-password"
                />
              )}

              {isLogin && (
                <div className="text-right">
                  <button type="button" className="text-xs font-semibold text-primary hover:underline">
                    Forgot password?
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={busy}
                data-track-label={isLogin ? 'Auth — Sign in (email)' : 'Auth — Create account (email)'}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 font-semibold text-on-primary transition-all hover:bg-primary-container active:scale-[0.98] disabled:opacity-60"
              >
                {busy ? (
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                    {isLogin ? 'login' : 'how_to_reg'}
                  </span>
                )}
                {isLogin ? 'Sign in' : 'Create account'}
              </button>
            </form>

            {/* Divider */}
            <div className="my-6 flex items-center gap-3">
              <span className="h-px flex-1 bg-slate-200" />
              <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">or</span>
              <span className="h-px flex-1 bg-slate-200" />
            </div>

            {/* Google SSO button */}
            {clientId ? (
              <div className="flex justify-center">
                <div ref={buttonRef} className="min-h-[44px]" />
              </div>
            ) : (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700">
                Set <code className="rounded bg-amber-100 px-1">VITE_GOOGLE_CLIENT_ID</code> in{' '}
                <code className="rounded bg-amber-100 px-1">frontend/.env</code> to enable Google Sign-In.
              </div>
            )}

            {/* Switch mode */}
            <p className="mt-8 text-center text-sm text-slate-500">
              {isLogin ? (
                <>
                  Don&apos;t have an account?{' '}
                  <Link to="/register" className="font-semibold text-primary hover:underline">
                    Register for free
                  </Link>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <Link to="/login" className="font-semibold text-primary hover:underline">
                    Sign in
                  </Link>
                </>
              )}
            </p>
          </div>

          {/* Legal note */}
          <p className="mt-6 text-center text-xs text-slate-400">
            By continuing you agree to our{' '}
            <Link to="/#terms" className="hover:underline">Terms</Link>
            {' '}and{' '}
            <Link to="/#privacy" className="hover:underline">Privacy Policy</Link>.
          </p>
        </div>
      </main>
    </div>
  )
}
