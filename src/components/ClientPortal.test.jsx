import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import ClientPortal from './ClientPortal'
import { calculatePortalProgress, portalDemo } from '../data/clientPortalDemo'

describe('ClientPortal', () => {
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
})

describe('calculatePortalProgress', () => {
  it('weights complete as 100%, current as 50%, upcoming as 0%', () => {
    expect(calculatePortalProgress(portalDemo.milestones)).toBe(50)
    expect(calculatePortalProgress([])).toBe(0)
  })
})
