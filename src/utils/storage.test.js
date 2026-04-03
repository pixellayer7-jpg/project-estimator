import { describe, it, expect, beforeEach } from 'vitest'
import {
  loadEstimatorForm,
  saveEstimatorForm,
  clearEstimatorForm,
} from './storage'

const KEY = 'pixellayer-estimator-form'

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
})
