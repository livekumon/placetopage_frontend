import { useCallback, useEffect, useRef, useState } from 'react'
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

/** Detect India via browser timezone — fast, no network call needed */
function detectIsIndia() {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    return tz === 'Asia/Calcutta' || tz === 'Asia/Kolkata'
  } catch {
    return false
  }
}

/** Dynamically load the Razorpay checkout script once */
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

function PerSiteLabel({ pack }) {
  const perSite = (pack.amountUsd / pack.credits).toFixed(2)
  const savePct = Math.round((1 - pack.amountUsd / (5 * pack.credits)) * 100)
  return (
    <span className="pack-per-credit">
      ${perSite} / website
      {savePct > 0 && <span className="pack-save-badge">Save {savePct}%</span>}
    </span>
  )
}

const GATEWAY_PAYPAL = 'paypal'
const GATEWAY_RAZORPAY = 'razorpay'

export default function PurchaseTokensPage() {
  const { user, refreshUser } = useAuth()
  const isIndia = detectIsIndia()

  const [paypalClientId, setPaypalClientId] = useState('')
  const [razorpayKeyId, setRazorpayKeyId] = useState('')
  const [packs, setPacks] = useState([])
  const [selectedPack, setSelectedPack] = useState(null)
  const [gateway, setGateway] = useState(isIndia ? GATEWAY_RAZORPAY : GATEWAY_PAYPAL)
  const [loadingPacks, setLoadingPacks] = useState(true)
  const [payStatus, setPayStatus] = useState(null) // null | 'processing' | 'success' | 'error'
  const [payMessage, setPayMessage] = useState('')
  const [newCredits, setNewCredits] = useState(null)
  const rzpRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [ppId, rzpId, packList] = await Promise.all([
          getPaypalClientId(),
          getRazorpayKeyId(),
          getTokenPacks(),
        ])
        if (cancelled) return
        setPaypalClientId(ppId)
        setRazorpayKeyId(rzpId)
        setPacks(packList)
        setSelectedPack(packList.find((p) => p.popular) || packList[0] || null)
      } catch {
        // silently degrade
      } finally {
        if (!cancelled) setLoadingPacks(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  // ── PayPal handlers ───────────────────────────────────────────────────────
  const handlePaypalCreate = useCallback(async () => {
    if (!selectedPack) throw new Error('No pack selected')
    setPayStatus('processing')
    setPayMessage('')
    const data = await createPaypalOrder(selectedPack.id)
    return data.orderId
  }, [selectedPack])

  const handlePaypalApprove = useCallback(async (data) => {
    try {
      const result = await capturePaypalOrder(data.orderID)
      await refreshUser()
      setNewCredits(result.user?.publishingCredits ?? null)
      setPayStatus('success')
      setPayMessage(
        `Payment successful! ${result.payment?.publishingCreditsGranted ?? ''} website${
          result.payment?.publishingCreditsGranted !== 1 ? 's' : ''
        } added to your account.`
      )
    } catch (err) {
      setPayStatus('error')
      setPayMessage(err.message || 'Payment capture failed. Please contact support.')
    }
  }, [refreshUser])

  const handlePaypalError = useCallback((err) => {
    console.error('PayPal error', err)
    setPayStatus('error')
    setPayMessage('Something went wrong with PayPal. Please try again.')
  }, [])

  const handlePaypalCancel = useCallback(() => {
    setPayStatus(null)
    setPayMessage('')
  }, [])

  // ── Razorpay handler ──────────────────────────────────────────────────────
  const handleRazorpay = useCallback(async () => {
    if (!selectedPack) return
    setPayStatus('processing')
    setPayMessage('')
    try {
      const loaded = await loadRazorpayScript()
      if (!loaded) throw new Error('Failed to load Razorpay checkout. Check your connection.')

      const order = await createRazorpayOrder(selectedPack.id)

      await new Promise((resolve, reject) => {
        const options = {
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
              setPayStatus('success')
              setPayMessage(
                `Payment successful! ${result.payment?.publishingCreditsGranted ?? ''} website${
                  result.payment?.publishingCreditsGranted !== 1 ? 's' : ''
                } added to your account.`
              )
              resolve()
            } catch (err) {
              setPayStatus('error')
              setPayMessage(err.message || 'Payment verification failed. Contact support.')
              reject(err)
            }
          },
          modal: {
            ondismiss: () => {
              setPayStatus(null)
              setPayMessage('')
              resolve()
            },
          },
          prefill: {
            email: user?.email || '',
            name: user?.name || '',
          },
          theme: { color: '#1a56ff' },
        }
        rzpRef.current = new window.Razorpay(options)
        rzpRef.current.open()
      })
    } catch (err) {
      setPayStatus('error')
      setPayMessage(err.message || 'Something went wrong. Please try again.')
    }
  }, [selectedPack, razorpayKeyId, user, refreshUser])

  const resetAndBuyMore = () => {
    setPayStatus(null)
    setPayMessage('')
    setNewCredits(null)
  }

  if (loadingPacks) {
    return (
      <div className="pt-page pt-page--loading">
        <span className="material-symbols-outlined spinning">progress_activity</span>
        <p>Loading plans…</p>
      </div>
    )
  }

  const credits = newCredits !== null ? newCredits : (user?.publishingCredits ?? 0)

  return (
    <div className="pt-page">
      <header className="pt-page__header">
        <h1 className="pt-page__title">Purchase Websites</h1>
        <p className="pt-page__subtitle">
          Each website lets you publish one site live on <strong>placetopage.com</strong>
        </p>
        {user && (
          <div className="pt-balance-chip">
            <span className="material-symbols-outlined">language</span>
            <span>{credits} website{credits !== 1 ? 's' : ''} remaining</span>
          </div>
        )}
      </header>

      {payStatus === 'success' ? (
        <div className="pt-result pt-result--success">
          <span className="material-symbols-outlined pt-result__icon">check_circle</span>
          <h2>You're all set!</h2>
          <p>{payMessage}</p>
          {newCredits !== null && (
            <p className="pt-result__balance">
              Your balance is now <strong>{newCredits} website{newCredits !== 1 ? 's' : ''}</strong>.
            </p>
          )}
          <button className="pt-btn pt-btn--primary" onClick={resetAndBuyMore}>
            Buy more websites
          </button>
        </div>
      ) : (
        <>
          {/* Pack grid */}
          <div className="pt-packs">
            {packs.map((pack) => {
              const isSelected = selectedPack?.id === pack.id
              const savePct = Math.round((1 - pack.amountUsd / (5 * pack.credits)) * 100)
              return (
                <button
                  key={pack.id}
                  className={`pt-pack${isSelected ? ' pt-pack--selected' : ''}${pack.popular ? ' pt-pack--popular' : ''}`}
                  onClick={() => { setSelectedPack(pack); setPayStatus(null); setPayMessage('') }}
                  aria-pressed={isSelected}
                >
                  {pack.popular && <div className="pt-pack__badge">Most popular</div>}
                  <div className="pt-pack__label">{pack.label}</div>
                  <div className="pt-pack__price">
                    <span className="pt-pack__amount">${pack.amountUsd}</span>
                  </div>
                  <div className="pt-pack__credits">
                    {pack.credits} website{pack.credits !== 1 ? 's' : ''}
                  </div>
                  <div className="pt-pack__meta">
                    <PerSiteLabel pack={pack} />
                  </div>
                  {savePct > 0 && (
                    <div className="pt-pack__saving">Save ${5 * pack.credits - pack.amountUsd}</div>
                  )}
                  <p className="pt-pack__desc">{pack.description}</p>
                </button>
              )
            })}
          </div>

          {selectedPack && (
            <div className="pt-checkout">
              <p className="pt-checkout__summary">
                You selected <strong>{selectedPack.label}</strong> —{' '}
                {selectedPack.credits} website{selectedPack.credits !== 1 ? 's' : ''} for{' '}
                <strong>${selectedPack.amountUsd}</strong>
              </p>

              {/* Gateway toggle */}
              <div className="pt-gateway-toggle" role="group" aria-label="Payment method">
                <button
                  type="button"
                  className={`pt-gateway-btn${gateway === GATEWAY_PAYPAL ? ' pt-gateway-btn--active' : ''}`}
                  onClick={() => { setGateway(GATEWAY_PAYPAL); setPayStatus(null); setPayMessage('') }}
                >
                  <img src="https://www.paypalobjects.com/webstatic/mktg/logo/pp_cc_mark_111x69.jpg" alt="PayPal" className="pt-gateway-logo" />
                  <div className="pt-gateway-info">
                    <span className="pt-gateway-name">PayPal</span>
                    <span className="pt-gateway-region">USA &amp; worldwide</span>
                  </div>
                </button>

                <button
                  type="button"
                  className={`pt-gateway-btn${gateway === GATEWAY_RAZORPAY ? ' pt-gateway-btn--active' : ''}`}
                  onClick={() => { setGateway(GATEWAY_RAZORPAY); setPayStatus(null); setPayMessage('') }}
                >
                  <img src="https://razorpay.com/assets/razorpay-logo.svg" alt="Razorpay" className="pt-gateway-logo pt-gateway-logo--rzp" />
                  <div className="pt-gateway-info">
                    <span className="pt-gateway-name">Razorpay</span>
                    <span className="pt-gateway-region">India (INR)</span>
                  </div>
                </button>
              </div>

              {payStatus === 'error' && (
                <div className="pt-alert pt-alert--error">
                  <span className="material-symbols-outlined">error</span>
                  {payMessage}
                </div>
              )}

              {/* PayPal flow */}
              {gateway === GATEWAY_PAYPAL && (
                !paypalClientId ? (
                  <div className="pt-alert pt-alert--warn">
                    <span className="material-symbols-outlined">warning</span>
                    PayPal is not configured. Please contact the administrator.
                  </div>
                ) : (
                  <div className="pt-paypal-wrap">
                    <PayPalScriptProvider
                      key={paypalClientId}
                      options={{ clientId: paypalClientId, currency: 'USD', intent: 'capture' }}
                    >
                      <PayPalButtons
                        style={{ layout: 'vertical', shape: 'rect', label: 'pay', height: 48 }}
                        disabled={payStatus === 'processing'}
                        createOrder={handlePaypalCreate}
                        onApprove={handlePaypalApprove}
                        onError={handlePaypalError}
                        onCancel={handlePaypalCancel}
                      />
                    </PayPalScriptProvider>
                  </div>
                )
              )}

              {/* Razorpay flow */}
              {gateway === GATEWAY_RAZORPAY && (
                !razorpayKeyId ? (
                  <div className="pt-alert pt-alert--warn">
                    <span className="material-symbols-outlined">warning</span>
                    Razorpay is not configured. Please contact the administrator.
                  </div>
                ) : (
                  <div className="pt-razorpay-wrap">
                    <p className="pt-razorpay-note">
                      You'll be charged{' '}
                      <strong>₹{Math.round(selectedPack.amountUsd * 84)}</strong>{' '}
                      (approx. at current exchange rate)
                    </p>
                    <button
                      type="button"
                      disabled={payStatus === 'processing'}
                      onClick={handleRazorpay}
                      className="pt-rzp-btn"
                    >
                      {payStatus === 'processing' ? (
                        <>
                          <span className="material-symbols-outlined spinning-sm">progress_activity</span>
                          Processing…
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined">payment</span>
                          Pay with Razorpay
                        </>
                      )}
                    </button>
                  </div>
                )
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
