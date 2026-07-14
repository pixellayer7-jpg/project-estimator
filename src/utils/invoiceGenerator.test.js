import { describe, it, expect } from 'vitest'
import {
  buildDepositInvoiceHtml,
  suggestedFee,
  invoiceNumber,
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
  })

  it('invoice number is stable prefix form', () => {
    expect(invoiceNumber('abcd1234-xxxx')).toMatch(/^INV-\d{8}-ABCD1234$/)
  })
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
