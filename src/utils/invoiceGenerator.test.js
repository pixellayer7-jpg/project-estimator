import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  buildDepositInvoiceHtml,
  invoiceNumber,
  openDepositInvoiceWindow,
  suggestedFee,
} from './invoiceGenerator'
import { buildSowHtml } from './sowGenerator'

describe('invoiceGenerator', () => {
  it('computes 50% deposit from midpoint', () => {
    expect(suggestedFee(1000, 2000)).toBe(1500)
  })

  it('builds printable invoice with deposit amount', () => {
    const html = buildDepositInvoiceHtml({
      lang: 'en',
      projectTypeLabel: 'Landing Page',
      min: 920,
      max: 1380,
      quoteRef: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee',
    })
    expect(html).toContain('Deposit invoice')
    expect(html).toContain('INV-')
    expect(html).toContain('$1,150 USD')
    expect(html).toContain('window.print()')
    expect(html).toContain('Bank transfer')
  })

  it('escapes client name in invoice HTML', () => {
    const html = buildDepositInvoiceHtml({
      lang: 'en',
      projectTypeLabel: 'Landing Page',
      min: 920,
      max: 1380,
      clientName: '<script>x</script>',
    })
    expect(html).toContain('&lt;script&gt;x&lt;/script&gt;')
    expect(html).not.toContain('<script>x</script>')
  })

  it('invoice number is stable prefix form', () => {
    expect(invoiceNumber('abcd1234-xxxx')).toMatch(/^INV-\d{8}-ABCD1234$/)
  })

  it('treats missing amounts as zero and falls back to DRAFT', () => {
    expect(suggestedFee(undefined, '40')).toBe(20)
    expect(suggestedFee('nope', null)).toBe(0)
    expect(invoiceNumber('')).toMatch(/^INV-\d{8}-DRAFT$/)
    expect(invoiceNumber('---')).toMatch(/^INV-\d{8}-DRAFT$/)
  })

  it('renders a Chinese invoice and escapes quotes in the client name', () => {
    const html = buildDepositInvoiceHtml({
      lang: 'zh',
      projectTypeLabel: '落地页',
      min: 800,
      max: 1200,
      clientName: 'Tom & "Ada"',
    })
    expect(html).toContain('lang="zh-CN"')
    expect(html).toContain('定金发票（草案）')
    expect(html).toContain('银行转账')
    expect(html).toContain('Tom &amp; &quot;Ada&quot;')
    expect(html).toContain('$1,000 USD')
  })

  it('opens a print window and reports a blocked popup', () => {
    const opened = {
      document: { open: vi.fn(), write: vi.fn(), close: vi.fn() },
    }
    vi.spyOn(window, 'open').mockReturnValue(opened)
    expect(
      openDepositInvoiceWindow({
        lang: 'en',
        projectTypeLabel: 'Landing Page',
        min: 100,
        max: 200,
      })
    ).toBe(true)
    expect(opened.document.write).toHaveBeenCalledWith(
      expect.stringContaining('Deposit invoice')
    )
    window.open.mockReturnValue(null)
    expect(
      openDepositInvoiceWindow({
        lang: 'en',
        projectTypeLabel: 'Landing Page',
        min: 1,
        max: 2,
      })
    ).toBe(false)
  })
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('buildSowHtml', () => {
  it('includes print affordance and range', () => {
    const html = buildSowHtml({
      lang: 'en',
      projectTypeId: 'landing',
      addOnIds: ['i18n'],
      extraSections: '1',
      min: 920,
      max: 1380,
      quoteRef: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee',
    })
    expect(html).toContain('Statement of Work')
    expect(html).toContain('$920 – $1,380 USD')
    expect(html).toContain('window.print()')
    expect(html).toContain('PixelLayer L.L.C')
  })
})
