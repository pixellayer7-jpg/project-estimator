/** Parse ?type=, ?addons=, and ?extra= from URL for deep links. */
export function parseCalculatorUrlParams(search = window.location.search) {
  const params = new URLSearchParams(search)
  const type = params.get('type')
  const addonsRaw = params.get('addons')
  const extraRaw = params.get('extra')
  const validTypes = new Set(['landing', 'website', 'dashboard'])
  const validAddons = new Set(['design', 'i18n', 'rush'])
  const result = {}
  if (type && validTypes.has(type)) result.projectType = type
  if (addonsRaw) {
    const ids = addonsRaw
      .split(',')
      .map((s) => s.trim())
      .filter((id) => validAddons.has(id))
    if (ids.length) result.addOnIds = ids
  }
  if (extraRaw != null && extraRaw !== '') {
    const n = parseInt(extraRaw, 10)
    if (Number.isFinite(n)) {
      result.extraSections = String(Math.min(20, Math.max(0, n)))
    }
  }
  return result
}

/** Remove type/addons from URL without reload (after applying to form). */
export function stripCalculatorMarketingParams() {
  const url = new URL(window.location.href)
  url.searchParams.delete('type')
  url.searchParams.delete('addons')
  url.searchParams.delete('extra')
  const next = url.searchParams.toString()
  const path = url.pathname + (next ? `?${next}` : '') + url.hash
  window.history.replaceState(null, '', path)
}
