import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  buildLandingContactUrl,
  saveContactHandoff,
  isHandoffOriginCompatible,
  CONTACT_HANDOFF_KEY,
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
    vi.unstubAllGlobals()
  })
})
