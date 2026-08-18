import { describe, expect, it, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ClientPortal from './ClientPortal'
import { calculatePortalProgress, portalDemo } from '../data/clientPortalDemo'
import { buildPortalFromQuote } from '../utils/portalFromQuote'
import { PORTAL_ACCEPT_KEY } from '../utils/portalAcceptStore'

describe('ClientPortal', () => {
  beforeEach(() => {
    localStorage.removeItem(PORTAL_ACCEPT_KEY)
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
  })
})

describe('calculatePortalProgress', () => {
  it('weights complete as 100%, current as 50%, upcoming as 0%', () => {
    expect(calculatePortalProgress(portalDemo.milestones)).toBe(50)
    expect(calculatePortalProgress([])).toBe(0)
  })
})
