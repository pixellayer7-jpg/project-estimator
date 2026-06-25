/** Parse ?type= and ?addons= from URL for deep links from landing pricing cards. */
export function parseCalculatorUrlParams(search = window.location.search) {
  const params = new URLSearchParams(search)
  const type = params.get('type')
  const addonsRaw = params.get('addons')
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
  return result
}

/** Remove type/addons from URL without reload (after applying to form). */
export function stripCalculatorMarketingParams() {
  const url = new URL(window.location.href)
  url.searchParams.delete('type')
  url.searchParams.delete('addons')
  const next = url.searchParams.toString()
  const path = url.pathname + (next ? `?${next}` : '') + url.hash
  window.history.replaceState(null, '', path)
}
