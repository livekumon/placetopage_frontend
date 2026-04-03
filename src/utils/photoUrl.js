/** Trim for comparison; listing URLs must match exactly for selection UI. */
export function trimPhotoUrl(u) {
  return typeof u === 'string' ? u.trim() : ''
}

export function samePhotoUrl(a, b) {
  return trimPhotoUrl(a) === trimPhotoUrl(b)
}
