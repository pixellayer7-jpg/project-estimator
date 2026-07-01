/** Trigger browser download of JSON array. */
export function downloadJson(filename, rows) {
  const blob = new Blob([JSON.stringify(rows, null, 2)], {
    type: 'application/json;charset=utf-8',
  })
  triggerDownload(filename, blob)
}

/** Escape CSV field. */
function csvCell(value) {
  const s = value == null ? '' : String(value)
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

/** Trigger browser download of CSV from object rows. */
export function downloadCsv(filename, rows) {
  if (!rows.length) {
    downloadJson(filename.replace(/\.csv$/i, '.json'), [])
    return
  }
  const keys = Object.keys(rows[0])
  const lines = [
    keys.join(','),
    ...rows.map((row) => keys.map((k) => csvCell(row[k])).join(',')),
  ]
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' })
  triggerDownload(filename, blob)
}

function triggerDownload(filename, blob) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
