import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { downloadCsv, downloadJson, downloadText } from './exportCrm'

let downloads

beforeEach(() => {
  downloads = []
  URL.createObjectURL = vi.fn(() => 'blob:mock')
  URL.revokeObjectURL = vi.fn()
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(
    function () {
      downloads.push({ href: this.href, download: this.download })
    }
  )
})

afterEach(() => {
  vi.restoreAllMocks()
  delete URL.createObjectURL
  delete URL.revokeObjectURL
})

function lastBlob() {
  const calls = URL.createObjectURL.mock.calls
  return calls[calls.length - 1][0]
}

describe('exportCrm downloads', () => {
  it('downloadJson writes pretty JSON and revokes the object URL', async () => {
    downloadJson('quotes.json', [{ id: 1 }])
    expect(downloads).toEqual([{ href: 'blob:mock', download: 'quotes.json' }])
    expect(lastBlob().type).toBe('application/json;charset=utf-8')
    expect(await lastBlob().text()).toBe('[\n  {\n    "id": 1\n  }\n]')
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock')
  })

  it('downloadCsv writes a header row and escapes special characters', async () => {
    downloadCsv('leads.csv', [
      { name: 'Alex', note: 'says "hi", twice', empty: null },
      { name: 'Jamie', note: 'line1\nline2', empty: undefined },
    ])
    expect(downloads[0].download).toBe('leads.csv')
    expect(lastBlob().type).toBe('text/csv;charset=utf-8')
    expect(await lastBlob().text()).toBe(
      [
        'name,note,empty',
        'Alex,"says ""hi"", twice",',
        'Jamie,"line1\nline2",',
      ].join('\n')
    )
  })

  it('downloadCsv falls back to an empty JSON file when there are no rows', async () => {
    downloadCsv('leads.CSV', [])
    expect(downloads[0].download).toBe('leads.json')
    expect(await lastBlob().text()).toBe('[]')
  })

  it('downloadText defaults to Markdown and accepts a custom type', async () => {
    downloadText('sow.md', '# SOW')
    expect(lastBlob().type).toBe('text/markdown;charset=utf-8')
    expect(await lastBlob().text()).toBe('# SOW')

    downloadText('notes.txt', 'plain', 'text/plain')
    expect(downloads[1].download).toBe('notes.txt')
    expect(lastBlob().type).toBe('text/plain')
  })
})
