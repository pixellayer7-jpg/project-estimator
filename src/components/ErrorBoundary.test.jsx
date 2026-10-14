import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ErrorBoundary from './ErrorBoundary'

function Boom() {
  throw new Error('render failed')
}

describe('ErrorBoundary', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('renders children when nothing throws', () => {
    render(
      <ErrorBoundary>
        <p>All good</p>
      </ErrorBoundary>
    )
    expect(screen.getByText('All good')).toBeInTheDocument()
  })

  it('shows the fallback, logs the error and reloads on click', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    const reload = vi.fn()
    vi.stubGlobal('location', { ...window.location, reload })

    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>
    )

    expect(
      screen.getByRole('heading', { name: 'Something went wrong' })
    ).toBeInTheDocument()
    expect(consoleError).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'render failed' }),
      expect.any(String)
    )

    await userEvent.click(screen.getByRole('button', { name: /Reload/ }))
    expect(reload).toHaveBeenCalledOnce()
  })
})
