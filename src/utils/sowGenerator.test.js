import { describe, it, expect } from 'vitest'
import { buildSowMarkdown } from './sowGenerator'

describe('buildSowMarkdown', () => {
  it('includes project type and range in English', () => {
    const md = buildSowMarkdown({
      lang: 'en',
      projectTypeId: 'landing',
      addOnIds: ['i18n'],
      extraSections: '2',
      min: 920,
      max: 1380,
      quoteRef: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee',
    })
    expect(md).toContain('Landing Page')
    expect(md).toContain('$920 – $1,380 USD')
    expect(md).toContain('aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee')
    expect(md).toContain('Multilingual')
    expect(md).toContain('CLIENT_LEGAL_NAME')
    expect(md).toContain('Bank transfer')
  })

  it('uses the provided client name', () => {
    const md = buildSowMarkdown({
      lang: 'en',
      projectTypeId: 'landing',
      addOnIds: [],
      extraSections: '0',
      min: 800,
      max: 1200,
      clientName: 'Acme Studio',
    })
    expect(md).toContain('Acme Studio')
    expect(md).not.toContain('CLIENT_LEGAL_NAME')
  })

  it('includes Chinese headings when lang is zh', () => {
    const md = buildSowMarkdown({
      lang: 'zh',
      projectTypeId: 'website',
      addOnIds: [],
      extraSections: '0',
      min: 1500,
      max: 2800,
    })
    expect(md).toContain('工作说明书')
    expect(md).toContain('企业 / 工作室官网')
  })
})
