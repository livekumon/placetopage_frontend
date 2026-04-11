/**
 * UTM parameter capture and persistence.
 *
 * On first page load we grab any UTM query-params from the URL and stash them
 * in localStorage so they survive navigation inside this SPA.  Downstream code
 * (analytics, checkout, etc.) can call `getUtmParams()` at any time to read
 * the stored values.
 */

const UTM_STORAGE_KEY = 'p2p_utm'

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content']

/**
 * Read UTM params from the current URL and persist them in localStorage.
 * Call this once on app mount (e.g. inside a useEffect in App / Layout).
 * Only overwrites stored values when at least one UTM param is present in the URL.
 */
export function captureUtmParams() {
  try {
    const params = new URLSearchParams(window.location.search)
    const utm = {}
    let found = false
    for (const key of UTM_KEYS) {
      const val = params.get(key)
      if (val) {
        utm[key] = val
        found = true
      }
    }
    if (found) {
      utm.captured_at = new Date().toISOString()
      utm.landing_page = window.location.pathname
      localStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(utm))
    }
  } catch {
    // localStorage unavailable — silently degrade
  }
}

/**
 * Return the stored UTM object, or an empty object if nothing was captured.
 * @returns {Record<string, string>}
 */
export function getUtmParams() {
  try {
    const raw = localStorage.getItem(UTM_STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

/**
 * Clear stored UTM data (e.g. after a successful conversion).
 */
export function clearUtmParams() {
  try {
    localStorage.removeItem(UTM_STORAGE_KEY)
  } catch {
    // noop
  }
}
