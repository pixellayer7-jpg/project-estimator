import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'
import { act, render, screen } from '@testing-library/react'
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

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
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
    expect(screen.queryByText('DATE')).not.toBeInTheDocument()
    expect(screen.getByLabelText(/Type your name/i)).toHaveValue('Acme Studio')
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

  it('requires a typed name before accepting', async () => {
    const user = userEvent.setup()
    render(
      <Proposal lang="en" quoteInput={{ ...quoteInput, clientName: '' }} />
    )
    const input = screen.getByLabelText(/Type your name/i)
    await user.clear(input)
    expect(
      screen.getByRole('button', { name: /Accept this scope/i })
    ).toBeDisabled()
    await user.type(input, 'Jamie Chen')
    expect(
      screen.getByRole('button', { name: /Accept this scope/i })
    ).toBeEnabled()
  })

  it('renders a Chinese invoice with no add-ons and a placeholder client', () => {
    render(
      <Proposal
        lang="zh"
        initialTab="invoice"
        quoteInput={{ projectType: 'nope', addOnIds: [], extraSections: '0' }}
      />
    )
    expect(
      screen.getByRole('heading', { level: 1, name: '定金发票' })
    ).toBeInTheDocument()
    expect(screen.getAllByText('客户法定名称').length).toBeGreaterThan(0)
    expect(screen.getByText('落地页')).toBeInTheDocument()
    expect(screen.getByText(/银行转账/)).toBeInTheDocument()
    expect(window.location.search).toContain('proposal=invoice')
  })

  it('shows None selected on an English SOW without add-ons', () => {
    render(
      <Proposal
        lang="en"
        quoteInput={{ ...quoteInput, addOnIds: [], quoteRef: null }}
      />
    )
    expect(screen.getByText('None selected')).toBeInTheDocument()
    expect(screen.getByText('QUOTE_REF')).toBeInTheDocument()
  })

  it('copies the share link, prints, and downloads the engagement record', async () => {
    const resets = []
    const realTimeout = window.setTimeout.bind(window)
    vi.spyOn(window, 'setTimeout').mockImplementation((fn, ms, ...rest) => {
      if (ms === 2000) {
        resets.push(fn)
        return 0
      }
      return realTimeout(fn, ms, ...rest)
    })
    URL.createObjectURL = vi.fn(() => 'blob:engagement')
    URL.revokeObjectURL = vi.fn()
    const downloads = []
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(
      function () {
        if (this.download) downloads.push(this.download)
      }
    )
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.spyOn(navigator.clipboard, 'writeText').mockImplementation(writeText)
    const print = vi.spyOn(window, 'print').mockImplementation(() => {})
    const user = userEvent.setup()
    render(<Proposal lang="en" quoteInput={quoteInput} />)
    await user.click(screen.getByRole('button', { name: 'Copy share link' }))
    expect(writeText).toHaveBeenCalledWith(
      expect.stringContaining('proposal=sow')
    )
    expect(
      screen.getByRole('button', { name: 'Link copied' })
    ).toBeInTheDocument()
    await act(async () => {
      resets.at(-1)()
    })
    expect(
      screen.getByRole('button', { name: 'Copy share link' })
    ).toBeInTheDocument()
    await user.click(
      screen.getByRole('button', { name: 'Print / Save as PDF' })
    )
    expect(print).toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: /Accept this scope/i }))
    await user.click(
      screen.getByRole('button', { name: 'Download engagement JSON' })
    )
    await user.click(
      screen.getByRole('button', { name: 'Download engagement Markdown' })
    )
    expect(downloads.some((name) => name.endsWith('.json'))).toBe(true)
    expect(downloads.some((name) => name.endsWith('.md'))).toBe(true)
  })

  it('shows a copy failure and still accepts when navigation throws', async () => {
    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(
      new Error('denied')
    )
    const assign = vi.fn(() => {
      throw new Error('navigation blocked')
    })
    vi.stubGlobal('location', { ...window.location, assign })
    const user = userEvent.setup()
    render(
      <Proposal
        lang="zh"
        quoteInput={{ ...quoteInput, quoteRef: null, clientName: '' }}
      />
    )
    await user.type(screen.getByLabelText('键入你的姓名'), '阿达')
    await user.click(screen.getByRole('button', { name: '复制分享链接' }))
    expect(screen.getByRole('button', { name: '复制失败' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '接受此范围' }))
    expect(screen.getByText('范围已接受')).toBeInTheDocument()
    expect(screen.getByText(/签署人/)).toBeInTheDocument()
  })
})
