import { useCallback, useEffect, useRef, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
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
import { trackBeginCheckout, trackPackSelect, trackPurchase, trackClick, trackEvent, trackViewPricing } from '../utils/analytics'

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

// ── Pack card ─────────────────────────────────────────────────────────────────
function PackCard({ pack, selected, onSelect }) {
  const perSite = (pack.amountUsd / pack.credits).toFixed(2)
  const savePct = Math.round((1 - pack.amountUsd / (5 * pack.credits)) * 100)

  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={`relative flex flex-col items-center rounded-2xl border-2 p-4 text-center transition-all active:scale-[0.97] ${
        selected
          ? 'border-primary bg-primary/5 shadow-md shadow-primary/10'
          : 'border-slate-200 bg-white hover:border-primary/40 hover:shadow-sm dark:border-slate-700 dark:bg-slate-800'
      }`}
    >
      {/* Popular badge */}
      {pack.popular && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-primary px-3 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white shadow-sm">
          Most popular
        </span>
      )}

      {/* Save badge */}
      {savePct > 0 && (
        <span className="mb-1.5 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
          Save {savePct}%
        </span>
      )}

      <p className="mb-1 text-xs font-semibold text-slate-500 dark:text-slate-400">{pack.label}</p>

      {/* Price */}
      <p className="font-headline text-3xl font-extrabold leading-none tracking-tight text-primary">
        ${pack.amountUsd}
      </p>

      {/* Credits */}
      <p className="mt-1.5 text-sm font-semibold text-slate-700 dark:text-slate-200">
        {pack.credits} website{pack.credits !== 1 ? 's' : ''}
      </p>

      {/* Per-site cost */}
      <p className="mt-0.5 text-xs text-slate-400">
        ${perSite} / site
      </p>

      {/* Selected tick */}
      {selected && (
        <span
          className="material-symbols-outlined absolute right-2.5 top-2.5 text-[18px] text-primary"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          check_circle
        </span>
      )}
    </button>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function PurchaseTokensPage() {
  const { user, refreshUser } = useAuth()
  const isIndia = detectIsIndia()

  const [paypalClientId, setPaypalClientId] = useState('')
  const [razorpayKeyId, setRazorpayKeyId] = useState('')
  const [packs, setPacks] = useState([])
  const [selectedPack, setSelectedPack] = useState(null)
  const [gateway, setGateway] = useState(isIndia ? GATEWAY_RAZORPAY : GATEWAY_PAYPAL)
  const [loadingPacks, setLoadingPacks] = useState(true)
  const [payStatus, setPayStatus] = useState(null)
  const [payMessage, setPayMessage] = useState('')
  const [newCredits, setNewCredits] = useState(null)
  const rzpRef = useRef(null)

  useEffect(() => { trackViewPricing() }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [ppId, rzpId, packList] = await Promise.all([
          getPaypalClientId(), getRazorpayKeyId(), getTokenPacks(),
        ])
        if (cancelled) return
        setPaypalClientId(ppId)
        setRazorpayKeyId(rzpId)
        setPacks(packList)
        setSelectedPack(packList.find((p) => p.popular) || packList[0] || null)
      } catch { /* silently degrade */ } finally {
        if (!cancelled) setLoadingPacks(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  // ── PayPal ────────────────────────────────────────────────────────────────
  const handlePaypalCreate = useCallback(async () => {
    if (!selectedPack) throw new Error('No pack selected')
    setPayStatus('processing'); setPayMessage('')
    trackBeginCheckout(selectedPack, GATEWAY_PAYPAL)
    const data = await createPaypalOrder(selectedPack.id)
    return data.orderId
  }, [selectedPack])

  const handlePaypalApprove = useCallback(async (data) => {
    try {
      const result = await capturePaypalOrder(data.orderID)
      await refreshUser()
      setNewCredits(result.user?.publishingCredits ?? null)
      trackPurchase(selectedPack, GATEWAY_PAYPAL, data.orderID)
      setPayStatus('success')
      setPayMessage(`Payment successful! ${result.payment?.publishingCreditsGranted ?? ''} website${result.payment?.publishingCreditsGranted !== 1 ? 's' : ''} added.`)
    } catch (err) {
      trackEvent('payment_error', { gateway: GATEWAY_PAYPAL, error: err.message })
      setPayStatus('error')
      setPayMessage(err.message || 'Payment capture failed. Please contact support.')
    }
  }, [refreshUser, selectedPack])

  const handlePaypalError = useCallback(() => {
    trackEvent('payment_error', { gateway: GATEWAY_PAYPAL, error: 'paypal_sdk_error' })
    setPayStatus('error'); setPayMessage('Something went wrong with PayPal. Please try again.')
  }, [])

  const handlePaypalCancel = useCallback(() => {
    trackEvent('payment_cancel', { gateway: GATEWAY_PAYPAL })
    setPayStatus(null); setPayMessage('')
  }, [])

  // ── Razorpay ──────────────────────────────────────────────────────────────
  const handleRazorpay = useCallback(async () => {
    if (!selectedPack) return
    setPayStatus('processing'); setPayMessage('')
    trackBeginCheckout(selectedPack, GATEWAY_RAZORPAY)
    try {
      const loaded = await loadRazorpayScript()
      if (!loaded) throw new Error('Failed to load Razorpay checkout.')
      const order = await createRazorpayOrder(selectedPack.id)
      await new Promise((resolve, reject) => {
        rzpRef.current = new window.Razorpay({
          key: razorpayKeyId,
          amount: order.amountPaise,
          currency: 'INR',
          name: 'Place to Page',
          description: `${selectedPack.label} — ${selectedPack.credits} website${selectedPack.credits !== 1 ? 's' : ''}`,
          order_id: order.orderId,
          handler: async (response) => {
            try {
              const result = await verifyRazorpayPayment({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                paymentId: order.paymentId,
              })
              await refreshUser()
              setNewCredits(result.user?.publishingCredits ?? null)
              trackPurchase(selectedPack, GATEWAY_RAZORPAY, response.razorpay_order_id)
              setPayStatus('success')
              setPayMessage(`Payment successful! ${result.payment?.publishingCreditsGranted ?? ''} website${result.payment?.publishingCreditsGranted !== 1 ? 's' : ''} added.`)
              resolve()
            } catch (err) {
              trackEvent('payment_error', { gateway: GATEWAY_RAZORPAY, error: err.message })
              setPayStatus('error'); setPayMessage(err.message || 'Verification failed. Contact support.'); reject(err)
            }
          },
          modal: { ondismiss: () => { trackEvent('payment_cancel', { gateway: GATEWAY_RAZORPAY }); setPayStatus(null); setPayMessage(''); resolve() } },
          prefill: { email: user?.email || '', name: user?.name || '' },
          theme: { color: '#1a56ff' },
        })
        rzpRef.current.open()
      })
    } catch (err) {
      trackEvent('payment_error', { gateway: GATEWAY_RAZORPAY, error: err.message })
      setPayStatus('error'); setPayMessage(err.message || 'Something went wrong. Please try again.')
    }
  }, [selectedPack, razorpayKeyId, user, refreshUser])

  const resetAndBuyMore = () => { setPayStatus(null); setPayMessage(''); setNewCredits(null) }

  const credits = newCredits !== null ? newCredits : (user?.publishingCredits ?? 0)

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loadingPacks) {
    return (
      <div className="flex min-h-[calc(100dvh-64px)] flex-col items-center justify-center gap-3 text-on-surface-variant">
        <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
        <p className="text-sm">Loading plans…</p>
      </div>
    )
  }

  // ── Success screen ────────────────────────────────────────────────────────
  if (payStatus === 'success') {
    return (
      <div className="flex min-h-[calc(100dvh-64px)] flex-col items-center justify-center px-4 py-16 text-center">
        <span
          className="material-symbols-outlined mb-4 text-[72px] text-emerald-500"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          check_circle
        </span>
        <h2 className="font-headline text-2xl font-extrabold text-slate-900 dark:text-white">You're all set!</h2>
        <p className="mt-2 max-w-sm text-sm text-slate-500">{payMessage}</p>
        {newCredits !== null && (
          <p className="mt-3 text-base font-semibold text-slate-800 dark:text-slate-100">
            Balance: <span className="text-primary">{newCredits} website{newCredits !== 1 ? 's' : ''}</span>
          </p>
        )}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            onClick={resetAndBuyMore}
            className="rounded-full bg-primary px-6 py-3 text-sm font-bold text-white shadow-md transition-all hover:brightness-110 active:scale-[0.97]"
          >
            Buy more websites
          </button>
          <Link
            to="/dashboard"
            className="rounded-full border border-slate-200 px-6 py-3 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  // ── Main ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-[calc(100dvh-64px)] bg-slate-50 dark:bg-slate-950">

      {/* Mobile logo bar — hidden on desktop (sidebar already shows logo) */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 lg:hidden dark:border-slate-800 dark:bg-slate-900">
        <Link to="/" className="flex items-center gap-2 rounded-lg p-1" aria-label="Home">
          <img src="/logo.png" alt="Place to Page" className="h-8 w-8 rounded-lg object-contain" />
          <span className="font-manrope text-base font-bold tracking-tighter text-slate-900 dark:text-white">Place to Page</span>
        </Link>
        <Link to="/dashboard" className="flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-500 dark:border-slate-700">
          <span className="material-symbols-outlined text-[15px]">dashboard</span>
          Dashboard
        </Link>
      </div>

      <div className="mx-auto max-w-2xl px-4 pb-48 pt-8 sm:px-6 lg:pb-12">

        {/* ── Page header ── */}
        <div className="mb-8 text-center">
          <h1 className="font-headline text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            Purchase Websites
          </h1>
          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
            Each website publishes one site live on <strong className="text-slate-700 dark:text-slate-200">placetopage.com</strong>
          </p>
          {user && (
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
              <span className="material-symbols-outlined text-[18px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>language</span>
              {credits} website{credits !== 1 ? 's' : ''} remaining
            </div>
          )}
        </div>

        {/* ── Pack grid — 2 columns on mobile, 4 on lg ── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {packs.map((pack) => (
            <PackCard
              key={pack.id}
              pack={pack}
              selected={selectedPack?.id === pack.id}
              onSelect={() => { setSelectedPack(pack); trackPackSelect(pack); setPayStatus(null); setPayMessage('') }}
            />
          ))}
        </div>

        {/* ── Trust row ── */}
        <div className="mt-5 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-500 sm:gap-6 dark:text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px] text-emerald-600" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
            Secure checkout via Stripe
          </span>
          <span className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px] text-blue-600" style={{ fontVariationSettings: "'FILL' 1" }}>shield</span>
            Refund policy
          </span>
          <span className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px] text-amber-500" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
            Used by 2,400+ businesses
          </span>
        </div>

        {/* ── Checkout — fixed bottom sheet on mobile, inline card on desktop ── */}
        {selectedPack && (
          <>
            {/* Mobile: fixed bottom panel */}
            <div className="fixed bottom-16 left-0 right-0 z-50 border-t border-slate-200 bg-white px-4 pb-4 pt-3 shadow-2xl shadow-slate-900/20 dark:border-slate-700 dark:bg-slate-900 lg:hidden">
              <CheckoutPanel
                selectedPack={selectedPack}
                gateway={gateway}
                setGateway={setGateway}
                setPayStatus={setPayStatus}
                setPayMessage={setPayMessage}
                payStatus={payStatus}
                payMessage={payMessage}
                paypalClientId={paypalClientId}
                razorpayKeyId={razorpayKeyId}
                handlePaypalCreate={handlePaypalCreate}
                handlePaypalApprove={handlePaypalApprove}
                handlePaypalError={handlePaypalError}
                handlePaypalCancel={handlePaypalCancel}
                handleRazorpay={handleRazorpay}
              />
            </div>

            {/* Desktop: inline card below packs */}
            <div className="mt-6 hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900 lg:block">
              <div className="px-6 py-5">
                <CheckoutPanel
                  selectedPack={selectedPack}
                  gateway={gateway}
                  setGateway={setGateway}
                  setPayStatus={setPayStatus}
                  setPayMessage={setPayMessage}
                  payStatus={payStatus}
                  payMessage={payMessage}
                  paypalClientId={paypalClientId}
                  razorpayKeyId={razorpayKeyId}
                  handlePaypalCreate={handlePaypalCreate}
                  handlePaypalApprove={handlePaypalApprove}
                  handlePaypalError={handlePaypalError}
                  handlePaypalCancel={handlePaypalCancel}
                  handleRazorpay={handleRazorpay}
                />
              </div>
            </div>
          </>
        )}

        {/* ── FAQ Accordion ── */}
        <FaqAccordion />
      </div>
    </div>
  )
}

// ── FAQ Accordion ──────────────────────────────────────────────────────────────
const FAQ_ITEMS = [
  {
    q: 'What happens when I run out of credits?',
    a: 'You can still browse your dashboard and edit existing sites. To generate or publish a new site you\'ll need to purchase additional credits. Your existing live sites remain online regardless of your credit balance.',
  },
  {
    q: 'Can I get a refund?',
    a: 'Yes — if you haven\'t used a credit yet, we\'re happy to issue a full refund within 14 days of purchase. Once a credit has been used to publish a site, that credit is non-refundable. Contact support@place2page.com for refund requests.',
  },
  {
    q: 'Do credits expire?',
    a: 'No. Credits never expire. Purchase them now and use them whenever you\'re ready — there\'s no time limit.',
  },
  {
    q: 'What\'s included in a generated site?',
    a: 'Every generated site includes a custom design based on your business photos and branding, SEO-optimised copy pulled from your Google Maps listing, a mobile-responsive layout, a free subdomain on placetopage.com, built-in analytics, and unlimited future edits.',
  },
]

function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState(null)

  return (
    <section className="mt-10">
      <h2 className="mb-4 text-center font-headline text-lg font-extrabold text-slate-900 dark:text-white">
        Frequently asked questions
      </h2>
      <div className="divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:divide-slate-700 dark:border-slate-700 dark:bg-slate-900">
        {FAQ_ITEMS.map((item, i) => {
          const isOpen = openIndex === i
          return (
            <div key={i}>
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : i)}
                className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-50 dark:text-slate-100 dark:hover:bg-slate-800"
                aria-expanded={isOpen}
              >
                {item.q}
                <span
                  className={`material-symbols-outlined shrink-0 text-[20px] text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                >
                  expand_more
                </span>
              </button>
              {isOpen && (
                <div className="px-5 pb-4 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  {item.a}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}

// ── Checkout panel (shared between mobile sheet and desktop card) ──────────────
function CheckoutPanel({
  selectedPack, gateway, setGateway, setPayStatus, setPayMessage,
  payStatus, payMessage, paypalClientId, razorpayKeyId,
  handlePaypalCreate, handlePaypalApprove, handlePaypalError, handlePaypalCancel, handleRazorpay,
}) {
  return (
    <div className="space-y-3">
      {/* Summary pill */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
          {selectedPack.credits} website{selectedPack.credits !== 1 ? 's' : ''}
          <span className="mx-2 text-slate-300">·</span>
          <span className="text-primary">${selectedPack.amountUsd}</span>
        </p>
        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500 dark:bg-slate-800">
          {selectedPack.label}
        </span>
      </div>

      {/* Gateway toggle */}
      <div className="grid grid-cols-2 gap-2" role="group" aria-label="Payment method">
        <button
          type="button"
          onClick={() => { setGateway(GATEWAY_PAYPAL); setPayStatus(null); setPayMessage('') }}
          className={`flex items-center gap-2.5 rounded-xl border-2 px-3 py-2.5 transition-all ${
            gateway === GATEWAY_PAYPAL
              ? 'border-primary bg-primary/5 shadow-sm'
              : 'border-slate-200 bg-slate-50 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800'
          }`}
        >
          <img
            src="https://www.paypalobjects.com/webstatic/mktg/logo/pp_cc_mark_111x69.jpg"
            alt="PayPal"
            className="h-6 w-auto flex-shrink-0 object-contain"
          />
          <div className="text-left">
            <p className="text-xs font-bold text-slate-800 dark:text-slate-100">PayPal</p>
            <p className="text-[10px] text-slate-400">USD · Worldwide</p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => { setGateway(GATEWAY_RAZORPAY); setPayStatus(null); setPayMessage('') }}
          className={`flex items-center gap-2.5 rounded-xl border-2 px-3 py-2.5 transition-all ${
            gateway === GATEWAY_RAZORPAY
              ? 'border-primary bg-primary/5 shadow-sm'
              : 'border-slate-200 bg-slate-50 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800'
          }`}
        >
          <img
            src="https://razorpay.com/assets/razorpay-logo.svg"
            alt="Razorpay"
            className="h-5 w-auto flex-shrink-0 object-contain"
            style={{ maxWidth: 72 }}
          />
          <div className="text-left">
            <p className="text-xs font-bold text-slate-800 dark:text-slate-100">Razorpay</p>
            <p className="text-[10px] text-slate-400">INR · India</p>
          </div>
        </button>
      </div>

      {/* Error */}
      {payStatus === 'error' && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
          <span className="material-symbols-outlined mt-0.5 shrink-0 text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
          {payMessage}
        </div>
      )}

      {/* PayPal */}
      {gateway === GATEWAY_PAYPAL && (
        !paypalClientId ? (
          <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800">
            <span className="material-symbols-outlined mt-0.5 shrink-0 text-[16px]">warning</span>
            PayPal is not configured. Please contact the administrator.
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

      {/* Razorpay */}
      {gateway === GATEWAY_RAZORPAY && (
        !razorpayKeyId ? (
          <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800">
            <span className="material-symbols-outlined mt-0.5 shrink-0 text-[16px]">warning</span>
            Razorpay is not configured. Please contact the administrator.
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-center text-xs text-slate-400">
              You'll be charged approx. <strong className="text-slate-600 dark:text-slate-300">₹{Math.round(selectedPack.amountUsd * 84)}</strong>
            </p>
            <button
              type="button"
              disabled={payStatus === 'processing'}
              onClick={handleRazorpay}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#072654] py-3 text-sm font-bold text-white shadow-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {payStatus === 'processing' ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                  Processing…
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">payment</span>
                  Pay with Razorpay
                </>
              )}
            </button>
          </div>
        )
      )}
    </div>
  )
}
