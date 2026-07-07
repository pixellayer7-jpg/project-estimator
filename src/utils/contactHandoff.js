/** Shared sessionStorage key — same origin across /1/ and /project-estimator/ on GitHub Pages. */
export const CONTACT_HANDOFF_KEY = 'pixellayer-contact-handoff'

/** Last saved API quote id (for lead quoteRef). */
export const SAVED_QUOTE_ID_KEY = 'pixellayer-last-saved-quote-id'

export function saveLastQuoteId(id) {
  try {
    sessionStorage.setItem(SAVED_QUOTE_ID_KEY, id)
  } catch {
    /* ignore */
  }
}

export function readLastQuoteId() {
  try {
    return sessionStorage.getItem(SAVED_QUOTE_ID_KEY) || ''
  } catch {
    return ''
  }
}

/** @param {string} landingUrl */
export function isHandoffOriginCompatible(landingUrl) {
  try {
    return (
      new URL(landingUrl.replace(/\/?$/, '/')).origin === window.location.origin
    )
  } catch {
    return false
  }
}

/** @param {{
 *   summary: string
 *   lang: string
 *   quoteRef?: string | null
 *   min?: number
 *   max?: number
 *   projectType?: string
 *   addOnIds?: string[]
 *   extraSections?: string | number
 * }} payload */
export function saveContactHandoff(payload) {
  try {
    sessionStorage.setItem(CONTACT_HANDOFF_KEY, JSON.stringify(payload))
  } catch {
    /* ignore */
  }
}

/** @param {string} landingUrl @param {string} lang @param {string | null} [quoteId] */
export function buildLandingContactUrl(landingUrl, lang, quoteId = null) {
  const url = new URL(landingUrl.replace(/\/?$/, '/'))
  if (lang === 'en' || lang === 'zh') url.searchParams.set('lang', lang)
  url.searchParams.set('utm_source', 'project-estimator')
  url.searchParams.set('utm_medium', 'cta')
  if (quoteId) url.searchParams.set('quote', quoteId)
  url.hash = 'contact'
  return url.toString()
}
