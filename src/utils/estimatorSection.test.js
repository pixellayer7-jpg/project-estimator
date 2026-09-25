import { describe, it, expect, afterEach, vi } from 'vitest'
import {
  ESTIMATOR_SECTIONS,
  normalizeEstimatorSection,
  scrollToEstimatorSectionFromLocation,
} from './estimatorSection'

describe('estimatorSection', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    document.body.innerHTML = ''
  })

  it('normalizes known section ids', () => {
    expect(normalizeEstimatorSection('changelog')).toBe('changelog')
    expect(normalizeEstimatorSection('#contact')).toBe('contact')
    expect(normalizeEstimatorSection('calc')).toBe('calc')
    expect(normalizeEstimatorSection('pricing')).toBe('pricing')
    expect(normalizeEstimatorSection('nope')).toBeNull()
    expect(ESTIMATOR_SECTIONS).toContain('changelog')
  })

  it('scrolls from ?section= query', () => {
    document.body.innerHTML = '<section id="changelog"></section>'
    const el = document.getElementById('changelog')
    el.scrollIntoView = vi.fn()
    const id = scrollToEstimatorSectionFromLocation({
      search: '?lang=en&section=changelog',
      hash: '',
    })
    expect(id).toBe('changelog')
    expect(el.scrollIntoView).toHaveBeenCalled()
  })

  it('falls back to hash when section query missing', () => {
    document.body.innerHTML = '<section id="contact"></section>'
    const el = document.getElementById('contact')
    el.scrollIntoView = vi.fn()
    const id = scrollToEstimatorSectionFromLocation({
      search: '',
      hash: '#contact',
    })
    expect(id).toBe('contact')
    expect(el.scrollIntoView).toHaveBeenCalled()
  })
})
