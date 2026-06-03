import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  buildCalculatorLoadUrl,
  extractQuoteIdFromInput,
  getQuoteById,
  normalizeQuoteApiBase,
  postQuoteSnapshot,
} from './quoteApi'

describe('quoteApi', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('buildCalculatorLoadUrl encodes id in query', () => {
    const id = 'aaaaaaaa-bbbb-4ccc-8aaa-eeeeeeeeeeee'
    expect(buildCalculatorLoadUrl('https://calc.test/', id)).toBe(
      `https://calc.test/?load=${id}`
    )
    expect(buildCalculatorLoadUrl('', id)).toBe('')
  })

  it('extractQuoteIdFromInput supports UUIDs and saved quote links', () => {
    const id = 'aaaaaaaa-bbbb-4ccc-8aaa-eeeeeeeeeeee'
    expect(extractQuoteIdFromInput(id)).toBe(id)
    expect(extractQuoteIdFromInput(`https://calc.test/?load=${id}`)).toBe(id)
    expect(
      extractQuoteIdFromInput(`https://api.test/api/v1/quotes/${id}`)
    ).toBe(id)
    expect(extractQuoteIdFromInput('not-a-quote')).toBe('')
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

  it('getQuoteById throws without fetch when id is not a UUID', async () => {
    await expect(
      getQuoteById('https://api.test', 'not-a-uuid')
    ).rejects.toThrow('Invalid id')
  })

  it('getQuoteById returns row on 200', async () => {
    const id = 'aaaaaaaa-bbbb-4ccc-8aaa-eeeeeeeeeeee'
    const row = {
      id,
      projectType: 'landing',
      addOnIds: [],
      extraSections: '0',
      min: 800,
      max: 1200,
    }
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(row),
    })
    const out = await getQuoteById('https://api.test', id)
    expect(out.projectType).toBe('landing')
    expect(globalThis.fetch).toHaveBeenCalledWith(
      `https://api.test/api/v1/quotes/${id}`,
      expect.objectContaining({ method: 'GET' })
    )
  })
})
