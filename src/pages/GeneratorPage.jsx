import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js'
import {
  createSite,
  deploySite,
  enrichPlace,
  lookupPlace,
  checkSubdomain,
  createPaypalOrder,
  capturePaypalOrder,
  getPaypalClientId,
} from '../api/client'
import { useAuth } from '../context/AuthContext'

const THEMES = [
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
  { id: 'bold', label: 'Bold' },
]

const navInactive = 'font-medium text-slate-500 transition-colors hover:text-slate-900'
const navActive = 'border-b-2 border-slate-900 pb-1 font-semibold text-slate-900'

// Steps: input → lookup → enriching → details → customize → generating → done
const STEP_LABELS = ['Paste link', 'Review details', 'Customize', 'Preview', 'Live']

function stepIndex(step) {
  if (step === 'input' || step === 'lookup' || step === 'enriching') return 0
  if (step === 'details') return 1
  if (step === 'customize') return 2
  if (step === 'generating' || step === 'preview') return 3
  if (step === 'done') return 4
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

function PriceLevel({ level }) {
  if (level == null) return null
  return (
    <span className="text-sm font-medium text-on-surface-variant">
      {'$'.repeat(level + 1)}
      <span className="opacity-30">{'$'.repeat(Math.max(0, 3 - level))}</span>
    </span>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function GeneratorPage() {
  const { pathname } = useLocation()
  const { user, logout, refreshUser } = useAuth()

  // Flow state
  const [step, setStep] = useState('input')
  const [mapsUrl, setMapsUrl] = useState('')
  const [urlError, setUrlError] = useState('')
  const [lookupError, setLookupError] = useState('')
  const [place, setPlace] = useState(null)           // result from /api/maps/lookup
  const [aiContent, setAiContent] = useState(null)       // result from /api/enrich
  const [extraFields, setExtraFields] = useState({})     // editable fields in review step
  const [theme, setTheme] = useState('light')
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState(null) // hero photo chosen by user
  const [created, setCreated] = useState(null)
  const [genError, setGenError] = useState(null)
  const [deployError, setDeployError] = useState(null)
  const [deployStage, setDeployStage] = useState(0)
  const [busy, setBusy] = useState(false)
  const [enrichStage, setEnrichStage] = useState(0)  // animation stage 0-3
  const [previewDevice, setPreviewDevice] = useState('desktop') // 'desktop' | 'mobile'

  // Subdomain state
  const [subdomain, setSubdomain] = useState('')
  const [subdomainStatus, setSubdomainStatus] = useState('idle') // idle | checking | available | taken | invalid
  const [subdomainInfo, setSubdomainInfo] = useState(null) // response from check-subdomain
  const subdomainDebounceRef = useRef(null)

  const [paypalClientId, setPaypalClientId] = useState(() => import.meta.env.VITE_PAYPAL_CLIENT_ID || '')
  const [paypalError, setPaypalError] = useState(null)

  const inputRef = useRef(null)

  const canPublish =
    Boolean(user?.skipPublishPayment) || (user?.publishingCredits ?? 0) >= 1

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

  // Load PayPal client ID from env or public API (must match server PAYPAL_CLIENT_ID)
  useEffect(() => {
    if (step !== 'preview') return
    if (paypalClientId) return
    let cancelled = false
    ;(async () => {
      try {
        const id = await getPaypalClientId()
        if (!cancelled && id) setPaypalClientId(id)
      } catch {
        /* ignore */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [step, paypalClientId])

  // ── Lookup ───────────────────────────────────────────────────────────────────

  const triggerLookup = useCallback(async (url) => {
    setLookupError('')
    setAiContent(null)
    setEnrichStage(0)
    setStep('lookup')
    try {
      // Step 1 — fetch from Google Maps
      const result = await lookupPlace(url)
      setPlace(result)

      // Step 2 — AI enrichment
      setStep('enriching')
      setEnrichStage(1)

      // Animate through stages while waiting for AI
      const stageTimer = setInterval(() => {
        setEnrichStage((s) => Math.min(s + 1, 3))
      }, 1200)

      let ai = null
      try {
        ai = await enrichPlace(result)
        setAiContent(ai)
      } catch {
        // AI failed — proceed without it, fields stay empty
      } finally {
        clearInterval(stageTimer)
        setEnrichStage(3)
      }

      // Pre-fill extraFields: AI suggestion first, then empty for manual entry
      const prefill = {}
      for (const f of result.missingFields) {
        prefill[f.id] = ai?.[f.id] ?? ''
      }
      setExtraFields(prefill)
      // Default hero photo to the first photo from Google Maps
      setSelectedPhotoUrl(result.photoUrl || result.photos?.[0] || null)
      setStep('details')
    } catch (e) {
      setLookupError(e.message || 'Failed to look up this place.')
      setStep('input')
    }
  }, [])

  function handleUrlSubmit(e) {
    e.preventDefault()
    setUrlError('')
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

  // ── Details → Customize ───────────────────────────────────────────────────────

  function handleDetailsNext(e) {
    e.preventDefault()
    // Check required fields
    for (const f of (place?.missingFields ?? [])) {
      if (f.required && !extraFields[f.id]?.trim()) {
        document.getElementById(`field-${f.id}`)?.focus()
        return
      }
    }
    setStep('customize')
  }

  // ── Generate ──────────────────────────────────────────────────────────────────

  async function handleGenerate() {
    setGenError(null)
    setBusy(true)
    setStep('generating')
    try {
      const site = await createSite({
        name: place.name,
        mapsUrl: place.mapsUrl,
        category: formatTypes(place.types)[0] || place.types[0] || 'Business',
        theme,
        thumbnailUrl: selectedPhotoUrl || place.photoUrl || '',
        placeData: {
          placeId: place.placeId,
          address: place.address,
          phone: extraFields.phone || place.phone,
          website: extraFields.website || place.website,
          description: extraFields.description || aiContent?.description || place.description,
          tagline: extraFields.tagline || aiContent?.tagline,
          heroHeadline: aiContent?.heroHeadline,
          ctaText: aiContent?.ctaText,
          seoDescription: aiContent?.seoDescription,
          highlights: aiContent?.highlights,
          rating: place.rating,
          reviewCount: place.reviewCount,
          openingHours: place.openingHours,
          reviews: place.reviews,
          photos: place.photos,
        },
      })
      setCreated(site)
      // Auto-generate a subdomain slug from the business name
      const autoSlug = (place.name || 'my-business')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 50)
      setSubdomain(autoSlug)
      setSubdomainStatus('idle')
      setSubdomainInfo(null)
      setStep('preview')
    } catch (e) {
      setGenError(e.message || 'Failed to create site')
      setStep('customize')
    } finally {
      setBusy(false)
    }
  }

  // Debounced subdomain availability check
  function handleSubdomainChange(value) {
    const raw = value.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 50)
    setSubdomain(raw)
    setSubdomainStatus('idle')
    setSubdomainInfo(null)
    if (subdomainDebounceRef.current) clearTimeout(subdomainDebounceRef.current)
    if (!raw) return
    setSubdomainStatus('checking')
    subdomainDebounceRef.current = setTimeout(async () => {
      try {
        const info = await checkSubdomain(raw)
        setSubdomainInfo(info)
        setSubdomainStatus(info.available ? 'available' : 'taken')
      } catch {
        setSubdomainStatus('idle')
      }
    }, 600)
  }

  async function handleDeploy() {
    if (!created?._id) return
    setDeployError(null)
    setDeployStage(0)
    setBusy(true)

    // Cycle through stages while waiting for the backend to confirm READY
    const stageDurations = [3000, 6000, 8000] // ms before advancing to next stage
    let stageIdx = 0
    const stageTimer = setInterval(() => {
      stageIdx = Math.min(stageIdx + 1, 3)
      setDeployStage(stageIdx)
    }, stageDurations[stageIdx] ?? 8000)

    try {
      const deployed = await deploySite(created._id, { subdomain })
      clearInterval(stageTimer)
      setDeployStage(4) // "Live!" flash before transitioning
      await new Promise((r) => setTimeout(r, 600))
      setCreated(deployed)
      setStep('done')
      await refreshUser()
    } catch (e) {
      clearInterval(stageTimer)
      // Show the specific "subdomain taken" error in the picker, not just a toast
      if (e.code === 'SUBDOMAIN_TAKEN') {
        setSubdomainStatus('taken')
        setSubdomainInfo({ available: false, reason: e.message })
      }
      setDeployError(e.message || 'Deployment failed. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  const currentStepIdx = stepIndex(step)

  return (
    <div className="min-h-screen bg-background font-body text-on-surface antialiased">
      {/* Nav */}
      <nav className="fixed top-0 z-50 flex h-16 w-full items-center justify-between border-b border-slate-100 bg-white/80 px-6 shadow-sm backdrop-blur-xl md:px-12">
        <Link to="/" className="font-headline text-xl font-bold tracking-tighter text-slate-900">
          Place to Page
        </Link>
        <div className="hidden items-center gap-8 md:flex">
          <Link to="/#features" className={navInactive}>Features</Link>
          <Link to="/#pricing" className={navInactive}>Pricing</Link>
          <Link to="/dashboard" className={pathname === '/dashboard' ? navActive : navInactive}>Dashboard</Link>
        </div>
        <div className="flex items-center gap-3">
          {user?.picture ? (
            <img src={user.picture} alt="" className="hidden h-9 w-9 rounded-full border border-slate-200 object-cover sm:block" />
          ) : null}
          <button
            type="button"
            onClick={logout}
            className="rounded-full px-4 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
          >
            Sign out
          </button>
          <Link
            to="/generator"
            className={`rounded-full px-5 py-2 font-semibold transition-all active:scale-95 md:px-6 ${
              pathname === '/generator'
                ? 'bg-primary-container text-on-primary'
                : 'bg-primary text-on-primary hover:bg-primary-container'
            }`}
          >
            Generator
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-5xl px-6 pb-20 pt-24">
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
                  Open any business on{' '}
                  <a href="https://maps.google.com" target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">
                    maps.google.com
                  </a>
                  , then copy the URL from your browser's address bar and paste it below.
                </p>
              </div>

              {lookupError && (
                <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  <span className="material-symbols-outlined mt-0.5 flex-shrink-0 text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
                  {lookupError}
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
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-4 font-headline text-lg font-bold text-on-primary transition-all hover:bg-primary-container active:scale-95"
                >
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>search</span>
                  Look up this place
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
                  { label: 'Preparing your review form', sub: 'Pre-filling fields so you can confirm or edit' },
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

        {/* ── STEP: details ────────────────────────────────────────────────── */}
        {step === 'details' && place && (
          <form onSubmit={handleDetailsNext}>
            <section className="rounded-xl border border-surface-container-high bg-surface-container-lowest p-8 shadow-md md:p-12">
              <div className="mx-auto max-w-2xl">
                <div className="mb-8 text-center">
                  <h1 className="mb-1 font-headline text-3xl font-extrabold tracking-tight">We found your business</h1>
                  <p className="text-on-surface-variant">Review what we pulled from Google Maps, then fill in any missing details.</p>
                </div>

                {/* Place card */}
                <div className="mb-8 overflow-hidden rounded-2xl border border-surface-container-high bg-white shadow-sm">
                  {place.photoUrl && (
                    <div className="h-48 w-full overflow-hidden bg-surface-container-high">
                      <img src={place.photoUrl} alt={place.name} className="h-full w-full object-cover" />
                    </div>
                  )}
                  <div className="p-6">
                    <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h2 className="font-headline text-2xl font-bold">{place.name}</h2>
                        <p className="mt-1 text-sm text-on-surface-variant">{place.address}</p>
                      </div>
                      {place.isOpenNow != null && (
                        <span className={`flex-shrink-0 rounded-full px-3 py-1 text-xs font-bold ${place.isOpenNow ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                          {place.isOpenNow ? 'Open now' : 'Currently closed'}
                        </span>
                      )}
                    </div>

                    <div className="mb-4 flex flex-wrap items-center gap-4">
                      {place.rating != null && (
                        <div className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-yellow-500 text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                          <span className="font-bold">{place.rating}</span>
                          <span className="text-xs text-on-surface-variant">({place.reviewCount?.toLocaleString()} reviews)</span>
                        </div>
                      )}
                      <PriceLevel level={place.priceLevel} />
                    </div>

                    <div className="mb-4 flex flex-wrap gap-2">
                      {formatTypes(place.types).map((t) => (
                        <span key={t} className="rounded px-2 py-1 text-[10px] font-bold uppercase tracking-wider bg-surface-container text-on-surface-variant capitalize">
                          {t}
                        </span>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 gap-3 border-t border-surface-container pt-4 text-sm sm:grid-cols-2">
                      {place.phone && (
                        <div className="flex items-center gap-2 text-on-surface-variant">
                          <span className="material-symbols-outlined text-lg text-primary">phone</span>
                          <span>{place.phone}</span>
                        </div>
                      )}
                      {place.website && (
                        <div className="flex items-center gap-2 text-on-surface-variant">
                          <span className="material-symbols-outlined text-lg text-primary">language</span>
                          <a href={place.website} target="_blank" rel="noopener noreferrer" className="truncate hover:underline">
                            {place.website.replace(/^https?:\/\/(www\.)?/, '')}
                          </a>
                        </div>
                      )}
                      {place.openingHours && (
                        <div className="col-span-full">
                          <button
                            type="button"
                            onClick={(e) => e.currentTarget.nextElementSibling?.classList.toggle('hidden')}
                            className="flex items-center gap-2 text-on-surface-variant hover:text-on-surface"
                          >
                            <span className="material-symbols-outlined text-lg text-primary">schedule</span>
                            <span className="font-medium">View opening hours</span>
                            <span className="material-symbols-outlined text-sm">expand_more</span>
                          </button>
                          <ul className="hidden mt-2 space-y-0.5 pl-8 text-xs text-on-surface-variant">
                            {place.openingHours.map((h) => <li key={h}>{h}</li>)}
                          </ul>
                        </div>
                      )}
                      {place.description && (
                        <p className="col-span-full text-on-surface-variant italic">&ldquo;{place.description}&rdquo;</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* ── Hero photo picker ──────────────────────────────────── */}
                {((place.photos?.length > 0) || place.photoUrl) && (
                  <div className="mb-8">
                    <div className="mb-3 flex items-center gap-2">
                      <span className="h-px flex-1 bg-surface-container-high" />
                      <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Choose hero photo</span>
                      <span className="h-px flex-1 bg-surface-container-high" />
                    </div>
                    <p className="mb-3 text-center text-xs text-on-surface-variant">
                      This photo will be the full-screen background on your site.
                    </p>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {[...new Set([place.photoUrl, ...(place.photos || [])].filter(Boolean))].map((url) => {
                        const isSelected = (selectedPhotoUrl || place.photoUrl) === url
                        return (
                          <button
                            key={url}
                            type="button"
                            onClick={() => setSelectedPhotoUrl(url)}
                            className={`group relative overflow-hidden rounded-xl transition-all ${
                              isSelected
                                ? 'ring-2 ring-primary ring-offset-2 shadow-lg'
                                : 'ring-1 ring-surface-container-high hover:ring-primary/50'
                            }`}
                          >
                            <img
                              src={url}
                              alt="Hero option"
                              className="aspect-video w-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                            {isSelected && (
                              <div className="absolute inset-0 flex items-center justify-center bg-primary/25">
                                <span
                                  className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white shadow-md"
                                  style={{ fontFamily: 'Material Symbols Outlined' }}
                                >
                                  check
                                </span>
                              </div>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* AI-generated highlights preview */}
                {aiContent?.highlights?.length > 0 && (
                  <div className="mb-6 rounded-xl border border-primary/20 bg-primary/5 p-5">
                    <div className="mb-3 flex items-center gap-2">
                      <span className="material-symbols-outlined text-lg text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                      <span className="text-xs font-bold uppercase tracking-widest text-primary">AI-generated highlights</span>
                    </div>
                    <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {aiContent.highlights.map((h) => (
                        <li key={h} className="flex items-start gap-2 text-sm text-on-surface">
                          <span className="material-symbols-outlined mt-0.5 flex-shrink-0 text-base text-green-500" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                          {h}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Reviews */}
                {place.reviews?.length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center gap-2">
                      <span className="h-px flex-1 bg-surface-container-high" />
                      <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Customer reviews</span>
                      <span className="h-px flex-1 bg-surface-container-high" />
                    </div>
                    <div className="mt-4 space-y-3">
                      {place.reviews.map((r, i) => (
                        <div key={i} className="rounded-xl border border-surface-container-high bg-surface-container-lowest p-4">
                          <div className="mb-2 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              {r.authorPhoto ? (
                                <img src={r.authorPhoto} alt="" className="h-7 w-7 rounded-full object-cover" />
                              ) : (
                                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                                  {r.author?.[0] ?? '?'}
                                </div>
                              )}
                              <span className="text-sm font-semibold">{r.author}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-yellow-500 text-sm">{'★'.repeat(r.rating ?? 0)}{'☆'.repeat(5 - (r.rating ?? 0))}</span>
                              <span className="text-xs text-on-surface-variant">{r.relativeTime}</span>
                            </div>
                          </div>
                          <p className="text-sm leading-relaxed text-on-surface-variant line-clamp-3">{r.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Missing / enrichment fields */}
                {place.missingFields?.length > 0 && (
                  <div className="mb-8 space-y-5">
                    <div className="flex items-center gap-2">
                      <span className="h-px flex-1 bg-surface-container-high" />
                      <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                        {place.missingFields.filter(f => f.required).length > 0 ? 'Complete your listing' : 'Enhance your page'}
                      </span>
                      <span className="h-px flex-1 bg-surface-container-high" />
                    </div>
                    {aiContent && (
                      <div className="flex items-start gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-xs text-primary">
                        <span className="material-symbols-outlined mt-0.5 flex-shrink-0 text-base" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                        Fields marked <strong>AI suggested</strong> were pre-filled based on your Google Maps data. Review and edit them before continuing.
                      </div>
                    )}
                    {place.missingFields.map((f) => {
                      const isAiPrefilled = aiContent && !!aiContent[f.id]
                      return (
                        <div key={f.id}>
                          <label
                            htmlFor={`field-${f.id}`}
                            className="mb-1.5 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-on-surface-variant"
                          >
                            {f.label}
                            {f.required && <span className="text-red-500">*</span>}
                            {isAiPrefilled && (
                              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary normal-case">
                                ✦ AI suggested
                              </span>
                            )}
                          </label>
                          <p className="mb-2 text-xs text-on-surface-variant">{f.hint}</p>
                          {f.type === 'textarea' ? (
                            <textarea
                              id={`field-${f.id}`}
                              rows={4}
                              className={`w-full rounded-xl border-2 bg-white px-4 py-3 text-sm text-on-surface placeholder:text-outline-variant focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 ${isAiPrefilled ? 'border-primary/30' : 'border-surface-container-high'}`}
                              placeholder={f.placeholder}
                              value={extraFields[f.id] || ''}
                              onChange={(e) => setExtraFields((p) => ({ ...p, [f.id]: e.target.value }))}
                              required={f.required}
                            />
                          ) : (
                            <input
                              id={`field-${f.id}`}
                              type={f.type}
                              className={`w-full rounded-xl border-2 bg-white px-4 py-3 text-sm text-on-surface placeholder:text-outline-variant focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 ${isAiPrefilled ? 'border-primary/30' : 'border-surface-container-high'}`}
                              placeholder={f.placeholder}
                              value={extraFields[f.id] || ''}
                              onChange={(e) => setExtraFields((p) => ({ ...p, [f.id]: e.target.value }))}
                              required={f.required}
                            />
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}

                <div className="flex items-center justify-between gap-4">
                  <button
                    type="button"
                    onClick={() => { setStep('input'); setPlace(null) }}
                    className="flex items-center gap-2 rounded-full px-5 py-3 text-sm font-medium text-on-surface-variant hover:bg-surface-container"
                  >
                    <span className="material-symbols-outlined text-lg">arrow_back</span>
                    Change link
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-2 rounded-full bg-primary px-8 py-3 font-bold text-on-primary transition-all hover:bg-primary-container active:scale-95"
                  >
                    Continue to customize
                    <span className="material-symbols-outlined text-lg">arrow_forward</span>
                  </button>
                </div>
              </div>
            </section>
          </form>
        )}

        {/* ── STEP: customize ─────────────────────────────────────────────── */}
        {step === 'customize' && place && (
          <section className="rounded-xl border border-surface-container-high bg-surface-container-lowest p-8 shadow-md md:p-12">
            <div className="mx-auto max-w-2xl">
              <div className="mb-8 text-center">
                <h1 className="mb-2 font-headline text-3xl font-extrabold tracking-tight">Choose your visual theme</h1>
                <p className="text-on-surface-variant">Select the aesthetic for <strong>{place.name}</strong>'s landing page.</p>
              </div>

              {/* Compact place reminder */}
              <div className="mb-8 flex items-center gap-4 rounded-xl bg-surface-container-low px-4 py-3">
                {place.photoUrl ? (
                  <img src={place.photoUrl} alt="" className="h-12 w-12 flex-shrink-0 rounded-lg object-cover" />
                ) : (
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>store</span>
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-bold truncate">{place.name}</p>
                  <p className="truncate text-xs text-on-surface-variant">{place.address}</p>
                </div>
                <button type="button" onClick={() => setStep('details')}
                  className="ml-auto flex-shrink-0 text-xs font-medium text-primary hover:underline">
                  Edit details
                </button>
              </div>

              {genError && (
                <div className="mb-6 rounded-xl bg-error-container px-4 py-3 text-sm text-on-error-container">{genError}</div>
              )}

              <div className="mb-10">
                <label className="mb-4 block text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                  Select visual theme
                </label>
                <div className="grid grid-cols-3 gap-4">
                  {THEMES.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTheme(t.id)}
                      className={`group flex flex-col items-center gap-3 ${theme === t.id ? '' : 'opacity-60 hover:opacity-100'}`}
                    >
                      <div
                        className={`relative aspect-[4/3] w-full overflow-hidden rounded-lg border-2 transition-all group-hover:scale-[1.02] ${
                          t.id === 'light'
                            ? 'border-primary bg-white'
                            : t.id === 'dark'
                              ? 'border-transparent bg-slate-900'
                              : 'border-transparent bg-gradient-to-br from-primary to-primary-container'
                        }`}
                      >
                        <div className={`absolute inset-0 flex flex-col items-center justify-center gap-2 ${t.id === 'dark' ? 'bg-slate-800' : t.id === 'light' ? 'bg-slate-50' : ''}`}>
                          <div className={`h-2 w-12 rounded ${t.id === 'bold' ? 'bg-white/20' : 'bg-slate-200'}`} />
                          <div className={`h-2 w-8 rounded ${t.id === 'bold' ? 'bg-white/10' : 'bg-slate-100'}`} />
                        </div>
                        {theme === t.id && (
                          <div className="absolute bottom-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary shadow">
                            <span className="material-symbols-outlined text-[12px] text-white" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
                          </div>
                        )}
                      </div>
                      <span className="text-xs font-bold uppercase tracking-widest">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="text-center">
                <button
                  type="button"
                  disabled={busy}
                  onClick={handleGenerate}
                  className="mb-4 w-full rounded-full bg-gradient-to-br from-primary to-primary-container py-5 font-headline text-lg font-extrabold tracking-tight text-on-primary transition-all hover:shadow-xl active:scale-95 disabled:opacity-60"
                >
                  Generate site — uses 1 credit
                </button>
                <p className="text-xs text-on-surface-variant">
                  You have{' '}
                  <span className="font-semibold text-on-surface">
                    {user?.creditsRemaining != null ? user.creditsRemaining.toLocaleString() : '—'}
                  </span>{' '}
                  credits remaining.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* ── STEP: preview ───────────────────────────────────────────────── */}
        {step === 'preview' && created && (
          <section className="space-y-6">
            {/* Header bar */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-headline text-2xl font-extrabold tracking-tight">Preview your site</h2>
                <p className="mt-0.5 text-sm text-on-surface-variant">Looks good? Click <strong>Deploy to Vercel</strong> to make it live.</p>
              </div>
              {/* Device toggle */}
              <div className="flex items-center gap-1 rounded-full border border-surface-container-high bg-surface-container-lowest p-1 self-start sm:self-auto">
                {[
                  { id: 'desktop', icon: 'desktop_windows', label: 'Desktop' },
                  { id: 'mobile',  icon: 'smartphone',       label: 'Mobile'  },
                ].map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setPreviewDevice(d.id)}
                    className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition-all ${
                      previewDevice === d.id
                        ? 'bg-primary text-on-primary shadow-sm'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    <span className="material-symbols-outlined text-base">{d.icon}</span>
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Browser chrome + iframe */}
            <div className={`mx-auto transition-all duration-300 ${previewDevice === 'mobile' ? 'max-w-sm' : 'max-w-full'}`}>
              {/* Fake browser bar */}
              <div className="flex items-center gap-2 rounded-t-xl border border-b-0 border-surface-container-high bg-surface-container-low px-4 py-3">
                <div className="flex gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-red-400" />
                  <span className="h-3 w-3 rounded-full bg-yellow-400" />
                  <span className="h-3 w-3 rounded-full bg-green-400" />
                </div>
                <div className="flex flex-1 items-center gap-2 rounded-md bg-surface-container px-3 py-1.5">
                  <span className="material-symbols-outlined text-sm text-on-surface-variant">lock</span>
                  <span className="truncate text-xs text-on-surface-variant">
                    {created.name?.toLowerCase().replace(/\s+/g, '-')}.vercel.app
                  </span>
                </div>
              </div>

              {/* iframe */}
              <div className={`overflow-hidden rounded-b-xl border border-surface-container-high bg-white shadow-xl ${previewDevice === 'mobile' ? 'h-[700px]' : 'h-[600px]'}`}>
                <iframe
                  title="Site preview"
                  srcDoc={created.generatedHtml || ''}
                  sandbox="allow-same-origin allow-scripts"
                  className="h-full w-full border-0"
                  style={previewDevice === 'mobile' ? { transform: 'scale(1)', transformOrigin: 'top left' } : {}}
                />
              </div>
            </div>

            {/* ── Subdomain picker ────────────────────────────────────────── */}
            <div className="rounded-2xl border border-surface-container-high bg-surface-container-lowest p-5">
              <div className="mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-lg text-primary">language</span>
                <h3 className="font-headline text-base font-bold">Your website address</h3>
              </div>
              <p className="mb-4 text-sm text-on-surface-variant">
                Choose a subdomain for your site. It will be published at{' '}
                <strong>{subdomain || 'your-name'}.placetopage.com</strong>.
              </p>

              {/* Input row */}
              <div className="flex items-stretch overflow-hidden rounded-xl border-2 border-surface-container-high focus-within:border-primary transition-colors">
                <input
                  type="text"
                  value={subdomain}
                  onChange={(e) => handleSubdomainChange(e.target.value)}
                  placeholder="your-business-name"
                  maxLength={50}
                  className="flex-1 bg-transparent px-4 py-3 text-sm font-mono outline-none placeholder:text-on-surface-variant/40"
                />
                <span className="flex items-center bg-surface-container-low px-4 text-sm font-medium text-on-surface-variant border-l border-surface-container-high select-none">
                  .placetopage.com
                </span>
              </div>

              {/* Status indicator */}
              <div className="mt-2 h-5 flex items-center gap-1.5 text-xs font-medium">
                {subdomainStatus === 'checking' && (
                  <>
                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    <span className="text-on-surface-variant">Checking availability…</span>
                  </>
                )}
                {subdomainStatus === 'available' && (
                  <>
                    <span className="material-symbols-outlined text-base text-green-600" style={{ fontSize: '14px' }}>check_circle</span>
                    <span className="text-green-700">
                      <strong>{subdomainInfo?.fullDomain}</strong> is available!
                    </span>
                  </>
                )}
                {subdomainStatus === 'taken' && (
                  <>
                    <span className="material-symbols-outlined text-base text-red-500" style={{ fontSize: '14px' }}>cancel</span>
                    <span className="text-red-600">
                      {subdomainInfo?.reason || 'This subdomain is already taken.'} Try a different name.
                    </span>
                  </>
                )}
                {subdomainStatus === 'idle' && subdomain && (
                  <span className="text-on-surface-variant/60">Enter your desired subdomain above</span>
                )}
              </div>
            </div>

            {/* Go Live — PayPal (required unless dev skip or credits) */}
            {canPublish && user?.skipPublishPayment && (
              <p className="rounded-lg border border-dashed border-surface-container-high bg-surface-container-low px-4 py-2 text-xs text-on-surface-variant">
                Dev mode: publishing payment gate is off (SKIP_PUBLISH_PAYMENT on the API).
              </p>
            )}
            {canPublish && !user?.skipPublishPayment && (user?.publishingCredits ?? 0) >= 1 && (
              <p className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-800">
                <span className="material-symbols-outlined mr-1 align-middle text-base" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                You have <strong>{user.publishingCredits}</strong> Go Live credit
                {user.publishingCredits === 1 ? '' : 's'} — ready to publish.
              </p>
            )}
            {!canPublish && (
              <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50/80 p-5 shadow-sm">
                <div className="mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-xl text-amber-700">payments</span>
                  <h3 className="font-headline text-base font-bold text-amber-950">Go Live — $5 one-time</h3>
                </div>
                <p className="mb-4 text-sm text-amber-900/90">
                  Publishing to <strong>*.placetopage.com</strong> requires a one-time PayPal payment. You get{' '}
                  <strong>one publish credit</strong> per purchase. Preview above is always free.
                </p>
                {paypalError && (
                  <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{paypalError}</div>
                )}
                {paypalClientId ? (
                  <PayPalScriptProvider
                    options={{
                      clientId: paypalClientId,
                      currency: 'USD',
                      intent: 'capture',
                    }}
                  >
                    <PayPalButtons
                      style={{ layout: 'vertical', shape: 'rect', label: 'pay' }}
                      createOrder={async () => {
                        setPaypalError(null)
                        try {
                          const data = await createPaypalOrder('go_live')
                          return data.orderId
                        } catch (err) {
                          setPaypalError(err.message || 'Could not start PayPal checkout')
                          throw err
                        }
                      }}
                      onApprove={async (data) => {
                        try {
                          setPaypalError(null)
                          await capturePaypalOrder(data.orderID)
                          await refreshUser()
                        } catch (err) {
                          setPaypalError(err.message || 'Payment capture failed')
                          throw err
                        }
                      }}
                      onError={(err) => {
                        console.error(err)
                        setPaypalError('PayPal encountered an error. Please try again.')
                      }}
                      onCancel={() => setPaypalError('Payment cancelled.')}
                    />
                  </PayPalScriptProvider>
                ) : (
                  <p className="text-sm text-amber-800">
                    PayPal is not configured: set <code className="rounded bg-amber-100 px-1">PAYPAL_CLIENT_ID</code> and{' '}
                    <code className="rounded bg-amber-100 px-1">PAYPAL_CLIENT_SECRET</code> on the API, redeploy, then add{' '}
                    <code className="rounded bg-amber-100 px-1">VITE_PAYPAL_CLIENT_ID</code> on the frontend (same client ID as PayPal
                    REST app).
                  </p>
                )}
              </div>
            )}

            {/* Deploy error */}
            {deployError && subdomainStatus !== 'taken' && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {deployError}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
              <button
                type="button"
                onClick={() => setStep('customize')}
                className="flex items-center justify-center gap-2 rounded-full border border-surface-container-high px-6 py-3 text-sm font-semibold text-on-surface-variant hover:bg-surface-container-low"
              >
                <span className="material-symbols-outlined text-lg">arrow_back</span>
                Back to customize
              </button>
              <button
                type="button"
                onClick={handleDeploy}
                disabled={
                  busy ||
                  subdomainStatus === 'taken' ||
                  subdomainStatus === 'checking' ||
                  !subdomain ||
                  !canPublish ||
                  subdomainStatus !== 'available'
                }
                className="flex min-w-[210px] items-center justify-center gap-2 rounded-full bg-primary px-8 py-3 text-sm font-bold text-on-primary shadow-md transition-all hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
                title={!canPublish ? 'Purchase a Go Live pass with PayPal first' : undefined}
              >
                {busy ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent flex-shrink-0" />
                    {[
                      'Uploading files…',
                      'Building site…',
                      'Running checks…',
                      'Waiting for Vercel…',
                      '🎉 Going live!',
                    ][deployStage] ?? 'Deploying…'}
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-lg">rocket_launch</span>
                    {subdomainStatus === 'available'
                      ? `Publish to ${subdomainInfo?.fullDomain}`
                      : 'Deploy to Vercel'}
                  </>
                )}
              </button>
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
              <h2 className="mb-8 font-headline text-2xl font-extrabold tracking-tight">Generating &amp; deploying your site…</h2>
              <div className="mb-10 space-y-6 text-left">
                {[
                  { icon: 'check_circle', color: 'text-green-500', label: 'Place data fetched', sub: 'Google Maps Places API sync complete', done: true },
                  { icon: 'check_circle', color: 'text-green-500', label: 'Details confirmed', sub: 'All required information collected', done: true },
                  { icon: 'magic_button', color: 'text-primary', label: 'Building your page', sub: 'Composing HTML from your data and AI content', done: false, active: true },
                  { icon: 'radio_button_unchecked', color: 'text-on-surface-variant', label: 'Deploying to Vercel', sub: 'Publishing to global edge network', done: false, active: false },
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

        {/* ── STEP: done ──────────────────────────────────────────────────── */}
        {step === 'done' && created && (
          <section className="rounded-xl border border-primary/20 bg-gradient-to-b from-surface-container-lowest to-surface-container-low p-8 md:p-12">
            <div className="mx-auto max-w-2xl text-center">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-green-600">
                <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>celebration</span>
              </div>
              <h2 className="mb-2 font-headline text-3xl font-extrabold tracking-tight">
                {created.deploymentUrl ? 'Your site is live! 🎉' : 'Site saved!'}
              </h2>
              <p className="mb-8 text-on-surface-variant">
                <strong>{created.name}</strong>{' '}
                {created.deploymentUrl
                  ? 'has been deployed and is publicly accessible.'
                  : 'has been saved. Add a Vercel token to deploy it live.'}
              </p>

              {/* Live URL card */}
              {created.deploymentUrl ? (
                <div className="mb-8 overflow-hidden rounded-2xl border border-green-200 bg-green-50 shadow-sm">
                  <div className="flex items-center gap-2 border-b border-green-200 bg-green-100/60 px-4 py-2">
                    <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-green-500" />
                    <span className="text-xs font-bold uppercase tracking-widest text-green-700">
                      {created.customSubdomain ? `Live on placetopage.com` : 'Live on Vercel'}
                    </span>
                  </div>
                  {/* Custom domain badge */}
                  {created.customSubdomain && (
                    <div className="flex items-center gap-2 border-b border-green-200 bg-green-100/30 px-4 py-2">
                      <span className="material-symbols-outlined text-sm text-green-600">domain</span>
                      <span className="text-xs text-green-700 font-medium">
                        Custom domain: <strong>{created.customSubdomain}.placetopage.com</strong>
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-3 p-4">
                    <span className="material-symbols-outlined text-green-600" style={{ fontVariationSettings: "'FILL' 1" }}>language</span>
                    <a
                      href={created.deploymentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="min-w-0 flex-1 truncate text-sm font-semibold text-green-700 hover:underline"
                    >
                      {created.deploymentUrl}
                    </a>
                    <button
                      type="button"
                      onClick={() => navigator.clipboard?.writeText(created.deploymentUrl || '')}
                      className="flex flex-shrink-0 items-center gap-1.5 rounded-lg bg-green-200 px-3 py-1.5 text-xs font-bold text-green-800 hover:bg-green-300"
                    >
                      <span className="material-symbols-outlined text-sm">content_copy</span>
                      Copy
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mb-8 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                  Add <code className="rounded bg-amber-100 px-1">VERCEL_TOKEN</code> to <code className="rounded bg-amber-100 px-1">backend/.env</code> to enable live deployment.
                </div>
              )}

              {/* Action buttons */}
              <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {created.deploymentUrl && (
                  <a
                    href={created.deploymentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-3 rounded-full bg-primary py-4 font-headline text-lg font-bold text-on-primary transition-all hover:shadow-lg"
                  >
                    <span className="material-symbols-outlined">open_in_new</span>
                    View live site
                  </a>
                )}
                <Link
                  to="/dashboard"
                  className="flex items-center justify-center gap-3 rounded-full bg-surface-container-highest py-4 font-headline text-lg font-bold text-on-surface transition-all hover:bg-surface-container-high"
                >
                  <span className="material-symbols-outlined">dashboard</span>
                  Go to dashboard
                </Link>
              </div>

              {/* Quick actions */}
              <div className="border-t border-surface-container-high pt-8">
                <span className="mb-6 block text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">Quick actions</span>
                <div className="flex flex-wrap justify-center gap-6">
                  {[
                    { label: 'Generate another', icon: 'add', action: () => { setStep('input'); setPlace(null); setAiContent(null); setCreated(null); setMapsUrl('') } },
                    { label: 'Share link', icon: 'share', action: () => navigator.clipboard?.writeText(created.deploymentUrl || '') },
                    { label: 'Analytics', icon: 'bar_chart', action: () => {} },
                  ].map((item) => (
                    <button key={item.label} type="button" onClick={item.action} className="group flex flex-col items-center gap-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-low transition-all group-hover:bg-primary group-hover:text-white">
                        <span className="material-symbols-outlined text-xl">{item.icon}</span>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">{item.label}</span>
                    </button>
                  ))}
                </div>
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
