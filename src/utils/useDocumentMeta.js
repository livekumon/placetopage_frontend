import { useEffect } from 'react'

/**
 * Sets document <title> and <meta> tags for the current page.
 * Cleans up on unmount by restoring defaults.
 *
 * Usage:
 *   useDocumentMeta({
 *     title: 'My Page | PlacePage',
 *     description: 'Page description for search results',
 *     canonical: 'https://www.placetopage.com/my-page',
 *     ogTitle: 'My Page',
 *     ogDescription: 'Page description',
 *     ogType: 'article',            // optional, default 'website'
 *     ogImage: '/og-image.png',     // optional
 *     jsonLd: { ... },              // optional structured data object
 *   })
 */
const DEFAULTS = {
  title: 'PlacePage — Turn Any Google Maps Listing Into a Live Website in 60 Seconds',
  description: 'Paste a Google Maps link. Get a fully designed, SEO-optimised landing page live in under 60 seconds. No designers, no developers. Used by 2,400+ businesses. Start free.',
  canonical: 'https://www.placetopage.com',
}

function setMeta(name, content, attr = 'name') {
  let el = document.querySelector(`meta[${attr}="${name}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, name)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function setCanonical(href) {
  let el = document.querySelector('link[rel="canonical"]')
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', 'canonical')
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

const JSON_LD_ID = 'page-json-ld'

function setJsonLd(data) {
  let el = document.getElementById(JSON_LD_ID)
  if (!data) {
    if (el) el.remove()
    return
  }
  if (!el) {
    el = document.createElement('script')
    el.id = JSON_LD_ID
    el.type = 'application/ld+json'
    document.head.appendChild(el)
  }
  el.textContent = JSON.stringify(data)
}

export default function useDocumentMeta(meta = {}) {
  useEffect(() => {
    const {
      title,
      description,
      canonical,
      ogTitle,
      ogDescription,
      ogType,
      ogImage,
      jsonLd,
    } = meta

    if (title) document.title = title
    if (description) setMeta('description', description)
    if (canonical) setCanonical(canonical)

    // Open Graph
    if (ogTitle || title) setMeta('og:title', ogTitle || title, 'property')
    if (ogDescription || description) setMeta('og:description', ogDescription || description, 'property')
    if (ogType) setMeta('og:type', ogType, 'property')
    if (ogImage) setMeta('og:image', ogImage, 'property')
    if (canonical) setMeta('og:url', canonical, 'property')

    // Twitter
    if (ogTitle || title) setMeta('twitter:title', ogTitle || title)
    if (ogDescription || description) setMeta('twitter:description', ogDescription || description)

    // JSON-LD
    if (jsonLd) setJsonLd(jsonLd)

    return () => {
      document.title = DEFAULTS.title
      setMeta('description', DEFAULTS.description)
      setCanonical(DEFAULTS.canonical)
      setMeta('og:title', DEFAULTS.title, 'property')
      setMeta('og:description', DEFAULTS.description, 'property')
      setMeta('og:type', 'website', 'property')
      setMeta('og:url', DEFAULTS.canonical, 'property')
      setMeta('twitter:title', DEFAULTS.title)
      setMeta('twitter:description', DEFAULTS.description)
      setJsonLd(null)
    }
  }, [
    meta.title,
    meta.description,
    meta.canonical,
    meta.ogTitle,
    meta.ogDescription,
    meta.ogType,
    meta.ogImage,
    // jsonLd intentionally excluded — reference changes every render; content is stable
  ])
}
