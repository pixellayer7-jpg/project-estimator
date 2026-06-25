import { describe, it, expect } from 'vitest'
import { parseCalculatorUrlParams } from './urlParams.js'

describe('parseCalculatorUrlParams', () => {
  it('parses type and addons', () => {
    const r = parseCalculatorUrlParams('?type=website&addons=design,i18n')
    expect(r.projectType).toBe('website')
    expect(r.addOnIds).toEqual(['design', 'i18n'])
  })

  it('ignores invalid type', () => {
    expect(
      parseCalculatorUrlParams('?type=invalid').projectType
    ).toBeUndefined()
  })

  it('filters invalid addons', () => {
    const r = parseCalculatorUrlParams('?addons=design,bad,rush')
    expect(r.addOnIds).toEqual(['design', 'rush'])
  })
})
