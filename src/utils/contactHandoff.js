/** Shared sessionStorage key — same origin across /1/ and /project-estimator/ on GitHub Pages. */
export const CONTACT_HANDOFF_KEY = 'pixellayer-contact-handoff'

/** @param {{ summary: string, lang: string, quoteRef?: string | null, min?: number, max?: number }} payload */
export function saveContactHandoff(payload) {
  try {
    sessionStorage.setItem(CONTACT_HANDOFF_KEY, JSON.stringify(payload))
  } catch {
    /* ignore */
  }
}

/** @param {string} landingUrl */
export function buildLandingContactUrl(landingUrl, lang) {
  const url = new URL(landingUrl.replace(/\/?$/, '/'))
  if (lang === 'en' || lang === 'zh') url.searchParams.set('lang', lang)
  url.hash = 'contact'
  return url.toString()
}
