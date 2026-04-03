import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createSite, enrichPlace, lookupPlace } from '../api/client'
import { trimPhotoUrl } from '../utils/photoUrl'

// Steps: input → lookup / enriching / generating (processing) → redirect to site settings
const STEP_LABELS = ['Paste link', 'Processing']

function stepIndex(step) {
  if (step === 'input') return 0
  if (step === 'lookup' || step === 'enriching' || step === 'generating') return 1
  return 0
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const MAPS_URL_RE =
  /^https?:\/\/(maps\.google\.|www\.google\.com\/maps|google\.com\/maps|goo\.gl\/maps|maps\.app\.goo\.gl)/i

function formatTypes(types = []) {
  const skip = new Set(['point_of_interest', 'establishment', 'food', 'store'])
  return types
    .filter((t) => !skip.has(t))
    .slice(0, 3)
    .map((t) => t.replace(/_/g, ' '))
}

// ── Main component ────────────────────────────────────────────────────────────

export default function GeneratorPage() {
  const navigate = useNavigate()

  // Flow state
  const [step, setStep] = useState('input')
  const [mapsUrl, setMapsUrl] = useState('')
  const [urlError, setUrlError] = useState('')
  const [lookupError, setLookupError] = useState('')
  const [genError, setGenError] = useState(null)
  const [busy, setBusy] = useState(false)
  const [enrichStage, setEnrichStage] = useState(0) // animation stage 0-3

  const inputRef = useRef(null)

  // ── On mount: pick up URL from sessionStorage (set by landing page) ──────────
  useEffect(() => {
    const stored = sessionStorage.getItem('pendingMapsUrl')
    if (stored) {
      sessionStorage.removeItem('pendingMapsUrl')
      setMapsUrl(stored)
      triggerLookup(stored)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Lookup ───────────────────────────────────────────────────────────────────

  const triggerLookup = useCallback(async (url) => {
    setLookupError('')
    setGenError(null)
    setEnrichStage(0)
    setBusy(true)
    setStep('lookup')
    try {
      const result = await lookupPlace(url)

      setStep('enriching')
      setEnrichStage(1)

      const stageTimer = setInterval(() => {
        setEnrichStage((s) => Math.min(s + 1, 3))
      }, 1200)

      let ai = null
      try {
        ai = await enrichPlace(result)
      } catch {
        /* AI optional */
      } finally {
        clearInterval(stageTimer)
        setEnrichStage(3)
      }

      const prefill = {}
      for (const f of result.missingFields ?? []) {
        prefill[f.id] = ai?.[f.id] ?? ''
      }
      const defaultHero = trimPhotoUrl(result.photoUrl || result.photos?.[0] || '')
      const listing = [...new Set([defaultHero, ...(result.photos || []).filter(Boolean)].filter(Boolean))]

      setStep('generating')
      setGenError(null)
      try {
        const heroUrl = trimPhotoUrl(defaultHero || '')
        const aboutUrl =
          trimPhotoUrl(listing[1] || '') || trimPhotoUrl(listing[0] || '') || heroUrl
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
        navigate(`/dashboard/sites/${site._id}`, { replace: true })
      } catch (err) {
        setGenError(err.message || 'Failed to create site')
        setStep('input')
      }
    } catch (e) {
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
    if (!val) { setUrlError('Please paste a Google Maps link.'); return }
    const withProtocol = /^https?:\/\//i.test(val) ? val : 'https://' + val
    if (!MAPS_URL_RE.test(withProtocol)) {
      setUrlError(
        "That doesn't look like a Google Maps link. Copy the URL directly from Google Maps while a business page is open."
      )
      return
    }
    setMapsUrl(withProtocol)
    triggerLookup(withProtocol)
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  const currentStepIdx = stepIndex(step)

  return (
    <div className="min-h-screen bg-background font-body text-on-surface antialiased">
      <main className="mx-auto max-w-5xl px-6 pb-20 pt-8 md:pt-10">
        {/* Step indicator */}
        <div className="mb-16 flex items-center justify-between px-4 md:px-20">
          {STEP_LABELS.map((label, i, arr) => (
            <div key={label} className="flex flex-1 items-center">
              <div className={`flex flex-col items-center gap-2 ${i > currentStepIdx ? 'opacity-40' : ''}`}>
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                    i < currentStepIdx
                      ? 'bg-green-500 text-white'
                      : i === currentStepIdx
                        ? 'bg-primary text-on-primary'
                        : 'bg-surface-container-high text-on-surface-variant'
                  }`}
                >
                  {i < currentStepIdx ? (
                    <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
                  ) : (
                    i + 1
                  )}
                </span>
                <span className={`text-xs uppercase tracking-widest ${i === currentStepIdx ? 'font-bold' : ''}`}>{label}</span>
              </div>
              {i < arr.length - 1 && (
                <div className={`mx-2 mb-6 h-[2px] min-w-[1rem] flex-1 transition-colors md:mx-4 ${i < currentStepIdx ? 'bg-green-400' : 'bg-surface-container-high'}`} />
              )}
            </div>
          ))}
        </div>

        {/* ── STEP: input ─────────────────────────────────────────────────── */}
        {step === 'input' && (
          <section className="rounded-xl border border-surface-container-high bg-surface-container-lowest p-8 shadow-md md:p-12">
            <div className="mx-auto max-w-xl">
              <div className="mb-10 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-on-primary shadow-lg">
                  <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>location_on</span>
                </div>
                <h1 className="mb-2 font-headline text-3xl font-extrabold tracking-tight">Paste your Google Maps link</h1>
                <p className="text-on-surface-variant">
                  We will fetch the business, generate your page, then open <strong>Site settings</strong> where you can
                  customize everything and publish when you are ready.
                </p>
              </div>

              {lookupError && (
                <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  <span className="material-symbols-outlined mt-0.5 flex-shrink-0 text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
                  {lookupError}
                </div>
              )}
              {genError && (
                <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  <span className="material-symbols-outlined mt-0.5 flex-shrink-0 text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
                  {genError}
                </div>
              )}

              <form onSubmit={handleUrlSubmit} className="space-y-4">
                <div>
                  <div className={`flex items-center rounded-xl border-2 bg-white p-1.5 shadow-sm transition-all focus-within:border-primary ${urlError ? 'border-red-400' : 'border-surface-container-high'}`}>
                    <div className="flex flex-1 items-center px-3">
                      <span className={`material-symbols-outlined mr-2 flex-shrink-0 ${urlError ? 'text-red-400' : 'text-outline'}`}>
                        {urlError ? 'error' : 'link'}
                      </span>
                      <input
                        ref={inputRef}
                        autoFocus
                        className="min-w-0 flex-1 border-none bg-transparent py-3 text-sm font-medium text-on-surface placeholder:text-outline-variant focus:ring-0"
                        placeholder="https://www.google.com/maps/place/..."
                        type="text"
                        value={mapsUrl}
                        onChange={(e) => { setMapsUrl(e.target.value); setUrlError('') }}
                      />
                      {mapsUrl && (
                        <button type="button" onClick={() => { setMapsUrl(''); setUrlError(''); inputRef.current?.focus() }}
                          className="ml-2 flex-shrink-0 text-outline-variant hover:text-on-surface">
                          <span className="material-symbols-outlined text-lg">close</span>
                        </button>
                      )}
                    </div>
                  </div>
                  {urlError && <p className="mt-2 text-xs font-medium text-red-500">{urlError}</p>}
                </div>

                <button
                  type="submit"
                  disabled={busy}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-4 font-headline text-lg font-bold text-on-primary transition-all hover:bg-primary-container active:scale-95 disabled:opacity-60"
                >
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                  Generate
                </button>
              </form>

              <div className="mt-8 rounded-xl bg-surface-container-low px-5 py-4">
                <p className="mb-2 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Accepted link formats</p>
                <ul className="space-y-1 text-xs text-on-surface-variant">
                  <li className="font-mono">https://www.google.com/maps/place/Business+Name/...</li>
                  <li className="font-mono">https://maps.google.com/maps?...</li>
                  <li className="font-mono">https://goo.gl/maps/XXXX (short link)</li>
                  <li className="font-mono">https://maps.app.goo.gl/XXXX (share link)</li>
                </ul>
              </div>
            </div>
          </section>
        )}

        {/* ── STEP: lookup (loading) ───────────────────────────────────────── */}
        {step === 'lookup' && (
          <section className="rounded-xl border border-surface-container-high bg-surface-container-lowest p-8 md:p-12">
            <div className="mx-auto max-w-md text-center">
              <div className="relative mx-auto mb-8 h-20 w-20">
                <div className="absolute inset-0 rounded-full border-4 border-surface-container-high" />
                <div className="absolute inset-0 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="material-symbols-outlined text-3xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>location_on</span>
                </div>
              </div>
              <h2 className="mb-3 font-headline text-2xl font-extrabold tracking-tight">Fetching place details…</h2>
              <p className="text-sm text-on-surface-variant">
                We're calling the Google Maps Places API to pull reviews, photos, hours, and more.
              </p>
            </div>
          </section>
        )}

        {/* ── STEP: enriching (AI content generation) ─────────────────────── */}
        {step === 'enriching' && (
          <section className="rounded-xl border border-surface-container-high bg-surface-container-lowest p-8 md:p-12">
            <div className="mx-auto max-w-md text-center">
              {/* Animated icon */}
              <div className="relative mx-auto mb-8 h-20 w-20">
                <div className="absolute inset-0 animate-ping rounded-full bg-primary/10" />
                <div className="absolute inset-0 rounded-full border-4 border-surface-container-high" />
                <div className="absolute inset-0 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="material-symbols-outlined text-3xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                </div>
              </div>
              <h2 className="mb-2 font-headline text-2xl font-extrabold tracking-tight">AI is reading your business…</h2>
              <p className="mb-10 text-sm text-on-surface-variant">Crafting descriptions, taglines and page copy tailored to your listing.</p>

              <div className="space-y-5 text-left">
                {[
                  { label: 'Business data fetched from Google Maps', sub: 'Name, address, rating, photos, reviews collected' },
                  { label: 'Analysing reviews and business category', sub: 'Understanding tone, strengths and customer sentiment' },
                  { label: 'Generating description and tagline', sub: 'Crafting copy specific to your business' },
                  { label: 'Preparing your site draft', sub: 'Next you will land in Site settings to review and publish' },
                ].map((s, i) => {
                  const done = enrichStage > i
                  const active = enrichStage === i
                  return (
                    <div key={s.label} className={`flex items-start gap-4 transition-opacity duration-500 ${!done && !active ? 'opacity-30' : ''}`}>
                      <div className="mt-0.5 flex-shrink-0">
                        {done ? (
                          <span className="material-symbols-outlined text-lg text-green-500" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                        ) : active ? (
                          <div className="flex h-5 w-5 items-center justify-center">
                            <div className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                          </div>
                        ) : (
                          <span className="material-symbols-outlined text-lg text-on-surface-variant/40">radio_button_unchecked</span>
                        )}
                      </div>
                      <div>
                        <p className={`text-sm font-semibold ${active ? 'text-primary' : done ? 'text-on-surface' : 'text-on-surface-variant'}`}>{s.label}</p>
                        <p className="text-xs text-on-surface-variant">{s.sub}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </section>
        )}

        {/* ── STEP: generating ────────────────────────────────────────────── */}
        {step === 'generating' && (
          <section className="rounded-xl border border-surface-container-high bg-surface-container-lowest p-8 md:p-12">
            <div className="mx-auto max-w-md text-center">
              <div className="relative mx-auto mb-8 h-20 w-20">
                <div className="absolute inset-0 rounded-full border-4 border-surface-container-high" />
                <div className="absolute inset-0 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="material-symbols-outlined text-3xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>magic_button</span>
                </div>
              </div>
              <h2 className="mb-8 font-headline text-2xl font-extrabold tracking-tight">Creating your site…</h2>
              <div className="mb-10 space-y-6 text-left">
                {[
                  { icon: 'check_circle', color: 'text-green-500', label: 'Place data fetched', sub: 'Google Maps Places API sync complete', done: true },
                  { icon: 'check_circle', color: 'text-green-500', label: 'AI content ready', sub: 'Descriptions and copy merged where available', done: true },
                  { icon: 'magic_button', color: 'text-primary', label: 'Saving your draft', sub: 'Generating HTML and storing your site', done: false, active: true },
                  { icon: 'radio_button_unchecked', color: 'text-on-surface-variant', label: 'Opening Site settings', sub: 'You can customize and go live from there', done: false, active: false },
                ].map((s) => (
                  <div key={s.label} className={`flex items-center gap-4 ${!s.done && !s.active ? 'opacity-30' : ''}`}>
                    {s.active ? (
                      <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center">
                        <div className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                      </div>
                    ) : (
                      <span className={`material-symbols-outlined flex-shrink-0 ${s.color}`} style={{ fontVariationSettings: s.done ? "'FILL' 1" : "'FILL' 0" }}>{s.icon}</span>
                    )}
                    <div>
                      <span className={`block text-sm font-bold ${s.active ? 'text-primary' : ''}`}>{s.label}</span>
                      <span className="block text-xs text-on-surface-variant">{s.sub}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

      </main>

      <footer className="w-full border-t border-slate-100 bg-white py-12">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 md:flex-row">
          <span className="text-xs uppercase tracking-widest text-slate-400">© 2026 Place to Page. All rights reserved.</span>
          <nav className="flex flex-wrap justify-center gap-8">
            <Link to="/#terms" className="text-xs uppercase tracking-widest text-slate-400 opacity-80 transition-opacity hover:opacity-100">Terms</Link>
            <Link to="/#privacy" className="text-xs uppercase tracking-widest text-slate-400 opacity-80 transition-opacity hover:opacity-100">Privacy</Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}
