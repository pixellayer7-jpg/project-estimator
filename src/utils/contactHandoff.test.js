import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  buildLandingContactUrl,
  saveContactHandoff,
  isHandoffOriginCompatible,
  CONTACT_HANDOFF_KEY,
  saveLastQuoteId,
  readLastQuoteId,
  SAVED_QUOTE_ID_KEY,
} from './contactHandoff.js'

describe('contactHandoff', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  it('buildLandingContactUrl sets lang, utm, quote id, and contact hash', () => {
    const url = buildLandingContactUrl(
      'https://pixellayer7-jpg.github.io/1',
      'zh',
      'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee'
    )
    expect(url).toContain('lang=zh')
    expect(url).toContain('quote=aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee')
    expect(url).toContain('#contact')
  })

  it('saveContactHandoff stores JSON in sessionStorage', () => {
    saveContactHandoff({
      summary: 'Hello',
      lang: 'en',
      quoteRef: 'abc',
      projectType: 'landing',
    })
    const raw = sessionStorage.getItem(CONTACT_HANDOFF_KEY)
    expect(JSON.parse(raw)).toMatchObject({
      summary: 'Hello',
      projectType: 'landing',
    })
  })

  it('isHandoffOriginCompatible compares origins', () => {
    vi.stubGlobal('location', {
      ...window.location,
      origin: 'https://pixellayer7-jpg.github.io',
    })
    expect(
      isHandoffOriginCompatible('https://pixellayer7-jpg.github.io/1/')
    ).toBe(true)
    expect(isHandoffOriginCompatible('https://example.com/1/')).toBe(false)
    expect(isHandoffOriginCompatible('::::')).toBe(false)
    vi.unstubAllGlobals()
  })

  it('sets English lang and omits quote when no id is passed', () => {
    const url = new URL(buildLandingContactUrl('https://example.com/1', 'en'))
    expect(url.searchParams.get('lang')).toBe('en')
    expect(url.searchParams.get('quote')).toBeNull()
    expect(url.searchParams.get('utm_medium')).toBe('cta')
    expect(url.hash).toBe('#contact')
  })

  it('skips lang when it is neither en nor zh', () => {
    const url = new URL(buildLandingContactUrl('https://example.com/1/', 'fr'))
    expect(url.searchParams.has('lang')).toBe(false)
  })

  it('round-trips the last saved quote id', () => {
    expect(readLastQuoteId()).toBe('')
    saveLastQuoteId('abc')
    expect(sessionStorage.getItem(SAVED_QUOTE_ID_KEY)).toBe('abc')
    expect(readLastQuoteId()).toBe('abc')
  })

  it('swallows sessionStorage failures', () => {
    const setItem = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw new Error('full')
      })
    expect(() => saveLastQuoteId('x')).not.toThrow()
    expect(() => saveContactHandoff({ summary: 'a', lang: 'en' })).not.toThrow()
    setItem.mockRestore()

    const getItem = vi
      .spyOn(Storage.prototype, 'getItem')
      .mockImplementation(() => {
        throw new Error('blocked')
      })
    expect(readLastQuoteId()).toBe('')
    getItem.mockRestore()
  })
})
