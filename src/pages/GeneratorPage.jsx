import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createSite, enrichPlace, lookupPlace } from '../api/client'
import { trimPhotoUrl } from '../utils/photoUrl'
import { isValidWebUrlInput } from '../utils/isWebUrl'
import { trackFormSubmit, trackSiteGenerate, trackSiteGenerated, trackEvent } from '../utils/analytics'

function formatTypes(types = []) {
  const skip = new Set(['point_of_interest', 'establishment', 'food', 'store'])
  return types
    .filter((t) => !skip.has(t))
    .slice(0, 3)
    .map((t) => t.replace(/_/g, ' '))
}

// ── Google Maps pin SVG (matches Maps brand look) ─────────────────────────────
function MapPin({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
    </svg>
  )
}

// ── Animated progress row used in enriching / generating steps ────────────────
function ProgressRow({ label, sub, state }) {
  // state: 'done' | 'active' | 'pending'
  return (
    <div className={`flex items-start gap-4 transition-all duration-500 ${state === 'pending' ? 'opacity-30' : 'opacity-100'}`}>
      <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center">
        {state === 'done' && (
          <span className="material-symbols-outlined text-[20px] text-emerald-500" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
        )}
        {state === 'active' && (
          <span className="flex h-2.5 w-2.5 animate-pulse rounded-full bg-primary" />
        )}
        {state === 'pending' && (
          <span className="material-symbols-outlined text-[20px] text-slate-300">radio_button_unchecked</span>
        )}
      </div>
      <div>
        <p className={`text-sm font-semibold leading-tight ${state === 'active' ? 'text-primary' : state === 'done' ? 'text-slate-800' : 'text-slate-400'}`}>
          {label}
        </p>
        <p className="mt-0.5 text-xs text-slate-400">{sub}</p>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function GeneratorPage() {
  const navigate = useNavigate()

  const [step, setStep] = useState('input')
  const [mapsUrl, setMapsUrl] = useState('')
  const [urlError, setUrlError] = useState('')
  const [lookupError, setLookupError] = useState('')
  const [genError, setGenError] = useState(null)
  const [busy, setBusy] = useState(false)
  const [enrichStage, setEnrichStage] = useState(0)

  const inputRef = useRef(null)

  // Pick up URL from sessionStorage (set by landing page)
  useEffect(() => {
    const stored = sessionStorage.getItem('pendingMapsUrl')
    if (stored) {
      sessionStorage.removeItem('pendingMapsUrl')
      setMapsUrl(stored)
      triggerLookup(stored)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const triggerLookup = useCallback(async (url) => {
    setLookupError('')
    setGenError(null)
    setEnrichStage(0)
    setBusy(true)
    setStep('lookup')
    trackSiteGenerate(url)
    try {
      const result = await lookupPlace(url)
      trackEvent('site_lookup_success', { place_name: result.name, place_id: result.placeId })
      setStep('enriching')
      setEnrichStage(1)
      const stageTimer = setInterval(() => setEnrichStage((s) => Math.min(s + 1, 3)), 1200)
      let ai = null
      try {
        ai = await enrichPlace(result)
      } catch { /* AI optional */ } finally {
        clearInterval(stageTimer)
        setEnrichStage(3)
      }
      const prefill = {}
      for (const f of result.missingFields ?? []) prefill[f.id] = ai?.[f.id] ?? ''
      const defaultHero = trimPhotoUrl(result.photoUrl || result.photos?.[0] || '')
      const listing = [...new Set([defaultHero, ...(result.photos || []).filter(Boolean)].filter(Boolean))]
      setStep('generating')
      try {
        const heroUrl = trimPhotoUrl(defaultHero || '')
        const aboutUrl = trimPhotoUrl(listing[1] || '') || trimPhotoUrl(listing[0] || '') || heroUrl
        const site = await createSite({
          name: result.name,
          mapsUrl: result.mapsUrl,
          category: formatTypes(result.types)[0] || result.types[0] || 'Business',
          theme: 'light',
          thumbnailUrl: heroUrl,
          placeData: {
            placeId: result.placeId,
            address: result.address,
            phone: prefill.phone || result.phone,
            website: prefill.website || result.website,
            description: prefill.description || ai?.description || result.description,
            tagline: prefill.tagline || ai?.tagline,
            heroHeadline: ai?.heroHeadline,
            ctaText: ai?.ctaText,
            seoDescription: ai?.seoDescription,
            highlights: ai?.highlights,
            rating: result.rating,
            reviewCount: result.reviewCount,
            openingHours: result.openingHours,
            reviews: result.reviews,
            photos: result.photos,
            photoUrl: heroUrl,
            aboutPhotoUrl: aboutUrl,
            suggestedSubdomainSlug: ai?.suggestedCustomSubdomain || '',
            subdomainSuggestionPhrase: ai?.subdomainSuggestionPhrase || '',
          },
        })
        trackEvent('site_created', { site_id: site._id, site_name: site.name, place_name: result.name })
        trackSiteGenerated(1)
        navigate(`/dashboard/sites/${site._id}`, { replace: true })
      } catch (err) {
        trackEvent('site_create_error', { error: err.message })
        setGenError(err.message || 'Failed to create site')
        setStep('input')
      }
    } catch (e) {
      trackEvent('site_lookup_error', { error: e.message })
      setLookupError(e.message || 'Failed to look up this place.')
      setStep('input')
    } finally {
      setBusy(false)
    }
  }, [navigate])

  function handleUrlSubmit(e) {
    e.preventDefault()
    setUrlError('')
    setGenError(null)
    const val = mapsUrl.trim()
    if (!val) {
      setUrlError('Please paste a Google Maps link.')
      trackFormSubmit('generator_url', { result: 'validation_error', reason: 'empty_url' })
      return
    }
    const withProtocol = /^https?:\/\//i.test(val) ? val : 'https://' + val
    if (!isValidWebUrlInput(withProtocol)) {
      setUrlError('Enter a valid link (http or https). Paste a share URL or address-bar URL from Google Maps.')
      trackFormSubmit('generator_url', { result: 'validation_error', reason: 'invalid_url' })
      return
    }
    trackFormSubmit('generator_url', { result: 'submitted' })
    setMapsUrl(withProtocol)
    triggerLookup(withProtocol)
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-[calc(100dvh-64px)] bg-white font-body text-slate-900 antialiased">

      {/* ══════════════════════════════════════════════════════════════════════
          INPUT STEP
      ══════════════════════════════════════════════════════════════════════ */}
      {step === 'input' && (
        <div className="relative flex min-h-[calc(100dvh-64px)] flex-col items-center justify-center px-4 py-14">

          {/* Ambient background blobs */}
          <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute left-1/2 top-0 h-[480px] w-[680px] -translate-x-1/2 -translate-y-1/4 rounded-full bg-primary/6 blur-3xl" />
            <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-blue-100/50 blur-3xl" />
            <div className="absolute bottom-0 left-0 h-48 w-48 rounded-full bg-violet-100/40 blur-3xl" />
          </div>

          <div className="relative w-full max-w-2xl">

            {/* Badge */}
            <div className="mb-6 flex justify-center">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/8 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-primary">
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                AI-powered website builder
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-center font-headline text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl md:text-5xl">
              Turn any{' '}
              <span className="relative inline-block">
                <span className="relative z-10 text-primary">Google Maps</span>
                <span
                  aria-hidden
                  className="absolute inset-x-0 bottom-1 z-0 h-3 rounded-full bg-primary/12"
                />
              </span>{' '}
              listing<br className="hidden sm:block" /> into a live website
            </h1>
            <p className="mx-auto mt-4 max-w-lg text-center text-base text-slate-500 sm:text-lg">
              Paste your business link below. We fetch your details, our AI writes the copy, and your website is ready to publish — in under a minute.
            </p>

            {/* Error banners */}
            {(lookupError || genError) && (
              <div className="mt-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm text-red-700">
                <span className="material-symbols-outlined mt-0.5 shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
                <span>{lookupError || genError}</span>
              </div>
            )}

            {/* ── URL input card ── */}
            <form onSubmit={handleUrlSubmit} className="mt-8">
              <div
                className={`flex flex-col gap-2 rounded-2xl border-2 bg-white p-2 shadow-xl shadow-slate-200/70 transition-all duration-200 focus-within:border-primary focus-within:shadow-primary/10 sm:flex-row sm:items-center ${urlError ? 'border-red-400' : 'border-slate-200'}`}
              >
                {/* Input row */}
                <div className="flex flex-1 items-center gap-2.5 px-3 py-1">
                  <MapPin className="h-5 w-5 shrink-0 text-slate-400" />
                  <input
                    ref={inputRef}
                    autoFocus
                    className="min-w-0 flex-1 border-none bg-transparent py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:ring-0 sm:text-base"
                    placeholder="Paste your Google Maps link here…"
                    type="text"
                    value={mapsUrl}
                    onChange={(e) => { setMapsUrl(e.target.value); setUrlError('') }}
                  />
                  {mapsUrl && (
                    <button
                      type="button"
                      onClick={() => { setMapsUrl(''); setUrlError(''); inputRef.current?.focus() }}
                      className="shrink-0 rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                      aria-label="Clear"
                    >
                      <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                  )}
                </div>

                {/* Generate button — full-width on mobile, inline on sm+ */}
                <button
                  type="submit"
                  disabled={busy}
                  data-track-label="Generator — Generate website"
                  className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 font-headline text-base font-bold text-on-primary shadow-md shadow-primary/20 transition-all hover:brightness-110 active:scale-[0.97] disabled:opacity-60 sm:py-3"
                >
                  <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                  Generate website
                </button>
              </div>

              {urlError && (
                <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-red-600">
                  <span className="material-symbols-outlined text-[15px]" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
                  {urlError}
                </p>
              )}
            </form>

            {/* Accepted format chips */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <span className="text-[11px] font-medium text-slate-400">Works with:</span>
              {['maps.app.goo.gl', 'share.google', 'goo.gl/maps', 'google.com/maps', 'g.co'].map((fmt) => (
                <span
                  key={fmt}
                  className="rounded-full bg-slate-100 px-2.5 py-0.5 font-mono text-[11px] text-slate-500"
                >
                  {fmt}
                </span>
              ))}
            </div>

            {/* ── How it works — 3 cards ── */}
            <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {[
                {
                  icon: 'map',
                  num: '01',
                  bg: 'bg-blue-50',
                  iconColor: 'text-blue-600',
                  title: 'Fetch your data',
                  desc: 'Name, address, photos, reviews and opening hours — pulled straight from Google Maps.',
                },
                {
                  icon: 'auto_awesome',
                  num: '02',
                  bg: 'bg-violet-50',
                  iconColor: 'text-violet-600',
                  title: 'AI writes the copy',
                  desc: 'Claude AI crafts your headline, tagline, description, and page content in seconds.',
                },
                {
                  icon: 'rocket_launch',
                  num: '03',
                  bg: 'bg-emerald-50',
                  iconColor: 'text-emerald-600',
                  title: 'Publish live',
                  desc: 'Tweak anything in the editor, then publish your site live on your own subdomain.',
                },
              ].map(({ icon, num, bg, iconColor, title, desc }) => (
                <div
                  key={num}
                  className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="mb-3 flex items-center gap-3">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${bg}`}>
                      <span
                        className={`material-symbols-outlined text-xl ${iconColor}`}
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        {icon}
                      </span>
                    </div>
                    <span className="font-mono text-xs font-bold text-slate-300">{num}</span>
                  </div>
                  <p className="mb-1 font-semibold text-slate-800">{title}</p>
                  <p className="text-xs leading-relaxed text-slate-500">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          PROCESSING STEPS (lookup / enriching / generating)
      ══════════════════════════════════════════════════════════════════════ */}
      {step !== 'input' && (
        <div className="flex min-h-[calc(100dvh-64px)] flex-col items-center justify-center px-4 py-16">
          <div className="w-full max-w-sm">

            {/* ── Lookup ── */}
            {step === 'lookup' && (
              <>
                <div className="relative mx-auto mb-8 flex h-24 w-24 items-center justify-center">
                  <div className="absolute inset-0 animate-ping rounded-full bg-primary/15" />
                  <div className="absolute inset-0 rounded-full bg-primary/8" />
                  <div className="absolute inset-0 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
                  <MapPin className="relative h-9 w-9 text-primary" />
                </div>
                <h2 className="text-center font-headline text-2xl font-extrabold tracking-tight text-slate-900">
                  Fetching place details…
                </h2>
                <p className="mt-3 text-center text-sm leading-relaxed text-slate-500">
                  Calling the Google Maps Places API to pull your reviews, photos, hours, and more.
                </p>
                <div className="mt-8 space-y-3.5">
                  <ProgressRow label="Resolving your Maps link" sub="Following redirects to the canonical URL" state="active" />
                  <ProgressRow label="Fetching business profile" sub="Reviews, photos, address, opening hours" state="pending" />
                  <ProgressRow label="Running AI enrichment" sub="Writing copy tailored to your business" state="pending" />
                  <ProgressRow label="Building your site draft" sub="Generating HTML and saving to your account" state="pending" />
                </div>
              </>
            )}

            {/* ── Enriching ── */}
            {step === 'enriching' && (
              <>
                <div className="relative mx-auto mb-8 flex h-24 w-24 items-center justify-center">
                  <div className="absolute inset-0 animate-ping rounded-full bg-violet-500/15" />
                  <div className="absolute inset-0 rounded-full bg-violet-500/8" />
                  <div className="absolute inset-0 animate-spin rounded-full border-4 border-violet-200 border-t-violet-500" />
                  <span
                    className="relative material-symbols-outlined text-[36px] text-violet-600"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    auto_awesome
                  </span>
                </div>
                <h2 className="text-center font-headline text-2xl font-extrabold tracking-tight text-slate-900">
                  AI is reading your business…
                </h2>
                <p className="mt-2 text-center text-sm text-slate-500">
                  Crafting descriptions, taglines and copy tailored to your listing.
                </p>
                <div className="mt-8 space-y-3.5">
                  <ProgressRow
                    label="Business data fetched"
                    sub="Name, address, rating, photos, reviews collected"
                    state={enrichStage > 0 ? 'done' : enrichStage === 0 ? 'active' : 'pending'}
                  />
                  <ProgressRow
                    label="Analysing reviews & category"
                    sub="Understanding tone, strengths and sentiment"
                    state={enrichStage > 1 ? 'done' : enrichStage === 1 ? 'active' : 'pending'}
                  />
                  <ProgressRow
                    label="Generating description & tagline"
                    sub="Crafting copy specific to your business"
                    state={enrichStage > 2 ? 'done' : enrichStage === 2 ? 'active' : 'pending'}
                  />
                  <ProgressRow
                    label="Preparing your site draft"
                    sub="Next you'll land in Site settings to review and publish"
                    state={enrichStage > 3 ? 'done' : enrichStage === 3 ? 'active' : 'pending'}
                  />
                </div>
              </>
            )}

            {/* ── Generating ── */}
            {step === 'generating' && (
              <>
                <div className="relative mx-auto mb-8 flex h-24 w-24 items-center justify-center">
                  <div className="absolute inset-0 animate-ping rounded-full bg-emerald-500/15" />
                  <div className="absolute inset-0 rounded-full bg-emerald-500/8" />
                  <div className="absolute inset-0 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-500" />
                  <span
                    className="relative material-symbols-outlined text-[36px] text-emerald-600"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    rocket_launch
                  </span>
                </div>
                <h2 className="text-center font-headline text-2xl font-extrabold tracking-tight text-slate-900">
                  Creating your site…
                </h2>
                <p className="mt-2 text-center text-sm text-slate-500">
                  Almost there — generating your HTML and saving your draft.
                </p>
                <div className="mt-8 space-y-3.5">
                  <ProgressRow label="Place data fetched" sub="Google Maps Places API sync complete" state="done" />
                  <ProgressRow label="AI content ready" sub="Descriptions and copy merged" state="done" />
                  <ProgressRow label="Saving your draft" sub="Generating HTML and storing your site" state="active" />
                  <ProgressRow label="Opening Site settings" sub="You can customise and go live from there" state="pending" />
                </div>
              </>
            )}

          </div>
        </div>
      )}
    </div>
  )
}
