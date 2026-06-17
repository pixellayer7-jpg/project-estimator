/** Shared sessionStorage key — same origin across /1/ and /project-estimator/ on GitHub Pages. */
export const CONTACT_HANDOFF_KEY = 'pixellayer-contact-handoff'

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

/** @param {string} landingUrl @param {string} lang */
export function buildLandingContactUrl(landingUrl, lang) {
  const url = new URL(landingUrl.replace(/\/?$/, '/'))
  if (lang === 'en' || lang === 'zh') url.searchParams.set('lang', lang)
  url.searchParams.set('utm_source', 'project-estimator')
  url.searchParams.set('utm_medium', 'cta')
  url.hash = 'contact'
  return url.toString()
}
