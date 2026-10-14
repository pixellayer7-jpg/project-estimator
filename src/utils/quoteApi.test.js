import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  buildCalculatorLoadUrl,
  extractQuoteIdFromInput,
  getQuoteById,
  getStats,
  listLeadsRecent,
  listQuotesRecent,
  normalizeQuoteApiBase,
  patchLeadStatus,
  patchQuoteStatus,
  postLead,
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

  it('getQuoteById and postQuoteSnapshot reject malformed success bodies', async () => {
    const id = 'aaaaaaaa-bbbb-4ccc-8aaa-eeeeeeeeeeee'
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => 'not json',
    })
    await expect(getQuoteById('https://api.test', id)).rejects.toThrow(
      'Invalid response'
    )
    await expect(postQuoteSnapshot('https://api.test', {})).rejects.toThrow(
      'Invalid response'
    )
  })
})

describe('quoteApi CRM endpoints', () => {
  const BASE = 'https://api.test'
  const ID = 'aaaaaaaa-bbbb-4ccc-8aaa-eeeeeeeeeeee'

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  function stubFetch(ok, status, body) {
    const fetchMock = vi.fn().mockResolvedValue({
      ok,
      status,
      text: async () => body,
    })
    vi.stubGlobal('fetch', fetchMock)
    return fetchMock
  }

  const CASES = [
    {
      name: 'listQuotesRecent',
      call: (token) => listQuotesRecent(BASE, token, 5),
      url: `${BASE}/api/v1/quotes?limit=5`,
      method: 'GET',
    },
    {
      name: 'listLeadsRecent',
      call: (token) => listLeadsRecent(BASE, token),
      url: `${BASE}/api/v1/leads?limit=50`,
      method: 'GET',
    },
    {
      name: 'patchQuoteStatus',
      call: (token) => patchQuoteStatus(BASE, token, ID, 'won'),
      url: `${BASE}/api/v1/quotes/${ID}`,
      method: 'PATCH',
      body: { status: 'won' },
    },
    {
      name: 'patchLeadStatus',
      call: (token) => patchLeadStatus(BASE, token, ID, 'contacted'),
      url: `${BASE}/api/v1/leads/${ID}`,
      method: 'PATCH',
      body: { status: 'contacted' },
    },
    {
      name: 'postLead',
      call: () => postLead(BASE, { email: 'a@b.com' }),
      url: `${BASE}/api/v1/leads`,
      method: 'POST',
      body: { email: 'a@b.com' },
      public: true,
    },
    {
      name: 'getStats',
      call: () => getStats(BASE),
      url: `${BASE}/api/v1/stats`,
      method: 'GET',
      public: true,
    },
  ]

  for (const c of CASES) {
    it(`${c.name} sends the right request and returns JSON`, async () => {
      const fetchMock = stubFetch(true, 200, JSON.stringify({ ok: 1 }))
      await expect(c.call('secret')).resolves.toEqual({ ok: 1 })
      const [url, init] = fetchMock.mock.calls[0]
      expect(url).toBe(c.url)
      expect(init.method).toBe(c.method)
      if (c.body) expect(JSON.parse(init.body)).toEqual(c.body)
      if (!c.public) {
        expect(init.headers.Authorization).toBe('Bearer secret')
      }
    })

    it(`${c.name} surfaces API errors, falling back to the HTTP status`, async () => {
      stubFetch(false, 401, JSON.stringify({ error: 'Unauthorized' }))
      await expect(c.call('')).rejects.toThrow('Unauthorized')
      stubFetch(false, 502, '<html>')
      await expect(c.call('')).rejects.toThrow('HTTP 502')
    })
  }

  it('list calls omit Authorization without a token and treat empty bodies as {}', async () => {
    const fetchMock = stubFetch(true, 200, '')
    await expect(listQuotesRecent(BASE, '')).resolves.toEqual({})
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBeUndefined()
  })

  it('PATCH helpers reject malformed ids without calling fetch', async () => {
    const fetchMock = stubFetch(true, 200, '{}')
    await expect(patchQuoteStatus(BASE, 't', 'bad', 'won')).rejects.toThrow(
      'Invalid id'
    )
    await expect(patchLeadStatus(BASE, 't', 'bad', 'new')).rejects.toThrow(
      'Invalid id'
    )
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
