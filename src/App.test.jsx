import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'

const LANG_KEY = 'pixellayer-estimator-lang'

describe('App', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
    window.history.replaceState({}, '', '/')
  })

  it('defaults to English and sets document lang', () => {
    render(<App />)
    expect(document.documentElement.lang).toBe('en')
    expect(screen.getByRole('button', { name: /^EN$/ })).toHaveAttribute(
      'aria-pressed',
      'true'
    )
  })

  it('switches to Chinese and persists language', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: /^中文$/ }))
    expect(document.documentElement.lang).toBe('zh-CN')
    expect(document.title).toMatch(/项目报价/)
    expect(localStorage.getItem(LANG_KEY)).toBe('zh')
    await user.click(screen.getByRole('button', { name: /^EN$/ }))
    expect(document.documentElement.lang).toBe('en')
    expect(localStorage.getItem(LANG_KEY)).toBe('en')
  })

  it('logo links to marketing site', () => {
    render(<App />)
    expect(
      screen.getByRole('link', { name: /PixelLayer L\.L\.C/i })
    ).toHaveAttribute('href', 'https://pixellayer7-jpg.github.io/1/')
  })

  it('ecosystem strip links to Rongen client preview', () => {
    render(<App />)
    expect(
      screen.getByRole('link', { name: /^Rongen \(client\)$/ })
    ).toHaveAttribute(
      'href',
      'https://pixellayer7-jpg.github.io/rongen-church/'
    )
    expect(screen.getByRole('link', { name: /^Rongen EN$/ })).toHaveAttribute(
      'href',
      'https://pixellayer7-jpg.github.io/rongen-church/en/'
    )
  })

  it('renders calculator changelog with latest release', () => {
    render(<App />)
    expect(
      screen.getByRole('heading', { name: /^Changelog$/ })
    ).toBeInTheDocument()
    expect(screen.getByText(/^v2\.7\.18$/)).toBeInTheDocument()
    expect(
      screen.getByRole('heading', {
        name: /App routing, proposal, and calculator leftovers covered/,
      })
    ).toBeInTheDocument()
  })

  it('scrolls to changelog when ?section=changelog', async () => {
    window.history.replaceState({}, '', '/?section=changelog')
    const scrollIntoView = vi.fn()
    Element.prototype.scrollIntoView = scrollIntoView
    render(<App />)
    expect(document.getElementById('changelog')).toBeTruthy()
    await waitFor(() => {
      expect(scrollIntoView).toHaveBeenCalled()
    })
  })

  it('routes ?portal=demo to the client status portal', async () => {
    window.history.replaceState({}, '', '/?portal=demo')
    render(<App />)
    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: 'Bilingual product launch site',
      })
    ).toBeInTheDocument()
    expect(document.title).toMatch(/Client Project Status/)
    expect(
      screen.queryByRole('heading', { name: /Get an estimated quote/i })
    ).not.toBeInTheDocument()
  })

  it('hydrates ?portal=quote from calculator query params', async () => {
    window.history.replaceState(
      {},
      '',
      '/?portal=quote&type=website&addons=i18n&extra=2&ref=aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee'
    )
    render(<App />)
    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: 'Company / Agency Website',
      })
    ).toBeInTheDocument()
    expect(screen.getByText(/From your quote/i)).toBeInTheDocument()
    expect(screen.getByText('$1,885 – $3,520 USD')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Accept this scope/i })
    ).toBeInTheDocument()
  })

  it('routes ?proposal=sow from calculator query params', async () => {
    window.history.replaceState(
      {},
      '',
      '/?proposal=sow&type=website&addons=i18n&extra=2&ref=aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee&client=Acme%20Studio'
    )
    render(<App />)
    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: 'Statement of Work',
      })
    ).toBeInTheDocument()
    expect(document.title).toMatch(/Client Proposal/)
    expect(screen.getAllByText('Acme Studio').length).toBeGreaterThan(0)
    expect(screen.getByText('$1,885 – $3,520 USD')).toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: /Get an estimated quote/i })
    ).not.toBeInTheDocument()
  })

  it('syncs UI language from hydrated quote ?load= snapshot', async () => {
    vi.stubEnv('VITE_QUOTE_API_URL', 'https://api.example.com')
    const loadId = 'aaaaaaaa-bbbb-4ccc-8aaa-eeeeeeeeeeee'
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
    render(<App />)
    await waitFor(() => {
      expect(document.documentElement.lang).toBe('zh-CN')
    })
    expect(localStorage.getItem(LANG_KEY)).toBe('zh')
  })

  it('opens CRM admin from ?admin=1 and from #admin', async () => {
    window.history.replaceState({}, '', '/?admin=1')
    const first = render(<App />)
    expect(
      await screen.findByRole('heading', { name: /CRM admin/i })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /Skip to calculator|Skip to/i })
    ).toBeTruthy()
    first.unmount()

    window.history.replaceState({}, '', '/#admin')
    render(<App />)
    expect(
      await screen.findByRole('heading', { name: /CRM admin/i })
    ).toBeInTheDocument()
  })

  it('treats ?proposal=1 as SOW and ?proposal=invoice as the invoice tab', async () => {
    window.history.replaceState({}, '', '/?proposal=1&type=landing')
    const sow = render(<App />)
    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: 'Statement of Work',
      })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Skip to proposal' })
    ).toBeInTheDocument()
    sow.unmount()

    window.history.replaceState({}, '', '/?proposal=invoice&lang=zh')
    render(<App />)
    expect(
      await screen.findByRole('heading', { level: 1, name: '定金发票' })
    ).toBeInTheDocument()
    expect(document.title).toMatch(/客户提案/)
    expect(screen.getByRole('link', { name: '跳到提案' })).toBeInTheDocument()
  })

  it('reads language from the query string or localStorage, and survives storage errors', async () => {
    window.history.replaceState({}, '', '/?lang=zh')
    const fromQuery = render(<App />)
    expect(document.documentElement.lang).toBe('zh-CN')
    expect(screen.getByRole('link', { name: '跳到计算器' })).toBeInTheDocument()
    fromQuery.unmount()

    window.history.replaceState({}, '', '/')
    localStorage.setItem(LANG_KEY, 'zh')
    const fromStore = render(<App />)
    expect(document.documentElement.lang).toBe('zh-CN')
    fromStore.unmount()

    localStorage.setItem(LANG_KEY, 'nope')
    render(<App />)
    expect(document.documentElement.lang).toBe('en')

    const setItem = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw new Error('quota')
      })
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /^中文$/ }))
    expect(document.documentElement.lang).toBe('zh-CN')
    setItem.mockRestore()
  })

  it('uses Chinese skip copy on the quote portal', async () => {
    window.history.replaceState({}, '', '/?portal=quote&type=landing&lang=zh')
    render(<App />)
    expect(
      await screen.findByRole('link', { name: '跳到项目状态' })
    ).toBeInTheDocument()
    expect(document.title).toMatch(/客户项目状态/)
  })

  it('survives a blocked language read from localStorage', () => {
    const getItem = vi
      .spyOn(Storage.prototype, 'getItem')
      .mockImplementation(() => {
        throw new Error('blocked')
      })
    render(<App />)
    expect(document.documentElement.lang).toBe('en')
    getItem.mockRestore()
  })
})
