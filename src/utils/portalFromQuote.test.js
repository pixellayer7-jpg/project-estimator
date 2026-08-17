import { describe, expect, it } from 'vitest'
import {
  buildPortalFromQuote,
  buildPortalQuoteUrl,
  buildProposalUrl,
  buildQuoteSchedule,
  resolveQuoteInputFromLocation,
  withDepositMarked,
  withQuoteAcceptance,
} from './portalFromQuote'
import { calculateQuote } from '../data/pricing'
import { suggestedFee } from './invoiceGenerator'

describe('buildPortalQuoteUrl', () => {
  it('encodes quote fields as shareable query params', () => {
    const url = buildPortalQuoteUrl({
      base: 'https://pixellayer7-jpg.github.io/project-estimator/',
      projectType: 'website',
      addOnIds: ['i18n', 'rush'],
      extraSections: '2',
      quoteRef: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee',
      lang: 'zh',
      clientName: 'Acme Studio',
    })
    const parsed = new URL(url)
    expect(parsed.searchParams.get('portal')).toBe('quote')
    expect(parsed.searchParams.get('type')).toBe('website')
    expect(parsed.searchParams.get('addons')).toBe('i18n,rush')
    expect(parsed.searchParams.get('extra')).toBe('2')
    expect(parsed.searchParams.get('ref')).toBe(
      'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee'
    )
    expect(parsed.searchParams.get('lang')).toBe('zh')
    expect(parsed.searchParams.get('client')).toBe('Acme Studio')
  })
})

describe('buildProposalUrl', () => {
  it('encodes the SOW tab and quote fields', () => {
    const url = buildProposalUrl({
      base: 'https://pixellayer7-jpg.github.io/project-estimator/',
      tab: 'invoice',
      projectType: 'landing',
      extraSections: '1',
      quoteRef: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee',
      clientName: 'Northwind',
    })
    const parsed = new URL(url)
    expect(parsed.searchParams.get('proposal')).toBe('invoice')
    expect(parsed.searchParams.get('type')).toBe('landing')
    expect(parsed.searchParams.get('extra')).toBe('1')
    expect(parsed.searchParams.get('client')).toBe('Northwind')
  })
})

describe('resolveQuoteInputFromLocation', () => {
  it('reads type, extras, ref, and client from the query string', () => {
    const input = resolveQuoteInputFromLocation(
      '?proposal=sow&type=dashboard&extra=4&ref=aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee&client=Globex'
    )
    expect(input.projectType).toBe('dashboard')
    expect(input.extraSections).toBe('4')
    expect(input.quoteRef).toBe('aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee')
    expect(input.clientName).toBe('Globex')
  })
})

describe('buildPortalFromQuote', () => {
  it('uses the same price range as the calculator', () => {
    const now = new Date('2026-08-17T12:00:00Z')
    const input = {
      projectType: 'website',
      addOnIds: ['i18n'],
      extraSections: '2',
      quoteRef: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee',
      now,
    }
    const { min, max } = calculateQuote('website', ['i18n'], '2')
    const project = buildPortalFromQuote(input)
    expect(project.source).toBe('quote')
    expect(project.projectId).toBe('PL-AAAAAAAA')
    expect(project.projectName.en).toBe('Company / Agency Website')
    expect(project.budget).toBe(
      `$${min.toLocaleString()} – $${max.toLocaleString()} USD`
    )
    expect(project.deposit).toBe(Math.round(suggestedFee(min, max) * 0.5))
    expect(project.milestones[0].status).toBe('complete')
    expect(project.milestones[1].status).toBe('upcoming')
    expect(project.dateRange.start).toBe('2026-08-17')
    expect(project.deliverables[0].href).toContain('proposal=sow')
    expect(project.deliverables[1].href).toContain('proposal=invoice')
  })

  it('shortens timeline when rush is selected', () => {
    const now = new Date('2026-08-17T12:00:00Z')
    const normal = buildPortalFromQuote({
      projectType: 'dashboard',
      addOnIds: [],
      now,
    })
    const rush = buildPortalFromQuote({
      projectType: 'dashboard',
      addOnIds: ['rush'],
      now,
    })
    expect(rush.dateRange.target < normal.dateRange.target).toBe(true)
  })
})

describe('withQuoteAcceptance', () => {
  it('advances design to complete and build to current', () => {
    const project = buildPortalFromQuote({
      projectType: 'landing',
      quoteRef: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee',
      now: new Date('2026-08-17T12:00:00Z'),
    })
    const accepted = withQuoteAcceptance(
      project,
      new Date('2026-08-17T12:00:00Z')
    )
    expect(accepted.accepted).toBe(true)
    expect(accepted.milestones.find((m) => m.id === 'design')?.status).toBe(
      'complete'
    )
    expect(accepted.milestones.find((m) => m.id === 'build')?.status).toBe(
      'current'
    )
    expect(accepted.updates[0].author).toBe('Client')
  })
})

describe('buildQuoteSchedule', () => {
  it('shortens delivery when rush is selected', () => {
    const now = new Date('2026-08-17T12:00:00Z')
    const normal = buildQuoteSchedule({
      projectType: 'dashboard',
      addOnIds: [],
      now,
    })
    const rush = buildQuoteSchedule({
      projectType: 'dashboard',
      addOnIds: ['rush'],
      now,
    })
    expect(rush.delivery < normal.delivery).toBe(true)
    expect(normal.kickoff).toBe('2026-08-17')
  })
})

describe('withDepositMarked', () => {
  it('keeps build current and records deposit sent', () => {
    const project = buildPortalFromQuote({
      projectType: 'landing',
      quoteRef: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee',
      now: new Date('2026-08-17T12:00:00Z'),
    })
    const next = withDepositMarked(project, new Date('2026-08-17T12:00:00Z'), {
      signerName: 'Jamie Chen',
    })
    expect(next.depositSent).toBe(true)
    expect(next.signerName).toBe('Jamie Chen')
    expect(next.updates[0].body.en).toMatch(/deposit/i)
  })
})
