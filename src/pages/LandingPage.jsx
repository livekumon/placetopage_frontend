import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const MAPS_URL_RE =
  /^https?:\/\/(maps\.google\.|www\.google\.com\/maps|google\.com\/maps|goo\.gl\/maps|maps\.app\.goo\.gl)/i

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

  function handleGenerate(e) {
    e.preventDefault()
    setUrlError('')
    const val = mapsUrl.trim()
    if (!val) {
      setUrlError('Please paste a Google Maps link first.')
      return
    }
    const withProtocol = /^https?:\/\//i.test(val) ? val : 'https://' + val
    if (!MAPS_URL_RE.test(withProtocol)) {
      setUrlError(
        "That doesn't look like a Google Maps link. Copy the URL directly from Google Maps while a business is open."
      )
      return
    }
    sessionStorage.setItem('pendingMapsUrl', withProtocol)
    navigate(user ? '/generator' : '/register')
  }

  return (
    <div className="bg-background text-on-background font-body antialiased">
      <header className="fixed top-0 z-50 w-full border-b border-slate-100 bg-white/80 font-manrope tracking-tight shadow-sm backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-none">
        <div className="relative mx-auto flex h-16 w-full items-center justify-between px-6 md:px-12">
          <Link to="/" className="text-xl font-bold tracking-tighter text-slate-900 dark:text-white">
            Place to Page
          </Link>
          <nav className="hidden items-center gap-8 md:flex">
            <a
              className="text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              href="#features"
            >
              How it works
            </a>
            <a
              className="text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              href="#pricing"
            >
              Pricing
            </a>
            <a
              className="text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              href="#pricing"
            >
              For agencies
            </a>
          </nav>
          <div className="flex items-center gap-3 md:gap-4">
            {user ? (
              <>
                <Link
                  to="/dashboard"
                  className="hidden font-medium text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white sm:block"
                >
                  Dashboard
                </Link>
                {user.picture ? (
                  <img
                    src={user.picture}
                    alt=""
                    className="h-9 w-9 rounded-full border border-slate-200 object-cover dark:border-slate-700"
                  />
                ) : null}
                <button
                  type="button"
                  onClick={logout}
                  className="rounded-full px-4 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                >
                  Sign out
                </button>
                <Link
                  to="/generator"
                  className="rounded-full bg-primary px-5 py-2.5 font-semibold text-on-primary transition-all hover:bg-primary-container active:scale-95 md:px-6"
                >
                  Generate
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-3 py-2 font-medium text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white md:px-4"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="hidden font-medium text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white sm:block"
                >
                  Sign up
                </Link>
                <Link
                  to="/register"
                  className="rounded-full bg-primary px-5 py-2.5 font-semibold text-on-primary transition-all hover:bg-primary-container active:scale-95 md:px-6"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="pt-16">
        {/* ── Hero ── */}
        <section className="relative overflow-hidden bg-gradient-to-b from-surface-container-low to-background py-20 md:py-28">
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

          <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-6 md:grid-cols-[1fr_auto_1fr] md:gap-8 md:px-12">
            {/* ── Left image ── */}
            <div className="flex justify-center md:justify-end">
              <div className="relative w-full max-w-sm overflow-hidden rounded-2xl shadow-2xl ring-1 ring-slate-200/60">
                <img
                  src="/hero.png"
                  alt="Google Maps listing transforming into a beautiful website"
                  className="h-auto w-full object-cover"
                  style={{ transform: 'scaleX(-1)' }}
                />
                {/* fading right edge to blend into centre */}
                <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-surface-container-low to-transparent" />
              </div>
            </div>

            {/* ── Centre text ── */}
            <div className="flex flex-col items-center text-center">
              {/* badge */}
              <span className="mb-6 inline-flex items-center gap-2 rounded-full bg-secondary-container px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-on-secondary-container">
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                  magic_button
                </span>
                AI-powered · No code needed
              </span>

              <h1 className="mb-6 font-headline text-4xl font-extrabold leading-[1.1] tracking-tighter text-on-background md:text-5xl lg:text-6xl">
                Paste a Google Map link.
                <br />
                <span className="text-primary-container">Get a live website.</span>
              </h1>

              <p className="mb-8 max-w-md text-lg text-on-surface-variant md:text-xl">
                Instantly turn any Google Maps business listing into a premium, high-converting landing page — in under 60 seconds. No designers, no developers, no waiting.
              </p>

              {/* URL input */}
              <form onSubmit={handleGenerate} className="mb-1 w-full max-w-lg">
                <div className={`flex items-center rounded-full bg-white p-1.5 shadow-lg ring-1 transition-all ${urlError ? 'ring-red-400' : 'ring-slate-200'}`}>
                  <div className="flex flex-1 items-center overflow-hidden px-4">
                    <span className={`material-symbols-outlined mr-2 flex-shrink-0 ${urlError ? 'text-red-400' : 'text-outline'}`}>
                      {urlError ? 'error' : 'link'}
                    </span>
                    <input
                      className="min-w-0 flex-1 border-none bg-transparent py-2 text-sm font-medium text-on-surface placeholder:text-outline-variant focus:ring-0"
                      placeholder="Paste your Google Maps URL here…"
                      type="text"
                      value={mapsUrl}
                      onChange={(e) => { setMapsUrl(e.target.value); setUrlError('') }}
                    />
                  </div>
                  <button
                    type="submit"
                    className="flex flex-shrink-0 items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-on-primary transition-all hover:bg-primary-container active:scale-95 md:px-6"
                  >
                    <span className="hidden sm:inline">Generate</span>
                    <span className="material-symbols-outlined text-[18px]">magic_button</span>
                  </button>
                </div>
              </form>
              {urlError && (
                <p className="mb-3 w-full max-w-lg text-center text-xs font-medium text-red-500">{urlError}</p>
              )}

              <p className="mb-8 text-xs font-medium uppercase tracking-widest text-on-surface-variant">
                Restaurants · Hotels · Gyms · Salons · Attractions
              </p>

              {/* social proof */}
              <div className="flex flex-col items-center gap-4 sm:flex-row">
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
                <div className="text-left">
                  <div className="text-sm font-bold text-on-surface">1,428 sites generated this month</div>
                  <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                    Average deploy time: 54 seconds
                  </div>
                </div>
              </div>
            </div>

            {/* ── Right image ── */}
            <div className="flex justify-center md:justify-start">
              <div className="relative w-full max-w-sm overflow-hidden rounded-2xl shadow-2xl ring-1 ring-slate-200/60">
                {/* fading left edge to blend into centre */}
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
        <section className="border-y border-outline-variant/20 bg-surface-container-lowest py-14">
          <div className="mx-auto max-w-5xl px-6">
            <div className="grid grid-cols-1 gap-8 text-center sm:grid-cols-3">
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

        <section id="features" className="mx-auto mb-40 max-w-7xl scroll-mt-28 px-6">
          <div className="mb-20 text-center">
            <h2 className="mb-4 font-headline text-4xl font-extrabold">The new standard for local SEO.</h2>
            <p className="mx-auto max-w-xl text-on-surface-variant">
              Everything you need to turn searchers into customers, automated from start to finish.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="group rounded-xl border border-transparent bg-surface-container-lowest p-10 shadow-sm transition-all hover:bg-white"
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

        <section id="pricing" className="scroll-mt-28 bg-surface-container-low px-6 py-32">
          <div className="mx-auto max-w-7xl">
            <div className="mb-20 text-center">
              <h2 className="mb-4 font-headline text-4xl font-extrabold">Simple, transparent pricing.</h2>
              <p className="text-on-surface-variant">Start free, go live when you're ready. No hidden fees.</p>
            </div>
            <div className="grid grid-cols-1 items-stretch gap-8 md:grid-cols-3">

              {/* ── Free ── */}
              <div className="flex h-full flex-col rounded-2xl border border-outline-variant/10 bg-white p-10 shadow-sm">
                <span className="mb-4 self-start rounded-full bg-surface-container px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                  Free
                </span>
                <h3 className="mb-2 font-headline text-2xl font-bold">Try it out</h3>
                <div className="mb-1 text-5xl font-extrabold">$0</div>
                <div className="mb-8 text-sm text-on-surface-variant">No credit card required</div>
                <p className="mb-8 text-sm leading-relaxed text-on-surface-variant">
                  Build one website and see exactly what your page will look like — design, copy, and layout.{' '}
                  <span className="font-semibold text-on-surface">Site is not published live.</span> Perfect for experimenting before you commit.
                </p>
                <ul className="mb-10 flex-1 space-y-3">
                  {[
                    'Generate 1 website',
                    'Full design preview',
                    'Basic analytics dashboard',
                  ].map((t) => (
                    <li key={t} className="flex items-start gap-3 text-sm font-medium">
                      <span className="material-symbols-outlined mt-0.5 flex-shrink-0 text-lg text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                      {t}
                    </li>
                  ))}
                  <li className="flex items-start gap-3 text-sm text-on-surface-variant/60">
                    <span className="material-symbols-outlined mt-0.5 flex-shrink-0 text-lg">block</span>
                    Site not published publicly
                  </li>
                </ul>
                <Link
                  to="/register"
                  className="w-full rounded-full bg-surface-container-highest py-4 text-center font-bold text-on-surface transition-all hover:bg-surface-container"
                >
                  Get started free
                </Link>
              </div>

              {/* ── $5 Go Live ── */}
              <div className="relative flex h-full transform flex-col overflow-hidden rounded-2xl bg-primary p-12 text-on-primary shadow-2xl md:scale-105">
                <div className="absolute right-6 top-6 rounded-full bg-white/20 px-3 py-1 text-[10px] font-bold uppercase tracking-widest">
                  Most popular
                </div>
                <span className="mb-4 self-start rounded-full bg-white/15 px-3 py-1 text-[10px] font-bold uppercase tracking-widest">
                  Go Live
                </span>
                <h3 className="mb-2 font-headline text-2xl font-bold">Publish your page</h3>
                <div className="mb-1 text-5xl font-extrabold">$5</div>
                <div className="mb-8 text-sm text-on-primary/70">per website · one-time payment</div>
                <p className="mb-8 text-sm leading-relaxed text-on-primary/80">
                  Ready to go public? Pay once and your site is instantly published on a live URL, fully indexed and ready to bring in customers.
                </p>
                <ul className="mb-12 flex-1 space-y-3">
                  {[
                    'Everything in Free',
                    'Website published publicly',
                    'Custom subdomain (yourname.placetopage.app)',
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
                <Link
                  to="/register"
                  className="w-full rounded-full bg-white py-5 text-center text-lg font-bold text-black transition-all hover:bg-slate-100"
                >
                  Publish for $5
                </Link>
              </div>

              {/* ── Agency ── */}
              <div className="flex h-full flex-col rounded-2xl border-2 border-dashed border-outline-variant/40 bg-white p-10 shadow-sm">
                <span className="mb-4 self-start rounded-full bg-secondary-container px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-on-secondary-container">
                  Agencies
                </span>
                <h3 className="mb-2 font-headline text-2xl font-bold">Scale with us</h3>
                <div className="mb-1 text-5xl font-extrabold">Custom</div>
                <div className="mb-8 text-sm text-on-surface-variant">Bulk pricing tailored to your volume</div>
                <p className="mb-8 text-sm leading-relaxed text-on-surface-variant">
                  Managing dozens or hundreds of business clients? We offer special bulk rates so each site costs you far less. Get in touch and we'll put together a plan that works for your agency.
                </p>
                <ul className="mb-10 flex-1 space-y-3">
                  {[
                    'Volume discounts on every site',
                    'White-label dashboard',
                    'Client access & team logins',
                    'API access for automation',
                    'Priority support & SLA',
                    'Dedicated account manager',
                  ].map((t) => (
                    <li key={t} className="flex items-start gap-3 text-sm font-medium">
                      <span className="material-symbols-outlined mt-0.5 flex-shrink-0 text-lg text-on-secondary-container" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                      {t}
                    </li>
                  ))}
                </ul>
                <a
                  href="mailto:hello@placetopage.app"
                  className="w-full rounded-full bg-on-surface py-4 text-center font-bold text-surface transition-all hover:opacity-90"
                >
                  Contact us for a bulk plan
                </a>
              </div>

            </div>
          </div>
        </section>

        <section id="legal" className="scroll-mt-28 border-t border-outline-variant/20 bg-surface-container-lowest px-6 py-16">
          <div className="mx-auto max-w-3xl space-y-8 text-on-surface-variant">
            <div>
              <h2 id="terms" className="scroll-mt-28 font-headline text-xl font-bold text-on-surface">
                Terms of service
              </h2>
              <p className="mt-3 text-sm leading-relaxed">
                By using Place to Page you agree to our product terms. This is a demo application; replace this copy with your real terms before launch.
              </p>
            </div>
            <div>
              <h2 id="privacy" className="scroll-mt-28 font-headline text-xl font-bold text-on-surface">
                Privacy policy
              </h2>
              <p className="mt-3 text-sm leading-relaxed">
                We describe how we handle data from Google Maps listings and generated sites. Replace with your legal privacy policy.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer
        id="site-footer"
        className="w-full border-t border-slate-100 bg-white py-12 dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-8 px-6 md:flex-row">
          <div className="font-inter text-xs uppercase tracking-widest text-slate-400 dark:text-slate-500">
            © 2026 Place to Page. All rights reserved.
          </div>
          <nav className="flex flex-wrap justify-center gap-8" aria-label="Footer">
            <a
              className="font-inter text-xs uppercase tracking-widest text-slate-400 opacity-80 transition-opacity hover:opacity-100 dark:hover:text-white"
              href="#terms"
            >
              Terms
            </a>
            <a
              className="font-inter text-xs uppercase tracking-widest text-slate-400 opacity-80 transition-opacity hover:opacity-100 dark:hover:text-white"
              href="#privacy"
            >
              Privacy
            </a>
            <a
              className="font-inter text-xs uppercase tracking-widest text-slate-400 opacity-80 transition-opacity hover:opacity-100 dark:hover:text-white"
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              Twitter
            </a>
            <a
              className="font-inter text-xs uppercase tracking-widest text-slate-400 opacity-80 transition-opacity hover:opacity-100 dark:hover:text-white"
              href="https://www.linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              LinkedIn
            </a>
          </nav>
        </div>
      </footer>
    </div>
  )
}
