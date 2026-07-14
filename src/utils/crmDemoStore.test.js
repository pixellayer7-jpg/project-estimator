import { describe, it, expect, beforeEach } from 'vitest'
import { computeCrmStats, cloneDemoSeed } from '../data/crmDemoSeed'
import {
  loadCrmDemoState,
  patchDemoQuoteStatus,
  resetCrmDemoState,
  CRM_DEMO_STORAGE_KEY,
} from './crmDemoStore'

describe('crmDemoSeed', () => {
  it('seeds multiple quotes and leads with statuses', () => {
    const seed = cloneDemoSeed()
    expect(seed.quotes.length).toBeGreaterThanOrEqual(3)
    expect(seed.leads.length).toBeGreaterThanOrEqual(3)
    const stats = computeCrmStats(seed.quotes, seed.leads)
    expect(stats.totalQuotes).toBe(seed.quotes.length)
    expect(stats.totalLeads).toBe(seed.leads.length)
    expect(stats.quotesByStatus.sent).toBeGreaterThanOrEqual(1)
    expect(stats.leadsByStatus.new).toBeGreaterThanOrEqual(1)
  })
})

describe('crmDemoStore', () => {
  beforeEach(() => {
    localStorage.removeItem(CRM_DEMO_STORAGE_KEY)
  })

  it('persists quote status changes', () => {
    const initial = loadCrmDemoState()
    const target = initial.quotes[0]
    const next = patchDemoQuoteStatus(initial, target.id, 'accepted')
    expect(next.quotes.find((q) => q.id === target.id)?.status).toBe('accepted')
    const reloaded = loadCrmDemoState()
    expect(reloaded.quotes.find((q) => q.id === target.id)?.status).toBe(
      'accepted'
    )
  })

  it('reset restores seed statuses', () => {
    const initial = loadCrmDemoState()
    const target = initial.quotes[0]
    const original = target.status
    patchDemoQuoteStatus(initial, target.id, 'declined')
    const fresh = resetCrmDemoState()
    expect(fresh.quotes.find((q) => q.id === target.id)?.status).toBe(original)
  })
})
