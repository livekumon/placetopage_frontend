const base = import.meta.env.VITE_API_URL || ''

const TOKEN_KEY = 'auth_token'

export function getAuthToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setAuthToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

function authHeaders() {
  const t = getAuthToken()
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

export async function getDashboardStats() {
  const res = await fetch(`${base}/api/sites/stats`, {
    headers: { ...authHeaders() },
  })
  const data = await parseJson(res)
  if (res.status === 401) throw new Error('Unauthorized')
  if (!res.ok) throw new Error(data?.message || 'Failed to load stats')
  return data
}

export async function enrichPlace(placeData) {
  const res = await fetch(`${base}/api/enrich`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(placeData),
  })
  const data = await parseJson(res)
  // 503 means no Gemini key — return empty gracefully so flow continues
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
  if (!res.ok) throw Object.assign(new Error(data?.message || 'Deployment failed'), { code: data?.code })
  return data
}

export async function checkSubdomain(subdomain) {
  const res = await fetch(`${base}/api/sites/check-subdomain?subdomain=${encodeURIComponent(subdomain)}`, {
    headers: { ...authHeaders() },
  })
  const data = await parseJson(res)
  if (!res.ok) throw new Error(data?.message || 'Check failed')
  return data // { available, subdomain, fullDomain, domainBase, reason }
}
