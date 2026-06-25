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
    window.history.replaceState({}, '', '/')
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

  it('hydrates from ?load= when VITE_QUOTE_API_URL is set', async () => {
    vi.stubEnv('VITE_QUOTE_API_URL', 'https://api.example.com')
    const loadId = 'aaaaaaaa-bbbb-4ccc-8aaa-eeeeeeeeeeee'
    const quoteRefRow = 'bbbbbbbb-bbbb-4bbb-8ccc-cccccccccccc'
    const replaceState = vi.spyOn(window.history, 'replaceState')
    window.history.replaceState({}, '', `/?load=${loadId}`)
    const row = {
      projectType: 'website',
      addOnIds: ['design'],
      extraSections: '2',
      min: 2000,
      max: 3500,
      quoteRef: quoteRefRow,
    }
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(row),
    })
    render(<Calculator lang="en" />)
    await waitFor(() => {
      expect(
        screen.getByText(/Loaded estimate from your link/i)
      ).toBeInTheDocument()
    })
    expect(globalThis.fetch).toHaveBeenCalledWith(
      `https://api.example.com/api/v1/quotes/${loadId}`,
      expect.objectContaining({ method: 'GET' })
    )
    expect(
      screen.getByRole('radio', { name: /Company \/ Agency Website/i })
    ).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByText(quoteRefRow)).toBeInTheDocument()
    expect(replaceState).toHaveBeenCalled()
    replaceState.mockRestore()
  })

  it('calls onHydratedLang when snapshot includes lang', async () => {
    vi.stubEnv('VITE_QUOTE_API_URL', 'https://api.example.com')
    const loadId = 'aaaaaaaa-bbbb-4ccc-8aaa-eeeeeeeeeeee'
    const onHydratedLang = vi.fn()
    window.history.replaceState({}, '', `/?load=${loadId}`)
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          projectType: 'landing',
          addOnIds: [],
          extraSections: '0',
          lang: 'zh',
        }),
    })
    render(<Calculator lang="en" onHydratedLang={onHydratedLang} />)
    await waitFor(() => {
      expect(onHydratedLang).toHaveBeenCalledWith('zh')
    })
  })

  it('loads a saved estimate from pasted calculator link', async () => {
    vi.stubEnv('VITE_QUOTE_API_URL', 'https://api.example.com')
    const id = 'aaaaaaaa-bbbb-4ccc-8aaa-eeeeeeeeeeee'
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          projectType: 'dashboard',
          addOnIds: [],
          extraSections: '1',
          min: 3000,
          max: 5000,
        }),
    })
    const user = userEvent.setup()
    render(<Calculator lang="en" />)
    await user.type(
      screen.getByLabelText(/saved quote link or uuid/i),
      `https://calc.example.com/?load=${id}`
    )
    await user.click(screen.getByRole('button', { name: /^Load estimate$/i }))
    await waitFor(() => {
      expect(
        screen.getByText(/Loaded estimate from your link/i)
      ).toBeInTheDocument()
    })
    expect(globalThis.fetch).toHaveBeenCalledWith(
      `https://api.example.com/api/v1/quotes/${id}`,
      expect.objectContaining({ method: 'GET' })
    )
    expect(screen.getByRole('radio', { name: /Dashboard/i })).toHaveAttribute(
      'aria-checked',
      'true'
    )
  })

  it('shows validation error for manual saved quote input', async () => {
    vi.stubEnv('VITE_QUOTE_API_URL', 'https://api.example.com')
    const user = userEvent.setup()
    render(<Calculator lang="en" />)
    await user.type(screen.getByLabelText(/saved quote link or uuid/i), 'bad')
    await user.click(screen.getByRole('button', { name: /^Load estimate$/i }))
    expect(
      screen.getByText(/Enter a valid saved quote UUID or link/i)
    ).toBeInTheDocument()
  })

  it('shows load error when GET quote fails', async () => {
    vi.stubEnv('VITE_QUOTE_API_URL', 'https://api.example.com')
    const loadId = 'aaaaaaaa-bbbb-4ccc-8aaa-eeeeeeeeeeee'
    window.history.replaceState({}, '', `/?load=${loadId}`)
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      text: async () => JSON.stringify({ error: 'Not found' }),
    })
    render(<Calculator lang="en" />)
    await waitFor(() => {
      expect(screen.getByText(/Could not load link/i)).toBeInTheDocument()
    })
    expect(screen.getByText(/Not found/)).toBeInTheDocument()
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

  it('shows calculator ?load= link when VITE_SITE_URL is set', async () => {
    vi.stubEnv('VITE_QUOTE_API_URL', 'https://api.example.com')
    vi.stubEnv('VITE_SITE_URL', 'https://calc.example.com')
    const id = 'aaaaaaaa-bbbb-4ccc-8aaa-eeeeeeeeeeee'
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
      expect(
        screen.getByText(
          new RegExp(
            `https://calc\\.example\\.com/\\?load=${id.replace(/-/g, '\\-')}`
          )
        )
      ).toBeInTheDocument()
    })
  })

  it('shows native Share when navigator.share exists and site URL saved', async () => {
    vi.stubEnv('VITE_QUOTE_API_URL', 'https://api.example.com')
    vi.stubEnv('VITE_SITE_URL', 'https://calc.example.com')
    const id = 'aaaaaaaa-bbbb-4ccc-8aaa-eeeeeeeeeeee'
    const share = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { ...navigator, share })
    navigator.share = share
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      text: async () =>
        JSON.stringify({
          id,
          createdAt: '2026-01-01T00:00:00.000Z',
          path: `/api/v1/quotes/${id}`,
          loadQuery: `?load=${id}`,
        }),
    })
    const user = userEvent.setup()
    render(<Calculator lang="en" />)
    await user.click(screen.getByRole('button', { name: /save online copy/i }))
    await waitFor(() => {
      expect(
        screen.getByRole('button', {
          name: /share calculator link using your device/i,
        })
      ).toBeInTheDocument()
    })
    await user.click(
      screen.getByRole('button', {
        name: /share calculator link using your device/i,
      })
    )
    expect(share).toHaveBeenCalledWith(
      expect.objectContaining({
        url: `https://calc.example.com/?load=${id}`,
      })
    )
  })

  it('apply ?type= from URL on mount', async () => {
    window.history.replaceState({}, '', '/?type=website')
    sessionStorage.clear()
    localStorage.clear()
    render(<Calculator lang="en" />)
    expect(
      screen.getByRole('radio', { name: /Company \/ Agency Website/i })
    ).toHaveAttribute('aria-checked', 'true')
  })

  it('continue on main site saves handoff and navigates with utm', async () => {
    vi.stubEnv('VITE_LANDING_URL', 'https://pixellayer7-jpg.github.io/1/')
    const href = {
      value: 'https://pixellayer7-jpg.github.io/project-estimator/',
    }
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        origin: 'https://pixellayer7-jpg.github.io',
        get href() {
          return href.value
        },
        set href(v) {
          href.value = v
        },
      },
    })
    sessionStorage.clear()
    const user = userEvent.setup()
    render(<Calculator lang="en" />)
    await user.click(
      screen.getByRole('button', { name: /continue on main site/i })
    )
    const raw = sessionStorage.getItem('pixellayer-contact-handoff')
    expect(JSON.parse(raw).projectType).toBeTruthy()
    expect(href.value).toContain('#contact')
    expect(href.value).toContain('utm_source=project-estimator')
  })
})
