/** Map quoteRef UUID → leads that reference it. */
export function indexLeadsByQuoteRef(leads) {
  const map = new Map()
  for (const lead of leads) {
    const ref = lead.quoteRef
    if (!ref || typeof ref !== 'string') continue
    const list = map.get(ref) ?? []
    list.push(lead)
    map.set(ref, list)
  }
  return map
}

/** Count leads linked to each quote id (quote.id or quote.quoteRef). */
export function leadCountForQuote(quote, leadsByRef) {
  let count = 0
  if (quote.id && leadsByRef.has(quote.id)) {
    count += leadsByRef.get(quote.id).length
  }
  if (quote.quoteRef && leadsByRef.has(quote.quoteRef)) {
    count += leadsByRef.get(quote.quoteRef).length
  }
  return count
}
