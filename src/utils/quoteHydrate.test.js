import { describe, it, expect } from 'vitest'
import { clampExtraSectionsString, mapQuoteRowToForm } from './quoteHydrate'

describe('quoteHydrate', () => {
  it('clampExtraSectionsString bounds 0–20', () => {
    expect(clampExtraSectionsString('99')).toBe('20')
    expect(clampExtraSectionsString('-1')).toBe('0')
    expect(clampExtraSectionsString('x')).toBe('0')
  })

  it('mapQuoteRowToForm keeps known project and add-ons', () => {
    const { form, quoteRef, lang } = mapQuoteRowToForm({
      projectType: 'website',
      addOnIds: ['design', 'unknown'],
      extraSections: 2,
      quoteRef: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      lang: 'zh',
    })
    expect(form.projectType).toBe('website')
    expect(form.addOnIds).toEqual(['design'])
    expect(form.extraSections).toBe('2')
    expect(quoteRef).toBe('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb')
    expect(lang).toBe('zh')
  })

  it('mapQuoteRowToForm falls back for unknown project type', () => {
    const { form } = mapQuoteRowToForm({
      projectType: 'nope',
      addOnIds: [],
      extraSections: '0',
    })
    expect(form.projectType).toBe('landing')
  })

  it('mapQuoteRowToForm ignores invalid quoteRef and lang', () => {
    const { quoteRef, lang } = mapQuoteRowToForm({
      projectType: 'landing',
      addOnIds: [],
      extraSections: '0',
      quoteRef: 'not-uuid',
      lang: 'fr',
    })
    expect(quoteRef).toBeNull()
    expect(lang).toBeNull()
  })
})
