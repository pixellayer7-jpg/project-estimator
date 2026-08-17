import { projectTypes, addOns } from '../data/pricing'

const STORAGE_KEY = 'pixellayer-estimator-form'
const QUOTE_REF_KEY = 'pixellayer-estimator-quote-ref'

function isUuidLike(s) {
  return (
    typeof s === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      s
    )
  )
}

/** Persisted quote reference for client correspondence (no server). */
export function loadQuoteRef() {
  try {
    const raw = localStorage.getItem(QUOTE_REF_KEY)
    if (raw && isUuidLike(raw)) return raw
    return null
  } catch {
    return null
  }
}

export function saveQuoteRef(ref) {
  try {
    if (ref && isUuidLike(ref)) localStorage.setItem(QUOTE_REF_KEY, ref)
  } catch {
    /* ignore */
  }
}

export function clearQuoteRef() {
  try {
    localStorage.removeItem(QUOTE_REF_KEY)
  } catch {
    /* ignore */
  }
}

/** Returns existing valid ref or creates, persists, and returns a new UUID. */
export function ensureQuoteRef() {
  const existing = loadQuoteRef()
  if (existing) return existing
  const id = crypto.randomUUID()
  saveQuoteRef(id)
  return id
}

function normalizeExtraSections(raw) {
  const n = parseInt(String(raw), 10)
  if (!Number.isFinite(n)) return '0'
  return String(Math.min(20, Math.max(0, n)))
}

export function loadEstimatorForm() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const p = JSON.parse(raw)
    if (!p || typeof p !== 'object') return null
    const ids = new Set(projectTypes.map((t) => t.id))
    if (!ids.has(p.projectType)) return null
    const addOnIds = Array.isArray(p.addOnIds)
      ? p.addOnIds.filter((id) => addOns.some((a) => a.id === id))
      : []
    const extraSections = normalizeExtraSections(p.extraSections)
    const clientName =
      typeof p.clientName === 'string' ? p.clientName.trim().slice(0, 80) : ''
    return {
      projectType: p.projectType,
      addOnIds,
      extraSections,
      ...(clientName ? { clientName } : {}),
    }
  } catch {
    return null
  }
}

export function saveEstimatorForm(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    /* ignore quota / private mode */
  }
}

export function clearEstimatorForm() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
}
