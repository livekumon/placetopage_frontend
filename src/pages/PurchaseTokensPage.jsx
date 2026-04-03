import { useCallback, useEffect, useState } from 'react'
import { PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js'
import { capturePaypalOrder, createPaypalOrder, getPaypalClientId, getTokenPacks } from '../api/client'
import { useAuth } from '../context/AuthContext'

function PerCreditLabel({ pack }) {
  const perSite = (pack.amountUsd / pack.credits).toFixed(2)
  const basePrice = 5
  const savePct = Math.round((1 - pack.amountUsd / (basePrice * pack.credits)) * 100)
  return (
    <span className="pack-per-credit">
      ${perSite} / website
      {savePct > 0 && <span className="pack-save-badge">Save {savePct}%</span>}
    </span>
  )
}

export default function PurchaseTokensPage() {
  const { user, refreshUser } = useAuth()
  const [clientId, setClientId] = useState('')
  const [packs, setPacks] = useState([])
  const [selectedPack, setSelectedPack] = useState(null)
  const [loadingPacks, setLoadingPacks] = useState(true)
  const [payStatus, setPayStatus] = useState(null) // null | 'processing' | 'success' | 'error'
  const [payMessage, setPayMessage] = useState('')
  const [newCredits, setNewCredits] = useState(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [id, packList] = await Promise.all([getPaypalClientId(), getTokenPacks()])
        if (cancelled) return
        setClientId(id)
        setPacks(packList)
        const popular = packList.find((p) => p.popular) || packList[0]
        setSelectedPack(popular || null)
      } catch {
        // silently degrade
      } finally {
        if (!cancelled) setLoadingPacks(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const handleCreateOrder = useCallback(async () => {
    if (!selectedPack) throw new Error('No pack selected')
    setPayStatus('processing')
    setPayMessage('')
    const data = await createPaypalOrder(selectedPack.id)
    return data.orderId
  }, [selectedPack])

  const handleApprove = useCallback(
    async (data) => {
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
    },
    [refreshUser]
  )

  const handleError = useCallback((err) => {
    console.error('PayPal error', err)
    setPayStatus('error')
    setPayMessage('Something went wrong with PayPal. Please try again.')
  }, [])

  const handleCancel = useCallback(() => {
    setPayStatus(null)
    setPayMessage('')
  }, [])

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

  return (
    <div className="pt-page">
      <header className="pt-page__header">
        <h1 className="pt-page__title">Purchase Websites</h1>
        <p className="pt-page__subtitle">
          Each website lets you publish one site live on{' '}
          <strong>placetopage.com</strong>
        </p>
        {user && (
          <div className="pt-balance-chip">
            <span className="material-symbols-outlined">language</span>
            <span>
              {newCredits !== null ? newCredits : (user.publishingCredits ?? 0)} website
              {(newCredits !== null ? newCredits : (user.publishingCredits ?? 0)) !== 1 ? 's' : ''}{' '}
              remaining
            </span>
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
          {/* Pricing grid */}
          <div className="pt-packs">
            {packs.map((pack) => {
              const isSelected = selectedPack?.id === pack.id
              const basePrice = 5
              const savePct = Math.round((1 - pack.amountUsd / (basePrice * pack.credits)) * 100)
              return (
                <button
                  key={pack.id}
                  className={`pt-pack${isSelected ? ' pt-pack--selected' : ''}${
                    pack.popular ? ' pt-pack--popular' : ''
                  }`}
                  onClick={() => {
                    setSelectedPack(pack)
                    setPayStatus(null)
                    setPayMessage('')
                  }}
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
                    <PerCreditLabel pack={pack} />
                  </div>
                  {savePct > 0 && <div className="pt-pack__saving">Save ${basePrice * pack.credits - pack.amountUsd}</div>}
                  <p className="pt-pack__desc">{pack.description}</p>
                </button>
              )
            })}
          </div>

          {/* PayPal button section */}
          {selectedPack && (
            <div className="pt-checkout">
              <p className="pt-checkout__summary">
                You selected <strong>{selectedPack.label}</strong> — {selectedPack.credits} website
                {selectedPack.credits !== 1 ? 's' : ''} for{' '}
                <strong>${selectedPack.amountUsd}</strong>
              </p>

              {payStatus === 'error' && (
                <div className="pt-alert pt-alert--error">
                  <span className="material-symbols-outlined">error</span>
                  {payMessage}
                </div>
              )}

              {!clientId ? (
                <div className="pt-alert pt-alert--warn">
                  <span className="material-symbols-outlined">warning</span>
                  PayPal is not configured. Please contact the site administrator.
                </div>
              ) : (
                <div className="pt-paypal-wrap">
                  <PayPalScriptProvider
                    key={clientId}
                    options={{ clientId, currency: 'USD', intent: 'capture' }}
                  >
                    <PayPalButtons
                      style={{ layout: 'vertical', shape: 'rect', label: 'pay', height: 48 }}
                      disabled={payStatus === 'processing'}
                      createOrder={handleCreateOrder}
                      onApprove={handleApprove}
                      onError={handleError}
                      onCancel={handleCancel}
                    />
                  </PayPalScriptProvider>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
