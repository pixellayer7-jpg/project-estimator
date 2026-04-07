import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'

const LANG_KEY = 'pixellayer-estimator-lang'

describe('App', () => {
  beforeEach(() => {
    localStorage.clear()
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

  it('logo links to main content', () => {
    render(<App />)
    expect(
      screen.getByRole('link', { name: /PixelLayer L\.L\.C/i })
    ).toHaveAttribute('href', '#main-content')
  })
})
