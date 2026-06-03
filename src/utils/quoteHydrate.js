import { projectTypes, addOns } from '../data/pricing'
import { QUOTE_UUID_RE } from './quoteApi'

/** Clamp extra sections/pages to 0–20 as a string (matches Calculator input). */
export function clampExtraSectionsString(raw) {
  const n = parseInt(String(raw), 10)
  if (!Number.isFinite(n)) return '0'
  return String(Math.min(20, Math.max(0, n)))
}

/**
 * Map an estimator-api quote row into local form state (safe ids only).
 * @param {object} row - GET /api/v1/quotes/:id body
 * @returns {{ form: { projectType: string, addOnIds: string[], extraSections: string }, quoteRef: string | null, lang: 'en' | 'zh' | null }}
 */
export function mapQuoteRowToForm(row) {
  const pt = projectTypes.some((p) => p.id === row.projectType)
    ? row.projectType
    : 'landing'
  const addonSet = new Set(addOns.map((a) => a.id))
  const ads = Array.isArray(row.addOnIds)
    ? row.addOnIds.filter((x) => typeof x === 'string' && addonSet.has(x))
    : []
  const es = clampExtraSectionsString(String(row.extraSections ?? '0'))
  const quoteRef =
    typeof row.quoteRef === 'string' && QUOTE_UUID_RE.test(row.quoteRef)
      ? row.quoteRef
      : null
  const lang = row.lang === 'en' || row.lang === 'zh' ? row.lang : null
  return {
    form: { projectType: pt, addOnIds: ads, extraSections: es },
    quoteRef,
    lang,
  }
}
