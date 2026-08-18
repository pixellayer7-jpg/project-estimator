import { describe, expect, it, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import CrmAdmin from './CrmAdmin'
import { acceptQuote, PORTAL_ACCEPT_KEY } from '../utils/portalAcceptStore'
import { saveQuoteRef } from '../utils/storage'

const QUOTE_ID = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee'

describe('CrmAdmin', () => {
  beforeEach(() => {
    localStorage.clear()
    localStorage.removeItem(PORTAL_ACCEPT_KEY)
  })

  it('shows this-browser engagement for the current quote', () => {
    saveQuoteRef(QUOTE_ID)
    acceptQuote(QUOTE_ID, { signerName: 'Jamie Chen' })
    render(<CrmAdmin lang="en" />)
    expect(
      screen.getByRole('heading', { name: /This browser/i })
    ).toBeInTheDocument()
    expect(screen.getByText('Jamie Chen')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^JSON$/i })).toBeInTheDocument()
  })
})
