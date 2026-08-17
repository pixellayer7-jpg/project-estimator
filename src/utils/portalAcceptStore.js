const STORAGE_KEY = 'pixellayer-portal-accept-v1'

function readAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function writeAll(map) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
  } catch {
    /* ignore quota / private mode */
  }
}

export function isQuoteAccepted(quoteRef) {
  if (!quoteRef) return false
  const row = readAll()[quoteRef]
  return Boolean(row?.acceptedAt)
}

export function acceptQuote(quoteRef) {
  if (!quoteRef) return false
  const map = readAll()
  map[quoteRef] = { acceptedAt: new Date().toISOString() }
  writeAll(map)
  return true
}

export function clearQuoteAccept(quoteRef) {
  if (!quoteRef) return
  const map = readAll()
  delete map[quoteRef]
  writeAll(map)
}

export { STORAGE_KEY as PORTAL_ACCEPT_KEY }
