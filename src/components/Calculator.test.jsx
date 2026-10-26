import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Calculator from './Calculator'

const FORM_KEY = 'pixellayer-estimator-form'
const originalLocation = window.location

describe('Calculator', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation,
    })
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

  it('wraps selection with ArrowLeft, Home, and End', async () => {
    const user = userEvent.setup()
    render(<Calculator lang="en" />)
    const landing = screen.getByRole('radio', { name: /^Landing Page$/i })
    landing.focus()
    await user.keyboard('{ArrowLeft}')
    expect(screen.getByRole('radio', { name: /Dashboard/i })).toHaveAttribute(
      'aria-checked',
      'true'
    )
    await user.keyboard('{Home}')
    expect(landing).toHaveAttribute('aria-checked', 'true')
    await user.keyboard('{End}')
    expect(screen.getByRole('radio', { name: /Dashboard/i })).toHaveAttribute(
      'aria-checked',
      'true'
    )
    await user.keyboard('x')
    expect(screen.getByRole('radio', { name: /Dashboard/i })).toHaveAttribute(
      'aria-checked',
      'true'
    )
  })

  it('downloads the summary and SOW, and opens print views', async () => {
    URL.createObjectURL = vi.fn(() => 'blob:quote')
    URL.revokeObjectURL = vi.fn()
    const downloads = []
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(
      function () {
        if (this.download) downloads.push(this.download)
      }
    )
    const opened = {
      document: { open: vi.fn(), write: vi.fn(), close: vi.fn() },
    }
    vi.spyOn(window, 'open').mockReturnValue(opened)
    const print = vi.spyOn(window, 'print').mockImplementation(() => {})
    const user = userEvent.setup()
    render(<Calculator lang="en" />)
    await user.type(
      screen.getByRole('textbox', { name: /Client name/i }),
      'Ada & Co'
    )
    await user.click(
      screen.getByRole('button', {
        name: 'Download estimate summary as a text file',
      })
    )
    await user.click(
      screen.getByRole('button', {
        name: 'Download statement of work draft as Markdown',
      })
    )
    await user.click(
      screen.getByRole('button', {
        name: /Open print-ready proposal HTML/i,
      })
    )
    await user.click(
      screen.getByRole('button', { name: /Open deposit invoice draft/i })
    )
    await user.click(
      screen.getByRole('button', {
        name: /Open print dialog to save or print the estimate/i,
      })
    )
    expect(downloads).toEqual([
      'pixellayer-quote-summary.txt',
      'pixelayer-sow-draft.md',
    ])
    expect(opened.document.write).toHaveBeenCalledWith(
      expect.stringContaining('Statement of Work')
    )
    expect(opened.document.write).toHaveBeenCalledWith(
      expect.stringContaining('Ada &amp; Co')
    )
    expect(print).toHaveBeenCalled()
  })

  it('shows copy failure when the clipboard rejects', async () => {
    const user = userEvent.setup()
    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(
      new Error('denied')
    )
    render(<Calculator lang="zh" />)
    const copyBtn = screen.getByRole('button', {
      name: '将估算摘要复制到剪贴板',
    })
    await user.click(copyBtn)
    expect(copyBtn).toHaveTextContent('复制失败')
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

  it('clears the saved link when the estimate changes', async () => {
    vi.stubEnv('VITE_QUOTE_API_URL', 'https://api.example.com')
    const id = 'aaaaaaaa-bbbb-4ccc-8bbb-eeeeeeeeeeee'
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
    const user = userEvent.setup()
    render(<Calculator lang="en" />)
    await user.click(screen.getByRole('button', { name: /save online copy/i }))
    const savedPath = new RegExp(`/api/v1/quotes/${id}`)
    await waitFor(() => {
      expect(screen.getByText(savedPath)).toBeInTheDocument()
    })
    await user.click(
      screen.getByRole('radio', { name: /Company \/ Agency Website/i })
    )
    expect(screen.queryByText(savedPath)).not.toBeInTheDocument()
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

  it('links to a quote-hydrated client portal', () => {
    render(<Calculator lang="en" />)
    const link = screen.getByRole('link', {
      name: /client status page generated from this quote/i,
    })
    expect(link).toHaveAttribute(
      'href',
      expect.stringContaining('portal=quote')
    )
    expect(link).toHaveAttribute(
      'href',
      expect.stringContaining('type=landing')
    )
  })

  it('links to a shareable in-app proposal', () => {
    render(<Calculator lang="en" />)
    const link = screen.getByRole('link', {
      name: /shareable in-app proposal/i,
    })
    expect(link).toHaveAttribute(
      'href',
      expect.stringContaining('proposal=sow')
    )
    expect(link).toHaveAttribute(
      'href',
      expect.stringContaining('type=landing')
    )
  })

  it('moves selection with ArrowDown and ArrowUp', async () => {
    const user = userEvent.setup()
    render(<Calculator lang="en" />)
    const landing = screen.getByRole('radio', { name: /^Landing Page$/i })
    landing.focus()
    await user.keyboard('{ArrowDown}')
    expect(
      screen.getByRole('radio', { name: /Company \/ Agency Website/i })
    ).toHaveAttribute('aria-checked', 'true')
    await user.keyboard('{ArrowUp}')
    expect(landing).toHaveAttribute('aria-checked', 'true')
  })

  it('puts the client name on the proposal and portal links', async () => {
    const user = userEvent.setup()
    render(<Calculator lang="en" />)
    await user.type(screen.getByLabelText(/Client name/i), 'Acme Studio')
    expect(
      screen.getByRole('link', { name: /shareable in-app proposal/i })
    ).toHaveAttribute('href', expect.stringContaining('client=Acme'))
    expect(
      screen.getByRole('link', {
        name: /client status page generated from this quote/i,
      })
    ).toHaveAttribute('href', expect.stringContaining('client=Acme'))
  })

  it('copies the saved API link and reports a clipboard failure', async () => {
    vi.stubEnv('VITE_QUOTE_API_URL', 'https://api.example.com')
    const id = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee'
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      text: async () =>
        JSON.stringify({
          id,
          createdAt: '2026-01-01T00:00:00.000Z',
          links: {
            contact: `https://landing.example/1/?quote=${id}#contact`,
          },
        }),
    })
    const resets = []
    const real = window.setTimeout.bind(window)
    vi.spyOn(window, 'setTimeout').mockImplementation((fn, ms, ...args) => {
      if (ms === 2000) {
        resets.push(fn)
        return 1
      }
      return real(fn, ms, ...args)
    })
    const user = userEvent.setup()
    render(<Calculator lang="en" />)
    await user.click(screen.getByRole('button', { name: /save online copy/i }))
    const copy = await screen.findByRole('button', {
      name: /copy share link to clipboard/i,
    })
    expect(
      screen.getByRole('link', {
        name: /open contact form with this estimate/i,
      })
    ).toHaveAttribute('href', `https://landing.example/1/?quote=${id}#contact`)
    navigator.clipboard.writeText = vi.fn().mockResolvedValue(undefined)
    await user.click(copy)
    expect(copy).toHaveTextContent('Link copied!')
    await act(() => {
      resets.at(-1)()
    })
    expect(copy).toHaveTextContent('Copy link')

    navigator.clipboard.writeText = vi
      .fn()
      .mockRejectedValue(new Error('denied'))
    await user.click(copy)
    expect(copy).toHaveTextContent('Copy link')
  })

  it('keeps the calculator link when copying it fails, and ignores a cancelled share', async () => {
    vi.stubEnv('VITE_QUOTE_API_URL', 'https://api.example.com')
    vi.stubEnv('VITE_SITE_URL', 'https://calc.example.com')
    const id = 'aaaaaaaa-bbbb-4ccc-8aaa-eeeeeeeeeeee'
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      text: async () =>
        JSON.stringify({
          id,
          createdAt: '2026-01-01T00:00:00.000Z',
        }),
    })
    const share = vi
      .fn()
      .mockRejectedValueOnce(
        new DOMException('The user aborted a request.', 'AbortError')
      )
      .mockRejectedValueOnce('share-unavailable')
    const user = userEvent.setup()
    render(<Calculator lang="zh" />)
    navigator.share = share
    await user.click(screen.getByRole('button', { name: '保存线上副本' }))
    const copyCalc = await screen.findByRole('button', {
      name: /复制带 \?load= 的计算器地址/,
    })
    navigator.clipboard.writeText = vi
      .fn()
      .mockRejectedValue(new Error('denied'))
    await user.click(copyCalc)
    expect(copyCalc).toHaveTextContent('复制计算器链接')
    const shareBtn = screen.getByRole('button', {
      name: /通过系统分享菜单发送计算器链接/,
    })
    await user.click(shareBtn)
    await user.click(shareBtn)
    expect(share).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'PixelLayer 项目报价估算' })
    )
  })

  it('opens the contact form after saving, and returns to idle when that save fails', async () => {
    vi.stubEnv('VITE_QUOTE_API_URL', 'https://api.example.com/')
    const id = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee'
    const href = { value: 'http://localhost:3000/' }
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        origin: 'http://localhost:3000',
        pathname: '/',
        search: '',
        hash: '',
        get href() {
          return href.value
        },
        set href(v) {
          href.value = v
        },
      },
    })
    globalThis.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 201,
      text: async () =>
        JSON.stringify({
          id,
          createdAt: '2026-01-01T00:00:00.000Z',
        }),
    })
    const user = userEvent.setup()
    const view = render(<Calculator lang="en" />)
    await user.click(
      screen.getByRole('button', { name: /Save & contact on main site/i })
    )
    await waitFor(() => {
      expect(href.value).toContain(`quote=${id}`)
      expect(href.value).toContain('#contact')
    })
    expect(sessionStorage.getItem('pixellayer-last-saved-quote-id')).toBe(id)
    view.unmount()

    const resets = []
    const real = window.setTimeout.bind(window)
    vi.spyOn(window, 'setTimeout').mockImplementation((fn, ms, ...args) => {
      if (ms === 3000) {
        resets.push(fn)
        return 1
      }
      return real(fn, ms, ...args)
    })
    globalThis.fetch = vi.fn().mockRejectedValueOnce(new Error('offline'))
    render(<Calculator lang="en" />)
    await user.click(
      screen.getByRole('button', { name: /Save & contact on main site/i })
    )
    await waitFor(() => expect(resets.length).toBeGreaterThan(0))
    await act(() => {
      resets.at(-1)()
    })
    expect(
      screen.getByRole('button', { name: /Save & contact on main site/i })
    ).toBeEnabled()
  })

  it('shows a non-Error save failure and ignores a stale save response', async () => {
    vi.stubEnv('VITE_QUOTE_API_URL', 'https://api.example.com')
    const user = userEvent.setup()
    globalThis.fetch = vi.fn().mockRejectedValueOnce('disk full')
    const failed = render(<Calculator lang="en" />)
    await user.click(screen.getByRole('button', { name: /save online copy/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Save failed: disk full'
    )
    failed.unmount()

    const first = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee'
    const second = 'bbbbbbbb-bbbb-4ccc-8ddd-eeeeeeeeeeee'
    let resolveFirst
    let calls = 0
    globalThis.fetch = vi.fn().mockImplementation(() => {
      calls += 1
      if (calls === 1) {
        return new Promise((resolve) => {
          resolveFirst = resolve
        })
      }
      return Promise.resolve({
        ok: true,
        status: 201,
        text: async () =>
          JSON.stringify({
            id: second,
            createdAt: '2026-01-01T00:00:00.000Z',
          }),
      })
    })
    render(<Calculator lang="en" />)
    await user.click(screen.getByRole('button', { name: /save online copy/i }))
    await waitFor(() => expect(resolveFirst).toBeTypeOf('function'))
    await user.click(
      screen.getByRole('radio', { name: /Company \/ Agency Website/i })
    )
    await user.click(screen.getByRole('button', { name: /save online copy/i }))
    await screen.findByText(new RegExp(`/api/v1/quotes/${second}`))
    resolveFirst({
      ok: true,
      status: 201,
      text: async () =>
        JSON.stringify({
          id: first,
          createdAt: '2026-01-01T00:00:00.000Z',
        }),
    })
    await act(async () => {
      await Promise.resolve()
    })
    expect(
      screen.queryByText(new RegExp(`/api/v1/quotes/${first}`))
    ).not.toBeInTheDocument()
  })

  it('ignores an older quote load and a failure after unmount', async () => {
    vi.stubEnv('VITE_QUOTE_API_URL', 'https://api.example.com')
    const first = 'aaaaaaaa-bbbb-4ccc-8aaa-eeeeeeeeeeee'
    const second = 'bbbbbbbb-bbbb-4ccc-8bbb-eeeeeeeeeeee'
    window.history.replaceState({}, '', `/?load=${first}`)
    let resolveFirst
    globalThis.fetch = vi.fn().mockImplementation((url) => {
      if (String(url).includes(first)) {
        return new Promise((resolve) => {
          resolveFirst = resolve
        })
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify({
            projectType: 'dashboard',
            addOnIds: [],
            extraSections: '0',
          }),
      })
    })
    const view = render(<Calculator lang="en" />)
    await waitFor(() => expect(resolveFirst).toBeTypeOf('function'))
    window.history.replaceState({}, '', `/?load=${second}`)
    window.dispatchEvent(new PopStateEvent('popstate'))
    await waitFor(() => {
      expect(screen.getByRole('radio', { name: /Dashboard/i })).toHaveAttribute(
        'aria-checked',
        'true'
      )
    })
    resolveFirst({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          projectType: 'website',
          addOnIds: [],
          extraSections: '0',
        }),
    })
    await act(async () => {
      await Promise.resolve()
    })
    expect(
      screen.getByRole('radio', { name: /Company \/ Agency Website/i })
    ).toHaveAttribute('aria-checked', 'false')
    view.unmount()

    window.history.replaceState({}, '', `/?load=${first}`)
    let rejectLate
    globalThis.fetch = vi.fn().mockReturnValue(
      new Promise((_, reject) => {
        rejectLate = reject
      })
    )
    const late = render(<Calculator lang="en" />)
    await waitFor(() => expect(rejectLate).toBeTypeOf('function'))
    late.unmount()
    await act(async () => {
      rejectLate(new Error('late'))
      await Promise.resolve()
    })
  })

  it('clears a failed load on back navigation and shows a non-Error load failure', async () => {
    vi.stubEnv('VITE_QUOTE_API_URL', 'https://api.example.com')
    const loadId = 'aaaaaaaa-bbbb-4ccc-8aaa-eeeeeeeeeeee'
    window.history.replaceState({}, '', `/?load=${loadId}`)
    globalThis.fetch = vi.fn().mockRejectedValueOnce('offline')
    render(<Calculator lang="en" />)
    expect(await screen.findByText(/offline/)).toBeInTheDocument()
    window.history.replaceState({}, '', '/')
    window.dispatchEvent(new PopStateEvent('popstate'))
    await waitFor(() => {
      expect(screen.queryByText(/Could not load link/i)).not.toBeInTheDocument()
    })
  })
})
