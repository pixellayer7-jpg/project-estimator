import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CrmAdmin from './CrmAdmin'
import { acceptQuote, PORTAL_ACCEPT_KEY } from '../utils/portalAcceptStore'
import { saveQuoteRef } from '../utils/storage'

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
})
