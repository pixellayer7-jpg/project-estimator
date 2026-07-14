import { cloneDemoSeed, computeCrmStats } from '../data/crmDemoSeed'

const STORAGE_KEY = 'pixellayer-crm-demo-v1'

export function loadCrmDemoState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return cloneDemoSeed()
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed?.quotes) || !Array.isArray(parsed?.leads)) {
      return cloneDemoSeed()
    }
    return {
      quotes: parsed.quotes.map((q) => ({ ...q })),
      leads: parsed.leads.map((l) => ({ ...l })),
    }
  } catch {
    return cloneDemoSeed()
  }
}

export function saveCrmDemoState(state) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        quotes: state.quotes,
        leads: state.leads,
      })
    )
  } catch {
    /* ignore quota / private mode */
  }
}

export function resetCrmDemoState() {
  const fresh = cloneDemoSeed()
  saveCrmDemoState(fresh)
  return fresh
}

export function patchDemoQuoteStatus(state, id, status) {
  const quotes = state.quotes.map((q) => (q.id === id ? { ...q, status } : q))
  const next = { quotes, leads: state.leads }
  saveCrmDemoState(next)
  return next
}

export function patchDemoLeadStatus(state, id, status) {
  const leads = state.leads.map((l) => (l.id === id ? { ...l, status } : l))
  const next = { quotes: state.quotes, leads }
  saveCrmDemoState(next)
  return next
}

export function demoStatsFromState(state) {
  return computeCrmStats(state.quotes, state.leads)
}

export { STORAGE_KEY as CRM_DEMO_STORAGE_KEY }
