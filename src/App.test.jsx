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
    expect(
      screen.getByRole('link', { name: /^Rongen EN$/ })
    ).toHaveAttribute(
      'href',
      'https://pixellayer7-jpg.github.io/rongen-church/en/'
    )
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
})
