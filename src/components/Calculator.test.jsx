import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Calculator from './Calculator'

const FORM_KEY = 'pixellayer-estimator-form'

describe('Calculator', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  it('renders default landing estimate in English', () => {
    render(<Calculator lang="en" />)
    expect(
      screen.getByRole('heading', { level: 2, name: /get an estimated quote/i })
    ).toBeInTheDocument()
    const value = document.querySelector('.calc-result-value')
    expect(value).toHaveTextContent(/\$800/)
    expect(value).toHaveTextContent(/1,?200/)
  })

  it('updates range when selecting another project type', async () => {
    const user = userEvent.setup()
    render(<Calculator lang="en" />)
    await user.click(
      screen.getByRole('radio', { name: /Company \/ Agency Website/i })
    )
    const value = document.querySelector('.calc-result-value')
    expect(value).toHaveTextContent(/\$1,?500/)
    expect(value).toHaveTextContent(/2,?800/)
  })

  it('toggles add-on and updates estimate', async () => {
    const user = userEvent.setup()
    render(<Calculator lang="en" />)
    await user.click(
      screen.getByRole('checkbox', {
        name: /Design from scratch/i,
      })
    )
    const value = document.querySelector('.calc-result-value')
    expect(value).toHaveTextContent(/\$1,?000/)
    expect(value).toHaveTextContent(/1,?500/)
  })

  it('clamps extra sections on blur', async () => {
    const user = userEvent.setup()
    render(<Calculator lang="en" />)
    const input = screen.getByRole('spinbutton', { name: /extra sections/i })
    await user.clear(input)
    await user.type(input, '99')
    await user.tab()
    expect(input).toHaveValue(20)
  })

  it('reset restores defaults and persists default form', async () => {
    const user = userEvent.setup()
    render(<Calculator lang="en" />)
    await user.click(screen.getByRole('radio', { name: /Dashboard/i }))
    await waitFor(() => {
      expect(localStorage.getItem(FORM_KEY)).toBeTruthy()
    })
    await user.click(screen.getByRole('button', { name: /^Reset$/i }))
    const stored = JSON.parse(localStorage.getItem(FORM_KEY))
    expect(stored.projectType).toBe('landing')
    expect(stored.addOnIds).toEqual([])
    expect(stored.extraSections).toBe('0')
    const value = document.querySelector('.calc-result-value')
    expect(value).toHaveTextContent(/\$800/)
  })

  it('moves project selection with ArrowRight keyboard', async () => {
    const user = userEvent.setup()
    render(<Calculator lang="en" />)
    const landing = screen.getByRole('radio', { name: /^Landing Page$/i })
    landing.focus()
    await user.keyboard('{ArrowRight}')
    expect(
      screen.getByRole('radio', { name: /Company \/ Agency Website/i })
    ).toHaveAttribute('aria-checked', 'true')
  })

  it('copy summary shows success feedback', async () => {
    const user = userEvent.setup()
    render(<Calculator lang="en" />)
    const copyBtn = screen.getByRole('button', {
      name: /copy estimate summary to clipboard/i,
    })
    await user.click(copyBtn)
    await waitFor(() => {
      expect(copyBtn).toHaveTextContent(/^Copied/)
    })
    expect(screen.getByText('Summary copied to clipboard')).toBeInTheDocument()
  })

  it('shows Chinese copy when lang is zh', () => {
    render(<Calculator lang="zh" />)
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
      /获取项目报价估算/
    )
    expect(screen.getByRole('radio', { name: /^落地页$/ })).toBeInTheDocument()
  })

  it('expands preview and shows summary text', async () => {
    const user = userEvent.setup()
    render(<Calculator lang="en" />)
    await user.click(screen.getByText(/Preview email body/i))
    const pre = document.querySelector('.calc-preview-body')
    expect(pre).toBeVisible()
    expect(pre.textContent).toContain('Project type: Landing Page')
  })

  it('shows persisted quote reference in preview', async () => {
    const user = userEvent.setup()
    render(<Calculator lang="en" />)
    const ref = localStorage.getItem('pixellayer-estimator-quote-ref')
    expect(ref).toBeTruthy()
    expect(screen.getByText(ref)).toBeInTheDocument()
    await user.click(screen.getByText(/Preview email body/i))
    const pre = document.querySelector('.calc-preview-body')
    expect(pre.textContent).toContain('Quote reference')
    expect(pre.textContent).toContain(ref)
  })

  it('does not show save-to-server without VITE_QUOTE_API_URL', () => {
    render(<Calculator lang="en" />)
    expect(
      screen.queryByRole('button', { name: /save online copy/i })
    ).not.toBeInTheDocument()
  })

  it('POSTs snapshot when save clicked with API URL set', async () => {
    vi.stubEnv('VITE_QUOTE_API_URL', 'https://api.example.com')
    const id = 'aaaaaaaa-bbbb-4ccc-dddd-eeeeeeeeeeee'
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      text: async () =>
        JSON.stringify({
          id,
          createdAt: '2026-01-01T00:00:00.000Z',
          path: `/api/v1/quotes/${id}`,
        }),
    })
    globalThis.fetch = fetchMock
    const user = userEvent.setup()
    render(<Calculator lang="en" />)
    await user.click(screen.getByRole('button', { name: /save online copy/i }))
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled()
    })
    const [, init] = fetchMock.mock.calls[0]
    expect(init.method).toBe('POST')
    expect(init.body).toContain('"projectType":"landing"')
    await waitFor(() => {
      expect(
        screen.getByText(new RegExp(`/api/v1/quotes/${id}`))
      ).toBeInTheDocument()
    })
  })
})
