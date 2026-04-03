import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  checkSubdomain,
  deploySite,
  getSiteMine,
  getUploadStatus,
  renderSitePreview,
  updateSite,
  uploadHeroImage,
} from '../api/client'
import { IPHONE_HEIGHT, IPHONE_WIDTH } from '../constants/viewports'
import { samePhotoUrl, trimPhotoUrl } from '../utils/photoUrl'
import { buildSiteEditPreviewSrcDoc } from '../utils/previewIframe'
import { makeDemoReviews } from '../utils/demoReviews'
import AuthenticatedGcsImage from '../components/AuthenticatedGcsImage'

const MAX_DEMO_REVIEWS = 30

const THEMES = [
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
  { id: 'bold', label: 'Bold' },
]

const labelClass =
  'mb-1.5 block text-xs font-semibold text-slate-500 dark:text-slate-400'
const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-on-surface outline-none transition-shadow focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-400'

const PREVIEW_DEBOUNCE_MS = 320
/** Shown next to subdomain input; must match backend CUSTOM_DOMAIN_BASE default for UX copy. */
const PUBLIC_SITE_DOMAIN = 'placetopage.com'

/** Same rules as backend `SUBDOMAIN_RE` — used to validate before publish. */
const SUBDOMAIN_FORMAT_RE = /^[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$|^[a-z0-9]$/

function isValidSubdomainSegment(s) {
  if (!s) return true
  return SUBDOMAIN_FORMAT_RE.test(s)
}

/** Keys from `data-p2p-field` in generated preview HTML → form control ids. */
const P2P_FIELD_TO_FORM_ID = {
  name: 'site-name',
  ctaText: 'cta',
  category: 'category',
  heroHeadline: 'hero',
  tagline: 'tagline',
  description: 'desc',
  mapsUrl: 'maps-url',
  phone: 'phone',
  website: 'web',
  seoDescription: 'seo',
  footerCopyright: 'footer-copyright',
  footerAttribution: 'footer-attribution',
}

/** Boolean flags parallel to `placeData.reviews` (Google). Legacy: `reviewsCustom[].enabled`. */
function initReviewsEnabled(pd) {
  const raw = pd?.reviews
  if (!Array.isArray(raw) || raw.length === 0) return []
  const n = raw.length
  if (Array.isArray(pd?.reviewsEnabled) && pd.reviewsEnabled.length === n) {
    return raw.map((_, i) => pd.reviewsEnabled[i] !== false)
  }
  if (Array.isArray(pd?.reviewsCustom) && pd.reviewsCustom.length > 0) {
    return raw.map((_, i) => pd.reviewsCustom[i]?.enabled !== false)
  }
  return raw.map(() => true)
}

function buildPreviewBody(site, state) {
  const {
    name,
    theme,
    mapsUrl,
    category,
    thumbnailUrl,
    aboutPhotoUrl,
    tagline,
    description,
    heroHeadline,
    phone,
    website,
    ctaText,
    seoDescription,
    reviewsCatalog,
    reviewsEnabled,
    footerCopyright,
    footerAttribution,
    showFooterAttribution,
  } = state
  const hero = trimPhotoUrl(thumbnailUrl)
  const about = trimPhotoUrl(aboutPhotoUrl)
  const pd = site?.placeData || {}
  const list = Array.isArray(reviewsCatalog) ? reviewsCatalog : []
  const reviewsEnabledResolved =
    list.length > 0 ? list.map((_, i) => reviewsEnabled[i] !== false) : []
  return {
    name: name || 'Untitled',
    theme,
    mapsUrl,
    category,
    thumbnailUrl: hero,
    placeData: {
      ...pd,
      photoUrl: hero || pd.photoUrl || '',
      aboutPhotoUrl: about,
      reviews: list,
      tagline: tagline.trim(),
      description: description.trim(),
      heroHeadline: heroHeadline.trim(),
      phone: phone.trim(),
      website: website.trim(),
      ctaText: ctaText.trim(),
      seoDescription: seoDescription.trim(),
      reviewsEnabled: reviewsEnabledResolved,
      reviewsCustom: null,
      footerCopyright: footerCopyright.trim(),
      footerAttribution: footerAttribution.trim(),
      showFooterAttribution,
    },
  }
}

export default function SiteEditPage() {
  const { siteId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const isPublishStepRoute = /\/dashboard\/sites\/[^/]+\/publish\/?$/.test(location.pathname)
  const previewGen = useRef(0)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deploying, setDeploying] = useState(false)
  const [error, setError] = useState(null)
  const [publishSuccessOpen, setPublishSuccessOpen] = useState(false)
  const [publishSuccessLiveUrl, setPublishSuccessLiveUrl] = useState(null)
  const [publishReviewOpen, setPublishReviewOpen] = useState(false)
  const [publishModalError, setPublishModalError] = useState(null)
  const [publishNoCredits, setPublishNoCredits] = useState(false)
  const [subdomainAvailability, setSubdomainAvailability] = useState(null)
  const [subdomainCheckBusy, setSubdomainCheckBusy] = useState(false)
  const [subdomainSaving, setSubdomainSaving] = useState(false)
  const [subdomainSaveError, setSubdomainSaveError] = useState(null)
  const [inlineAddressSaving, setInlineAddressSaving] = useState(false)
  const [inlineAddressError, setInlineAddressError] = useState(null)
  const [publishUrlCopied, setPublishUrlCopied] = useState(false)
  const [site, setSite] = useState(null)

  const [previewHtml, setPreviewHtml] = useState('')
  const [previewBusy, setPreviewBusy] = useState(false)
  const [previewTab, setPreviewTab] = useState('desktop')
  /** Mobile-only: which panel is visible — 'settings' | 'preview' */
  const [mobileEditorTab, setMobileEditorTab] = useState('settings')

  const [name, setName] = useState('')
  const [theme, setTheme] = useState('light')
  const [mapsUrl, setMapsUrl] = useState('')
  const [publishSubdomain, setPublishSubdomain] = useState('')
  const [category, setCategory] = useState('Business')
  const [thumbnailUrl, setThumbnailUrl] = useState('')
  const [aboutPhotoUrl, setAboutPhotoUrl] = useState('')
  const [tagline, setTagline] = useState('')
  const [description, setDescription] = useState('')
  const [heroHeadline, setHeroHeadline] = useState('')
  const [phone, setPhone] = useState('')
  const [website, setWebsite] = useState('')
  const [ctaText, setCtaText] = useState('')
  const [seoDescription, setSeoDescription] = useState('')

  const [reviewsEnabled, setReviewsEnabled] = useState([])
  /** Google reviews + optional demo rows appended in the editor (saved on placeData.reviews). */
  const [reviewsCatalog, setReviewsCatalog] = useState([])
  const [footerCopyright, setFooterCopyright] = useState('')
  const [footerAttribution, setFooterAttribution] = useState('')
  const [showFooterAttribution, setShowFooterAttribution] = useState(true)

  const [uploadConfigured, setUploadConfigured] = useState(false)
  const [gcsBucket, setGcsBucket] = useState(null)
  const [uploadBusy, setUploadBusy] = useState(false)
  const [uploadError, setUploadError] = useState(null)
  const heroFileInputRef = useRef(null)
  const aboutFileInputRef = useRef(null)
  const publicSubdomainInputRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    getUploadStatus()
      .then((s) => {
        if (!cancelled) {
          setUploadConfigured(Boolean(s?.uploadConfigured))
          setGcsBucket(s?.bucket || null)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setUploadConfigured(false)
          setGcsBucket(null)
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  const trimmedPublishSubdomain = useMemo(() => publishSubdomain.trim(), [publishSubdomain])
  const customPublicSiteUrl = useMemo(
    () =>
      trimmedPublishSubdomain ? `https://${trimmedPublishSubdomain}.${PUBLIC_SITE_DOMAIN}` : null,
    [trimmedPublishSubdomain]
  )
  const subdomainFormatOk = isValidSubdomainSegment(trimmedPublishSubdomain)

  const openPublishReview = useCallback(() => {
    setError(null)
    setSubdomainSaveError(null)
    setPublishModalError(null)
    // Detect zero credits immediately so the modal shows the buy-credits UI
    // without requiring the user to click "Publish site" first.
    setPublishNoCredits((user?.publishingCredits ?? 0) < 1)
    setPublishReviewOpen(true)
  }, [user?.publishingCredits])

  const closePublishReview = useCallback(() => {
    if (saving || deploying || subdomainSaving) return
    setPublishReviewOpen(false)
    setPublishModalError(null)
    setPublishNoCredits(false)
    setSubdomainAvailability(null)
    setSubdomainSaveError(null)
    if (isPublishStepRoute) {
      navigate(`/dashboard/sites/${siteId}`, { replace: true })
    }
  }, [saving, deploying, subdomainSaving, isPublishStepRoute, siteId, navigate])

  useEffect(() => {
    if (loading || !site || !isPublishStepRoute) return
    setPublishReviewOpen(true)
  }, [loading, site, isPublishStepRoute])

  useEffect(() => {
    if (!publishReviewOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [publishReviewOpen])

  useEffect(() => {
    if (!publishReviewOpen || !trimmedPublishSubdomain || !subdomainFormatOk) {
      setSubdomainAvailability(null)
      setSubdomainCheckBusy(false)
      return
    }
    let cancelled = false
    setSubdomainCheckBusy(true)
    const t = setTimeout(async () => {
      try {
        const r = await checkSubdomain(trimmedPublishSubdomain, { exceptSiteId: siteId })
        if (!cancelled) setSubdomainAvailability(r)
      } catch {
        if (!cancelled) setSubdomainAvailability(null)
      } finally {
        if (!cancelled) setSubdomainCheckBusy(false)
      }
    }, 450)
    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [publishReviewOpen, trimmedPublishSubdomain, subdomainFormatOk, siteId])

  /** When availability check passes (or slug cleared), persist customSubdomain on the site document. */
  useEffect(() => {
    if (!publishReviewOpen || !siteId) return
    if (subdomainCheckBusy) return

    const stored = (site?.customSubdomain || '').trim()

    if (!trimmedPublishSubdomain) {
      if (!stored) return
      let cancelled = false
      ;(async () => {
        setSubdomainSaving(true)
        setSubdomainSaveError(null)
        try {
          const data = await updateSite(siteId, { customSubdomain: '' })
          if (cancelled) return
          applyUpdatedSite(data, previewHtml)
        } catch (err) {
          if (!cancelled) {
            setSubdomainSaveError(err.message || 'Could not clear subdomain')
          }
        } finally {
          if (!cancelled) setSubdomainSaving(false)
        }
      })()
      return () => {
        cancelled = true
      }
    }

    if (!subdomainFormatOk || !subdomainAvailability?.available) return
    if (subdomainAvailability.subdomain !== trimmedPublishSubdomain) return
    if (trimmedPublishSubdomain === stored) return

    let cancelled = false
    ;(async () => {
      setSubdomainSaving(true)
      setSubdomainSaveError(null)
      try {
        const data = await updateSite(siteId, { customSubdomain: trimmedPublishSubdomain })
        if (cancelled) return
        applyUpdatedSite(data, previewHtml)
      } catch (err) {
        if (cancelled) return
        const taken = err.status === 409 || err.code === 'SUBDOMAIN_TAKEN'
        setSubdomainSaveError(
          taken
            ? 'That subdomain is already taken. Please choose a different one.'
            : err.message || 'Could not save subdomain'
        )
        if (taken) {
          setSubdomainAvailability({
            available: false,
            subdomain: trimmedPublishSubdomain,
            fullDomain: `${trimmedPublishSubdomain}.${PUBLIC_SITE_DOMAIN}`,
            reason: 'This subdomain is already taken. Try something else.',
          })
        }
      } finally {
        if (!cancelled) setSubdomainSaving(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [
    publishReviewOpen,
    siteId,
    site?.customSubdomain,
    subdomainCheckBusy,
    trimmedPublishSubdomain,
    subdomainFormatOk,
    subdomainAvailability,
    previewHtml,
  ])

  useEffect(() => {
    if (!publishReviewOpen) return
    function onKey(e) {
      if (e.key === 'Escape' && !saving && !deploying && !subdomainSaving) closePublishReview()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [publishReviewOpen, saving, deploying, subdomainSaving, closePublishReview])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setError(null)
      try {
        const s = await getSiteMine(siteId)
        if (cancelled) return
        setSite(s)
        setName(s.name || '')
        setTheme(['light', 'dark', 'bold'].includes(s.theme) ? s.theme : 'light')
        setMapsUrl(s.mapsUrl || '')
        const pdLoad = s.placeData || {}
        setPublishSubdomain(
          (s.customSubdomain || pdLoad.userPreferredSubdomain || pdLoad.suggestedSubdomainSlug || '').trim()
        )
        setCategory(s.category || 'Business')
        const pd = pdLoad
        const listingPhotos = Array.isArray(pd.photos) ? pd.photos.filter(Boolean) : []
        const heroInit =
          (s.thumbnailUrl || '').trim() ||
          (pd.photoUrl || '').trim() ||
          (listingPhotos[0] || '')
        setThumbnailUrl(heroInit)
        setAboutPhotoUrl(
          (pd.aboutPhotoUrl || '').trim() ||
            listingPhotos[1] ||
            listingPhotos[0] ||
            heroInit ||
            ''
        )
        setTagline(pd.tagline || '')
        setDescription(pd.description || '')
        setHeroHeadline(pd.heroHeadline || '')
        setPhone(pd.phone || '')
        setWebsite(pd.website || '')
        setCtaText(pd.ctaText || '')
        setSeoDescription(pd.seoDescription || '')
        const rev = Array.isArray(pd.reviews) ? pd.reviews : []
        setReviewsCatalog(rev)
        setReviewsEnabled(initReviewsEnabled(pd))
        setFooterCopyright(pd.footerCopyright ?? '')
        setFooterAttribution(pd.footerAttribution ?? '')
        setShowFooterAttribution(pd.showFooterAttribution !== false)
        setPreviewHtml(s.generatedHtml || '')
      } catch (e) {
        if (!cancelled) setError(e.message || 'Could not load site')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [siteId])

  useEffect(() => {
    if (!site) return

    const gen = ++previewGen.current
    const timer = setTimeout(async () => {
      setPreviewBusy(true)
      try {
        const body = buildPreviewBody(site, {
          name,
          theme,
          mapsUrl,
          category,
          thumbnailUrl,
          aboutPhotoUrl,
          tagline,
          description,
          heroHeadline,
          phone,
          website,
          ctaText,
          seoDescription,
          reviewsCatalog,
          reviewsEnabled,
          footerCopyright,
          footerAttribution,
          showFooterAttribution,
        })
        const html = await renderSitePreview(body)
        if (gen !== previewGen.current) return
        setPreviewHtml(html)
      } catch {
        if (gen !== previewGen.current) return
        /* keep last good preview */
      } finally {
        if (gen === previewGen.current) setPreviewBusy(false)
      }
    }, PREVIEW_DEBOUNCE_MS)

    return () => clearTimeout(timer)
  }, [
    site,
    name,
    theme,
    mapsUrl,
    category,
    thumbnailUrl,
    aboutPhotoUrl,
    tagline,
    description,
    heroHeadline,
    phone,
    website,
    ctaText,
    seoDescription,
    reviewsCatalog,
    reviewsEnabled,
    footerCopyright,
    footerAttribution,
    showFooterAttribution,
  ])

  const previewSrcDoc = useMemo(
    () => (previewHtml ? buildSiteEditPreviewSrcDoc(previewHtml) : ''),
    [previewHtml]
  )

  useEffect(() => {
    function focusAndHighlight(el) {
      if (!el) return
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      requestAnimationFrame(() => {
        try {
          el.focus({ preventScroll: true })
        } catch {
          el.focus()
        }
        const prevOutline = el.style.outline
        const prevOffset = el.style.outlineOffset
        el.style.outline = '3px solid rgb(37 99 235)'
        el.style.outlineOffset = '2px'
        window.setTimeout(() => {
          el.style.outline = prevOutline
          el.style.outlineOffset = prevOffset
        }, 2500)
      })
    }

    function onMessage(event) {
      const d = event.data
      if (!d || d.source !== 'p2p-preview' || d.type !== 'focus-field' || typeof d.field !== 'string') return
      let el = null
      const id = P2P_FIELD_TO_FORM_ID[d.field]
      if (id) el = document.getElementById(id)
      focusAndHighlight(el)
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  function buildPersistPayload() {
    const hero = trimPhotoUrl(thumbnailUrl)
    const about = trimPhotoUrl(aboutPhotoUrl)
    const reviewsEnabledToSave =
      reviewsCatalog.length > 0 ? reviewsCatalog.map((_, i) => reviewsEnabled[i] !== false) : []
    return {
      name,
      theme,
      mapsUrl,
      category,
      thumbnailUrl: hero,
      placeData: {
        tagline: tagline.trim(),
        description: description.trim(),
        heroHeadline: heroHeadline.trim(),
        phone: phone.trim(),
        website: website.trim(),
        ctaText: ctaText.trim(),
        seoDescription: seoDescription.trim(),
        photoUrl: hero,
        aboutPhotoUrl: about,
        reviews: reviewsCatalog,
        reviewsEnabled: reviewsEnabledToSave,
        reviewsCustom: null,
        footerCopyright: footerCopyright.trim(),
        footerAttribution: footerAttribution.trim(),
        showFooterAttribution,
        userPreferredSubdomain: publishSubdomain.trim(),
      },
    }
  }

  async function persistSite() {
    return updateSite(siteId, buildPersistPayload())
  }

  function applyUpdatedSite(updated, htmlFallback) {
    const { vercelPauseWarning: _vw, vercelPaused: _vp, ...siteDoc } = updated || {}
    void _vw
    void _vp
    setSite(siteDoc)
    setReviewsCatalog(Array.isArray(siteDoc.placeData?.reviews) ? siteDoc.placeData.reviews : [])
    setReviewsEnabled(initReviewsEnabled(siteDoc.placeData || {}))
    setPreviewHtml(siteDoc.generatedHtml || htmlFallback)
  }

  async function savePublicAddressFromSettings() {
    const t = publishSubdomain.trim()
    setInlineAddressError(null)
    if (t && !isValidSubdomainSegment(t)) {
      setInlineAddressError('Invalid subdomain format.')
      return
    }
    setInlineAddressSaving(true)
    try {
      if (t) {
        const chk = await checkSubdomain(t, { exceptSiteId: siteId })
        if (!chk.available) {
          setInlineAddressError(chk.reason || 'That subdomain is already taken. Please choose something else.')
          return
        }
      }
      const data = await updateSite(siteId, { customSubdomain: t || '' })
      applyUpdatedSite(data, previewHtml)
    } catch (e) {
      setInlineAddressError(e.message || 'Could not save subdomain.')
    } finally {
      setInlineAddressSaving(false)
    }
  }

  async function confirmPublishFromReview() {
    if (trimmedPublishSubdomain && !subdomainFormatOk) return
    if (trimmedPublishSubdomain && subdomainAvailability && !subdomainAvailability.available) return
    if (subdomainSaving) return

    setPublishSuccessOpen(false)
    setPublishSuccessLiveUrl(null)
    setError(null)
    setPublishModalError(null)
    setPublishNoCredits(false)
    setSaving(true)
    setDeploying(false)
    try {
      const storedSub = (site?.customSubdomain || '').trim()
      if (trimmedPublishSubdomain !== storedSub) {
        if (
          trimmedPublishSubdomain &&
          (!subdomainFormatOk ||
            !subdomainAvailability?.available ||
            subdomainAvailability.subdomain !== trimmedPublishSubdomain)
        ) {
          setSaving(false)
          return
        }
        const syncData = await updateSite(siteId, { customSubdomain: trimmedPublishSubdomain || '' })
        applyUpdatedSite(syncData, previewHtml)
      }

      const updated = await persistSite()
      applyUpdatedSite(updated, previewHtml)
      setSaving(false)
      setDeploying(true)
      const sub = trimmedPublishSubdomain
      const deployed = await deploySite(updated._id, { subdomain: sub })
      setSite(deployed)
      setPublishSubdomain((deployed.customSubdomain || sub || '').trim())
      setReviewsCatalog(Array.isArray(deployed.placeData?.reviews) ? deployed.placeData.reviews : [])
      setReviewsEnabled(initReviewsEnabled(deployed.placeData || {}))
      setPreviewHtml(deployed.generatedHtml || previewHtml)
      const live = (deployed?.deploymentUrl || '').trim() || null
      setPublishSuccessLiveUrl(live)
      setPublishReviewOpen(false)
      setSubdomainAvailability(null)
      if (isPublishStepRoute) {
        navigate(`/dashboard/sites/${siteId}`, { replace: true })
      }
      setPublishSuccessOpen(true)
    } catch (err) {
      if (err.code === 'PUBLISHING_CREDITS_REQUIRED' || err.status === 402) {
        setPublishNoCredits(true)
      } else {
        setPublishModalError(err.message || 'Save or publish failed')
      }
    } finally {
      setSaving(false)
      setDeploying(false)
    }
  }

  function closePublishSuccessModal() {
    setPublishSuccessOpen(false)
    setPublishSuccessLiveUrl(null)
  }

  useEffect(() => {
    if (!publishSuccessOpen) return
    function onKeyDown(e) {
      if (e.key === 'Escape') closePublishSuccessModal()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [publishSuccessOpen])

  /** Unique listing + hero URLs for the picker (order: current hero, then listing). Up to 20 match the API / generator. */
  const MAX_LISTING_PHOTOS = 20
  const photoUrls = useMemo(() => {
    const pd = site?.placeData || {}
    const fromList = Array.isArray(pd.photos) ? pd.photos.filter(Boolean) : []
    const fromPd = pd.photoUrl ? [pd.photoUrl] : []
    const thumb = (thumbnailUrl || '').trim()
    return [...new Set([thumb, ...fromPd, ...fromList].filter(Boolean))].slice(0, MAX_LISTING_PHOTOS)
  }, [site?.placeData, thumbnailUrl])

  /** Which URL drives the hero in the generator (thumbnail wins, else first photo). */
  const activeHeroUrl = useMemo(() => {
    const t = trimPhotoUrl(thumbnailUrl)
    if (t) return t
    return photoUrls[0] || ''
  }, [thumbnailUrl, photoUrls])

  const activeAboutUrl = useMemo(() => {
    const a = trimPhotoUrl(aboutPhotoUrl)
    if (a) return a
    return photoUrls[1] || photoUrls[0] || ''
  }, [aboutPhotoUrl, photoUrls])

  const demoReviewCount = useMemo(
    () => reviewsCatalog.filter((r) => r?.isDemo).length,
    [reviewsCatalog]
  )
  const canLoadMoreDemo = demoReviewCount < MAX_DEMO_REVIEWS

  function handleLoadMoreDemoReviews() {
    if (!canLoadMoreDemo) return
    const offset = reviewsCatalog.length
    const batch = makeDemoReviews(5, offset)
    setReviewsCatalog((prev) => [...prev, ...batch])
    setReviewsEnabled((prev) => [...prev, ...Array(5).fill(true)])
  }

  async function handleHeroFileChange(e) {
    const f = e.target.files?.[0]
    if (!f) return
    setUploadBusy(true)
    setUploadError(null)
    try {
      const url = await uploadHeroImage(f)
      setThumbnailUrl(trimPhotoUrl(url))
    } catch (err) {
      setUploadError(err.message || 'Upload failed')
    } finally {
      setUploadBusy(false)
      e.target.value = ''
    }
  }

  async function handleAboutFileChange(e) {
    const f = e.target.files?.[0]
    if (!f) return
    setUploadBusy(true)
    setUploadError(null)
    try {
      const url = await uploadHeroImage(f)
      setAboutPhotoUrl(trimPhotoUrl(url))
    } catch (err) {
      setUploadError(err.message || 'Upload failed')
    } finally {
      setUploadBusy(false)
      e.target.value = ''
    }
  }

  const liveUrl = site?.deploymentUrl || null

  const savedCustomSubdomain = (site?.customSubdomain || '').trim()
  const subdomainInSyncWithDb = trimmedPublishSubdomain === savedCustomSubdomain
  const publishAddressBlocked =
    Boolean(subdomainSaving) ||
    Boolean(trimmedPublishSubdomain && !subdomainFormatOk) ||
    Boolean(trimmedPublishSubdomain && subdomainCheckBusy) ||
    Boolean(
      trimmedPublishSubdomain &&
        subdomainAvailability &&
        subdomainAvailability.available === false
    ) ||
    !subdomainInSyncWithDb

  async function copyPublishUrl() {
    if (!customPublicSiteUrl || !navigator.clipboard?.writeText) return
    try {
      await navigator.clipboard.writeText(customPublicSiteUrl)
      setPublishUrlCopied(true)
      window.setTimeout(() => setPublishUrlCopied(false), 2000)
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="flex h-dvh max-h-dvh flex-col overflow-hidden bg-surface text-on-surface dark:bg-slate-950 dark:text-slate-100">
      <header className="sticky top-0 z-40 shrink-0 border-b border-slate-200/50 bg-slate-50/95 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-2 px-3 py-2 sm:gap-3 sm:px-6 sm:py-3">
          <div className="flex min-w-0 items-center gap-2 sm:gap-4">
            <Link
              to="/dashboard#recent-sites"
              className="shrink-0 font-inter text-sm font-medium text-on-surface-variant transition-colors hover:text-primary"
              aria-label="Back to dashboard"
            >
              <span className="hidden sm:inline">← Back to dashboard</span>
              <span className="material-symbols-outlined text-[22px] sm:hidden">arrow_back</span>
            </Link>
            <span className="hidden h-4 w-px shrink-0 bg-slate-300 sm:inline dark:bg-slate-600" aria-hidden />
            <Link
              to="/"
              className="hidden shrink-0 items-center gap-1.5 font-manrope text-lg font-bold tracking-tighter text-slate-900 dark:text-white sm:flex"
            >
              <img src="/logo.png" alt="" className="h-7 w-7 rounded-md object-contain" aria-hidden />
              Place to Page
            </Link>
            <span className="hidden h-4 w-px shrink-0 bg-slate-300 sm:inline dark:bg-slate-600" aria-hidden />
            <span className="min-w-0 truncate font-headline text-sm font-extrabold tracking-tight text-on-surface sm:text-lg">
              Site settings
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            {saving && !deploying && (
              <span className="hidden text-xs font-medium text-on-surface-variant sm:inline" aria-live="polite">
                Saving…
              </span>
            )}
            {liveUrl && (
              <a
                href={liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-2 text-xs font-bold uppercase tracking-widest text-on-surface-variant transition-colors hover:border-primary hover:text-primary dark:border-slate-700"
                title="View live site"
              >
                <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                <span className="hidden sm:inline">View live</span>
              </a>
            )}
            {user && (
              <Link
                to="/purchase-tokens"
                className="flex items-center gap-1.5 rounded-full border border-slate-200 px-2 py-2 text-xs font-bold text-on-surface-variant transition-colors hover:border-primary hover:text-primary dark:border-slate-700 sm:px-3"
                title={`${user.publishingCredits ?? 0} websites · Buy more`}
              >
                <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>language</span>
                <span className="hidden sm:inline">{user.publishingCredits ?? 0} website{(user.publishingCredits ?? 0) !== 1 ? 's' : ''}</span>
                <span className="hidden text-on-surface-variant/60 md:inline">· Buy more</span>
              </Link>
            )}
            {!loading && site && (
              <button
                type="button"
                disabled={saving || deploying}
                onClick={openPublishReview}
                className="rounded-full bg-primary px-4 py-2 font-headline text-xs font-bold uppercase tracking-widest text-on-primary shadow-md shadow-primary/15 transition-all hover:bg-primary-container disabled:opacity-60 sm:px-6 sm:py-2.5"
              >
                Publish
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto flex min-h-0 w-full max-w-[1600px] flex-1 flex-col overflow-hidden px-3 py-2 sm:px-6 sm:py-3 md:py-4 dark:bg-slate-950">
        {loading && <p className="text-on-surface-variant">Loading site…</p>}

        {!loading && error && !site && (
          <div className="rounded-xl bg-error-container px-4 py-3 text-sm text-on-error-container">
            {error}{' '}
            <button type="button" className="underline" onClick={() => navigate('/dashboard')}>
              Return to dashboard
            </button>
          </div>
        )}

        {!loading && site && (
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            {error && (
              <div className="mb-3 shrink-0 rounded-xl bg-error-container px-4 py-3 text-sm text-on-error-container">{error}</div>
            )}

            {/* ── Mobile tab switcher (Settings / Preview) — hidden on desktop ── */}
            <div className="mb-1 flex shrink-0 overflow-hidden rounded-xl bg-surface-container-high/80 p-1 lg:hidden">
              <button
                type="button"
                onClick={() => setMobileEditorTab('settings')}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-all ${
                  mobileEditorTab === 'settings'
                    ? 'bg-white text-on-surface shadow-sm dark:bg-slate-900 dark:text-white'
                    : 'text-on-surface-variant'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">tune</span>
                Settings
              </button>
              <button
                type="button"
                onClick={() => setMobileEditorTab('preview')}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-all ${
                  mobileEditorTab === 'preview'
                    ? 'bg-white text-on-surface shadow-sm dark:bg-slate-900 dark:text-white'
                    : 'text-on-surface-variant'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">preview</span>
                Preview
              </button>
            </div>

            <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-hidden lg:flex-row lg:gap-10">
              {/* Left: settings — hidden on mobile when preview tab is active */}
              <div className={`min-h-0 min-w-0 w-full flex-1 overflow-y-auto pb-16 lg:max-w-[440px] lg:flex-none lg:shrink-0 lg:self-stretch lg:pb-2 lg:pr-2 ${mobileEditorTab === 'preview' ? 'hidden lg:block' : ''}`}>
                {/* Hidden file inputs */}
                <input ref={heroFileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" aria-label="Upload hero image" onChange={handleHeroFileChange} />
                <input ref={aboutFileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" aria-label="Upload about image" onChange={handleAboutFileChange} />

                <form onSubmit={(e) => e.preventDefault()} className="divide-y divide-slate-100 pb-8 dark:divide-slate-800">

                  {/* ── Basics ─────────────────────────────────────────── */}
                  <section className="space-y-4 py-5">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                        <span className="material-symbols-outlined text-[16px] text-slate-500">tune</span>
                      </span>
                      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Basics</h3>
                    </div>

                    <div>
                      <label className={labelClass} htmlFor="site-name">Site name</label>
                      <input id="site-name" className={inputClass} value={name} onChange={(e) => setName(e.target.value)} required />
                    </div>

                    <div>
                      <label className={labelClass} htmlFor="category">Category</label>
                      <input id="category" className={inputClass} value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Restaurant, Salon, Gym…" />
                    </div>

                    <div>
                      <label className={labelClass}>Theme</label>
                      <div className="flex gap-2">
                        {THEMES.map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => setTheme(t.id)}
                            className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all ${
                              theme === t.id
                                ? 'bg-primary text-on-primary shadow-sm'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                            }`}
                          >
                            {t.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className={labelClass} htmlFor="maps-url">Google Maps link</label>
                      <input id="maps-url" type="url" className={inputClass} value={mapsUrl} onChange={(e) => setMapsUrl(e.target.value)} placeholder="https://maps.google.com/…" />
                    </div>
                  </section>

                  {/* ── Your URL ───────────────────────────────────────── */}
                  <section className="space-y-3 py-5">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                        <span className="material-symbols-outlined text-[16px] text-slate-500">link</span>
                      </span>
                      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Your URL</h3>
                    </div>

                    {/* Subdomain row — stacks on mobile, inline on sm+ */}
                    <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center">
                      <div className="flex min-w-0 flex-1 items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 dark:border-slate-700 dark:bg-slate-800">
                        <span className="hidden shrink-0 font-mono text-xs text-slate-400 sm:inline">https://</span>
                        <input
                          ref={publicSubdomainInputRef}
                          id="public-subdomain-inline"
                          className="min-w-0 flex-1 border-none bg-transparent py-2 font-mono text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100"
                          value={publishSubdomain}
                          onChange={(e) => {
                            setPublishSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
                            setInlineAddressError(null)
                          }}
                          placeholder="your-subdomain"
                          autoComplete="off"
                          spellCheck="false"
                          disabled={inlineAddressSaving}
                        />
                        <span className="shrink-0 font-mono text-xs text-slate-400">.{PUBLIC_SITE_DOMAIN}</span>
                      </div>
                      <button
                        type="button"
                        title="Save subdomain"
                        disabled={inlineAddressSaving}
                        onClick={() => void savePublicAddressFromSettings()}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary/10 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/20 disabled:opacity-40 sm:w-auto sm:rounded-lg sm:px-3 sm:py-2"
                      >
                        <span className="material-symbols-outlined text-[18px]">save</span>
                        <span className="sm:hidden">Save URL</span>
                      </button>
                    </div>

                    {inlineAddressSaving && <p className="text-xs text-slate-400" aria-live="polite">Saving…</p>}
                    {inlineAddressError && <p className="text-xs font-medium text-red-600 dark:text-red-400" role="alert">{inlineAddressError}</p>}
                    {customPublicSiteUrl && !inlineAddressError && (
                      <p className="break-all font-mono text-[11px] text-slate-400">{customPublicSiteUrl}</p>
                    )}
                  </section>

                  {/* ── Photos ─────────────────────────────────────────── */}
                  <section className="space-y-4 py-5">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                        <span className="material-symbols-outlined text-[16px] text-slate-500">photo_library</span>
                      </span>
                      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Photos</h3>
                    </div>

                    {uploadError && <p className="text-xs font-medium text-red-600 dark:text-red-400">{uploadError}</p>}

                    {/* Hero image */}
                    <div>
                      <label className={labelClass}>Hero image <span className="font-normal text-slate-400">(top of your site)</span></label>

                      {/* Large preview */}
                      <div className="relative mb-2 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800" style={{ aspectRatio: '16/7' }}>
                        {activeHeroUrl ? (
                          <>
                            <AuthenticatedGcsImage src={activeHeroUrl} alt="Selected hero" bucketName={gcsBucket} className="h-full w-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                            <span className="absolute bottom-2 left-3 rounded-md bg-black/40 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">Active</span>
                          </>
                        ) : (
                          <div className="flex h-full flex-col items-center justify-center gap-1.5 text-slate-400">
                            <span className="material-symbols-outlined text-3xl">image</span>
                            <span className="text-xs">No image selected</span>
                          </div>
                        )}
                      </div>

                      {/* Thumbnail strip */}
                      <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:thin]">
                        {photoUrls.map((url) => {
                          const isHero = samePhotoUrl(url, activeHeroUrl)
                          return (
                            <button key={url} type="button" onClick={() => setThumbnailUrl(trimPhotoUrl(url))} title="Set as hero"
                              className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 transition-all ${isHero ? 'border-primary ring-2 ring-primary/30' : 'border-transparent hover:border-slate-300 dark:hover:border-slate-600'}`}>
                              <AuthenticatedGcsImage src={url} alt="" bucketName={gcsBucket} className="h-full w-full object-cover" loading="lazy" />
                              {isHero && (
                                <div className="absolute inset-0 flex items-center justify-center bg-primary/25">
                                  <span className="material-symbols-outlined text-[16px] text-white drop-shadow" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                                </div>
                              )}
                            </button>
                          )
                        })}
                        <button type="button" disabled={!uploadConfigured || uploadBusy}
                          onClick={() => heroFileInputRef.current?.click()}
                          className="flex h-14 w-14 shrink-0 flex-col items-center justify-center gap-0.5 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 text-slate-400 transition-colors hover:border-primary hover:bg-primary/5 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800"
                          title={uploadBusy ? 'Uploading…' : 'Upload image'}>
                          <span className="material-symbols-outlined text-[20px]">upload</span>
                          <span className="text-[9px] font-bold uppercase tracking-wide">{uploadBusy ? '…' : 'Upload'}</span>
                        </button>
                      </div>
                    </div>

                    {/* About us image */}
                    <div>
                      <label className={labelClass}>About us image <span className="font-normal text-slate-400">(shown in the About section)</span></label>
                      <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:thin]">
                        {photoUrls.length > 0 ? photoUrls.map((url) => {
                          const isAbout = samePhotoUrl(url, activeAboutUrl)
                          return (
                            <button key={`about-${url}`} type="button" onClick={() => setAboutPhotoUrl(trimPhotoUrl(url))} title="Set as About us photo"
                              className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 transition-all ${isAbout ? 'border-amber-500 ring-2 ring-amber-500/30' : 'border-transparent hover:border-slate-300 dark:hover:border-slate-600'}`}>
                              <AuthenticatedGcsImage src={url} alt="" bucketName={gcsBucket} className="h-full w-full object-cover" loading="lazy" />
                              {isAbout && (
                                <div className="absolute inset-0 flex items-center justify-center bg-amber-500/25">
                                  <span className="material-symbols-outlined text-[16px] text-white drop-shadow" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                                </div>
                              )}
                            </button>
                          )
                        }) : (
                          <span className="text-xs text-slate-400">No photos available — upload a hero image first.</span>
                        )}
                        {photoUrls.length > 0 && (
                          <button type="button" disabled={!uploadConfigured || uploadBusy}
                            onClick={() => aboutFileInputRef.current?.click()}
                            className="flex h-14 w-14 shrink-0 flex-col items-center justify-center gap-0.5 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 text-slate-400 transition-colors hover:border-amber-500 hover:bg-amber-50 hover:text-amber-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800"
                            title={uploadBusy ? 'Uploading…' : 'Upload image'}>
                            <span className="material-symbols-outlined text-[20px]">upload</span>
                            <span className="text-[9px] font-bold uppercase tracking-wide">{uploadBusy ? '…' : 'Upload'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </section>

                  {/* ── Content ────────────────────────────────────────── */}
                  <section className="space-y-4 py-5">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                        <span className="material-symbols-outlined text-[16px] text-slate-500">edit_note</span>
                      </span>
                      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Content</h3>
                    </div>

                    <div>
                      <label className={labelClass} htmlFor="tagline">Tagline</label>
                      <input id="tagline" className={inputClass} value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="A short punchy line about your business" />
                    </div>
                    <div>
                      <label className={labelClass} htmlFor="hero">Hero headline</label>
                      <input id="hero" className={inputClass} value={heroHeadline} onChange={(e) => setHeroHeadline(e.target.value)} placeholder="Big bold title at the top of your page" />
                    </div>
                    <div>
                      <label className={labelClass} htmlFor="desc">Description</label>
                      <textarea id="desc" rows={4} className={`${inputClass} resize-y`} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Tell visitors what makes your business special…" />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className={labelClass} htmlFor="phone">Phone</label>
                        <input id="phone" className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 555 000 0000" />
                      </div>
                      <div>
                        <label className={labelClass} htmlFor="web">Website</label>
                        <input id="web" type="url" className={inputClass} value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://yourbusiness.com" />
                      </div>
                    </div>
                    <div>
                      <label className={labelClass} htmlFor="cta">Button label</label>
                      <input id="cta" className={inputClass} value={ctaText} onChange={(e) => setCtaText(e.target.value)} placeholder="e.g. Book now, Contact us, Get a quote" />
                    </div>
                    <div>
                      <label className={labelClass} htmlFor="seo">SEO description <span className="font-normal text-slate-400">(shown in Google search results)</span></label>
                      <textarea id="seo" rows={2} className={`${inputClass} resize-y`} value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} placeholder="One or two sentences summarising your business for search engines" />
                    </div>
                  </section>

                  {/* ── Reviews ────────────────────────────────────────── */}
                  <section className="space-y-3 py-5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                          <span className="material-symbols-outlined text-[16px] text-slate-500">star</span>
                        </span>
                        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Reviews</h3>
                      </div>
                      {reviewsCatalog.length > 1 && (
                        <button type="button" onClick={() => setReviewsEnabled(reviewsCatalog.map(() => true))}
                          className="text-xs font-semibold text-primary hover:underline">
                          Show all
                        </button>
                      )}
                    </div>

                    {reviewsCatalog.length === 0 ? (
                      <p className="rounded-xl bg-slate-50 px-4 py-4 text-center text-xs text-slate-400 dark:bg-slate-800/60">
                        No reviews yet — use the button below to add demo reviews.
                      </p>
                    ) : (
                      <ul className="space-y-2">
                        {reviewsCatalog.map((r, i) => {
                          const stars = Math.min(5, Math.max(0, Math.round(Number(r.rating) || 0)))
                          return (
                            <li key={i} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-white px-3.5 py-3 dark:border-slate-700/80 dark:bg-slate-800/40">
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{r.author?.trim() || 'Anonymous'}</p>
                                  {r.isDemo && (
                                    <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-800 dark:bg-amber-900/40 dark:text-amber-100">Demo</span>
                                  )}
                                </div>
                                <span className="text-xs text-amber-400" aria-label={`${stars} stars`}>{'★'.repeat(stars)}{'☆'.repeat(5 - stars)}</span>
                              </div>
                              <label className="flex shrink-0 cursor-pointer items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300">
                                <input type="checkbox" checked={reviewsEnabled[i] !== false}
                                  onChange={(e) => {
                                    const n = reviewsCatalog.length
                                    setReviewsEnabled((prev) => Array.from({ length: n }, (_, j) => j === i ? e.target.checked : prev[j] !== false))
                                  }}
                                  className="h-3.5 w-3.5 rounded border-slate-300 text-primary focus:ring-primary" />
                                Show
                              </label>
                            </li>
                          )
                        })}
                      </ul>
                    )}

                    <div className="flex flex-wrap items-center gap-2">
                      <button type="button" disabled={!canLoadMoreDemo} onClick={handleLoadMoreDemoReviews}
                        className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-4 py-2 text-xs font-bold text-primary transition-colors hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-50">
                        <span className="material-symbols-outlined text-[15px]">add</span>
                        Load 5 demo reviews
                      </button>
                      {!canLoadMoreDemo && <span className="text-xs text-slate-400">Limit reached ({MAX_DEMO_REVIEWS} max)</span>}
                    </div>
                  </section>

                  {/* ── Footer ─────────────────────────────────────────── */}
                  <section className="space-y-4 py-5">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                        <span className="material-symbols-outlined text-[16px] text-slate-500">bottom_panel_open</span>
                      </span>
                      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Footer</h3>
                    </div>

                    <div>
                      <label className={labelClass} htmlFor="footer-copyright">Copyright line</label>
                      <input id="footer-copyright" className={inputClass} value={footerCopyright}
                        onChange={(e) => setFooterCopyright(e.target.value)}
                        placeholder={`© ${new Date().getFullYear()} ${name || 'Your business'}`} />
                      <p className="mt-1 text-[11px] text-slate-400">Leave blank to auto-fill with the year and site name.</p>
                    </div>
                    <div>
                      <label className={labelClass} htmlFor="footer-attribution">Attribution text</label>
                      <input id="footer-attribution" className={inputClass} value={footerAttribution}
                        onChange={(e) => setFooterAttribution(e.target.value)}
                        placeholder="Made with Place to Page" />
                    </div>
                    <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                      <input id="footer-show-attrib" type="checkbox" checked={showFooterAttribution}
                        onChange={(e) => setShowFooterAttribution(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary" />
                      Show attribution link
                    </label>
                  </section>

                </form>
              </div>

              {/* Right: live preview — hidden on mobile when settings tab is active */}
              <section className={`min-h-0 min-w-0 flex-1 flex-col overflow-hidden pl-0 pb-16 lg:pb-0 lg:min-w-0 lg:pl-2 ${mobileEditorTab === 'settings' ? 'hidden lg:flex' : 'flex'}`}>
                <div className="flex shrink-0 flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-3 dark:border-slate-800">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Live preview</p>
                    <p className="mt-0.5 text-xs text-on-surface-variant">
                      Desktop is full width; mobile uses iPhone 15 Pro size ({IPHONE_WIDTH}×{IPHONE_HEIGHT} pt). Click
                      highlighted areas in the preview to jump to the matching field.
                    </p>
                  </div>
                  {previewBusy && (
                    <span className="shrink-0 rounded-full bg-surface-container-high px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                      Updating…
                    </span>
                  )}
                </div>

                <div
                  role="tablist"
                  aria-label="Preview device"
                  className="mt-4 flex shrink-0 gap-1 rounded-xl bg-surface-container-high/80 p-1 dark:bg-slate-800/80"
                >
                  <button
                    type="button"
                    role="tab"
                    id="preview-tab-desktop"
                    aria-selected={previewTab === 'desktop'}
                    aria-controls="preview-panel-desktop"
                    tabIndex={previewTab === 'desktop' ? 0 : -1}
                    onClick={() => setPreviewTab('desktop')}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${
                      previewTab === 'desktop'
                        ? 'bg-white text-on-surface shadow-sm dark:bg-slate-900 dark:text-white'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[20px]">desktop_windows</span>
                    Desktop
                  </button>
                  <button
                    type="button"
                    role="tab"
                    id="preview-tab-mobile"
                    aria-selected={previewTab === 'mobile'}
                    aria-controls="preview-panel-mobile"
                    tabIndex={previewTab === 'mobile' ? 0 : -1}
                    onClick={() => setPreviewTab('mobile')}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${
                      previewTab === 'mobile'
                        ? 'bg-white text-on-surface shadow-sm dark:bg-slate-900 dark:text-white'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[20px]">smartphone</span>
                    iPhone
                    <span className="text-[10px] font-normal opacity-70">
                      {IPHONE_WIDTH}×{IPHONE_HEIGHT}
                    </span>
                  </button>
                </div>

                <div className="mt-3 flex min-h-0 min-w-0 flex-1 flex-col sm:mt-4">
                  <div
                    id="preview-panel-desktop"
                    role="tabpanel"
                    aria-labelledby="preview-tab-desktop"
                    hidden={previewTab !== 'desktop'}
                    className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
                  >
                    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-inner dark:border-slate-700 dark:bg-slate-900/80">
                      {previewHtml ? (
                        <iframe
                          title="Desktop preview"
                          className="min-h-0 w-full flex-1 border-0 bg-white"
                          sandbox="allow-scripts allow-same-origin"
                          srcDoc={previewSrcDoc}
                        />
                      ) : (
                        <div className="flex min-h-[12rem] flex-1 items-center justify-center text-sm text-on-surface-variant">
                          Loading preview…
                        </div>
                      )}
                    </div>
                  </div>

                  <div
                    id="preview-panel-mobile"
                    role="tabpanel"
                    aria-labelledby="preview-tab-mobile"
                    hidden={previewTab !== 'mobile'}
                    className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
                  >
                    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl bg-gradient-to-b from-slate-200/90 to-slate-300/50 py-3 dark:from-slate-800 dark:to-slate-950/80">
                      <p className="mb-2 shrink-0 text-center text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                        iPhone 15 Pro · {IPHONE_WIDTH} × {IPHONE_HEIGHT} pt
                      </p>
                      <div className="flex min-h-0 flex-1 items-center justify-center px-2">
                        <div
                          className="relative min-h-0 w-full max-w-[393px] overflow-hidden rounded-[2.5rem] border-[10px] border-slate-800 bg-slate-950 shadow-2xl ring-1 ring-black/20 dark:border-slate-700"
                          style={{
                            height: `min(${IPHONE_HEIGHT}px, 100%)`,
                            width: `min(100%, ${IPHONE_WIDTH}px)`,
                          }}
                        >
                          {previewHtml ? (
                            <iframe
                              title="iPhone preview"
                              className="h-full w-full border-0 bg-white"
                              sandbox="allow-scripts allow-same-origin"
                              srcDoc={previewSrcDoc}
                            />
                          ) : (
                            <div className="flex h-full min-h-[12rem] items-center justify-center text-sm text-on-surface-variant">
                              Loading preview…
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>
        )}
      </main>

      {publishReviewOpen && (
        <div className="fixed inset-0 z-[210] flex items-end justify-center sm:items-center sm:p-4" role="presentation">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/55 backdrop-blur-sm dark:bg-black/60"
            aria-label="Close dialog"
            disabled={saving || deploying || subdomainSaving}
            onClick={closePublishReview}
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="publish-review-title"
            className="relative z-10 w-full max-w-md overflow-y-auto rounded-t-3xl border border-slate-200/80 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900 sm:rounded-2xl"
          >
            {/* ── Drag handle (mobile) ── */}
            <div className="flex justify-center pb-1 pt-3 sm:hidden">
              <div className="h-1 w-10 rounded-full bg-slate-200 dark:bg-slate-700" />
            </div>

            <div className="px-5 pb-6 pt-4 sm:px-6 sm:pt-5">

              {/* Header */}
              <div className="mb-5 flex items-start justify-between gap-3">
                <div>
                  <h2
                    id="publish-review-title"
                    className="font-headline text-lg font-bold tracking-tight text-slate-900 dark:text-white"
                  >
                    {publishNoCredits ? 'No website credits' : 'Publish your site'}
                  </h2>
                  <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                    {publishNoCredits
                      ? 'Purchase credits to go live.'
                      : 'Confirm your public URL, then hit publish.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closePublishReview}
                  disabled={saving || deploying || subdomainSaving}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:opacity-40 dark:hover:bg-slate-800"
                  aria-label="Close"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              {publishNoCredits ? (
                /* ── Zero-credits full card ── */
                <div className="flex flex-col items-center gap-5 py-4 text-center">
                  {/* Icon badge */}
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/40">
                    <span
                      className="material-symbols-outlined text-[36px] text-amber-500"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      toll
                    </span>
                  </div>

                  <div>
                    <p className="text-base font-bold text-slate-800 dark:text-slate-100">
                      You have <span className="text-amber-600">0 website credits</span>
                    </p>
                    <p className="mt-1.5 max-w-xs text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                      You need at least one credit to publish. Plans start at just{' '}
                      <span className="font-semibold text-slate-700 dark:text-slate-200">$5</span> — pay once
                      and your site goes live instantly.
                    </p>
                  </div>

                  <Link
                    to="/purchase-tokens"
                    onClick={closePublishReview}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-bold text-on-primary shadow-md transition-all hover:brightness-110 active:scale-[0.98]"
                  >
                    <span
                      className="material-symbols-outlined text-[18px]"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      shopping_cart
                    </span>
                    Buy website credits
                  </Link>

                  <button
                    type="button"
                    onClick={closePublishReview}
                    className="text-xs text-slate-400 underline underline-offset-2 hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    Maybe later
                  </button>
                </div>
              ) : (
                <>
                  {/* ── URL display ── */}
                  <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/60">
                    <span className="material-symbols-outlined shrink-0 text-[18px] text-emerald-500" aria-hidden>
                      lock
                    </span>
                    <p className="min-w-0 flex-1 truncate font-mono text-sm text-slate-800 dark:text-slate-100">
                      {customPublicSiteUrl ? (
                        <>
                          <span className="text-slate-400">https://</span>
                          <span className="font-semibold text-primary">{trimmedPublishSubdomain}</span>
                          <span className="text-slate-400">.{PUBLIC_SITE_DOMAIN}</span>
                        </>
                      ) : (
                        <span className="italic text-slate-400">No subdomain set yet</span>
                      )}
                    </p>
                    {customPublicSiteUrl && (
                      <button
                        type="button"
                        onClick={() => void copyPublishUrl()}
                        title="Copy URL"
                        className="flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                      >
                        <span className="material-symbols-outlined text-[15px]">
                          {publishUrlCopied ? 'check' : 'content_copy'}
                        </span>
                        {publishUrlCopied ? 'Copied' : 'Copy'}
                      </button>
                    )}
                  </div>

                  {/* ── Subdomain input ── */}
                  <div className="mt-4">
                    <label className="mb-1.5 block text-xs font-semibold text-slate-500 dark:text-slate-400" htmlFor="publish-review-subdomain">
                      Subdomain
                    </label>
                    <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 dark:border-slate-700 dark:bg-slate-800">
                      <input
                        id="publish-review-subdomain"
                        className="min-w-0 flex-1 border-none bg-transparent py-2 font-mono text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100"
                        value={publishSubdomain}
                        onChange={(e) =>
                          setPublishSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
                        }
                        placeholder={site?.placeData?.subdomainSuggestionPhrase?.toLowerCase().replace(/[^a-z0-9-]/g, '-') || 'your-business'}
                        autoComplete="off"
                        spellCheck="false"
                        disabled={saving || deploying || subdomainSaving}
                      />
                      <span className="shrink-0 font-mono text-xs text-slate-400">.{PUBLIC_SITE_DOMAIN}</span>
                    </div>

                    {/* Status line */}
                    <div className="mt-2 flex items-center gap-1.5 text-xs">
                      {subdomainSaving && (
                        <><span className="material-symbols-outlined animate-spin text-[14px] text-slate-400">progress_activity</span>
                        <span className="text-slate-400">Saving…</span></>
                      )}
                      {!subdomainSaving && subdomainCheckBusy && trimmedPublishSubdomain && (
                        <><span className="material-symbols-outlined animate-spin text-[14px] text-slate-400">progress_activity</span>
                        <span className="text-slate-400">Checking…</span></>
                      )}
                      {!subdomainSaving && !subdomainCheckBusy && trimmedPublishSubdomain && !subdomainFormatOk && (
                        <><span className="material-symbols-outlined text-[14px] text-red-500" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
                        <span className="text-red-600 dark:text-red-400">Invalid format — use letters, numbers and hyphens only.</span></>
                      )}
                      {!subdomainSaving && !subdomainCheckBusy && subdomainSaveError && (
                        <><span className="material-symbols-outlined text-[14px] text-red-500" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
                        <span className="text-red-600 dark:text-red-400">{subdomainSaveError}</span></>
                      )}
                      {!subdomainSaving && !subdomainCheckBusy && trimmedPublishSubdomain && subdomainFormatOk && subdomainAvailability && (
                        subdomainAvailability.available ? (
                          <><span className="material-symbols-outlined text-[14px] text-emerald-500" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                          <span className="text-emerald-700 dark:text-emerald-400">
                            {subdomainInSyncWithDb ? 'Available and saved' : 'Available — saving…'}
                          </span></>
                        ) : (
                          <><span className="material-symbols-outlined text-[14px] text-red-500" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
                          <span className="text-red-600 dark:text-red-400">{subdomainAvailability.reason || 'Already taken — choose another.'}</span></>
                        )
                      )}
                      {!trimmedPublishSubdomain && !subdomainSaving && (
                        <span className="text-slate-400">Letters, numbers and hyphens only.</span>
                      )}
                    </div>
                  </div>

                  {/* ── Generic error ── */}
                  {publishModalError && (
                    <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700 dark:border-red-800/50 dark:bg-red-950/40 dark:text-red-300" role="alert">
                      <span className="material-symbols-outlined shrink-0 text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
                      {publishModalError}
                    </div>
                  )}

                  {/* ── Actions ── */}
                  <div className="mt-5 flex gap-2.5">
                    <button
                      type="button"
                      onClick={closePublishReview}
                      disabled={saving || deploying || subdomainSaving}
                      className="flex-1 rounded-full border border-slate-200 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => void confirmPublishFromReview()}
                      disabled={publishAddressBlocked || saving || deploying}
                      className="flex flex-1 items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-bold text-on-primary shadow-md transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
                    >
                      {deploying ? (
                        <><span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>Publishing…</>
                      ) : saving ? (
                        'Saving…'
                      ) : (
                        <><span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>rocket_launch</span>Publish site</>
                      )}
                    </button>
                  </div>
                </>
              )}

            </div>
          </div>
        </div>
      )}

      {publishSuccessOpen && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          role="presentation"
        >
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]"
            aria-label="Close dialog"
            onClick={closePublishSuccessModal}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="publish-success-title"
            className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary dark:bg-primary/25">
              <span className="material-symbols-outlined text-[28px]" aria-hidden>
                check_circle
              </span>
            </div>
            <h2
              id="publish-success-title"
              className="font-headline text-xl font-bold tracking-tight text-on-surface dark:text-white"
            >
              Published successfully
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
              Your latest changes are saved and your site is live. Share the link or open it to verify everything looks
              right.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-end">
              <button
                type="button"
                onClick={closePublishSuccessModal}
                className="order-2 rounded-full border-2 border-slate-200 px-5 py-2.5 font-headline text-sm font-bold text-on-surface transition-colors hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-800 sm:order-1"
              >
                Close
              </button>
              {publishSuccessLiveUrl ? (
                <a
                  href={publishSuccessLiveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="order-1 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 font-headline text-sm font-bold text-on-primary shadow-md shadow-primary/20 transition-colors hover:bg-primary-container sm:order-2"
                >
                  <span className="material-symbols-outlined text-[20px]" aria-hidden>
                    open_in_new
                  </span>
                  View live
                </a>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
