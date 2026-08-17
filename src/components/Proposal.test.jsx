import { describe, expect, it, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Proposal from './Proposal'
import { PORTAL_ACCEPT_KEY, isQuoteAccepted } from '../utils/portalAcceptStore'

const quoteInput = {
  projectType: 'website',
  addOnIds: ['i18n'],
  extraSections: '2',
  quoteRef: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee',
  clientName: 'Acme Studio',
}

describe('Proposal', () => {
  beforeEach(() => {
    localStorage.removeItem(PORTAL_ACCEPT_KEY)
    window.history.replaceState({}, '', '/')
  })

  it('renders a shareable SOW from the quote, including client name and range', () => {
    render(<Proposal lang="en" quoteInput={quoteInput} />)
    expect(
      screen.getByRole('heading', { level: 1, name: 'Statement of Work' })
    ).toBeInTheDocument()
    expect(screen.getAllByText('Acme Studio').length).toBeGreaterThan(0)
    expect(screen.getByText('$1,885 – $3,520 USD')).toBeInTheDocument()
    expect(
      screen.getAllByText(/Company \/ Agency Website/).length
    ).toBeGreaterThan(0)
    expect(
      screen.getByRole('link', { name: /Open client portal/i })
    ).toHaveAttribute('href', expect.stringContaining('portal=quote'))
  })

  it('switches to the deposit invoice tab', async () => {
    const user = userEvent.setup()
    render(<Proposal lang="en" quoteInput={quoteInput} initialTab="sow" />)
    await user.click(screen.getByRole('tab', { name: /Deposit invoice/i }))
    expect(
      screen.getByRole('heading', { level: 1, name: 'Deposit invoice' })
    ).toBeInTheDocument()
    expect(screen.getByText(/Deposit due/i)).toBeInTheDocument()
    expect(window.location.search).toContain('proposal=invoice')
  })

  it('accepts the scope in this browser', async () => {
    const assign = vi.fn()
    vi.stubGlobal('location', {
      ...window.location,
      assign,
      href: 'http://localhost:5173/?proposal=sow',
    })
    const user = userEvent.setup()
    render(<Proposal lang="en" quoteInput={quoteInput} />)
    await user.click(screen.getByRole('button', { name: /Accept this scope/i }))
    expect(isQuoteAccepted(quoteInput.quoteRef)).toBe(true)
    expect(assign).toHaveBeenCalled()
    vi.unstubAllGlobals()
  })
})
