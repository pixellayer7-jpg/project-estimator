import { describe, expect, it, beforeEach } from 'vitest'
import {
  PORTAL_ACCEPT_KEY,
  acceptQuote,
  clearQuoteAccept,
  isQuoteAccepted,
} from './portalAcceptStore'

describe('portalAcceptStore', () => {
  beforeEach(() => {
    localStorage.removeItem(PORTAL_ACCEPT_KEY)
  })

  it('persists acceptance per quote ref', () => {
    const id = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee'
    expect(isQuoteAccepted(id)).toBe(false)
    acceptQuote(id)
    expect(isQuoteAccepted(id)).toBe(true)
    clearQuoteAccept(id)
    expect(isQuoteAccepted(id)).toBe(false)
  })
})
