import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ContactForm from './ContactForm'

describe('ContactForm', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  it('renders nothing when Formspree id is unset', () => {
    vi.stubEnv('VITE_FORMSPREE_FORM_ID', '')
    render(<ContactForm lang="en" />)
    expect(screen.queryByRole('form')).not.toBeInTheDocument()
  })

  it('submits JSON to Formspree and shows success', async () => {
    vi.stubEnv('VITE_FORMSPREE_FORM_ID', 'testformid')
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    })
    globalThis.fetch = fetchMock

    const user = userEvent.setup()
    render(<ContactForm lang="en" />)

    await user.type(screen.getByLabelText(/^Name$/i), 'Ada')
    await user.type(screen.getByLabelText(/^Email$/i), 'ada@example.com')
    await user.type(screen.getByLabelText(/^Message$/i), 'Hello')
    await user.click(screen.getByRole('button', { name: /^Send$/i }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'https://formspree.io/f/testformid',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Accept: 'application/json',
            'Content-Type': 'application/json',
          }),
        })
      )
    })

    const body = JSON.parse(fetchMock.mock.calls[0][1].body)
    expect(body).toMatchObject({
      name: 'Ada',
      email: 'ada@example.com',
      message: 'Hello',
    })

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent(/Thanks/)
    })
  })
})
