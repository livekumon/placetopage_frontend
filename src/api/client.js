const base = import.meta.env.VITE_API_URL || ''

const TOKEN_KEY = 'auth_token'
const ADMIN_TOKEN_KEY = 'admin_token'

export function getAuthToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setAuthToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

export function getAdminToken() {
  return localStorage.getItem(ADMIN_TOKEN_KEY)
}

export function setAdminToken(token) {
  if (token) localStorage.setItem(ADMIN_TOKEN_KEY, token)
  else localStorage.removeItem(ADMIN_TOKEN_KEY)
}

function authHeaders() {
  const t = getAuthToken()
  return t ? { Authorization: `Bearer ${t}` } : {}
}

function adminAuthHeaders() {
  const adminT = getAdminToken()
  const userT = getAuthToken()
  const t = adminT || userT
  return t ? { Authorization: `Bearer ${t}` } : {}
}

async function parseJson(res) {
  const text = await res.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

export async function getHealth() {
  const res = await fetch(`${base}/api/health`)
  return parseJson(res)
}

export async function adminLogin(email, password) {
  const res = await fetch(`${base}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const data = await parseJson(res)
  if (!res.ok) throw new Error(data?.message || 'Admin login failed')
  return data
}

export async function getAdminMetrics() {
  const headers = adminAuthHeaders()
  if (!headers.Authorization) {
    throw Object.assign(new Error('Not signed in'), { code: 'admin_auth' })
  }
  const res = await fetch(`${base}/api/admin/metrics`, {
    headers: { ...headers },
  })
  const data = await parseJson(res)
  if (res.status === 401 || res.status === 403) {
    throw Object.assign(new Error(data?.message || 'Unauthorized'), { code: 'admin_auth' })
  }
  if (!res.ok) throw new Error(data?.message || 'Failed to load metrics')
  return data
}

export async function getMe() {
  const res = await fetch(`${base}/api/auth/me`, {
    headers: { ...authHeaders() },
  })
  const data = await parseJson(res)
  if (!res.ok) throw new Error(data?.message || 'Not authenticated')
  return data
}

export async function loginWithEmail(email, password) {
  const res = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const data = await parseJson(res)
  if (!res.ok) throw Object.assign(new Error(data?.message || 'Login failed'), { field: data?.field })
  return data
}

export async function registerWithEmail(name, email, password) {
  const res = await fetch(`${base}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  })
  const data = await parseJson(res)
  if (!res.ok) throw Object.assign(new Error(data?.message || 'Registration failed'), { field: data?.field })
  return data
}

export async function loginWithGoogleCredential(credential) {
  const res = await fetch(`${base}/api/auth/google/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ credential }),
  })
  const data = await parseJson(res)
  if (!res.ok) throw new Error(data?.message || 'Login failed')
  return data
}

export async function registerWithGoogleCredential(credential) {
  const res = await fetch(`${base}/api/auth/google/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ credential }),
  })
  const data = await parseJson(res)
  if (!res.ok) throw new Error(data?.message || 'Registration failed')
  return data
}

export async function getSites() {
  const res = await fetch(`${base}/api/sites`, {
    headers: { ...authHeaders() },
  })
  const data = await parseJson(res)
  if (res.status === 401) throw new Error('Unauthorized')
  if (!res.ok) throw new Error(data?.message || 'Failed to load sites')
  return data
}

export async function getRecycleBinSites() {
  const res = await fetch(`${base}/api/sites/recycle-bin`, {
    headers: { ...authHeaders() },
  })
  const data = await parseJson(res)
  if (res.status === 401) throw new Error('Unauthorized')
  if (!res.ok) throw new Error(data?.message || 'Failed to load recycle bin')
  return data
}

export async function getDashboardStats() {
  const res = await fetch(`${base}/api/sites/stats`, {
    headers: { ...authHeaders() },
  })
  const data = await parseJson(res)
  if (res.status === 401) throw new Error('Unauthorized')
  if (!res.ok) throw new Error(data?.message || 'Failed to load stats')
  return data
}

export async function getSiteMine(siteId) {
  const res = await fetch(`${base}/api/sites/mine/${encodeURIComponent(siteId)}`, {
    headers: { ...authHeaders() },
  })
  const data = await parseJson(res)
  if (res.status === 401) throw new Error('Unauthorized')
  if (!res.ok) throw new Error(data?.message || 'Site not found')
  return data
}

