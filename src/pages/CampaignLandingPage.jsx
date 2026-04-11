import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { trackEvent } from '../utils/analytics'

/**
 * Minimal, conversion-focused landing page for social traffic.
 * Route: /lp/:campaign  (e.g. /lp/linkedin-april)
 *
 * - Stores campaign slug in localStorage for attribution
 * - No header/footer — just conversion elements
 */
export default function CampaignLandingPage() {
  const { campaign } = useParams()

  useEffect(() => {
    try {
      localStorage.setItem('p2p_campaign', campaign || '')
    } catch { /* noop */ }
    trackEvent('campaign_landing_view', { campaign })
  }, [campaign])

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-4 py-12 font-body text-on-background antialiased">
      {/* Logo */}
      <Link to="/" className="mb-10 flex items-center gap-2">
        <img src="/logo.png" alt="placetopage.com" className="h-10 w-10 rounded-xl object-contain" />
        <span className="font-manrope text-xl font-bold tracking-tight text-on-surface">placetopage.com</span>
      </Link>

      {/* Headline */}
      <h1 className="mb-4 max-w-xl text-center font-headline text-3xl font-extrabold leading-[1.15] tracking-tight sm:text-4xl md:text-5xl">
        Turn your Google listing into a{' '}
        <span className="text-primary-container">live website</span> — in 60 seconds.
      </h1>
      <p className="mb-10 max-w-md text-center text-base text-on-surface-variant sm:text-lg">
        No code. No designers. Just paste a link and go live.
      </p>

      {/* How it works — 3 steps */}
      <div className="mb-12 grid w-full max-w-2xl grid-cols-1 gap-6 sm:grid-cols-3">
        {[
          {
            step: '1',
            icon: 'link',
            title: 'Paste a Google Maps link',
            desc: 'Copy the URL from your browser or the Maps share button.',
          },
          {
            step: '2',
            icon: 'magic_button',
            title: 'AI generates your site',
            desc: 'Photos, reviews, hours — everything pulled automatically.',
          },
          {
            step: '3',
            icon: 'rocket_launch',
            title: 'Your site is live',
            desc: 'Published on a custom subdomain, ready for customers.',
          },
        ].map((s) => (
          <div key={s.step} className="flex flex-col items-center gap-3 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-on-primary shadow-lg">
              <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                {s.icon}
              </span>
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Step {s.step}</p>
            <h3 className="font-headline text-base font-bold text-on-surface">{s.title}</h3>
            <p className="text-sm leading-relaxed text-on-surface-variant">{s.desc}</p>
          </div>
        ))}
      </div>

      {/* CTA */}
      <Link
        to="/register"
        data-track-label="Campaign LP — Start free"
        className="rounded-full bg-primary px-8 py-4 text-base font-bold text-on-primary shadow-lg transition-all hover:brightness-110 active:scale-[0.97] sm:text-lg"
      >
        Start free &rarr;
      </Link>

      {/* Trust signals */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-xs text-on-surface-variant sm:gap-6">
        <span className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[16px] text-emerald-600" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
          Secure checkout
        </span>
        <span className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[16px] text-amber-500" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
          2,400+ businesses
        </span>
        <span className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[16px] text-blue-600" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
          Live in 60 seconds
        </span>
      </div>
    </div>
  )
}
