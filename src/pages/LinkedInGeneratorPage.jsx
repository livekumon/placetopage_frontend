import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createSite, lookupLinkedIn, enrichLinkedIn } from '../api/client'
import { trackEvent } from '../utils/analytics'
import { PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js'
import {
  capturePaypalOrder,
  createPaypalOrder,
  createRazorpayOrder,
  getPaypalClientId,
  getRazorpayKeyId,
  getTokenPacks,
  verifyRazorpayPayment,
} from '../api/client'
import { useAuth } from '../context/AuthContext'

// ── LinkedIn logo SVG ─────────────────────────────────────────────────────────
function LinkedInIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M19 3A2 2 0 0 1 21 5V19A2 2 0 0 1 19 21H5A2 2 0 0 1 3 19V5A2 2 0 0 1 5 3H19M18.5 18.5V13.2A3.26 3.26 0 0 0 15.24 9.94C14.39 9.94 13.4 10.46 12.92 11.24V10.13H10.13V18.5H12.92V13.57C12.92 12.8 13.54 12.17 14.31 12.17A1.4 1.4 0 0 1 15.71 13.57V18.5H18.5M6.88 8.56A1.68 1.68 0 0 0 8.56 6.88C8.56 5.95 7.81 5.19 6.88 5.19A1.69 1.69 0 0 0 5.19 6.88C5.19 7.81 5.95 8.56 6.88 8.56M8.27 18.5V10.13H5.5V18.5H8.27Z" />
    </svg>
  )
}

// ── Animated progress row ─────────────────────────────────────────────────────
function ProgressRow({ label, sub, state }) {
  return (
    <div className={`flex items-start gap-4 transition-all duration-500 ${state === 'pending' ? 'opacity-30' : 'opacity-100'}`}>
      <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center">
        {state === 'done' && (
          <span className="material-symbols-outlined text-[20px] text-emerald-500" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
        )}
        {state === 'active' && (
          <span className="flex h-2.5 w-2.5 animate-pulse rounded-full bg-[#0077b5]" />
        )}
        {state === 'pending' && (
          <span className="material-symbols-outlined text-[20px] text-slate-300">radio_button_unchecked</span>
        )}
      </div>
      <div>
        <p className={`text-sm font-semibold leading-tight ${state === 'active' ? 'text-[#0077b5]' : state === 'done' ? 'text-slate-800' : 'text-slate-400'}`}>
          {label}
        </p>
        <p className="mt-0.5 text-xs text-slate-400">{sub}</p>
      </div>
    </div>
  )
}

