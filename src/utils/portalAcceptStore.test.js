import { describe, expect, it, beforeEach, vi } from 'vitest'
import {
  PORTAL_ACCEPT_KEY,
  acceptQuote,
  clearQuoteAccept,
  engagementStage,
  getQuoteAcceptance,
  isDepositSent,
  isKickoffComplete,
  isQuoteAccepted,
  listLocalEngagements,
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
    expect(getQuoteAcceptance(id).kickoffCompletedAt).toBeTruthy()
    expect(listLocalEngagements()[0].stage).toBe('kickoff')
  })

  it('guards empty ids, corrupt storage, and stage transitions', () => {
    expect(acceptQuote('')).toBe(false)
    expect(markDepositSent('')).toBe(false)
    expect(
      setKickoffItem('aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee', 'logo', true)
    ).toBe(false)
    expect(getQuoteAcceptance('')).toBeNull()
    expect(engagementStage(null)).toBe('draft')
    expect(() => clearQuoteAccept('')).not.toThrow()

    localStorage.setItem(PORTAL_ACCEPT_KEY, '{broken')
    expect(
      getQuoteAcceptance('aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee')
    ).toBeNull()
    localStorage.setItem(PORTAL_ACCEPT_KEY, JSON.stringify(['nope']))
    expect(listLocalEngagements()).toEqual([])
    localStorage.setItem(
      PORTAL_ACCEPT_KEY,
      JSON.stringify({
        'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee': 'row',
        'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb': {
          acceptedAt: '2026-01-01T00:00:00.000Z',
          signerName: 'A',
        },
      })
    )
    expect(
      getQuoteAcceptance('aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee')
    ).toBeNull()
    expect(listLocalEngagements()).toHaveLength(1)
    expect(listLocalEngagements()[0].stage).toBe('signed')

    const id = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
    acceptQuote(id, { signerName: 'Jamie' })
    expect(engagementStage(getQuoteAcceptance(id))).toBe('signed')
    expect(markDepositSent(id)).toBe(true)
    expect(engagementStage(getQuoteAcceptance(id))).toBe('deposit')
    expect(markDepositSent(id)).toBe(true)

    const setItem = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw new Error('quota')
      })
    expect(() => acceptQuote(id, { signerName: 'Still ok' })).not.toThrow()
    setItem.mockRestore()
  })
})
