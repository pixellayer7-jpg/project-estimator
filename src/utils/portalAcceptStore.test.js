import { describe, expect, it, beforeEach } from 'vitest'
import {
  PORTAL_ACCEPT_KEY,
  acceptQuote,
  clearQuoteAccept,
  getQuoteAcceptance,
  isDepositSent,
  isKickoffComplete,
  isQuoteAccepted,
  markDepositSent,
  setKickoffItem,
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

  it('stores a typed signature and deposit mark', () => {
    const id = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee'
    acceptQuote(id, { signerName: 'Jamie Chen', fee: 2300, deposit: 1150 })
    expect(getQuoteAcceptance(id).signerName).toBe('Jamie Chen')
    expect(isDepositSent(id)).toBe(false)
    expect(markDepositSent(id)).toBe(true)
    expect(isDepositSent(id)).toBe(true)
  })

  it('persists kickoff checklist after acceptance', () => {
    const id = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee'
    expect(setKickoffItem(id, 'assets', true)).toBe(false)
    acceptQuote(id, { signerName: 'Jamie Chen' })
    expect(setKickoffItem(id, 'assets', true)).toBe(true)
    expect(setKickoffItem(id, 'copy', true)).toBe(true)
    expect(setKickoffItem(id, 'access', true)).toBe(true)
    markDepositSent(id)
    expect(isKickoffComplete(id)).toBe(true)
  })
})
