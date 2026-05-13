import { describe, it, expect, vi, afterEach } from 'vitest'
import { normalizeQuoteApiBase, postQuoteSnapshot } from './quoteApi'

describe('quoteApi', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('normalizeQuoteApiBase trims and strips slashes', () => {
    expect(normalizeQuoteApiBase('  https://x.com/api/  ')).toBe(
      'https://x.com/api'
    )
    expect(normalizeQuoteApiBase('')).toBe('')
    expect(normalizeQuoteApiBase(null)).toBe('')
  })

  it('postQuoteSnapshot returns id on 201', async () => {
    const id = 'aaaaaaaa-bbbb-4ccc-dddd-eeeeeeeeeeee'
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      text: async () =>
        JSON.stringify({
          id,
          createdAt: '2026-01-01T00:00:00.000Z',
          path: `/api/v1/quotes/${id}`,
        }),
    })
    const data = await postQuoteSnapshot('https://api.test', {
      projectType: 'landing',
      addOnIds: [],
      extraSections: '0',
      min: 100,
      max: 200,
      lang: 'en',
      quoteRef: id,
      summary: 'x',
    })
    expect(data.id).toBe(id)
    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://api.test/api/v1/quotes',
      expect.objectContaining({ method: 'POST' })
    )
  })

  it('postQuoteSnapshot throws on error JSON', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      text: async () => JSON.stringify({ error: 'bad' }),
    })
    await expect(
      postQuoteSnapshot('https://api.test', {
        projectType: 'landing',
        addOnIds: [],
        extraSections: '0',
        min: 1,
        max: 2,
        lang: 'en',
      })
    ).rejects.toThrow('bad')
  })
})