export async function updateSite(siteId, body) {
  const res = await fetch(`${base}/api/sites/${encodeURIComponent(siteId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body),
  })
  const data = await parseJson(res)
  if (res.status === 401) throw new Error('Unauthorized')
  if (!res.ok) {
    throw Object.assign(new Error(data?.message || 'Failed to update site'), {
      status: res.status,
      code: data?.code,
    })
  }
  return data
}

/** Soft-delete: archived sites only; hidden from dashboard but kept in DB */
export async function softDeleteSite(siteId) {
  const res = await fetch(`${base}/api/sites/${encodeURIComponent(siteId)}`, {
    method: 'DELETE',
    headers: { ...authHeaders() },
  })
  const data = await parseJson(res)
  if (res.status === 401) throw new Error('Unauthorized')
  if (!res.ok) {
    throw new Error(data?.message || 'Failed to remove site')
  }
  return data && typeof data === 'object' ? data : { ok: true }
}

export async function restoreSiteFromRecycleBin(siteId) {
  const res = await fetch(
    `${base}/api/sites/recycle-bin/${encodeURIComponent(siteId)}/restore`,
    {
      method: 'POST',
      headers: { ...authHeaders() },
    }
  )
  const data = await parseJson(res)
  if (res.status === 401) throw new Error('Unauthorized')
  if (!res.ok) throw new Error(data?.message || 'Failed to restore site')
  return data
}

/** Server-side HTML render for the editor preview (does not persist). */
export async function renderSitePreview(body) {
  const res = await fetch(`${base}/api/sites/preview`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body),
  })
  const data = await parseJson(res)
  if (res.status === 401) throw new Error('Unauthorized')
  if (!res.ok) throw new Error(data?.message || 'Preview render failed')
  return data.html
}

export async function enrichPlace(placeData) {
  const res = await fetch(`${base}/api/enrich`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(placeData),
  })
  const data = await parseJson(res)
  // 503 means no Anthropic key — return empty gracefully so flow continues
  if (res.status === 503) return data
  if (!res.ok) throw new Error(data?.message || 'AI enrichment failed')
  return data
}

export async function lookupPlace(url) {
  const res = await fetch(`${base}/api/maps/lookup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ url }),
  })
  const data = await parseJson(res)
  if (!res.ok) throw Object.assign(new Error(data?.message || 'Failed to look up place'), { code: data?.code })
  return data
}

export async function createSite(body) {
  const res = await fetch(`${base}/api/sites`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body),
  })
  const data = await parseJson(res)
  if (!res.ok) throw new Error(data?.message || 'Failed to create site')
  return data
}

export async function deploySite(siteId, { subdomain } = {}) {
  const res = await fetch(`${base}/api/sites/${siteId}/deploy`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ subdomain: subdomain || '' }),
  })
  const data = await parseJson(res)
  if (!res.ok) {
    throw Object.assign(new Error(data?.message || 'Deployment failed'), {
      code: data?.code,
      status: res.status,
    })
  }
  return data
}

export async function getPaypalClientId() {
  const res = await fetch(`${base}/api/paypal/client-id`)
  const data = await parseJson(res)
  return data?.clientId || ''
}

export async function getTokenPacks() {
  const res = await fetch(`${base}/api/payments/token-packs`)
  const data = await parseJson(res)
  if (!res.ok) throw new Error(data?.message || 'Failed to load token packs')
  return data?.packs || []
}

export async function createPaypalOrder(productType = 'go_live') {
  const res = await fetch(`${base}/api/payments/create-order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ productType }),
  })
  const data = await parseJson(res)
  if (!res.ok) throw new Error(data?.message || 'Failed to create PayPal order')
  return data
}

export async function capturePaypalOrder(orderId) {
  const res = await fetch(`${base}/api/payments/capture-order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ orderId }),
  })
  const data = await parseJson(res)
  if (!res.ok) throw new Error(data?.message || 'Failed to capture payment')
  return data
}

export async function checkSubdomain(subdomain, { exceptSiteId } = {}) {
  const q = new URLSearchParams({ subdomain })
  if (exceptSiteId) q.set('exceptSiteId', String(exceptSiteId))
  const res = await fetch(`${base}/api/sites/check-subdomain?${q}`, {
    headers: { ...authHeaders() },
  })
  const data = await parseJson(res)
  if (!res.ok) throw new Error(data?.message || 'Check failed')
  return data // { available, subdomain, fullDomain, domainBase, reason }
}

/** Whether the API has GCS configured for hero image uploads */
export async function getUploadStatus() {
  const res = await fetch(`${base}/api/upload/status`)
  const data = await parseJson(res)
  if (!res.ok) return { uploadConfigured: false }
  return data
}

/** Multipart upload → public URL on GCS (requires server env). */
export async function uploadHeroImage(file) {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(`${base}/api/upload/hero`, {
    method: 'POST',
    headers: { ...authHeaders() },
    body: form,
  })
  const data = await parseJson(res)
  if (res.status === 401) throw new Error('Unauthorized')
  if (!res.ok) throw new Error(data?.message || 'Upload failed')
  return data.url
}
