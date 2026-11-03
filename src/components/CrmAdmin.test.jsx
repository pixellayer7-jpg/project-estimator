import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CrmAdmin from './CrmAdmin'
import {
  acceptQuote,
  markDepositSent,
  PORTAL_ACCEPT_KEY,
} from '../utils/portalAcceptStore'
import { saveQuoteRef } from '../utils/storage'
import { downloadCsv, downloadJson } from '../utils/exportCrm'
import {
  downloadEngagementJson,
  downloadEngagementMarkdown,
} from '../utils/engagementRecord'

vi.mock('../utils/exportCrm', () => ({
  downloadJson: vi.fn(),
  downloadCsv: vi.fn(),
}))

vi.mock('../utils/engagementRecord', async () => {
  const actual = await vi.importActual('../utils/engagementRecord')
  return {
    ...actual,
    downloadEngagementJson: vi.fn(),
    downloadEngagementMarkdown: vi.fn(),
  }
})

const QUOTE_ID = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee'

describe('CrmAdmin', () => {
  beforeEach(() => {
    localStorage.clear()
    localStorage.removeItem(PORTAL_ACCEPT_KEY)
    sessionStorage.clear()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  it('auto-loads live leads when a token is saved', async () => {
    vi.stubEnv('VITE_QUOTE_API_URL', 'https://api.example.com')
    sessionStorage.setItem('pixellayer-admin-token', 'dev-token')
    const leadRow = {
      id: '33333333-3333-4333-8333-333333333333',
      createdAt: '2026-10-01T00:00:00.000Z',
      name: 'Riley Live',
      email: 'riley@example.com',
      message: 'Hi',
      status: 'new',
    }
    globalThis.fetch = vi.fn(async (url) => {
      const body = String(url).includes('/leads')
        ? { items: [leadRow] }
        : String(url).includes('/quotes')
          ? { items: [] }
          : { quotes: 0, leads: 1 }
      return { ok: true, status: 200, text: async () => JSON.stringify(body) }
    })
    const user = userEvent.setup()
    render(<CrmAdmin lang="en" />)
    await user.click(screen.getByRole('tab', { name: /Leads/i }))
    expect(await screen.findByText('Riley Live')).toBeInTheDocument()
  })

  it('shows demo leads without an API', async () => {
    vi.stubEnv('VITE_QUOTE_API_URL', '')
    const user = userEvent.setup()
    render(<CrmAdmin lang="en" />)
    await user.click(screen.getByRole('tab', { name: /Leads/i }))
    expect(screen.getByText('Alex Chen')).toBeInTheDocument()
  })

  it('loads demo data when switching from live mode', async () => {
    vi.stubEnv('VITE_QUOTE_API_URL', 'https://api.example.com')
    const user = userEvent.setup()
    render(<CrmAdmin lang="en" />)
    await user.click(screen.getByRole('tab', { name: /Leads/i }))
    expect(screen.queryByText('Alex Chen')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Use demo data/i }))
    expect(screen.getByText('Alex Chen')).toBeInTheDocument()
  })

  it('shows this-browser engagement for the current quote', () => {
    saveQuoteRef(QUOTE_ID)
    acceptQuote(QUOTE_ID, { signerName: 'Jamie Chen' })
    render(<CrmAdmin lang="en" />)
    expect(
      screen.getByRole('heading', { name: /This browser/i })
    ).toBeInTheDocument()
    expect(screen.getByText('Jamie Chen')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^JSON$/i })).toBeInTheDocument()
  })

  it('renders Chinese demo copy', () => {
    vi.stubEnv('VITE_QUOTE_API_URL', '')
    render(<CrmAdmin lang="zh" />)
    expect(
      screen.getByRole('heading', { name: /CRM 管理/ })
    ).toBeInTheDocument()
    expect(screen.getByText('演示数据')).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: '线索' })).toBeInTheDocument()
  })

  it('updates demo statuses, exports rows, and resets the seed', async () => {
    vi.stubEnv('VITE_QUOTE_API_URL', '')
    const user = userEvent.setup()
    render(<CrmAdmin lang="en" />)
    await user.click(screen.getByRole('tab', { name: 'Quotes' }))
    const quoteStatus = screen.getByRole('combobox', {
      name: /Status a1111111-1111-4111-8111-111111111111/,
    })
    await user.selectOptions(quoteStatus, 'accepted')
    expect(quoteStatus).toHaveValue('accepted')
    await user.click(screen.getByRole('button', { name: 'Export JSON' }))
    await user.click(screen.getByRole('button', { name: 'Export CSV' }))
    expect(downloadJson).toHaveBeenCalledWith(
      'pixelayer-quotes.json',
      expect.any(Array)
    )
    expect(downloadCsv).toHaveBeenCalledWith(
      'pixelayer-quotes.csv',
      expect.any(Array)
    )

    await user.click(screen.getByRole('tab', { name: 'Leads' }))
    const leadStatus = screen.getByRole('combobox', {
      name: /Status lead-aaaa-1111-4111-8111-aaaaaaaaaaaa/,
    })
    await user.selectOptions(leadStatus, 'closed')
    expect(leadStatus).toHaveValue('closed')
    await user.click(screen.getByRole('button', { name: 'Export JSON' }))
    expect(downloadJson).toHaveBeenCalledWith(
      'pixelayer-leads.json',
      expect.any(Array)
    )

    await user.click(screen.getByRole('button', { name: 'Reset demo' }))
    expect(
      screen.getByRole('combobox', {
        name: /Status lead-aaaa-1111-4111-8111-aaaaaaaaaaaa/,
      })
    ).toHaveValue('qualified')
  })

  it('saves a token, refreshes, and patches live quote and lead status', async () => {
    vi.stubEnv('VITE_QUOTE_API_URL', 'https://api.example.com/')
    const quote = {
      id: 'a1111111-1111-4111-8111-111111111111',
      createdAt: '2026-10-01T00:00:00.000Z',
      projectType: 'landing',
      min: 100,
      max: 200,
      status: 'draft',
      addOnIds: [],
      extraSections: '0',
    }
    const lead = {
      id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      createdAt: '2026-10-02T00:00:00.000Z',
      name: 'Riley Live',
      email: 'riley@example.com',
      source: 'landing',
      status: 'new',
      quoteRef: quote.id,
    }
    globalThis.fetch = vi.fn(async (url, init) => {
      const path = String(url)
      if (init?.method === 'PATCH') {
        return { ok: true, status: 200, text: async () => '{}' }
      }
      const body = path.includes('/leads')
        ? { items: [lead] }
        : path.includes('/quotes')
          ? { items: [quote] }
          : { totalQuotes: 1, totalLeads: 1, quotesByStatus: { draft: 1 } }
      return { ok: true, status: 200, text: async () => JSON.stringify(body) }
    })
    const user = userEvent.setup()
    render(<CrmAdmin lang="en" />)
    expect(
      screen.getByText(/No API URL|Requires estimator-api/)
    ).toBeInTheDocument()
    await user.type(screen.getByLabelText('Bearer token'), 'secret')
    await user.click(screen.getByRole('button', { name: 'Save token' }))
    expect(screen.getByRole('button', { name: '✓' })).toBeInTheDocument()
    expect(sessionStorage.getItem('pixellayer-admin-token')).toBe('secret')
    expect(
      (await screen.findByText('Total quotes')).nextElementSibling
    ).toHaveTextContent('1')

    await user.click(screen.getByRole('button', { name: 'Refresh all' }))
    await user.click(screen.getByRole('tab', { name: 'Quotes' }))
    await user.selectOptions(
      screen.getByRole('combobox', { name: new RegExp(`Status ${quote.id}`) }),
      'sent'
    )
    await user.click(screen.getByRole('tab', { name: 'Leads' }))
    await user.selectOptions(
      screen.getByRole('combobox', { name: new RegExp(`Status ${lead.id}`) }),
      'contacted'
    )
    const methods = globalThis.fetch.mock.calls.map((call) => call[1]?.method)
    expect(methods).toContain('PATCH')
  })

  it('maps an unauthorized live response to the token hint', async () => {
    vi.stubEnv('VITE_QUOTE_API_URL', 'https://api.example.com')
    sessionStorage.setItem('pixellayer-admin-token', 'nope')
    globalThis.fetch = vi.fn(async () => ({
      ok: false,
      status: 401,
      text: async () => JSON.stringify({ error: 'Unauthorized' }),
    }))
    render(<CrmAdmin lang="en" />)
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Unauthorized — check your token.'
    )
  })

  it('reports a failed status update', async () => {
    vi.stubEnv('VITE_QUOTE_API_URL', 'https://api.example.com')
    sessionStorage.setItem('pixellayer-admin-token', 'secret')
    const quote = {
      id: 'a1111111-1111-4111-8111-111111111111',
      createdAt: '2026-10-01T00:00:00.000Z',
      projectType: 'website',
      min: 10,
      max: 20,
      status: 'draft',
    }
    globalThis.fetch = vi.fn(async (_url, init) => {
      if (init?.method === 'PATCH') {
        return {
          ok: false,
          status: 500,
          text: async () => JSON.stringify({ error: 'Cannot update' }),
        }
      }
      const body = String(_url).includes('/quotes')
        ? { items: [quote] }
        : { items: [] }
      return { ok: true, status: 200, text: async () => JSON.stringify(body) }
    })
    const user = userEvent.setup()
    render(<CrmAdmin lang="zh" />)
    await user.click(screen.getByRole('tab', { name: '报价' }))
    await user.selectOptions(
      await screen.findByRole('combobox', { name: new RegExp(quote.id) }),
      'declined'
    )
    expect(await screen.findByRole('alert')).toHaveTextContent('Cannot update')
  })

  it('forces demo data when ?demo=1 is set and counts local signatures', () => {
    vi.stubEnv('VITE_QUOTE_API_URL', 'https://api.example.com')
    window.history.replaceState({}, '', '/?demo=1')
    const second = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
    saveQuoteRef(QUOTE_ID)
    acceptQuote(QUOTE_ID, { signerName: 'Jamie Chen' })
    acceptQuote(second, { signerName: 'Riley' })
    render(<CrmAdmin lang="en" />)
    expect(screen.getByText('Demo data')).toBeInTheDocument()
    expect(
      screen.getByText('2 signed quotes in this browser')
    ).toBeInTheDocument()
    expect(screen.queryByLabelText('Bearer token')).not.toBeInTheDocument()
    window.history.replaceState({}, '', '/')
  })

  it('downloads the local engagement record', async () => {
    saveQuoteRef(QUOTE_ID)
    acceptQuote(QUOTE_ID, { signerName: 'Jamie Chen' })
    const user = userEvent.setup()
    render(<CrmAdmin lang="zh" />)
    const local = screen.getByRole('region', { name: '本浏览器' })
    await user.click(within(local).getByRole('button', { name: 'JSON' }))
    await user.click(within(local).getByRole('button', { name: 'Markdown' }))
    expect(downloadEngagementJson).toHaveBeenCalled()
    expect(downloadEngagementMarkdown).toHaveBeenCalled()
  })

  it('shows an empty live pipeline before a token is saved', async () => {
    vi.stubEnv('VITE_QUOTE_API_URL', 'https://api.example.com')
    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ totalQuotes: 0, totalLeads: 0 }),
    }))
    const user = userEvent.setup()
    render(<CrmAdmin lang="en" />)
    await user.click(screen.getByRole('tab', { name: 'Quotes' }))
    expect(screen.getByText('No quotes yet.')).toBeInTheDocument()
    await user.click(screen.getByRole('tab', { name: 'Leads' }))
    expect(screen.getByText('No leads yet.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Refresh all' })).toBeDisabled()
  })

  it('toggles back to live API and reports a non-Error refresh failure', async () => {
    vi.stubEnv('VITE_QUOTE_API_URL', 'https://api.example.com')
    sessionStorage.setItem('pixellayer-admin-token', 'secret')
    const ok = {
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          items: [],
          totalQuotes: 0,
          totalLeads: 0,
          quotesByStatus: {},
        }),
    }
    globalThis.fetch = vi.fn(async () => ok)
    const user = userEvent.setup()
    render(<CrmAdmin lang="en" />)
    expect(await screen.findByText('Total quotes')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Use demo data' }))
    expect(screen.getByText('Demo data')).toBeInTheDocument()
    globalThis.fetch = vi.fn(async () => {
      throw 'offline'
    })
    await user.click(screen.getByRole('button', { name: 'Use live API' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('offline')
  })

  it('shows the local deposit stage label in Chinese', () => {
    saveQuoteRef(QUOTE_ID)
    acceptQuote(QUOTE_ID, { signerName: 'Jamie Chen' })
    markDepositSent(QUOTE_ID)
    render(<CrmAdmin lang="zh" />)
    expect(screen.getByText('已标记定金')).toBeInTheDocument()
  })

  it('shows the empty local engagement hint and Chinese signed count', () => {
    vi.stubEnv('VITE_QUOTE_API_URL', '')
    render(<CrmAdmin lang="en" />)
    expect(
      screen.getByText(/No signed quote in this browser yet/i)
    ).toBeInTheDocument()
    cleanup()

    const second = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
    saveQuoteRef(QUOTE_ID)
    acceptQuote(QUOTE_ID, { signerName: 'Jamie Chen' })
    acceptQuote(second, { signerName: 'Riley' })
    render(<CrmAdmin lang="zh" />)
    expect(screen.getByText('本浏览器共 2 条已签署报价')).toBeInTheDocument()
  })

  it('exports leads CSV and ignores status changes when the token is cleared', async () => {
    vi.stubEnv('VITE_QUOTE_API_URL', 'https://api.example.com')
    sessionStorage.setItem('pixellayer-admin-token', 'secret')
    const quote = {
      id: 'a1111111-1111-4111-8111-111111111111',
      createdAt: '2026-10-01T00:00:00.000Z',
      projectType: 'landing',
      min: 10,
      max: 20,
      status: 'draft',
    }
    const lead = {
      id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      createdAt: '2026-10-02T00:00:00.000Z',
      name: 'Casey',
      email: 'casey@example.com',
      source: 'landing',
      status: 'new',
      quoteRef: quote.id,
    }
    globalThis.fetch = vi.fn(async (url, init) => {
      if (init?.method === 'PATCH') {
        return { ok: true, status: 200, text: async () => '{}' }
      }
      const path = String(url)
      const body = path.includes('/leads')
        ? { items: [lead] }
        : path.includes('/quotes')
          ? { items: [quote] }
          : { totalQuotes: 1, totalLeads: 1, quotesByStatus: { draft: 1 } }
      return { ok: true, status: 200, text: async () => JSON.stringify(body) }
    })
    const user = userEvent.setup()
    render(<CrmAdmin lang="en" />)
    await user.click(await screen.findByRole('tab', { name: 'Leads' }))
    expect(await screen.findByText('Casey')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Export CSV' }))
    expect(downloadCsv).toHaveBeenCalledWith(
      'pixelayer-leads.csv',
      expect.any(Array)
    )

    await user.clear(screen.getByLabelText('Bearer token'))
    const before = globalThis.fetch.mock.calls.length
    await user.click(screen.getByRole('tab', { name: 'Quotes' }))
    await user.selectOptions(
      screen.getByRole('combobox', { name: new RegExp(`Status ${quote.id}`) }),
      'sent'
    )
    await user.click(screen.getByRole('tab', { name: 'Leads' }))
    await user.selectOptions(
      screen.getByRole('combobox', { name: new RegExp(`Status ${lead.id}`) }),
      'closed'
    )
    const patchCalls = globalThis.fetch.mock.calls
      .slice(before)
      .filter((call) => call[1]?.method === 'PATCH')
    expect(patchCalls).toHaveLength(0)
  })

  it('reports a failed lead status update and a typed refresh error', async () => {
    vi.stubEnv('VITE_QUOTE_API_URL', 'https://api.example.com')
    sessionStorage.setItem('pixellayer-admin-token', 'secret')
    const lead = {
      id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      createdAt: '2026-10-02T00:00:00.000Z',
      name: 'Casey',
      email: 'casey@example.com',
      source: 'calculator',
      status: 'new',
    }
    globalThis.fetch = vi.fn(async (url, init) => {
      if (init?.method === 'PATCH') {
        return {
          ok: false,
          status: 500,
          text: async () => JSON.stringify({ error: 'Lead locked' }),
        }
      }
      const path = String(url)
      const body = path.includes('/leads')
        ? { items: [lead] }
        : path.includes('/quotes')
          ? { items: [] }
          : { totalQuotes: 0, totalLeads: 1, leadsByStatus: { new: 1 } }
      return { ok: true, status: 200, text: async () => JSON.stringify(body) }
    })
    const user = userEvent.setup()
    render(<CrmAdmin lang="en" />)
    await user.click(await screen.findByRole('tab', { name: 'Leads' }))
    await user.selectOptions(
      await screen.findByRole('combobox', { name: new RegExp(lead.id) }),
      'qualified'
    )
    expect(await screen.findByRole('alert')).toHaveTextContent('Lead locked')

    globalThis.fetch = vi.fn(async () => {
      throw new Error('network down')
    })
    await user.click(screen.getByRole('button', { name: 'Refresh all' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('network down')
  })

  it('tolerates broken session storage and non-array live payloads', async () => {
    vi.stubEnv('VITE_QUOTE_API_URL', 'https://api.example.com')
    const getItem = vi
      .spyOn(Storage.prototype, 'getItem')
      .mockImplementation(function (key) {
        if (key === 'pixellayer-admin-token') throw new Error('blocked')
        return null
      })
    render(<CrmAdmin lang="en" />)
    expect(screen.getByLabelText('Bearer token')).toHaveValue('')
    getItem.mockRestore()
    cleanup()

    sessionStorage.setItem('pixellayer-admin-token', 'secret')
    globalThis.fetch = vi.fn(async (url) => {
      const path = String(url)
      const body = path.includes('/leads')
        ? { items: null }
        : path.includes('/quotes')
          ? { items: 'nope' }
          : { totalQuotes: 0, totalLeads: 0 }
      return { ok: true, status: 200, text: async () => JSON.stringify(body) }
    })
    render(<CrmAdmin lang="en" />)
    expect(await screen.findByText('Total quotes')).toBeInTheDocument()
    await userEvent.setup().click(screen.getByRole('tab', { name: 'Quotes' }))
    expect(screen.getByText('No quotes yet.')).toBeInTheDocument()
  })

  it('swallows a full sessionStorage when saving the token', async () => {
    vi.stubEnv('VITE_QUOTE_API_URL', 'https://api.example.com')
    const setItem = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw new Error('quota')
      })
    const user = userEvent.setup()
    render(<CrmAdmin lang="en" />)
    await user.type(screen.getByLabelText('Bearer token'), 'secret')
    await user.click(screen.getByRole('button', { name: 'Save token' }))
    expect(
      screen.getByRole('button', { name: 'Save token' })
    ).toBeInTheDocument()
    setItem.mockRestore()
  })

  it('falls back when demo detection cannot read the URL', () => {
    vi.stubEnv('VITE_QUOTE_API_URL', 'https://api.example.com')
    const original = window.location
    Object.defineProperty(window, 'location', {
      configurable: true,
      get() {
        throw new Error('no location')
      },
    })
    try {
      render(<CrmAdmin lang="en" />)
      expect(screen.getByLabelText('Bearer token')).toBeInTheDocument()
      expect(screen.queryByText('Demo data')).not.toBeInTheDocument()
    } finally {
      Object.defineProperty(window, 'location', {
        configurable: true,
        value: original,
      })
    }
  })

  it('renders live rows that omit status and add-ons', async () => {
    vi.stubEnv('VITE_QUOTE_API_URL', 'https://api.example.com')
    sessionStorage.setItem('pixellayer-admin-token', 'secret')
    const quote = {
      id: 'a1111111-1111-4111-8111-111111111111',
      createdAt: '2026-10-01T00:00:00.000Z',
      projectType: 'website',
      min: 100,
      max: 200,
    }
    const lead = {
      id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      createdAt: '2026-10-02T00:00:00.000Z',
      name: 'No Status',
      email: 'none@example.com',
      source: 'landing',
    }
    globalThis.fetch = vi.fn(async (url) => {
      const path = String(url)
      const body = path.includes('/leads')
        ? { items: [lead] }
        : path.includes('/quotes')
          ? { items: [quote] }
          : { totalQuotes: 1, totalLeads: 1 }
      return { ok: true, status: 200, text: async () => JSON.stringify(body) }
    })
    const user = userEvent.setup()
    render(<CrmAdmin lang="en" />)
    await user.click(await screen.findByRole('tab', { name: 'Quotes' }))
    expect(
      screen.getByRole('combobox', { name: new RegExp(`Status ${quote.id}`) })
    ).toHaveValue('draft')
    const proposal = screen
      .getAllByRole('link', { name: /^Proposal$/i })
      .find((a) => a.getAttribute('href')?.includes('type=website'))
    expect(proposal).toHaveAttribute(
      'href',
      expect.stringContaining('proposal=sow')
    )
    await user.click(screen.getByRole('tab', { name: 'Leads' }))
    expect(
      screen.getByRole('combobox', { name: new RegExp(`Status ${lead.id}`) })
    ).toHaveValue('new')
  })
})
