import { projectTypes, addOns } from '../data/pricing'

const STORAGE_KEY = 'pixellayer-estimator-form'

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
