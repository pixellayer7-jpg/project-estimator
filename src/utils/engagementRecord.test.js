import { describe, expect, it, vi, afterEach } from 'vitest'
import { downloadJson, downloadText } from './exportCrm'
import {
  buildEngagementMarkdown,
  buildEngagementRecord,
  downloadEngagementJson,
  downloadEngagementMarkdown,
} from './engagementRecord'
import { PORTAL_ACCEPT_KEY, acceptQuote } from './portalAcceptStore'

vi.mock('./exportCrm', () => ({
  downloadJson: vi.fn(),
  downloadText: vi.fn(),
}))

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

  it('falls back to the landing type and a local client name without a quote', () => {
    const record = buildEngagementRecord({
      projectType: 'native-app',
      addOnIds: null,
      extraSections: 4,
      clientName: '  北风工作室  ',
      now: new Date('2026-09-01T00:00:00Z'),
    })
    expect(record.quote.projectType).toBe('landing')
    expect(record.quote.addOnIds).toEqual([])
    expect(record.quote.extraSections).toBe('4')
    expect(record.quote.quoteRef).toBeNull()
    expect(record.client).toEqual({ name: '  北风工作室  ', signerName: '' })
    expect(record.status.stage).toBe('draft')
    expect(record.status.kickoff).toEqual({
      assets: false,
      copy: false,
      access: false,
    })
  })
})

describe('buildEngagementMarkdown', () => {
  it('renders Chinese fallbacks when the record is sparse', () => {
    const md = buildEngagementMarkdown({}, 'zh')
    expect(md).toContain('PixelLayer 合作记录')
    expect(md).toContain('报价编号:** QUOTE_REF')
    expect(md).toContain('附加项:** 无')
    expect(md).toContain('素材: no')
    expect(md).toContain('PixelLayer L.L.C')
    expect(buildEngagementMarkdown(buildEngagementRecord(), 'zh')).toContain(
      '非正式税务发票'
    )
  })

  it('lists selected add-ons and a completed kickoff in English', () => {
    const md = buildEngagementMarkdown(
      {
        generatedAt: '2026-09-01T00:00:00.000Z',
        provider: { name: 'PixelLayer L.L.C', email: 'pixellayer7@gmail.com' },
        quote: {
          quoteRef: 'ref-1',
          projectLabel: 'Landing Page',
          addOnLabels: ['i18n', 'rush'],
          extraSections: '2',
          range: '$1 – $2 USD',
          fee: 1500,
          deposit: 750,
        },
        client: { name: 'Ada', signerName: 'Ada Lovelace' },
        status: {
          stage: 'kickoff',
          acceptedAt: '2026-09-02',
          depositMarkedAt: '2026-09-03',
          kickoffCompletedAt: '2026-09-04',
          kickoff: { assets: true, copy: false, access: true },
        },
        notice: { en: 'Local only.' },
      },
      'en'
    )
    expect(md).toContain('i18n; rush')
    expect(md).toContain('Assets: yes')
    expect(md).toContain('Copy: no')
    expect(md).toContain('$1,500 / $750')
    expect(md).toContain('Local only.')
  })
})

describe('engagement downloads', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('names the files from the quote id and falls back to draft', () => {
    const record = {
      quote: { quoteRef: 'abc_123456789012345' },
    }
    downloadEngagementJson(record)
    expect(downloadJson).toHaveBeenCalledWith(
      'pixellayer-engagement-abc123456789.json',
      record
    )
    downloadEngagementMarkdown(record, 'zh')
    expect(downloadText).toHaveBeenCalledWith(
      'pixellayer-engagement-abc123456789.md',
      expect.stringContaining('合作记录')
    )
    downloadEngagementJson({})
    expect(downloadJson).toHaveBeenCalledWith(
      'pixellayer-engagement-draft.json',
      {}
    )
  })
})
