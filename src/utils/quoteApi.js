/** Trim and strip trailing slashes from `VITE_QUOTE_API_URL`. */
export function normalizeQuoteApiBase(raw) {
  if (raw == null) return ''
  return String(raw).trim().replace(/\/+$/, '')
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
