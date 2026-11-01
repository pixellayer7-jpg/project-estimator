import { describe, it, expect, beforeEach, vi } from 'vitest'
import { computeCrmStats, cloneDemoSeed } from '../data/crmDemoSeed'
import {
  loadCrmDemoState,
  saveCrmDemoState,
  patchDemoQuoteStatus,
  patchDemoLeadStatus,
  resetCrmDemoState,
  demoStatsFromState,
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

  it('defaults missing quote and lead statuses', () => {
    const stats = computeCrmStats(
      [{ id: 'q1' }, { id: 'q2', status: 'sent' }],
      [{ id: 'l1' }, { id: 'l2', status: 'closed' }]
    )
    expect(stats.quotesByStatus.draft).toBe(1)
    expect(stats.quotesByStatus.sent).toBe(1)
    expect(stats.leadsByStatus.new).toBe(1)
    expect(stats.leadsByStatus.closed).toBe(1)
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

  it('falls back to the seed for missing, invalid, or corrupt storage', () => {
    const seed = cloneDemoSeed()
    expect(loadCrmDemoState().quotes[0].id).toBe(seed.quotes[0].id)

    localStorage.setItem(CRM_DEMO_STORAGE_KEY, JSON.stringify({ quotes: [] }))
    expect(loadCrmDemoState().leads.length).toBe(seed.leads.length)

    localStorage.setItem(
      CRM_DEMO_STORAGE_KEY,
      JSON.stringify({ leads: [], quotes: 'nope' })
    )
    expect(loadCrmDemoState().quotes.length).toBe(seed.quotes.length)

    localStorage.setItem(CRM_DEMO_STORAGE_KEY, '{broken')
    expect(loadCrmDemoState().quotes[0].id).toBe(seed.quotes[0].id)
  })

  it('persists lead status changes and reports demo stats', () => {
    const initial = loadCrmDemoState()
    const target = initial.leads[0]
    const next = patchDemoLeadStatus(initial, target.id, 'closed')
    expect(next.leads.find((l) => l.id === target.id)?.status).toBe('closed')
    expect(
      loadCrmDemoState().leads.find((l) => l.id === target.id)?.status
    ).toBe('closed')
    const stats = demoStatsFromState(next)
    expect(stats.totalQuotes).toBe(next.quotes.length)
    expect(stats.leadsByStatus.closed).toBeGreaterThanOrEqual(1)
  })

  it('swallows a full localStorage when saving', () => {
    const setItem = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw new Error('quota')
      })
    expect(() =>
      saveCrmDemoState({ quotes: [{ id: '1' }], leads: [] })
    ).not.toThrow()
    setItem.mockRestore()
  })
})
