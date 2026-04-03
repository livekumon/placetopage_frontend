import { useEffect, useRef, useState } from 'react'
import { getAuthToken } from '../api/client'

const base = import.meta.env.VITE_API_URL || ''

/**
 * Parse object path from our default public GCS URL shape:
 * https://storage.googleapis.com/{bucket}/heroes/{userId}/file.jpg
 */
function parseAppGcsObjectPath(imageUrl, bucketName) {
  if (!imageUrl || !bucketName) return null
  try {
    const u = new URL(imageUrl)
    if (u.hostname !== 'storage.googleapis.com') return null
    const expected = `/${bucketName}/`
    if (!u.pathname.startsWith(expected)) return null
    const path = decodeURIComponent(u.pathname.slice(expected.length))
    if (!path || path.includes('..')) return null
    return path
  } catch {
    return null
  }
}

/**
 * Renders images from our private GCS bucket via authenticated API fetch (blob URL).
 * Other URLs use a normal <img>.
 */
export default function AuthenticatedGcsImage({ src, alt = '', className = '', loading, bucketName }) {
  const [displayUrl, setDisplayUrl] = useState(null)
  const [phase, setPhase] = useState('loading')
  const blobRef = useRef(null)

  useEffect(() => {
    if (blobRef.current) {
      URL.revokeObjectURL(blobRef.current)
      blobRef.current = null
    }
    setDisplayUrl(null)

    if (!src) {
      setPhase('idle')
      return
    }

    const objectPath = parseAppGcsObjectPath(src, bucketName)
    if (!objectPath || !bucketName) {
      setPhase('fallback')
      return
    }

    let cancelled = false
    setPhase('loading')

    ;(async () => {
      try {
        const token = getAuthToken()
        const res = await fetch(
          `${base}/api/upload/file?path=${encodeURIComponent(objectPath)}`,
          { headers: token ? { Authorization: `Bearer ${token}` } : {} }
        )
        if (!res.ok) throw new Error(String(res.status))
        const blob = await res.blob()
        if (cancelled) return
        const u = URL.createObjectURL(blob)
        blobRef.current = u
        setDisplayUrl(u)
        setPhase('ready')
      } catch {
        if (!cancelled) setPhase('error')
      }
    })()

    return () => {
      cancelled = true
    }
  }, [src, bucketName])

  if (!src) return null

  if (phase === 'idle') return null

  if (phase === 'error') {
    return (
      <div
        className={`flex items-center justify-center bg-slate-200 text-[10px] text-slate-500 dark:bg-slate-800 dark:text-slate-400 ${className}`}
        title="Could not load image"
      >
        Preview unavailable
      </div>
    )
  }

  if (phase === 'fallback') {
    return <img src={src} alt={alt} className={className} loading={loading} />
  }

  if (phase === 'ready' && displayUrl) {
    return <img src={displayUrl} alt={alt} className={className} loading={loading} />
  }

  return <div className={`animate-pulse bg-slate-200 dark:bg-slate-800 ${className}`} aria-hidden />
}
