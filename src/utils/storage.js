import { projectTypes, addOns } from '../data/pricing'

const STORAGE_KEY = 'pixellayer-estimator-form'

function isValidExtra(s) {
  const n = parseInt(s, 10)
  return Number.isFinite(n) && n >= 0 && n <= 20
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
    const extra = p.extraSections != null ? String(p.extraSections) : '0'
    const extraSections = isValidExtra(extra) ? String(parseInt(extra, 10)) : '0'
    return {
      projectType: p.projectType,
      addOnIds,
      extraSections,
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
