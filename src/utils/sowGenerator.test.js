import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  buildSowHtml,
  buildSowMarkdown,
  downloadSowMarkdown,
  openSowPrintWindow,
} from './sowGenerator'

describe('buildSowMarkdown', () => {
  it('includes project type and range in English', () => {
    const md = buildSowMarkdown({
      lang: 'en',
      projectTypeId: 'landing',
      addOnIds: ['i18n'],
      extraSections: '2',
      min: 920,
      max: 1380,
      quoteRef: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee',
    })
    expect(md).toContain('Landing Page')
    expect(md).toContain('$920 – $1,380 USD')
    expect(md).toContain('aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee')
    expect(md).toContain('Multilingual')
    expect(md).toContain('CLIENT_LEGAL_NAME')
    expect(md).toContain('Bank transfer')
  })

  it('uses the provided client name', () => {
    const md = buildSowMarkdown({
      lang: 'en',
      projectTypeId: 'landing',
      addOnIds: [],
      extraSections: '0',
      min: 800,
      max: 1200,
      clientName: 'Acme Studio',
    })
    expect(md).toContain('Acme Studio')
    expect(md).not.toContain('CLIENT_LEGAL_NAME')
  })

  it('includes Chinese headings when lang is zh', () => {
    const md = buildSowMarkdown({
      lang: 'zh',
      projectTypeId: 'website',
      addOnIds: [],
      extraSections: '0',
      min: 1500,
      max: 2800,
    })
    expect(md).toContain('工作说明书')
    expect(md).toContain('企业 / 工作室官网')
    expect(md).toContain('银行转账')
  })

  it('fills dates, clamps extra sections, and keeps an unknown type id', () => {
    const md = buildSowMarkdown({
      lang: 'en',
      projectTypeId: 'native-app',
      addOnIds: ['missing', 'i18n'],
      extraSections: '99',
      min: 100,
      max: 300,
      dates: {
        kickoff: '2026-11-01',
        preview: '2026-11-08',
        revisions: '2026-11-15',
        delivery: '2026-11-22',
      },
    })
    expect(md).toContain('native-app')
    expect(md).toContain('20 additional section')
    expect(md).toContain('**2026-11-01**')
    expect(md).toContain('**2026-11-22**')
    expect(md).toContain('QUOTE_REF')
    expect(md).toContain('Multilingual')
  })

  it('uses zero extra sections when the value is not a number', () => {
    const md = buildSowMarkdown({
      lang: 'zh',
      projectTypeId: 'landing',
      addOnIds: [],
      extraSections: 'nope',
      min: 800,
      max: 1200,
      clientName: '  北风工作室  ',
    })
    expect(md).toContain('**0** 个区块')
    expect(md).toContain('北风工作室')
    expect(md).toContain('无')
  })
})

describe('buildSowHtml and print download', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders Chinese HTML with escaped client text and no add-ons', () => {
    const html = buildSowHtml({
      lang: 'zh',
      projectTypeId: 'dashboard',
      addOnIds: [],
      extraSections: 'nope',
      min: 2200,
      max: 4500,
      clientName: 'A & B <studio>',
      dates: { kickoff: '2026-12-01' },
    })
    expect(html).toContain('lang="zh-CN"')
    expect(html).toContain('工作说明书（草案）')
    expect(html).toContain('A &amp; B &lt;studio&gt;')
    expect(html).toContain('无')
    expect(html).toContain('2026-12-01')
    expect(html).toContain('QUOTE_REF（发送前填写）')
  })

  it('downloads markdown through an object URL', async () => {
    URL.createObjectURL = vi.fn(() => 'blob:sow')
    URL.revokeObjectURL = vi.fn()
    const clicks = []
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(
      function () {
        clicks.push(this.download)
      }
    )
    downloadSowMarkdown('# SOW')
    expect(clicks).toEqual(['pixelayer-sow-draft.md'])
    expect(await URL.createObjectURL.mock.calls[0][0].text()).toBe('# SOW')
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:sow')
    downloadSowMarkdown('# Custom', 'custom.md')
    expect(clicks[1]).toBe('custom.md')
  })

  it('opens a print window and reports a blocked popup', () => {
    const opened = {
      document: { open: vi.fn(), write: vi.fn(), close: vi.fn() },
    }
    vi.spyOn(window, 'open').mockReturnValue(opened)
    const params = {
      lang: 'en',
      projectTypeId: 'landing',
      addOnIds: ['i18n'],
      extraSections: '1',
      min: 800,
      max: 1200,
      quoteRef: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee',
    }
    expect(openSowPrintWindow(params)).toBe(true)
    expect(opened.document.write).toHaveBeenCalledWith(
      expect.stringContaining('Statement of Work')
    )
    window.open.mockReturnValue(null)
    expect(openSowPrintWindow(params)).toBe(false)
  })
})
