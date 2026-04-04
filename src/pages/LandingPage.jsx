import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Footer from '../components/Footer'
import { isValidWebUrlInput } from '../utils/isWebUrl'

const CONTACT = {
  email: 'hello@placetopage.app',
  phone: '+1 (415) 555-0199',
  hours: 'Monday–Friday, 9:00 a.m.–6:00 p.m. PT',
  note: 'Questions about pricing, agencies, or going live? Reach out—we usually reply within one business day.',
}

function userInitialLetter(user) {
  const name = (user?.name || '').trim()
  const email = (user?.email || '').trim()
  if (name) return name[0].toUpperCase()
  if (email) return email[0].toUpperCase()
  return '?'
}

const avatars = [
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAogbVBtJT_4CrevVcXfTpe8vvtpx8a433w3dE6sVh6QHWf3ERBY_VJcMegGbjITcXZ5ykkiVzgK_Ix-Z3y2uIwwzLeR0UdAwrRwMycurNHZ0ykCNN0SBF3OniG6TVUP0gQldguyzjjixBA0PKStrSBGyGZJewpxhF-MLBkOOafYhkURwm8oeqaGNCkl5GkWJ5oDxtOJqWzlFZ8Y1lVqoGXyVhg-jtLuxmkE5lPEwcaNBAB2V1_tyGBDLohFY2DlF4hdhI1rnV0bqY',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCfb8YQbACmIjdSEV1vtMAAqsYTpO5x8pi8u_n6Zt-YFKsnal7okshQtofNk0OgJ3If70RL2ffJE6DwQvf13BkLXv3DJ4Floc_qwNjLvhDajmWluLkQcQLxKRg7x8-KZz1r6P03LthCrAKlQBNLPfHfzlY1X7b5ii170ppBRBte0vUj0SLIbFBYVnncIQo4o-4oN20EeCz51OplXqae-ZpaemTm6ZZmEBFx_qRpYsg5oz8luoSE9eYROZxMsMq_MD90jZWSYq8eTik',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCGyWZmv6yn5oGwxjmWhMo0WcqU4hgBfp2p2Z8oE2gZ4PBNb0GU5-ApqU8CK37NUjJfJ6z79XSB9-b7wCtsEbV7k1X85Bt6nS1gU_renIog_Xk2GstQvMqub6dODv_OqdCGaYhZT0w50oGIqS7f1FnvmPe76aPT7lbkkeNZgLL3yxI7uhRwpDLLS_7drrzOitxOZdOPhA6OPzAxajZd6MV7flyOyHcoBvkaZJj49CPL26BMtQ_dgwwlM7llrb_QfLlZSYp8zmqQslo',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCbMUbVSMBLGXtkX7zmnh6PMtMxHV06kWEFJtAU_KCad53RaPTT44Dz42cd7fV5_jUw0geIRVm7neQR5JvyPdCkescIVN68g1zbK7TfBtqeOngNK_RlNCUzRmadJYw-tJjMM7uCOrafXM_DAnaRkS3bDwwIxcRyVwXCVC90UPZAXSoftTBQgnm8TTXRSubcMJqKC1Nh40ZSGbUGxHfBL53eH7L0GyKZImfzQ-rBr1Yw283YeQbxCeLYSnqUuzM4Ioviw6wj4i2ouZA',
]

const features = [
  { icon: 'database', title: 'Real place data', text: 'We pull reviews, menus, photos, and hours directly from your Google Maps profile.' },
  { icon: 'palette', title: 'AI-designed every time', text: 'Our engine analyzes your brand colors and photos to create a unique, high-end design.' },
  { icon: 'bolt', title: 'Live in 60 seconds', text: 'Stop waiting weeks for web agencies. Get a professional presence before your coffee is ready.' },
  { icon: 'language', title: 'Custom domains', text: 'Connect your own .com or use our premium subdomains. SSL certificates included for free.' },
  { icon: 'insights', title: 'Built-in analytics', text: 'Track views, button clicks, and reservations without complex tracking codes.' },
  { icon: 'hub', title: 'Agency-ready', text: 'Mass-generate sites for all your clients from a single dashboard. Client logins included.' },
]

