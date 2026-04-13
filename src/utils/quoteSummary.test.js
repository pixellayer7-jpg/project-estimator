import { describe, it, expect } from 'vitest'
import { buildQuoteSummary, buildMailtoHref } from './quoteSummary'

describe('buildQuoteSummary', () => {
  it('includes project type, add-ons, range and timeline in English', () => {
    const s = buildQuoteSummary('en', 'landing', [], '0', 800, 1200)
    expect(s).toContain('Project type: Landing Page')
    expect(s).toContain('Add-ons: None')
    expect(s).toContain('Extra sections/pages: 0')
    expect(s).toMatch(/Estimated range: \$800 – \$1,?200 USD/)
    expect(s).toContain('Typical timeline: 1–2 weeks')
  })

  it('uses Chinese labels when lang is zh', () => {
    const s = buildQuoteSummary('zh', 'landing', [], '0', 800, 1200)
    expect(s).toContain('项目类型：落地页')
    expect(s).toContain('附加项：无')
    expect(s).toContain('额外区块/页面：0')
    expect(s).toMatch(/估算区间：\$800 – \$1,?200 USD/)
  })

  it('lists selected add-ons and clamps extra sections in summary text', () => {
    const s = buildQuoteSummary('en', 'website', ['i18n'], '30', 1500, 2800)
    expect(s).toContain('Multilingual')
    expect(s).toContain('Extra sections/pages: 20')
  })

  it('falls back to raw id in summary when type is unknown', () => {
    const s = buildQuoteSummary('en', 'unknown-id', [], '0', 0, 0)
    expect(s).toContain('Project type: unknown-id')
  })

  it('prepends quote reference when provided', () => {
    const id = '11111111-1111-4111-8111-111111111111'
    const s = buildQuoteSummary('en', 'landing', [], '0', 800, 1200, id)
    expect(s.startsWith(`Quote reference (include in email): ${id}`)).toBe(true)
    expect(s).toContain('Project type: Landing Page')
    const zh = buildQuoteSummary('zh', 'landing', [], '0', 800, 1200, id)
    expect(zh).toContain(`报价编号（请在邮件中保留）：${id}`)
  })
})

describe('buildMailtoHref', () => {
  it('builds mailto with encoded subject and body', () => {
    const href = buildMailtoHref('a@b.com', 'Hello & subject', 'Line1\nLine2')
    expect(href.startsWith('mailto:a@b.com?')).toBe(true)
    const qs = href.slice(href.indexOf('?') + 1)
    const params = new URLSearchParams(qs)
    expect(params.get('subject')).toBe('Hello & subject')
    expect(params.get('body')).toBe('Line1\nLine2')
  })
})
