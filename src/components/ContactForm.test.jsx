import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ContactForm from './ContactForm'
import { CONTACT_HANDOFF_KEY, saveLastQuoteId } from '../utils/contactHandoff'
import { postLead } from '../utils/quoteApi'

vi.mock('../utils/quoteApi', async () => {
  const actual = await vi.importActual('../utils/quoteApi')
  return { ...actual, postLead: vi.fn() }
})

describe('ContactForm', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
    sessionStorage.clear()
  })

  it('prefills the message from the calculator handoff', () => {
    vi.stubEnv('VITE_FORMSPREE_FORM_ID', 'testformid')
    sessionStorage.setItem(
      CONTACT_HANDOFF_KEY,
      JSON.stringify({ summary: 'Landing page: $800 – $1,200' })
    )
    render(<ContactForm lang="en" />)
    expect(screen.getByLabelText(/^Message$/i)).toHaveValue(
      'Landing page: $800 – $1,200'
    )
  })

  it('renders nothing when Formspree id and lead API are unset', () => {
    vi.stubEnv('VITE_FORMSPREE_FORM_ID', '')
    vi.stubEnv('VITE_LEAD_API_URL', '')
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

  it('clears error feedback when user edits after a failed submit', async () => {
    vi.stubEnv('VITE_FORMSPREE_FORM_ID', 'testformid')
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({}),
    })
    const user = userEvent.setup()
    render(<ContactForm lang="en" />)

    await user.type(screen.getByLabelText(/^Name$/i), 'Ada')
    await user.type(screen.getByLabelText(/^Email$/i), 'ada@example.com')
    await user.type(screen.getByLabelText(/^Message$/i), 'Hi')
    await user.click(screen.getByRole('button', { name: /^Send$/i }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })

    await user.type(screen.getByLabelText(/^Message$/i), ' again')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('ignores a broken or blank handoff and shows Chinese copy', () => {
    vi.stubEnv('VITE_LEAD_API_URL', 'https://api.test/')
    sessionStorage.setItem(CONTACT_HANDOFF_KEY, '{')
    const { unmount } = render(<ContactForm lang="zh" />)
    expect(screen.getByLabelText('留言内容')).toHaveValue('')
    unmount()
    sessionStorage.setItem(
      CONTACT_HANDOFF_KEY,
      JSON.stringify({ summary: '   ' })
    )
    render(<ContactForm lang="zh" />)
    expect(
      screen.getByRole('heading', { name: '在线留言' })
    ).toBeInTheDocument()
    expect(screen.getByLabelText('留言内容')).toHaveValue('')
    expect(
      screen.getByRole('link', { name: /打开主站完整联系表单/ })
    ).toHaveAttribute('href', expect.stringContaining('#contact'))
  })

  it('sends through the lead API using the handoff quote id', async () => {
    vi.stubEnv('VITE_LEAD_API_URL', 'https://api.test///')
    const quoteRef = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee'
    sessionStorage.setItem(
      CONTACT_HANDOFF_KEY,
      JSON.stringify({ summary: 'From calculator', quoteRef })
    )
    postLead.mockResolvedValue({ id: '1' })
    const user = userEvent.setup()
    render(<ContactForm lang="zh" />)
    await user.type(screen.getByLabelText('姓名'), '阿达')
    await user.type(screen.getByLabelText('邮箱'), 'ada@example.com')
    await user.click(screen.getByRole('button', { name: '发送' }))
    expect(await screen.findByRole('status')).toHaveTextContent('已收到')
    expect(postLead).toHaveBeenCalledWith(
      'https://api.test',
      expect.objectContaining({
        name: '阿达',
        quoteRef,
        source: 'calculator',
        lang: 'zh',
        subject: expect.stringContaining('[aaaaaaaa]'),
      })
    )
    expect(screen.getByLabelText('姓名')).toHaveValue('')
  })

  it('keeps a Formspree success when the lead API rejects', async () => {
    vi.stubEnv('VITE_FORMSPREE_FORM_ID', 'testformid')
    vi.stubEnv('VITE_LEAD_API_URL', 'https://api.test')
    saveLastQuoteId('aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee')
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => {
        throw new Error('bad json')
      },
    })
    postLead.mockRejectedValue(new Error('down'))
    const user = userEvent.setup()
    render(<ContactForm lang="en" />)
    await user.type(screen.getByLabelText(/^Name$/i), 'Ada')
    await user.type(screen.getByLabelText(/^Email$/i), 'ada@example.com')
    await user.type(screen.getByLabelText(/^Message$/i), 'Hi')
    await user.click(screen.getByRole('button', { name: /^Send$/i }))
    expect(await screen.findByRole('status')).toHaveTextContent(/Thanks/)
    const body = JSON.parse(fetch.mock.calls[0][1].body)
    expect(body._subject).toContain('[aaaaaaaa]')
  })

  it('reports a lead-only failure and a thrown request in Chinese', async () => {
    vi.stubEnv('VITE_LEAD_API_URL', 'https://api.test')
    postLead.mockRejectedValue(new Error('down'))
    const user = userEvent.setup()
    const { unmount } = render(<ContactForm lang="zh" />)
    await user.type(screen.getByLabelText('姓名'), '阿达')
    await user.type(screen.getByLabelText('邮箱'), 'ada@example.com')
    await user.type(screen.getByLabelText('留言内容'), '你好')
    await user.click(screen.getByRole('button', { name: '发送' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('发送失败')
    unmount()

    vi.stubEnv('VITE_FORMSPREE_FORM_ID', 'testformid')
    vi.stubEnv('VITE_LEAD_API_URL', '')
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('offline'))
    render(<ContactForm lang="zh" />)
    await user.type(screen.getByLabelText('姓名'), '阿达')
    await user.type(screen.getByLabelText('邮箱'), 'ada@example.com')
    await user.type(screen.getByLabelText('留言内容'), '你好')
    await user.click(screen.getByRole('button', { name: '发送' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('发送失败')
  })
})
