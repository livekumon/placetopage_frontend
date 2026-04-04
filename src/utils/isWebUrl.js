/** Accept any http(s) URL — Maps share links vary; the API decides if it resolves to a place. */
export function isValidWebUrlInput(raw) {
  const v = String(raw ?? '').trim()
  if (!v) return false
  try {
    const withProto = /^https?:\/\//i.test(v) ? v : `https://${v}`
    const u = new URL(withProto)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}
