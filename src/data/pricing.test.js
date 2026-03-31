import { describe, it, expect } from 'vitest'
import { calculateQuote } from './pricing'

describe('calculateQuote', () => {
  it('returns zero for unknown project type', () => {
    expect(calculateQuote('nope', [], '0', 'en')).toEqual({ min: 0, max: 0 })
  })

  it('returns base landing range with no add-ons', () => {
    expect(calculateQuote('landing', [], '0', 'en')).toEqual({ min: 800, max: 1200 })
  })

  it('applies design add-on as percent of type min/max', () => {
    expect(calculateQuote('landing', ['design'], '0', 'en')).toEqual({
      min: 1000,
      max: 1500,
    })
  })

  it('stacks multiple add-ons', () => {
    expect(calculateQuote('landing', ['design', 'rush'], '0', 'en')).toEqual({
      min: 1160,
      max: 1740,
    })
  })

  it('adds extra section cost and clamps to 0–20', () => {
    expect(calculateQuote('landing', [], '2', 'en')).toEqual({
      min: 800 + 2 * 80,
      max: 1200 + 2 * 150,
    })
    expect(calculateQuote('landing', [], '99', 'en')).toEqual({
      min: 800 + 20 * 80,
      max: 1200 + 20 * 150,
    })
    expect(calculateQuote('landing', [], '-5', 'en')).toEqual({ min: 800, max: 1200 })
  })

  it('treats non-numeric extraSections as 0', () => {
    expect(calculateQuote('landing', [], 'abc', 'en')).toEqual({ min: 800, max: 1200 })
  })

  it('ignores unknown add-on ids', () => {
    expect(calculateQuote('landing', ['design', 'fake'], '0', 'en')).toEqual({
      min: 1000,
      max: 1500,
    })
  })

  it('lang does not change numeric result', () => {
    expect(calculateQuote('website', ['i18n'], '1', 'en')).toEqual(
      calculateQuote('website', ['i18n'], '1', 'zh')
    )
  })
})