export default function LandingPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [mapsUrl, setMapsUrl] = useState('')
  const [urlError, setUrlError] = useState('')
  const [contactOpen, setContactOpen] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  useEffect(() => {
    if (!contactOpen) return
    function onKey(e) {
      if (e.key === 'Escape') setContactOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [contactOpen])

  useEffect(() => {
    if (!mobileNavOpen) return
    function onKey(e) {
      if (e.key === 'Escape') setMobileNavOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [mobileNavOpen])

  useEffect(() => {
    document.body.style.overflow = mobileNavOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileNavOpen])

  function handleGenerate(e) {
    e.preventDefault()
    setUrlError('')
    const val = mapsUrl.trim()
    if (!val) {
      setUrlError('Please paste a Google Maps link first.')
      return
    }
    const withProtocol = /^https?:\/\//i.test(val) ? val : 'https://' + val
    if (!isValidWebUrlInput(withProtocol)) {
      setUrlError('Enter a valid link (http or https). Paste a share URL or address-bar URL from Google Maps.')
      return
    }
    sessionStorage.setItem('pendingMapsUrl', withProtocol)
    navigate(user ? '/generator' : '/register')
  }

  function closeMobileNav() {
    setMobileNavOpen(false)
  }

  const headerNavLinkClass =
    'rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'

  return (
    <div className="bg-background text-on-background font-body antialiased">
      <header className="fixed top-0 z-50 w-full border-b border-slate-200/80 bg-white/90 font-manrope tracking-tight shadow-sm backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/90 dark:shadow-none">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
          <Link
            to="/"
            className="flex shrink-0 items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
          >
            <img src="/logo.png" alt="Place to Page logo" className="h-9 w-9 rounded-lg object-contain" />
            <span className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl dark:text-white">
              Place to Page
            </span>
          </Link>

          <nav
            className="hidden min-w-0 flex-1 items-center justify-center gap-0.5 md:flex lg:gap-1"
            aria-label="Primary"
          >
            <a className={headerNavLinkClass} href="#features">
              How it works
            </a>
            <a className={headerNavLinkClass} href="#pricing">
              Pricing
            </a>
            <a className={headerNavLinkClass} href="#agencies">
              For agencies
            </a>
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
            {user ? (
              <>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Link
                    to="/dashboard"
                    title="Dashboard"
                    aria-label="Dashboard"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    <span
                      className="material-symbols-outlined text-[22px]"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                      aria-hidden
                    >
                      dashboard
                    </span>
                  </Link>
                  {user.picture ? (
                    <img
                      src={user.picture}
                      alt=""
                      className="h-9 w-9 shrink-0 rounded-full border border-slate-200 object-cover dark:border-slate-700"
                    />
                  ) : (
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-on-primary shadow-sm"
                      aria-hidden
                    >
                      {userInitialLetter(user)}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={logout}
                    title="Sign out"
                    aria-label="Sign out"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                  >
                    <span className="material-symbols-outlined text-[22px]" aria-hidden>
                      logout
                    </span>
                  </button>
                </div>
                <button
                  type="button"
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 md:hidden dark:text-slate-200 dark:hover:bg-slate-800"
                  aria-expanded={mobileNavOpen}
                  aria-controls="mobile-primary-nav"
                  aria-label={mobileNavOpen ? 'Close menu' : 'Open menu'}
                  onClick={() => setMobileNavOpen((o) => !o)}
                >
                  <span className="material-symbols-outlined text-[26px]" aria-hidden>
                    {mobileNavOpen ? 'close' : 'menu'}
                  </span>
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/dashboard"
                  title="Dashboard"
                  aria-label="Dashboard"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <span
                    className="material-symbols-outlined text-[22px]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                    aria-hidden
                  >
                    dashboard
                  </span>
                </Link>
                <Link
                  to="/login"
                  className={`${headerNavLinkClass} hidden sm:inline-flex`}
                >
                  Log in
                </Link>
                <button
                  type="button"
                  onClick={() => setContactOpen(true)}
                  className={`${headerNavLinkClass} hidden md:inline-flex`}
                >
                  Sign up
                </button>
                <Link
                  to="/login"
                  className="hidden rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 dark:ring-offset-slate-900 md:inline-flex"
                >
                  Get started
                </Link>
                <Link
                  to="/login"
                  className="inline-flex rounded-full bg-primary px-4 py-2 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 dark:ring-offset-slate-900 md:hidden"
                >
                  Get started
                </Link>
                <button
                  type="button"
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 md:hidden dark:text-slate-200 dark:hover:bg-slate-800"
                  aria-expanded={mobileNavOpen}
                  aria-controls="mobile-primary-nav"
                  aria-label={mobileNavOpen ? 'Close menu' : 'Open menu'}
                  onClick={() => setMobileNavOpen((o) => !o)}
                >
                  <span className="material-symbols-outlined text-[26px]" aria-hidden>
                    {mobileNavOpen ? 'close' : 'menu'}
                  </span>
                </button>
              </>
            )}
          </div>
        </div>

        {mobileNavOpen ? (
          <>
            <button
              type="button"
              className="fixed inset-x-0 bottom-0 top-16 z-[45] bg-slate-900/35 backdrop-blur-[2px] md:hidden dark:bg-black/50"
              aria-label="Close menu"
              onClick={closeMobileNav}
            />
            <div
              id="mobile-primary-nav"
              className="relative z-50 max-h-[min(70vh,calc(100dvh-4rem))] overflow-y-auto border-t border-slate-200/80 bg-white/95 px-4 py-4 shadow-lg backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/95 md:hidden"
              role="dialog"
              aria-modal="true"
              aria-label="Site menu"
            >
            <nav className="mx-auto flex max-w-7xl flex-col gap-0.5" aria-label="Primary mobile">
              <a
                className={headerNavLinkClass}
                href="#features"
                onClick={closeMobileNav}
              >
                How it works
              </a>
              <a
                className={headerNavLinkClass}
                href="#pricing"
                onClick={closeMobileNav}
              >
                Pricing
              </a>
              <a
                className={headerNavLinkClass}
                href="#agencies"
                onClick={closeMobileNav}
              >
                For agencies
              </a>
              {user && (
                <>
                  <hr className="my-2 border-slate-200 dark:border-slate-700" />
                  <Link className={headerNavLinkClass} to="/dashboard" onClick={closeMobileNav}>
                    Dashboard
                  </Link>
                </>
              )}
              {!user && (
                <>
                  <hr className="my-2 border-slate-200 dark:border-slate-700" />
                  <Link className={headerNavLinkClass} to="/dashboard" onClick={closeMobileNav}>
                    Dashboard
                  </Link>
                  <Link className={headerNavLinkClass} to="/login" onClick={closeMobileNav}>
                    Log in
                  </Link>
                  <button
                    type="button"
                    className={`${headerNavLinkClass} w-full text-left`}
                    onClick={() => {
                      closeMobileNav()
                      setContactOpen(true)
                    }}
                  >
                    Sign up
                  </button>
                </>
              )}
            </nav>
            </div>
          </>
        ) : null}
      </header>

      <main className="pt-16">
        {/* ── Hero ── */}
        <section className="relative overflow-hidden bg-gradient-to-b from-surface-container-low to-background py-16 md:py-28">
          {/* subtle grid texture */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                'linear-gradient(#131b2e 1px, transparent 1px), linear-gradient(to right, #131b2e 1px, transparent 1px)',
              backgroundSize: '48px 48px',
            }}
          />

          <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-4 sm:px-6 md:grid-cols-[1fr_auto_1fr] md:gap-8 md:px-12">
            {/* ── Left image — hidden on mobile ── */}
            <div className="hidden md:flex md:justify-end">
              <div className="relative w-full max-w-sm overflow-hidden rounded-2xl shadow-2xl ring-1 ring-slate-200/60">
                <img
                  src="/hero.png"
                  alt="Google Maps listing transforming into a beautiful website"
                  className="h-auto w-full object-cover"
                  style={{ transform: 'scaleX(-1)' }}
                />
                <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-surface-container-low to-transparent" />
              </div>
            </div>

            {/* ── Centre text ── */}
            <div className="flex flex-col items-center text-center">
              {/* badge */}
              <span className="mb-5 inline-flex items-center gap-2 rounded-full bg-secondary-container px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-on-secondary-container">
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                  magic_button
                </span>
                AI-powered · No code needed
              </span>

              <h1 className="mb-5 font-headline text-3xl font-extrabold leading-[1.1] tracking-tighter text-on-background sm:text-4xl md:text-5xl lg:text-6xl">
                Paste a Google Map link.
                <br />
                <span className="text-primary-container">Get a live website.</span>
              </h1>

              <p className="mb-7 max-w-md text-base text-on-surface-variant sm:text-lg md:text-xl">
                Instantly turn any Google Maps business listing into a premium, high-converting landing page — in under 60 seconds. No designers, no developers, no waiting.
              </p>

              {/* URL input */}
              <form onSubmit={handleGenerate} className="mb-1 w-full max-w-lg">
                <div className={`flex items-center rounded-full bg-white p-1.5 shadow-lg ring-1 transition-all ${urlError ? 'ring-red-400' : 'ring-slate-200'}`}>
                  <div className="flex flex-1 items-center overflow-hidden px-3 sm:px-4">
                    <span className={`material-symbols-outlined mr-2 flex-shrink-0 text-[20px] ${urlError ? 'text-red-400' : 'text-outline'}`}>
                      {urlError ? 'error' : 'link'}
                    </span>
                    <input
                      className="min-w-0 flex-1 border-none bg-transparent py-2 text-sm font-medium text-on-surface placeholder:text-outline-variant focus:ring-0"
                      placeholder="Paste your Google Maps URL…"
                      type="text"
                      value={mapsUrl}
                      onChange={(e) => { setMapsUrl(e.target.value); setUrlError('') }}
                    />
                  </div>
                  <button
                    type="submit"
                    className="flex flex-shrink-0 items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-bold text-on-primary transition-all hover:bg-primary-container active:scale-95 sm:px-5 md:px-6"
                  >
                    <span className="hidden sm:inline">Generate</span>
                    <span className="material-symbols-outlined text-[18px]">magic_button</span>
                  </button>
                </div>
              </form>
              {urlError && (
                <p className="mb-3 w-full max-w-lg text-center text-xs font-medium text-red-500">{urlError}</p>
              )}

              <p className="mb-4 text-xs font-medium uppercase tracking-widest text-on-surface-variant">
                Restaurants · Hotels · Gyms · Salons · Attractions
              </p>

              <button
                type="button"
                onClick={() => setContactOpen(true)}
                className="mb-7 rounded-full border-2 border-primary/30 bg-transparent px-6 py-2.5 font-headline text-sm font-bold text-primary transition-all hover:border-primary hover:bg-primary/5 active:scale-[0.98]"
              >
                Start a journey
              </button>

              {/* social proof */}
              <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-4">
                <div className="flex -space-x-2.5">
                  {avatars.map((src, i) => (
                    <img
                      key={i}
                      alt=""
                      className="h-9 w-9 rounded-full border-2 border-white shadow-sm"
                      src={src}
                    />
                  ))}
                </div>
                <div className="text-center sm:text-left">
                  <div className="text-sm font-bold text-on-surface">1,428 sites generated this month</div>
                  <div className="flex items-center justify-center gap-2 text-xs text-on-surface-variant sm:justify-start">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                    Average deploy time: 54 seconds
                  </div>
                </div>
              </div>
            </div>

            {/* ── Right image — hidden on mobile ── */}
            <div className="hidden md:flex md:justify-start">
              <div className="relative w-full max-w-sm overflow-hidden rounded-2xl shadow-2xl ring-1 ring-slate-200/60">
                <div className="absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-surface-container-low to-transparent" />
                <img
                  src="/hero.png"
                  alt="A beautiful business website generated from a Maps listing"
                  className="h-auto w-full object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ── How it works strip ── */}
        <section className="border-y border-outline-variant/20 bg-surface-container-lowest py-12 md:py-14">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <div className="grid grid-cols-1 gap-10 text-center sm:grid-cols-3 sm:gap-8">
              {[
                { icon: 'link', step: '1', title: 'Paste a Maps link', desc: 'Copy any Google Maps business URL and drop it in the input above.' },
                { icon: 'magic_button', step: '2', title: 'AI builds your page', desc: 'Our engine pulls your data, picks a design, and writes the copy.' },
                { icon: 'rocket_launch', step: '3', title: 'Go live instantly', desc: 'Your site is published on a custom subdomain in under 60 seconds.' },
              ].map((s) => (
                <div key={s.step} className="flex flex-col items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-on-primary shadow-lg">
                    <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                      {s.icon}
                    </span>
                  </div>
                  <div>
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                      Step {s.step}
                    </p>
                    <h3 className="mb-2 font-headline text-lg font-bold text-on-surface">{s.title}</h3>
                    <p className="text-sm leading-relaxed text-on-surface-variant">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Inside the editor ── */}
        <section className="relative overflow-hidden bg-slate-950 py-16 md:py-32">
          {/* subtle dot grid */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
              backgroundSize: '32px 32px',
            }}
          />
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
            {/* heading */}
            <div className="mb-10 text-center md:mb-16">
              <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-white/70">
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                  preview
                </span>
                Inside the dashboard
              </span>
              <h2 className="mt-4 font-headline text-3xl font-extrabold tracking-tight text-white sm:text-4xl md:text-5xl">
                You&apos;re always in control.
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-base text-slate-400 sm:text-lg">
                A clean, intuitive editor lets you tweak every word, swap the theme, and see your live website update in real time — no code, no guesswork.
              </p>
            </div>

            {/* screenshot in a browser-chrome frame */}
            <div className="mx-auto max-w-5xl">
              <div className="overflow-hidden rounded-2xl shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_32px_80px_-12px_rgba(0,0,0,0.9)]">
                {/* fake browser bar */}
                <div className="flex items-center gap-2 bg-slate-800 px-4 py-3">
                  <span className="h-3 w-3 rounded-full bg-red-500/80" />
                  <span className="h-3 w-3 rounded-full bg-amber-400/80" />
                  <span className="h-3 w-3 rounded-full bg-emerald-500/80" />
                  <div className="ml-3 flex-1 rounded-md bg-slate-700 px-3 py-1 text-xs text-slate-400 font-mono truncate">
                    app.placetopage.com/dashboard/sites/…
                  </div>
                </div>
                <img
                  src="/editor-preview.png"
                  alt="Place to Page site editor — settings panel on the left with a live website preview on the right"
                  className="block w-full"
                />
              </div>
            </div>

            {/* 3 callouts below the screenshot */}
            <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-3">
              {[
                {
                  icon: 'tune',
                  title: 'Edit anything instantly',
                  desc: 'Site name, theme, subdomain, photos, category — change it all and hit Save.',
                },
                {
                  icon: 'devices',
                  title: 'Live preview on every device',
                  desc: 'Toggle between Desktop and iPhone views before you push any change live.',
                },
                {
                  icon: 'rocket_launch',
                  title: 'One-click publish',
                  desc: 'When you\'re happy, hit Publish. Your site goes live globally in seconds.',
                },
              ].map((c) => (
                <div key={c.title} className="flex flex-col items-center gap-3 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-white">
                    <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                      {c.icon}
                    </span>
                  </div>
                  <h3 className="font-headline text-base font-bold text-white">{c.title}</h3>
                  <p className="text-sm leading-relaxed text-slate-400">{c.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="features" className="mx-auto mb-20 max-w-7xl scroll-mt-28 px-4 pt-16 sm:px-6 md:mb-40 md:pt-24">
          <div className="mb-12 text-center md:mb-20">
            <h2 className="mb-4 font-headline text-3xl font-extrabold sm:text-4xl">The new standard for local SEO.</h2>
            <p className="mx-auto max-w-xl text-on-surface-variant">
              Everything you need to turn searchers into customers, automated from start to finish.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 md:gap-8">
            {features.map((f) => (
              <div
                key={f.title}
                className="group rounded-xl border border-transparent bg-surface-container-lowest p-6 shadow-sm transition-all hover:bg-white md:p-10"
              >
                <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-lg bg-primary-container text-white transition-transform group-hover:scale-110">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                    {f.icon}
                  </span>
                </div>
                <h3 className="mb-4 font-headline text-xl font-bold">{f.title}</h3>
                <p className="leading-relaxed text-on-surface-variant">{f.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="pricing" className="scroll-mt-28 bg-surface-container-low px-4 py-20 sm:px-6 md:py-32">
          <div className="mx-auto max-w-7xl">
            <div className="mb-12 text-center md:mb-20">
              <h2 className="mb-4 font-headline text-3xl font-extrabold sm:text-4xl">Simple, transparent pricing.</h2>
              <p className="text-on-surface-variant">Start free, go live when you're ready. No hidden fees.</p>
            </div>
            <div className="grid grid-cols-1 items-stretch gap-6 md:grid-cols-3 md:gap-8">

              {/* ── Free ── */}
              <div className="flex h-full flex-col rounded-2xl border border-outline-variant/10 bg-white p-10 shadow-sm">
                <span className="mb-4 self-start rounded-full bg-surface-container px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                  Free
                </span>
                <h3 className="mb-2 font-headline text-2xl font-bold">Get started free</h3>
                <div className="mb-1 text-5xl font-extrabold">$0</div>
                <div className="mb-8 text-sm text-on-surface-variant">No credit card required</div>
                <p className="mb-8 text-sm leading-relaxed text-on-surface-variant">
                  Sign up and instantly get{' '}
                  <span className="font-semibold text-on-surface">1 free publishing credit</span> —
                  generate your website and publish it live with no payment needed. Buy more credits whenever you're ready to grow.
                </p>
                <ul className="mb-10 flex-1 space-y-3">
                  {[
                    '1 free website publish included',
                    'AI-generated design & copy',
                    'Full live preview before publishing',
                    'Custom subdomain on placetopage.com',
                    'Basic analytics dashboard',
                  ].map((t) => (
                    <li key={t} className="flex items-start gap-3 text-sm font-medium">
                      <span className="material-symbols-outlined mt-0.5 flex-shrink-0 text-lg text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                      {t}
                    </li>
                  ))}
                </ul>
                <a
                  href="/login"
                  className="w-full rounded-full bg-surface-container-highest py-4 text-center font-bold text-on-surface transition-all hover:bg-surface-container block"
                >
                  Get started free
                </a>
              </div>

              {/* ── $5 per site (Starter) ── */}
              <div className="relative flex h-full flex-col overflow-hidden rounded-2xl bg-primary p-8 text-on-primary shadow-2xl sm:p-12 md:scale-105">
                <div className="absolute right-6 top-6 rounded-full bg-white/20 px-3 py-1 text-[10px] font-bold uppercase tracking-widest">
                  Most popular
                </div>
                <span className="mb-4 self-start rounded-full bg-white/15 px-3 py-1 text-[10px] font-bold uppercase tracking-widest">
                  Starter
                </span>
                <h3 className="mb-2 font-headline text-2xl font-bold">Buy more websites</h3>
                <div className="mb-1 text-5xl font-extrabold">$5</div>
                <div className="mb-8 text-sm text-on-primary/70">per website · one-time payment</div>
                <p className="mb-8 text-sm leading-relaxed text-on-primary/80">
                  Publish your first site for just $5 — pay once and it's live instantly, fully indexed and ready to bring in customers.
                </p>
                <ul className="mb-12 flex-1 space-y-3">
                  {[
                    'One additional website credit',
                    'Published on a live URL instantly',
                    'Custom subdomain (yourname.placetopage.com)',
                    'SEO-optimised page',
                    'Real-time analytics',
                    'Unlimited future updates',
                  ].map((t) => (
                    <li key={t} className="flex items-start gap-3 text-sm font-medium">
                      <span className="material-symbols-outlined mt-0.5 flex-shrink-0 text-lg text-white" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                      {t}
                    </li>
                  ))}
                </ul>
                <a
                  href="/login"
                  className="w-full rounded-full bg-white py-5 text-center text-lg font-bold text-black transition-all hover:bg-slate-100 block"
                >
                  Buy for $5
                </a>
              </div>

              {/* ── Bulk Credits ── */}
              <div
                id="agencies"
                className="scroll-mt-28 flex h-full flex-col rounded-2xl border-2 border-outline-variant/30 bg-white p-10 shadow-sm"
              >
                <span className="mb-4 self-start rounded-full bg-secondary-container px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-on-secondary-container">
                  Bulk credits
                </span>
                <h3 className="mb-2 font-headline text-2xl font-bold">Buy more, save more</h3>
                <div className="mb-1 text-2xl font-extrabold text-primary">From $2.50 / site</div>
                <div className="mb-6 text-sm text-on-surface-variant">One-time purchase · credits never expire</div>

                {/* Tiered price rows — mirrors the Purchase Websites page exactly */}
                <div className="mb-8 flex-1 divide-y divide-outline-variant/20 overflow-hidden rounded-xl border border-outline-variant/20">
                  {[
                    { sites: 5,  price: 20,  per: '4.00', label: 'Builder', save: '20%', popular: false },
                    { sites: 10, price: 35,  per: '3.50', label: 'Growth',  save: '30%', popular: true  },
                    { sites: 20, price: 60,  per: '3.00', label: 'Studio',  save: '40%', popular: false },
                    { sites: 40, price: 100, per: '2.50', label: 'Agency',  save: '50%', popular: false },
                  ].map(({ sites, price, per, label, save, popular }) => (
                    <div key={price} className={`flex items-center justify-between gap-3 px-4 py-3.5 transition-colors hover:bg-surface-container-low ${popular ? 'bg-primary/5' : 'bg-surface-container-lowest'}`}>
                      <div className="min-w-0">
                        <p className="flex items-center gap-1.5 text-sm font-bold text-on-surface">
                          {label}
                          {popular && (
                            <span className="rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
                              Popular
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-on-surface-variant">{sites} websites · ${per}/site</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                          Save {save}
                        </span>
                        <span className="text-xl font-extrabold text-on-surface">${price}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <ul className="mb-8 space-y-3">
                  {[
                    'Everything in Go Live',
                    'Credits stack with existing balance',
                    'Use across multiple sites',
                  ].map((t) => (
                    <li key={t} className="flex items-start gap-3 text-sm font-medium">
                      <span className="material-symbols-outlined mt-0.5 flex-shrink-0 text-lg text-on-secondary-container" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                      {t}
                    </li>
                  ))}
                </ul>
                <a
                  href="/login"
                  className="w-full rounded-full bg-on-surface py-4 text-center font-bold text-surface transition-all hover:opacity-90 block"
                >
                  Buy credits
                </a>
              </div>

            </div>
          </div>
        </section>

      </main>


      {contactOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" role="presentation">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]"
            aria-label="Close contact dialog"
            onClick={() => setContactOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="contact-modal-title"
            className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary dark:bg-primary/25">
              <span className="material-symbols-outlined text-[26px]" aria-hidden>
                contact_mail
              </span>
            </div>
            <h2
              id="contact-modal-title"
              className="font-headline text-xl font-bold tracking-tight text-slate-900 dark:text-white"
            >
              Contact us
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{CONTACT.note}</p>
            <ul className="mt-6 space-y-4 text-sm">
              <li className="flex gap-3">
                <span className="material-symbols-outlined mt-0.5 shrink-0 text-slate-400" aria-hidden>
                  mail
                </span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Email</p>
                  <a
                    href={`mailto:${CONTACT.email}`}
                    className="font-semibold text-primary hover:underline"
                  >
                    {CONTACT.email}
                  </a>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="material-symbols-outlined mt-0.5 shrink-0 text-slate-400" aria-hidden>
                  call
                </span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Phone</p>
                  <a
                    href={`tel:${CONTACT.phone.replace(/[^+\d]/g, '')}`}
                    className="font-semibold text-slate-900 hover:underline dark:text-white"
                  >
                    {CONTACT.phone}
                  </a>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="material-symbols-outlined mt-0.5 shrink-0 text-slate-400" aria-hidden>
                  schedule
                </span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Hours</p>
                  <p className="font-medium text-slate-800 dark:text-slate-200">{CONTACT.hours}</p>
                </div>
              </li>
            </ul>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-end">
              <button
                type="button"
                onClick={() => setContactOpen(false)}
                className="order-2 rounded-full border-2 border-slate-200 px-5 py-2.5 font-headline text-sm font-bold text-slate-800 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800 sm:order-1"
              >
                Close
              </button>
              <Link
                to="/register"
                onClick={() => setContactOpen(false)}
                className="order-1 inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-center font-headline text-sm font-bold text-on-primary shadow-md transition-colors hover:bg-primary-container sm:order-2"
              >
                Create free account
              </Link>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </div>
  )
}
