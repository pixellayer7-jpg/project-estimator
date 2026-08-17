const STORAGE_KEY = 'pixellayer-portal-accept-v1'
const KICKOFF_KEYS = ['assets', 'copy', 'access']

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

export function sanitizeSignerName(raw) {
  return String(raw ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80)
}

function normalizeKickoff(raw) {
  return {
    assets: Boolean(raw?.assets),
    copy: Boolean(raw?.copy),
    access: Boolean(raw?.access),
  }
}

export function getQuoteAcceptance(quoteRef) {
  if (!quoteRef) return null
  const row = readAll()[quoteRef]
  if (!row || typeof row !== 'object') return null
  return {
    acceptedAt: row.acceptedAt || null,
    signerName: sanitizeSignerName(row.signerName),
    clientName: sanitizeSignerName(row.clientName),
    fee: Number.isFinite(Number(row.fee)) ? Number(row.fee) : null,
    deposit: Number.isFinite(Number(row.deposit)) ? Number(row.deposit) : null,
    depositMarkedAt: row.depositMarkedAt || null,
    kickoff: normalizeKickoff(row.kickoff),
  }
}

export function isQuoteAccepted(quoteRef) {
  return Boolean(getQuoteAcceptance(quoteRef)?.acceptedAt)
}

export function isDepositSent(quoteRef) {
  return Boolean(getQuoteAcceptance(quoteRef)?.depositMarkedAt)
}

export function acceptQuote(quoteRef, details = {}) {
  if (!quoteRef) return false
  const map = readAll()
  const prev =
    map[quoteRef] && typeof map[quoteRef] === 'object' ? map[quoteRef] : {}
  const signerName =
    sanitizeSignerName(details.signerName) ||
    sanitizeSignerName(prev.signerName)
  const clientName =
    sanitizeSignerName(details.clientName) ||
    sanitizeSignerName(prev.clientName)
  const fee = Number.isFinite(Number(details.fee))
    ? Number(details.fee)
    : Number.isFinite(Number(prev.fee))
      ? Number(prev.fee)
      : null
  const deposit = Number.isFinite(Number(details.deposit))
    ? Number(details.deposit)
    : Number.isFinite(Number(prev.deposit))
      ? Number(prev.deposit)
      : null
  map[quoteRef] = {
    ...prev,
    acceptedAt: prev.acceptedAt || new Date().toISOString(),
    signerName,
    clientName,
    fee,
    deposit,
    kickoff: normalizeKickoff(prev.kickoff),
  }
  writeAll(map)
  return true
}

export function markDepositSent(quoteRef, now = new Date()) {
  if (!quoteRef) return false
  const map = readAll()
  const prev = map[quoteRef]
  if (!prev?.acceptedAt) return false
  map[quoteRef] = {
    ...prev,
    depositMarkedAt: prev.depositMarkedAt || now.toISOString(),
  }
  writeAll(map)
  return true
}

export function setKickoffItem(quoteRef, key, value) {
  if (!quoteRef || !KICKOFF_KEYS.includes(key)) return false
  const map = readAll()
  const prev = map[quoteRef]
  if (!prev?.acceptedAt) return false
  map[quoteRef] = {
    ...prev,
    kickoff: {
      ...normalizeKickoff(prev.kickoff),
      [key]: Boolean(value),
    },
  }
  writeAll(map)
  return true
}

export function isKickoffComplete(quoteRef) {
  const row = getQuoteAcceptance(quoteRef)
  if (!row?.acceptedAt || !row.depositMarkedAt) return false
  return row.kickoff.assets && row.kickoff.copy && row.kickoff.access
}

export function clearQuoteAccept(quoteRef) {
  if (!quoteRef) return
  const map = readAll()
  delete map[quoteRef]
  writeAll(map)
}

export { STORAGE_KEY as PORTAL_ACCEPT_KEY }
