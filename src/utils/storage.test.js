import { describe, it, expect, beforeEach } from 'vitest'
import {
  loadEstimatorForm,
  saveEstimatorForm,
  clearEstimatorForm,
  loadQuoteRef,
  saveQuoteRef,
  clearQuoteRef,
  ensureQuoteRef,
} from './storage'

const KEY = 'pixellayer-estimator-form'
const REF_KEY = 'pixellayer-estimator-quote-ref'

describe('storage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('loadEstimatorForm returns null when empty', () => {
    expect(loadEstimatorForm()).toBeNull()
  })

  it('save and load round-trip valid state', () => {
    const state = {
      projectType: 'website',
      addOnIds: ['design'],
      extraSections: '3',
    }
    saveEstimatorForm(state)
    expect(loadEstimatorForm()).toEqual(state)
  })

  it('round-trips optional client name', () => {
    saveEstimatorForm({
      projectType: 'landing',
      addOnIds: [],
      extraSections: '0',
      clientName: '  Acme Studio  ',
    })
    expect(loadEstimatorForm().clientName).toBe('Acme Studio')
  })

  it('normalizes extra sections on load', () => {
    saveEstimatorForm({
      projectType: 'landing',
      addOnIds: [],
      extraSections: '99',
    })
    expect(loadEstimatorForm().extraSections).toBe('20')
    saveEstimatorForm({
      projectType: 'landing',
      addOnIds: [],
      extraSections: '-2',
    })
    expect(loadEstimatorForm().extraSections).toBe('0')
  })

  it('filters unknown project type', () => {
    localStorage.setItem(
      KEY,
      JSON.stringify({
        projectType: 'invalid',
        addOnIds: [],
        extraSections: '0',
      })
    )
    expect(loadEstimatorForm()).toBeNull()
  })

  it('filters unknown add-on ids', () => {
    saveEstimatorForm({
      projectType: 'landing',
      addOnIds: ['design', 'nope'],
      extraSections: '0',
    })
    expect(loadEstimatorForm().addOnIds).toEqual(['design'])
  })

  it('clearEstimatorForm removes key', () => {
    saveEstimatorForm({
      projectType: 'landing',
      addOnIds: [],
      extraSections: '0',
    })
    clearEstimatorForm()
    expect(localStorage.getItem(KEY)).toBeNull()
  })

  it('loadEstimatorForm returns null on invalid JSON', () => {
    localStorage.setItem(KEY, '{')
    expect(loadEstimatorForm()).toBeNull()
  })

  it('quote ref round-trip and clear', () => {
    const id = '22222222-2222-4222-8222-222222222222'
    saveQuoteRef(id)
    expect(loadQuoteRef()).toBe(id)
    clearQuoteRef()
    expect(localStorage.getItem(REF_KEY)).toBeNull()
  })

  it('ensureQuoteRef creates and persists when missing', () => {
    expect(loadQuoteRef()).toBeNull()
    const a = ensureQuoteRef()
    expect(a).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    )
    expect(loadQuoteRef()).toBe(a)
  })

  it('loadQuoteRef returns null for malformed stored value', () => {
    localStorage.setItem(REF_KEY, 'not-a-uuid')
    expect(loadQuoteRef()).toBeNull()
  })
})
