import { describe, expect, it } from 'vitest'
import {
  buildEngagementMarkdown,
  buildEngagementRecord,
} from './engagementRecord'
import { PORTAL_ACCEPT_KEY, acceptQuote } from './portalAcceptStore'

describe('buildEngagementRecord', () => {
  it('builds a signed record with fee, deposit, and notice', () => {
    localStorage.removeItem(PORTAL_ACCEPT_KEY)
    const id = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee'
    acceptQuote(id, {
      signerName: 'Jamie Chen',
      clientName: 'Acme Studio',
      fee: 2702,
      deposit: 1351,
    })
    const record = buildEngagementRecord({
      quoteRef: id,
      projectType: 'website',
      addOnIds: ['i18n'],
      extraSections: '2',
      now: new Date('2026-08-18T12:00:00Z'),
    })
    expect(record.schema).toBe('pixellayer.engagement.v1')
    expect(record.quote.projectType).toBe('website')
    expect(record.client.signerName).toBe('Jamie Chen')
    expect(record.status.stage).toBe('signed')
    expect(record.quote.fee).toBeGreaterThan(0)
    const md = buildEngagementMarkdown(record, 'en')
    expect(md).toContain('Jamie Chen')
    expect(md).toContain('engagement record')
    expect(md).toContain(id)
  })
})
