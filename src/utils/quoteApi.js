/** Trim and strip trailing slashes from `VITE_QUOTE_API_URL`. */
export function normalizeQuoteApiBase(raw) {
  if (raw == null) return ''
  return String(raw).trim().replace(/\/+$/, '')
}

/** Matches estimator-api `GET :id` UUID rule. */
export const QUOTE_UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

/** Build deployed calculator URL with `?load=` for a saved quote id. */
export function buildCalculatorLoadUrl(siteBase, quoteId) {
  const base = normalizeQuoteApiBase(siteBase)
  if (!base || !QUOTE_UUID_RE.test(quoteId)) return ''
  return `${base}/?load=${encodeURIComponent(quoteId)}`
}

/**
 * Extract a quote UUID from a raw UUID, a calculator `?load=` URL,
 * or an estimator-api `/api/v1/quotes/:id` URL.
 */
export function extractQuoteIdFromInput(raw) {
  const input = String(raw ?? '').trim()
  if (!input) return ''
  if (QUOTE_UUID_RE.test(input)) return input

  try {
    const url = new URL(input)
    const load = url.searchParams.get('load')
    if (load && QUOTE_UUID_RE.test(load)) return load
    const last = url.pathname.split('/').filter(Boolean).at(-1) ?? ''
    return QUOTE_UUID_RE.test(last) ? last : ''
  } catch {
    const match = input.match(QUOTE_UUID_RE)
    return match?.[0] ?? ''
  }
}

/**
 * GET one quote row (full snapshot).
 * @param {string} baseUrl
 * @param {string} id
 * @param {{ signal?: AbortSignal }} [options]
 */
export async function getQuoteById(baseUrl, id, options = {}) {
  const { signal } = options
  if (!QUOTE_UUID_RE.test(id)) {
    throw new Error('Invalid id')
  }
  const url = `${baseUrl}/api/v1/quotes/${encodeURIComponent(id)}`
  const res = await fetch(url, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    signal,
  })
  const text = await res.text()
  let json = {}
  try {
    json = text ? JSON.parse(text) : {}
  } catch {
    /* ignore */
  }
  if (!res.ok) {
    const msg =
      typeof json.error === 'string' && json.error
        ? json.error
        : `HTTP ${res.status}`
    throw new Error(msg)
  }
  if (!json.projectType) {
    throw new Error('Invalid response')
  }
  return json
}

/**
 * POST a quote snapshot to estimator-api.
 * @param {string} baseUrl - e.g. https://your-api.example.com
 * @param {object} body - projectType, addOnIds, extraSections, min, max, lang, quoteRef, summary
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<{ id: string, createdAt: string, path: string }>}
 */
export async function postQuoteSnapshot(baseUrl, body, options = {}) {
  const { signal } = options
  const url = `${baseUrl}/api/v1/quotes`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    signal,
  })
  const text = await res.text()
  let json = {}
  try {
    json = text ? JSON.parse(text) : {}
  } catch {
    /* ignore */
  }
  if (!res.ok) {
    const msg =
      typeof json.error === 'string' && json.error
        ? json.error
        : `HTTP ${res.status}`
    throw new Error(msg)
  }
  if (!json.id || typeof json.id !== 'string') {
    throw new Error('Invalid response')
  }
  return json
}
