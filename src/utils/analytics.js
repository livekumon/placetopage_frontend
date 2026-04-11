/**
 * GA4 tracking utility for placetopage.com.
 * Wraps window.gtag so all calls are safe even before the script loads.
 */

/**
 * Send any GA4 event.
 * @param {string} eventName
 * @param {Record<string, unknown>} [params]
 */
export function trackEvent(eventName, params = {}) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return
  window.gtag('event', eventName, params)
}

/**
 * Track a generic button/CTA click with a human-readable label.
 * Maps to the GA4 custom event `button_click`.
 */
export function trackClick(label, params = {}) {
  trackEvent('button_click', { button_label: label, page_path: window.location.pathname, ...params })
}

/**
 * Track an outbound or internal link click.
 * Maps to the GA4 custom event `link_click`.
 */
export function trackLinkClick(label, destination, params = {}) {
  trackEvent('link_click', {
    link_label: label,
    link_destination: destination,
    page_path: window.location.pathname,
    ...params,
  })
}

/**
 * Track a form submission (any form).
 * Maps to the GA4 custom event `form_submit`.
 */
export function trackFormSubmit(formName, params = {}) {
  trackEvent('form_submit', { form_name: formName, page_path: window.location.pathname, ...params })
}

/**
 * Track an auth action attempt (login or register).
 * GA4 recommended events: `login` / `sign_up`.
 */
export function trackAuth(method, mode) {
  // GA4 recommended: `login` or `sign_up`
  trackEvent(mode === 'login' ? 'login' : 'sign_up', { method })
}

/**
 * Track a website generation attempt from a Google Maps URL.
 * Maps to the GA4 custom event `generate_website`.
 */
export function trackSiteGenerate(mapsUrl = '') {
  trackEvent('generate_website', {
    maps_url: String(mapsUrl).substring(0, 200),
    page_path: window.location.pathname,
  })
}

/**
 * Track payment / checkout initiation.
 * GA4 recommended event: `begin_checkout`.
 */
export function trackBeginCheckout(pack, gateway) {
  if (!pack) return
  trackEvent('begin_checkout', {
    currency: 'USD',
    value: pack.amountUsd ?? 0,
    payment_method: gateway,
    items: [{ item_id: pack.id, item_name: pack.label, quantity: pack.credits ?? 1, price: pack.amountUsd ?? 0 }],
  })
}

/**
 * Track a completed purchase.
 * GA4 recommended event: `purchase`.
 */
export function trackPurchase(pack, gateway, orderId = '') {
  if (!pack) return
  trackEvent('purchase', {
    currency: 'USD',
    value: pack.amountUsd ?? 0,
    transaction_id: orderId,
    payment_method: gateway,
    items: [{ item_id: pack.id, item_name: pack.label, quantity: pack.credits ?? 1, price: pack.amountUsd ?? 0 }],
  })
}

/**
 * Track a pack selection on the Purchase Tokens page.
 * Maps to the GA4 custom event `select_item`.
 */
export function trackPackSelect(pack) {
  if (!pack) return
  trackEvent('select_item', {
    items: [{ item_id: pack.id, item_name: pack.label, price: pack.amountUsd ?? 0 }],
  })
}

/**
 * Track when a site is published/deployed live.
 * Maps to the GA4 custom event `site_publish`.
 */
export function trackSitePublish(siteId, siteName) {
  trackEvent('site_publish', { site_id: siteId, site_name: siteName })
}

/**
 * Track when a site is saved (draft update).
 * Maps to the GA4 custom event `site_save`.
 */
export function trackSiteSave(siteId, siteName) {
  trackEvent('site_save', { site_id: siteId, site_name: siteName })
}

/**
 * Track when a site is archived.
 * Maps to the GA4 custom event `site_archive`.
 */
export function trackSiteArchive(siteId, siteName) {
  trackEvent('site_archive', { site_id: siteId, site_name: siteName })
}

/**
 * Track when a site is soft-deleted from the dashboard.
 * Maps to the GA4 custom event `site_delete`.
 */
export function trackSiteDelete(siteId, siteName) {
  trackEvent('site_delete', { site_id: siteId, site_name: siteName })
}

/**
 * Track a primary CTA click with a location label.
 * Maps to the GA4 custom event `cta_click`.
 */
export function trackCtaClick(location, params = {}) {
  trackEvent('cta_click', { location, page_path: window.location.pathname, ...params })
}

/**
 * Track when user views the pricing / purchase-tokens page.
 * Maps to the GA4 custom event `view_pricing`.
 */
export function trackViewPricing() {
  trackEvent('view_pricing', { page_path: window.location.pathname })
}

/**
 * Track a successful site generation.
 * Maps to the GA4 custom event `site_generated`.
 */
export function trackSiteGenerated(creditsUsed = 1) {
  trackEvent('site_generated', { credits_used: creditsUsed })
}

/**
 * Track a page view (useful for SPA route changes).
 * GA4 automatically tracks the initial page view; call this on subsequent route changes.
 */
export function trackPageView(path, title) {
  trackEvent('page_view', { page_path: path, page_title: title })
}
