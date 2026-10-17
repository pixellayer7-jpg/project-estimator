import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ClientPortal from './ClientPortal'
import { calculatePortalProgress, portalDemo } from '../data/clientPortalDemo'
import { buildPortalFromQuote } from '../utils/portalFromQuote'
import { acceptQuote, PORTAL_ACCEPT_KEY } from '../utils/portalAcceptStore'
import { openSowPrintWindow } from '../utils/sowGenerator'
import { openDepositInvoiceWindow } from '../utils/invoiceGenerator'
import {
  downloadEngagementJson,
  downloadEngagementMarkdown,
} from '../utils/engagementRecord'

vi.mock('../utils/sowGenerator', async () => {
  const actual = await vi.importActual('../utils/sowGenerator')
  return { ...actual, openSowPrintWindow: vi.fn() }
})

vi.mock('../utils/invoiceGenerator', async () => {
  const actual = await vi.importActual('../utils/invoiceGenerator')
  return { ...actual, openDepositInvoiceWindow: vi.fn() }
})

vi.mock('../utils/engagementRecord', async () => {
  const actual = await vi.importActual('../utils/engagementRecord')
  return {
    ...actual,
    downloadEngagementJson: vi.fn(),
    downloadEngagementMarkdown: vi.fn(),
  }
})

describe('ClientPortal', () => {
  beforeEach(() => {
    localStorage.removeItem(PORTAL_ACCEPT_KEY)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders a transparent demo project with progress and milestones', () => {
    render(<ClientPortal lang="en" />)

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Bilingual product launch site',
      })
    ).toBeInTheDocument()
    expect(screen.getByText(/no real client information/i)).toBeInTheDocument()
    expect(
      screen.getByRole('progressbar', { name: /overall progress: 50%/i })
    ).toHaveAttribute('aria-valuenow', '50')
    expect(screen.getAllByText('Complete')).toHaveLength(2)
    expect(screen.getByText('In progress')).toBeInTheDocument()
  })

  it('renders Chinese labels', () => {
    render(<ClientPortal lang="zh" />)
    expect(
      screen.getByRole('heading', { level: 1, name: '双语产品发布网站' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: '项目里程碑' })
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '提出问题' })).toHaveAttribute(
      'href',
      expect.stringMatching(/^mailto:/)
    )
  })

  it('renders a quote-hydrated project and accepts scope', async () => {
    const project = buildPortalFromQuote({
      projectType: 'landing',
      addOnIds: ['i18n'],
      extraSections: '1',
      quoteRef: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee',
      now: new Date('2026-08-17T12:00:00Z'),
    })
    const user = userEvent.setup()
    render(<ClientPortal lang="en" project={project} />)
    expect(
      screen.getByRole('heading', { level: 1, name: 'Landing Page' })
    ).toBeInTheDocument()
    expect(screen.getByText(/From your quote/i)).toBeInTheDocument()
    expect(
      screen.getByRole('progressbar', { name: /overall progress: 20%/i })
    ).toHaveAttribute('aria-valuenow', '20')
    await user.click(screen.getByRole('button', { name: /Accept this scope/i }))
    expect(
      screen.getByRole('button', { name: /Scope accepted/i })
    ).toBeDisabled()
    expect(
      screen.getByRole('progressbar', { name: /overall progress: 50%/i })
    ).toHaveAttribute('aria-valuenow', '50')
    expect(
      screen.getByRole('link', { name: /Open proposal \(SOW\)/i })
    ).toHaveAttribute('href', expect.stringContaining('proposal=sow'))
    await user.click(screen.getByRole('button', { name: /Mark deposit sent/i }))
    expect(
      screen.getByRole('button', { name: /Deposit marked sent/i })
    ).toBeDisabled()
    expect(screen.getByLabelText(/Brand assets/i)).toBeInTheDocument()
    await user.click(screen.getByLabelText(/Brand assets/i))
    await user.click(screen.getByLabelText(/Final copy/i))
    await user.click(screen.getByLabelText(/Domain, DNS/i))
    expect(screen.getByText(/Kickoff complete/i)).toBeInTheDocument()
    expect(
      screen.getByText(
        /Frontend build is in progress against the signed scope/i
      )
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Download engagement JSON/i })
    ).toBeInTheDocument()
    await user.click(
      screen.getByRole('button', { name: /Download engagement JSON/i })
    )
    await user.click(
      screen.getByRole('button', { name: /Download engagement Markdown/i })
    )
    expect(downloadEngagementJson).toHaveBeenCalled()
    expect(downloadEngagementMarkdown).toHaveBeenCalled()
  })

  it('prints, copies the share link, and opens draft artifacts', async () => {
    const resets = []
    const realTimeout = window.setTimeout.bind(window)
    vi.spyOn(window, 'setTimeout').mockImplementation((fn, ms, ...rest) => {
      if (ms === 2000) {
        resets.push(fn)
        return 0
      }
      return realTimeout(fn, ms, ...rest)
    })
    const user = userEvent.setup()
    const writeText = vi.spyOn(navigator.clipboard, 'writeText')
    const print = vi.fn()
    window.print = print
    const project = {
      ...portalDemo,
      quotePayload: {
        projectTypeId: 'mystery',
        addOnIds: ['i18n'],
        extraSections: '1',
        min: 800,
        max: 1200,
        quoteRef: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee',
        clientName: 'Ada',
      },
      deliverables: [
        {
          id: 'sow',
          action: 'sow',
          label: { en: 'Draft SOW', zh: '草案' },
          detail: { en: 'Printable', zh: '可打印' },
        },
        {
          id: 'invoice',
          action: 'invoice',
          label: { en: 'Draft invoice' },
          detail: { en: 'Deposit' },
        },
        {
          id: 'note',
          action: 'other',
          label: { en: 'Notes' },
          detail: { en: 'Nothing to open' },
        },
      ],
    }
    render(<ClientPortal lang="en" project={project} />)
    await user.click(screen.getByRole('button', { name: 'Print status page' }))
    expect(print).toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: 'Copy share link' }))
    expect(writeText).toHaveBeenCalledWith(
      expect.stringContaining('portal=demo')
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

    await user.click(screen.getByRole('button', { name: /Draft SOW/ }))
    await user.click(screen.getByRole('button', { name: /Draft invoice/ }))
    await user.click(screen.getByRole('button', { name: /Notes/ }))
    expect(openSowPrintWindow).toHaveBeenCalledWith(
      expect.objectContaining({ projectTypeId: 'mystery', clientName: 'Ada' })
    )
    expect(openDepositInvoiceWindow).toHaveBeenCalledWith(
      expect.objectContaining({ projectTypeLabel: 'mystery' })
    )
  })

  it('shows a copy failure and a stored signer name', async () => {
    const quoteRef = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee'
    acceptQuote(quoteRef, { signerName: 'Jamie Chen' })
    const user = userEvent.setup()
    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(
      new Error('denied')
    )
    const project = buildPortalFromQuote({
      projectType: 'unknown-type',
      addOnIds: [],
      extraSections: '0',
      quoteRef,
    })
    render(<ClientPortal lang="zh" project={project} />)
    expect(screen.getByText(/已在本浏览器签署: Jamie Chen/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '复制分享链接' }))
    expect(
      await screen.findByRole('button', { name: '复制失败' })
    ).toBeInTheDocument()
  })
})

describe('calculatePortalProgress', () => {
  it('weights complete as 100%, current as 50%, upcoming as 0%', () => {
    expect(calculatePortalProgress(portalDemo.milestones)).toBe(50)
    expect(calculatePortalProgress([])).toBe(0)
  })
})