// ── Dynamic experience row ────────────────────────────────────────────────────
function ExperienceRow({ idx, value, onChange, onRemove }) {
  return (
    <div className="grid grid-cols-12 gap-2 items-start">
      <div className="col-span-4">
        <input
          type="text"
          placeholder="Job title"
          value={value.title}
          onChange={(e) => onChange(idx, 'title', e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#0077b5] focus:outline-none focus:ring-2 focus:ring-[#0077b5]/20"
        />
      </div>
      <div className="col-span-4">
        <input
          type="text"
          placeholder="Company"
          value={value.company}
          onChange={(e) => onChange(idx, 'company', e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#0077b5] focus:outline-none focus:ring-2 focus:ring-[#0077b5]/20"
        />
      </div>
      <div className="col-span-3">
        <input
          type="text"
          placeholder="Duration"
          value={value.duration}
          onChange={(e) => onChange(idx, 'duration', e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#0077b5] focus:outline-none focus:ring-2 focus:ring-[#0077b5]/20"
        />
      </div>
      <div className="col-span-1 flex justify-end pt-1.5">
        <button type="button" onClick={() => onRemove(idx)} className="text-slate-400 hover:text-red-500">
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>
      </div>
    </div>
  )
}

// ── Education row ─────────────────────────────────────────────────────────────
function EducationRow({ idx, value, onChange, onRemove }) {
  return (
    <div className="grid grid-cols-12 gap-2 items-start">
      <div className="col-span-5">
        <input
          type="text"
          placeholder="Degree / Field"
          value={value.degree}
          onChange={(e) => onChange(idx, 'degree', e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#0077b5] focus:outline-none focus:ring-2 focus:ring-[#0077b5]/20"
        />
      </div>
      <div className="col-span-5">
        <input
          type="text"
          placeholder="School / University"
          value={value.school}
          onChange={(e) => onChange(idx, 'school', e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#0077b5] focus:outline-none focus:ring-2 focus:ring-[#0077b5]/20"
        />
      </div>
      <div className="col-span-1">
        <input
          type="text"
          placeholder="Year"
          value={value.year}
          onChange={(e) => onChange(idx, 'year', e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#0077b5] focus:outline-none focus:ring-2 focus:ring-[#0077b5]/20"
        />
      </div>
      <div className="col-span-1 flex justify-end pt-1.5">
        <button type="button" onClick={() => onRemove(idx)} className="text-slate-400 hover:text-red-500">
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>
      </div>
    </div>
  )
}

// ── Payment helpers ───────────────────────────────────────────────────────────
function detectIsIndia() {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    return tz === 'Asia/Calcutta' || tz === 'Asia/Kolkata'
  } catch { return false }
}

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true)
    const s = document.createElement('script')
    s.src = 'https://checkout.razorpay.com/v1/checkout.js'
    s.onload = () => resolve(true)
    s.onerror = () => resolve(false)
    document.body.appendChild(s)
  })
}

const GATEWAY_PAYPAL = 'paypal'
const GATEWAY_RAZORPAY = 'razorpay'

// ── Checkout panel (inline) ───────────────────────────────────────────────────
function CheckoutInline({
  selectedPack, gateway, setGateway,
  payStatus, setPayStatus, payMessage, setPayMessage,
  paypalClientId, razorpayKeyId,
  handlePaypalCreate, handlePaypalApprove, handlePaypalError, handlePaypalCancel,
  handleRazorpay,
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-700">
          {selectedPack.credits} website{selectedPack.credits !== 1 ? 's' : ''}
          <span className="mx-2 text-slate-300">·</span>
          <span className="text-[#0077b5]">${selectedPack.amountUsd}</span>
        </p>
        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500">
          {selectedPack.label}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => { setGateway(GATEWAY_PAYPAL); setPayStatus(null); setPayMessage('') }}
          className={`flex items-center gap-2.5 rounded-xl border-2 px-3 py-2.5 transition-all ${gateway === GATEWAY_PAYPAL ? 'border-[#0077b5] bg-[#0077b5]/5 shadow-sm' : 'border-slate-200 bg-slate-50 hover:border-slate-300'}`}
        >
          <img src="https://www.paypalobjects.com/webstatic/mktg/logo/pp_cc_mark_111x69.jpg" alt="PayPal" className="h-6 w-auto object-contain" />
          <div className="text-left">
            <p className="text-xs font-bold text-slate-800">PayPal</p>
            <p className="text-[10px] text-slate-400">USD · Worldwide</p>
          </div>
        </button>
        <button
          type="button"
          onClick={() => { setGateway(GATEWAY_RAZORPAY); setPayStatus(null); setPayMessage('') }}
          className={`flex items-center gap-2.5 rounded-xl border-2 px-3 py-2.5 transition-all ${gateway === GATEWAY_RAZORPAY ? 'border-[#0077b5] bg-[#0077b5]/5 shadow-sm' : 'border-slate-200 bg-slate-50 hover:border-slate-300'}`}
        >
          <img src="https://razorpay.com/assets/razorpay-logo.svg" alt="Razorpay" className="h-5 w-auto object-contain" style={{ maxWidth: 72 }} />
          <div className="text-left">
            <p className="text-xs font-bold text-slate-800">Razorpay</p>
            <p className="text-[10px] text-slate-400">INR · India</p>
          </div>
        </button>
      </div>
      {payStatus === 'error' && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700">
          <span className="material-symbols-outlined mt-0.5 shrink-0 text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
          {payMessage}
        </div>
      )}
      {gateway === GATEWAY_PAYPAL && (
        !paypalClientId ? (
          <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800">
            <span className="material-symbols-outlined mt-0.5 shrink-0 text-[16px]">warning</span>
            PayPal is not configured.
          </div>
        ) : (
          <PayPalScriptProvider key={paypalClientId} options={{ clientId: paypalClientId, currency: 'USD', intent: 'capture' }}>
            <PayPalButtons
              style={{ layout: 'vertical', shape: 'rect', label: 'pay', height: 44 }}
              disabled={payStatus === 'processing'}
              createOrder={handlePaypalCreate}
              onApprove={handlePaypalApprove}
              onError={handlePaypalError}
              onCancel={handlePaypalCancel}
            />
          </PayPalScriptProvider>
        )
      )}
      {gateway === GATEWAY_RAZORPAY && (
        !razorpayKeyId ? (
          <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800">
            <span className="material-symbols-outlined mt-0.5 shrink-0 text-[16px]">warning</span>
            Razorpay is not configured.
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-center text-xs text-slate-400">
              Approx. <strong className="text-slate-600">₹{Math.round(selectedPack.amountUsd * 84)}</strong>
            </p>
            <button
              type="button"
              disabled={payStatus === 'processing'}
              onClick={handleRazorpay}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#072654] py-3 text-sm font-bold text-white shadow-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {payStatus === 'processing' ? (
                <><span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>Processing…</>
              ) : (
                <><span className="material-symbols-outlined text-[18px]">payment</span>Pay with Razorpay</>
              )}
            </button>
          </div>
        )
      )}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function LinkedInGeneratorPage() {
  const navigate = useNavigate()
  const { user, refreshUser } = useAuth()
  const isIndia = detectIsIndia()

  // ── Step management ────────────────────────────────────────────────────────
  const [step, setStep] = useState('input') // input | details | payment | enriching | generating
  const [enrichStage, setEnrichStage] = useState(0)

  // ── URL input ──────────────────────────────────────────────────────────────
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [urlError, setUrlError] = useState('')
  const inputRef = useRef(null)

  // ── Profile details form ───────────────────────────────────────────────────
  const [profile, setProfile] = useState({
    fullName: '',
    headline: '',
    summary: '',
    location: '',
    currentPosition: '',
    currentCompany: '',
    profilePhotoUrl: '',
    bannerPhotoUrl: '',
    skills: '',
  })
  const [experience, setExperience] = useState([{ title: '', company: '', duration: '' }])
  const [education, setEducation] = useState([{ degree: '', school: '', year: '' }])

  // ── Errors ─────────────────────────────────────────────────────────────────
  const [lookupError, setLookupError] = useState('')
  const [genError, setGenError] = useState(null)
  const [busy, setBusy] = useState(false)

  // ── Payment ────────────────────────────────────────────────────────────────
  const [paypalClientId, setPaypalClientId] = useState('')
  const [razorpayKeyId, setRazorpayKeyId] = useState('')
  const [packs, setPacks] = useState([])
  const [selectedPack, setSelectedPack] = useState(null)
  const [loadingPacks, setLoadingPacks] = useState(false)
  const [gateway, setGateway] = useState(isIndia ? GATEWAY_RAZORPAY : GATEWAY_PAYPAL)
  const [payStatus, setPayStatus] = useState(null)
  const [payMessage, setPayMessage] = useState('')
  const rzpRef = useRef(null)

  // Derived: does user have publishing credits?
  const hasCredits = (user?.publishingCredits ?? 0) > 0

  // ── Validate LinkedIn URL ──────────────────────────────────────────────────
  function isValidLinkedInUrl(url) {
    try {
      const u = /^https?:\/\//i.test(url) ? url : 'https://' + url
      const p = new URL(u)
      return (p.hostname === 'linkedin.com' || p.hostname === 'www.linkedin.com') && p.pathname.startsWith('/in/')
    } catch { return false }
  }

  // ── Step 1: URL submitted → validate & go to details form ────────────────
  function handleUrlSubmit(e) {
    e.preventDefault()
    setUrlError('')
    const val = linkedinUrl.trim()
    if (!val) { setUrlError('Please paste your LinkedIn profile URL.'); return }
    const withProtocol = /^https?:\/\//i.test(val) ? val : 'https://' + val
    if (!isValidLinkedInUrl(withProtocol)) {
      setUrlError('Enter a LinkedIn profile URL like linkedin.com/in/your-name')
      return
    }
    setLinkedinUrl(withProtocol)
    trackEvent('linkedin_url_submitted', { url: withProtocol })
    setStep('details')
  }

  // ── Step 2: Details → check credits or show payment ───────────────────────
  function handleDetailsSubmit(e) {
    e.preventDefault()
    if (!profile.fullName.trim()) { return }
    if (hasCredits) {
      triggerGenerate()
    } else {
      // Load payment info then show payment step
      setLoadingPacks(true)
      setStep('payment')
      Promise.all([getPaypalClientId(), getRazorpayKeyId(), getTokenPacks()])
        .then(([ppId, rzpId, packList]) => {
          setPaypalClientId(ppId)
          setRazorpayKeyId(rzpId)
          setPacks(packList)
          setSelectedPack(packList.find((p) => p.popular) || packList[0] || null)
        })
        .catch(() => {})
        .finally(() => setLoadingPacks(false))
    }
  }

  // ── Payment handlers ───────────────────────────────────────────────────────
  const handlePaypalCreate = useCallback(async () => {
    if (!selectedPack) throw new Error('No pack selected')
    setPayStatus('processing'); setPayMessage('')
    const data = await createPaypalOrder(selectedPack.id)
    return data.orderId
  }, [selectedPack])

  const handlePaypalApprove = useCallback(async (data) => {
    try {
      await capturePaypalOrder(data.orderID)
      await refreshUser()
      setPayStatus('success')
      setPayMessage('Payment successful! Proceeding to generate your website…')
      setTimeout(() => triggerGenerate(), 1500)
    } catch (err) {
      setPayStatus('error')
      setPayMessage(err.message || 'Payment capture failed.')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshUser, selectedPack])

  const handlePaypalError = useCallback(() => {
    setPayStatus('error'); setPayMessage('Something went wrong with PayPal. Please try again.')
  }, [])

  const handlePaypalCancel = useCallback(() => {
    setPayStatus(null); setPayMessage('')
  }, [])

  const handleRazorpay = useCallback(async () => {
    if (!selectedPack) return
    setPayStatus('processing'); setPayMessage('')
    try {
      const loaded = await loadRazorpayScript()
      if (!loaded) throw new Error('Failed to load Razorpay checkout.')
      const order = await createRazorpayOrder(selectedPack.id)
      await new Promise((resolve, reject) => {
        rzpRef.current = new window.Razorpay({
          key: razorpayKeyId,
          amount: order.amountPaise,
          currency: 'INR',
          name: 'placetopage.com',
          description: `${selectedPack.label} — ${selectedPack.credits} website${selectedPack.credits !== 1 ? 's' : ''}`,
          order_id: order.orderId,
          handler: async (response) => {
            try {
              await verifyRazorpayPayment({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                paymentId: order.paymentId,
              })
              await refreshUser()
              setPayStatus('success')
              setPayMessage('Payment successful! Generating your website…')
              resolve()
              setTimeout(() => triggerGenerate(), 1500)
            } catch (err) {
              setPayStatus('error'); setPayMessage(err.message || 'Verification failed.'); reject(err)
            }
          },
          modal: { ondismiss: () => { setPayStatus(null); setPayMessage(''); resolve() } },
          prefill: { email: user?.email || '', name: user?.name || '' },
          theme: { color: '#0077b5' },
        })
        rzpRef.current.open()
      })
    } catch (err) {
      setPayStatus('error'); setPayMessage(err.message || 'Something went wrong.')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPack, razorpayKeyId, user, refreshUser])

  // ── Step 3: Generate site ──────────────────────────────────────────────────
  const triggerGenerate = useCallback(async () => {
    setLookupError('')
    setGenError(null)
    setEnrichStage(0)
    setBusy(true)
    setStep('enriching')

    const profileData = {
      fullName: profile.fullName.trim(),
      headline: profile.headline.trim(),
      summary: profile.summary.trim(),
      location: profile.location.trim(),
      currentPosition: profile.currentPosition.trim(),
      currentCompany: profile.currentCompany.trim(),
      profilePhotoUrl: profile.profilePhotoUrl.trim(),
      bannerPhotoUrl: profile.bannerPhotoUrl.trim(),
      skills: profile.skills.split(',').map((s) => s.trim()).filter(Boolean),
      experience: experience.filter((e) => e.title || e.company),
      education: education.filter((e) => e.degree || e.school),
      profileUrl: linkedinUrl,
    }

    try {
      // Validate URL via backend
      const lookupResult = await lookupLinkedIn(linkedinUrl, profileData)
      trackEvent('linkedin_lookup_success', { username: lookupResult.username })
      setStep('enriching')
      setEnrichStage(1)

      // AI enrichment
      const stageTimer = setInterval(() => setEnrichStage((s) => Math.min(s + 1, 3)), 1200)
      let ai = null
      try {
        ai = await enrichLinkedIn({ ...profileData, ...lookupResult })
      } catch { /* AI optional */ } finally {
        clearInterval(stageTimer)
        setEnrichStage(3)
      }

      setStep('generating')

      const site = await createSite({
        name: profileData.fullName,
        category: profileData.currentPosition || 'Professional',
        theme: 'light',
        thumbnailUrl: profileData.profilePhotoUrl || '',
        siteType: 'linkedin',
        placeData: {
          ...profileData,
          heroHeadline: ai?.heroHeadline || '',
          tagline: ai?.tagline || '',
          aboutSummary: ai?.aboutSummary || '',
          ctaText: ai?.ctaText || 'Get In Touch',
          seoDescription: ai?.seoDescription || '',
          highlights: ai?.highlights || [],
          suggestedSubdomainSlug: ai?.suggestedCustomSubdomain || '',
          subdomainSuggestionPhrase: ai?.subdomainSuggestionPhrase || '',
        },
      })

      trackEvent('linkedin_site_created', { site_id: site._id, name: profileData.fullName })
      navigate(`/dashboard/sites/${site._id}`, { replace: true })
    } catch (err) {
      trackEvent('linkedin_site_error', { error: err.message })
      setGenError(err.message || 'Failed to create site.')
      setStep('details')
    } finally {
      setBusy(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, experience, education, linkedinUrl, navigate])

  // ── Experience / education helpers ─────────────────────────────────────────
  function updateExp(idx, field, val) {
    setExperience((prev) => prev.map((e, i) => i === idx ? { ...e, [field]: val } : e))
  }
  function removeExp(idx) { setExperience((prev) => prev.filter((_, i) => i !== idx)) }
  function addExp() { setExperience((prev) => [...prev, { title: '', company: '', duration: '' }]) }

  function updateEdu(idx, field, val) {
    setEducation((prev) => prev.map((e, i) => i === idx ? { ...e, [field]: val } : e))
  }
  function removeEdu(idx) { setEducation((prev) => prev.filter((_, i) => i !== idx)) }
  function addEdu() { setEducation((prev) => [...prev, { degree: '', school: '', year: '' }]) }

  // ── Input field helper ─────────────────────────────────────────────────────
  function field(label, key, type = 'text', placeholder = '', required = false) {
    return (
      <div>
        <label className="mb-1.5 block text-xs font-semibold text-slate-600 uppercase tracking-wider">
          {label}{required && <span className="ml-0.5 text-red-500">*</span>}
        </label>
        {type === 'textarea' ? (
          <textarea
            rows={3}
            placeholder={placeholder}
            value={profile[key]}
            onChange={(e) => setProfile((p) => ({ ...p, [key]: e.target.value }))}
            className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#0077b5] focus:outline-none focus:ring-2 focus:ring-[#0077b5]/20"
          />
        ) : (
          <input
            type={type}
            required={required}
            placeholder={placeholder}
            value={profile[key]}
            onChange={(e) => setProfile((p) => ({ ...p, [key]: e.target.value }))}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#0077b5] focus:outline-none focus:ring-2 focus:ring-[#0077b5]/20"
          />
        )}
      </div>
    )
  }

  // ═════════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═════════════════════════════════════════════════════════════════════════════

  return (
    <div className="min-h-[calc(100dvh-64px)] bg-white font-body text-slate-900 antialiased">

      {/* ══════════════════════════════════════════════════════
          STEP 1: URL INPUT
      ══════════════════════════════════════════════════════ */}
      {step === 'input' && (
        <div className="relative flex min-h-[calc(100dvh-64px)] flex-col items-center justify-center px-4 py-14">

          {/* Ambient blobs */}
          <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute left-1/2 top-0 h-[480px] w-[680px] -translate-x-1/2 -translate-y-1/4 rounded-full blur-3xl" style={{ background: 'rgba(0,119,181,0.07)' }} />
            <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full blur-3xl" style={{ background: 'rgba(0,119,181,0.05)' }} />
          </div>

          <div className="relative w-full max-w-2xl">
            {/* Badge */}
            <div className="mb-6 flex justify-center">
              <span className="inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-xs font-bold uppercase tracking-widest" style={{ borderColor: 'rgba(0,119,181,0.25)', background: 'rgba(0,119,181,0.07)', color: '#0077b5' }}>
                <LinkedInIcon className="h-4 w-4" />
                LinkedIn Profile Website Builder
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-center font-headline text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl md:text-5xl">
              Turn your{' '}
              <span className="relative inline-block">
                <span className="relative z-10" style={{ color: '#0077b5' }}>LinkedIn Profile</span>
                <span aria-hidden className="absolute inset-x-0 bottom-1 z-0 h-3 rounded-full" style={{ background: 'rgba(0,119,181,0.12)' }} />
              </span>
              <br className="hidden sm:block" /> into a personal website
            </h1>
            <p className="mx-auto mt-4 max-w-lg text-center text-base text-slate-500 sm:text-lg">
              Paste your LinkedIn URL, fill in your details, and our AI will craft a stunning profile website — published live in minutes.
            </p>

            {/* Error */}
            {(lookupError || genError) && (
              <div className="mt-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm text-red-700">
                <span className="material-symbols-outlined mt-0.5 shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
                <span>{lookupError || genError}</span>
              </div>
            )}

            {/* URL input */}
            <form onSubmit={handleUrlSubmit} className="mt-8">
              <div className={`flex flex-col gap-2 rounded-2xl border-2 bg-white p-2 shadow-xl shadow-slate-200/70 transition-all duration-200 sm:flex-row sm:items-center ${urlError ? 'border-red-400' : 'border-slate-200'}`}
                style={{ '--tw-border-opacity': 1 }}
              >
                <div className="flex flex-1 items-center gap-2.5 px-3 py-1">
                  <LinkedInIcon className="h-5 w-5 shrink-0 text-slate-400" />
                  <input
                    ref={inputRef}
                    autoFocus
                    className="min-w-0 flex-1 border-none bg-transparent py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:ring-0 sm:text-base"
                    placeholder="linkedin.com/in/your-name"
                    type="text"
                    value={linkedinUrl}
                    onChange={(e) => { setLinkedinUrl(e.target.value); setUrlError('') }}
                  />
                  {linkedinUrl && (
                    <button type="button" onClick={() => { setLinkedinUrl(''); setUrlError(''); inputRef.current?.focus() }} className="shrink-0 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                      <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={busy}
                  className="flex shrink-0 items-center justify-center gap-2 rounded-xl px-6 py-3.5 font-headline text-base font-bold text-white shadow-md transition-all hover:brightness-110 active:scale-[0.97] disabled:opacity-60 sm:py-3"
                  style={{ background: '#0077b5' }}
                >
                  <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                  Build my website
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
              {['linkedin.com/in/username', 'www.linkedin.com/in/username'].map((fmt) => (
                <span key={fmt} className="rounded-full bg-slate-100 px-2.5 py-0.5 font-mono text-[11px] text-slate-500">{fmt}</span>
              ))}
            </div>

            {/* How it works */}
            <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {[
                { icon: 'person', num: '01', bg: 'bg-blue-50', iconColor: 'text-blue-600', title: 'Share your profile', desc: 'Paste your LinkedIn URL and fill in your details — no scraping, no login required.' },
                { icon: 'auto_awesome', num: '02', bg: 'bg-violet-50', iconColor: 'text-violet-600', title: 'AI writes your copy', desc: 'Claude AI crafts your headline, bio, and website content based on your profile.' },
                { icon: 'rocket_launch', num: '03', bg: 'bg-emerald-50', iconColor: 'text-emerald-600', title: 'Go live instantly', desc: 'Edit and publish your personal website on your own subdomain in minutes.' },
              ].map(({ icon, num, bg, iconColor, title, desc }) => (
                <div key={num} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="mb-3 flex items-center gap-3">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${bg}`}>
                      <span className={`material-symbols-outlined text-xl ${iconColor}`} style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
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

      {/* ══════════════════════════════════════════════════════
          STEP 2: PROFILE DETAILS FORM
      ══════════════════════════════════════════════════════ */}
      {step === 'details' && (
        <div className="mx-auto max-w-2xl px-4 pb-16 pt-8 sm:px-6">
          <div className="mb-8">
            <button
              type="button"
              onClick={() => setStep('input')}
              className="mb-4 flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              Back
            </button>
            <div className="flex items-center gap-3 mb-2">
              <LinkedInIcon className="h-7 w-7 shrink-0" style={{ color: '#0077b5' }} />
              <h1 className="font-headline text-2xl font-extrabold tracking-tight text-slate-900">Your Profile Details</h1>
            </div>
            <p className="text-sm text-slate-500">
              Fill in your details below — we'll use these to build your website. LinkedIn URL:{' '}
              <a href={linkedinUrl} target="_blank" rel="noopener noreferrer" className="font-mono text-xs text-[#0077b5] hover:underline break-all">{linkedinUrl}</a>
            </p>
          </div>

          {genError && (
            <div className="mb-4 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm text-red-700">
              <span className="material-symbols-outlined mt-0.5 shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
              {genError}
            </div>
          )}

          <form onSubmit={handleDetailsSubmit} className="space-y-6">

            {/* Basic info */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-500">Basic Info</h2>
              <div className="space-y-4">
                {field('Full Name', 'fullName', 'text', 'Jane Doe', true)}
                {field('Professional Headline', 'headline', 'text', 'Software Engineer at Google')}
                {field('Current Job Title', 'currentPosition', 'text', 'Senior Product Manager')}
                {field('Current Company', 'currentCompany', 'text', 'Acme Corp')}
                {field('Location', 'location', 'text', 'San Francisco, CA')}
              </div>
            </div>

            {/* About / Bio */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-500">About / Bio</h2>
              {field('Summary', 'summary', 'textarea', 'Write a short bio about yourself, your expertise, and what you\'re passionate about…')}
            </div>

            {/* Photos */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-500">Profile Photos (optional)</h2>
              <div className="space-y-4">
                {field('Profile Photo URL', 'profilePhotoUrl', 'url', 'https://media.licdn.com/dms/image/...')}
                {field('Banner/Cover Photo URL', 'bannerPhotoUrl', 'url', 'https://media.licdn.com/dms/image/...')}
              </div>
              <p className="mt-2 text-xs text-slate-400">Right-click your LinkedIn photo → "Copy image address" to get the URL</p>
            </div>

            {/* Experience */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-500">Work Experience (optional)</h2>
              <div className="space-y-2">
                {experience.map((e, i) => (
                  <ExperienceRow key={i} idx={i} value={e} onChange={updateExp} onRemove={removeExp} />
                ))}
              </div>
              <button type="button" onClick={addExp} className="mt-3 flex items-center gap-1.5 text-sm font-semibold" style={{ color: '#0077b5' }}>
                <span className="material-symbols-outlined text-[18px]">add_circle</span>
                Add experience
              </button>
            </div>

            {/* Education */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-500">Education (optional)</h2>
              <div className="space-y-2">
                {education.map((e, i) => (
                  <EducationRow key={i} idx={i} value={e} onChange={updateEdu} onRemove={removeEdu} />
                ))}
              </div>
              <button type="button" onClick={addEdu} className="mt-3 flex items-center gap-1.5 text-sm font-semibold" style={{ color: '#0077b5' }}>
                <span className="material-symbols-outlined text-[18px]">add_circle</span>
                Add education
              </button>
            </div>

            {/* Skills */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-500">Skills (optional)</h2>
              {field('Skills', 'skills', 'text', 'React, Node.js, Product Management, UX Design…')}
              <p className="mt-1.5 text-xs text-slate-400">Comma-separated list of skills</p>
            </div>

            {/* Credits notice */}
            {!hasCredits && (
              <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3.5 text-sm text-amber-800">
                <span className="material-symbols-outlined mt-0.5 shrink-0 text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>info</span>
                <span>You have no publishing credits. You'll need to purchase a pack before your site goes live. You can still preview and edit it for free.</span>
              </div>
            )}

            <button
              type="submit"
              disabled={!profile.fullName.trim() || busy}
              className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 font-headline text-base font-bold text-white shadow-md transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
              style={{ background: '#0077b5' }}
            >
              <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
              {hasCredits ? 'Generate my website' : 'Continue to payment'}
            </button>
          </form>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          STEP 3: PAYMENT
      ══════════════════════════════════════════════════════ */}
      {step === 'payment' && (
        <div className="mx-auto max-w-lg px-4 pb-16 pt-8 sm:px-6">
          <button type="button" onClick={() => setStep('details')} className="mb-4 flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800">
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Back to details
          </button>
          <h1 className="mb-1 font-headline text-2xl font-extrabold tracking-tight text-slate-900">Purchase a Website Credit</h1>
          <p className="mb-6 text-sm text-slate-500">Each credit publishes one site live on your subdomain.</p>

          {loadingPacks ? (
            <div className="flex items-center justify-center gap-3 py-12 text-slate-500">
              <span className="material-symbols-outlined animate-spin text-3xl" style={{ color: '#0077b5' }}>progress_activity</span>
              <p className="text-sm">Loading plans…</p>
            </div>
          ) : (
            <>
              {payStatus === 'success' && (
                <div className="mb-4 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3.5 text-sm text-emerald-700">
                  <span className="material-symbols-outlined mt-0.5 shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  {payMessage}
                </div>
              )}
              {/* Pack grid */}
              <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {packs.map((pack) => {
                  const selected = selectedPack?.id === pack.id
                  const savePct = Math.round((1 - pack.amountUsd / (5 * pack.credits)) * 100)
                  return (
                    <button
                      key={pack.id}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => { setSelectedPack(pack); setPayStatus(null); setPayMessage('') }}
                      className={`relative flex flex-col items-center rounded-2xl border-2 p-4 text-center transition-all active:scale-[0.97] ${selected ? 'shadow-md' : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'}`}
                      style={selected ? { borderColor: '#0077b5', background: 'rgba(0,119,181,0.05)' } : {}}
                    >
                      {pack.popular && (
                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-3 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white shadow-sm" style={{ background: '#0077b5' }}>
                          Most popular
                        </span>
                      )}
                      {savePct > 0 && (
                        <span className="mb-1.5 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">Save {savePct}%</span>
                      )}
                      <p className="mb-1 text-xs font-semibold text-slate-500">{pack.label}</p>
                      <p className="font-headline text-3xl font-extrabold leading-none tracking-tight" style={{ color: '#0077b5' }}>${pack.amountUsd}</p>
                      <p className="mt-1.5 text-sm font-semibold text-slate-700">{pack.credits} website{pack.credits !== 1 ? 's' : ''}</p>
                      <p className="mt-0.5 text-xs text-slate-400">${(pack.amountUsd / pack.credits).toFixed(2)} / site</p>
                      {selected && (
                        <span className="material-symbols-outlined absolute right-2.5 top-2.5 text-[18px]" style={{ fontVariationSettings: "'FILL' 1", color: '#0077b5' }}>check_circle</span>
                      )}
                    </button>
                  )
                })}
              </div>
              {/* Checkout */}
              {selectedPack && (
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <CheckoutInline
                    selectedPack={selectedPack}
                    gateway={gateway}
                    setGateway={setGateway}
                    payStatus={payStatus}
                    setPayStatus={setPayStatus}
                    payMessage={payMessage}
                    setPayMessage={setPayMessage}
                    paypalClientId={paypalClientId}
                    razorpayKeyId={razorpayKeyId}
                    handlePaypalCreate={handlePaypalCreate}
                    handlePaypalApprove={handlePaypalApprove}
                    handlePaypalError={handlePaypalError}
                    handlePaypalCancel={handlePaypalCancel}
                    handleRazorpay={handleRazorpay}
                  />
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          PROCESSING STEPS (enriching / generating)
      ══════════════════════════════════════════════════════ */}
      {(step === 'enriching' || step === 'generating') && (
        <div className="flex min-h-[calc(100dvh-64px)] flex-col items-center justify-center px-4 py-16">
          <div className="w-full max-w-sm">

            {step === 'enriching' && (
              <>
                <div className="relative mx-auto mb-8 flex h-24 w-24 items-center justify-center">
                  <div className="absolute inset-0 animate-ping rounded-full" style={{ background: 'rgba(0,119,181,0.12)' }} />
                  <div className="absolute inset-0 rounded-full" style={{ background: 'rgba(0,119,181,0.07)' }} />
                  <div className="absolute inset-0 animate-spin rounded-full border-4 border-t-transparent" style={{ borderColor: 'rgba(0,119,181,0.2)', borderTopColor: '#0077b5' }} />
                  <LinkedInIcon className="relative h-10 w-10" style={{ color: '#0077b5' }} />
                </div>
                <h2 className="text-center font-headline text-2xl font-extrabold tracking-tight text-slate-900">AI is building your profile…</h2>
                <p className="mt-2 text-center text-sm text-slate-500">Crafting your headline, bio, and personalised website copy.</p>
                <div className="mt-8 space-y-3.5">
                  <ProgressRow label="Profile data validated" sub="LinkedIn URL and profile details confirmed" state={enrichStage > 0 ? 'done' : 'active'} />
                  <ProgressRow label="Analysing your experience" sub="Understanding your career and expertise" state={enrichStage > 1 ? 'done' : enrichStage === 1 ? 'active' : 'pending'} />
                  <ProgressRow label="Generating copy & tagline" sub="Writing your headline, bio, and CTAs" state={enrichStage > 2 ? 'done' : enrichStage === 2 ? 'active' : 'pending'} />
                  <ProgressRow label="Preparing your site draft" sub="Next you'll land in Site settings to review" state={enrichStage > 3 ? 'done' : enrichStage === 3 ? 'active' : 'pending'} />
                </div>
              </>
            )}

            {step === 'generating' && (
              <>
                <div className="relative mx-auto mb-8 flex h-24 w-24 items-center justify-center">
                  <div className="absolute inset-0 animate-ping rounded-full bg-emerald-500/15" />
                  <div className="absolute inset-0 rounded-full bg-emerald-500/8" />
                  <div className="absolute inset-0 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-500" />
                  <span className="relative material-symbols-outlined text-[36px] text-emerald-600" style={{ fontVariationSettings: "'FILL' 1" }}>rocket_launch</span>
                </div>
                <h2 className="text-center font-headline text-2xl font-extrabold tracking-tight text-slate-900">Creating your website…</h2>
                <p className="mt-2 text-center text-sm text-slate-500">Almost there — saving your draft site.</p>
                <div className="mt-8 space-y-3.5">
                  <ProgressRow label="Profile validated" sub="LinkedIn data confirmed" state="done" />
                  <ProgressRow label="AI content ready" sub="Copy and highlights generated" state="done" />
                  <ProgressRow label="Saving your draft" sub="Generating HTML and storing your site" state="active" />
                  <ProgressRow label="Opening Site settings" sub="Customise and go live from there" state="pending" />
                </div>
              </>
            )}

          </div>
        </div>
      )}

    </div>
  )
}
