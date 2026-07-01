import { describe, it, expect } from 'vitest'
import { indexLeadsByQuoteRef, leadCountForQuote } from './crmJoin'

describe('crmJoin', () => {
  it('indexes leads by quoteRef', () => {
    const leads = [
      { id: '1', quoteRef: 'aaa' },
      { id: '2', quoteRef: 'aaa' },
      { id: '3', quoteRef: null },
    ]
    const map = indexLeadsByQuoteRef(leads)
    expect(map.get('aaa')).toHaveLength(2)
  })

  it('counts leads for quote id and quoteRef', () => {
    const leads = [{ quoteRef: 'ref-1' }, { quoteRef: 'q-id' }]
    const map = indexLeadsByQuoteRef(leads)
    expect(leadCountForQuote({ id: 'q-id', quoteRef: 'ref-1' }, map)).toBe(2)
  })
})
