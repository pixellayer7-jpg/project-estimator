import { describe, it, expect, beforeEach } from 'vitest'
import {
  buildLandingContactUrl,
  saveContactHandoff,
  CONTACT_HANDOFF_KEY,
} from './contactHandoff.js'

describe('contactHandoff', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  it('buildLandingContactUrl sets lang and contact hash', () => {
    const url = buildLandingContactUrl(
      'https://pixellayer7-jpg.github.io/1',
      'zh'
    )
    expect(url).toBe('https://pixellayer7-jpg.github.io/1/?lang=zh#contact')
  })

  it('saveContactHandoff stores JSON in sessionStorage', () => {
    saveContactHandoff({ summary: 'Hello', lang: 'en', quoteRef: 'abc' })
    const raw = sessionStorage.getItem(CONTACT_HANDOFF_KEY)
    expect(JSON.parse(raw)).toMatchObject({ summary: 'Hello', lang: 'en' })
  })
})
