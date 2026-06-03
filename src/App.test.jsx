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
