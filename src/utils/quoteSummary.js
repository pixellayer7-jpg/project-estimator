import { projectTypes, addOns } from '../data/pricing'

export function buildQuoteSummary(lang, projectTypeId, addOnIds, extraSections, min, max) {
  const en = lang === 'en'
  const type = projectTypes.find((p) => p.id === projectTypeId)
  const typeLabel = type ? (en ? type.labelEn : type.labelZh) : projectTypeId

  const addOnLabels = addOnIds
    .map((id) => addOns.find((a) => a.id === id))
    .filter(Boolean)
    .map((a) => (en ? a.labelEn : a.labelZh))

  const sections = Math.max(0, parseInt(extraSections, 10) || 0)

  const timelineLine = type ? (en ? type.timelineEn : type.timelineZh) : null

  if (en) {
    const lines = [
      `Project type: ${typeLabel}`,
      `Add-ons: ${addOnLabels.length ? addOnLabels.join('; ') : 'None'}`,
      `Extra sections/pages: ${sections}`,
      `Estimated range: $${min.toLocaleString()} – $${max.toLocaleString()} USD`,
    ]
    if (timelineLine) lines.push(timelineLine)
    lines.push('', 'Timeline, budget, and reference links:')
    return lines.join('\n')
  }

  const zhLines = [
    `项目类型：${typeLabel}`,
    `附加项：${addOnLabels.length ? addOnLabels.join('；') : '无'}`,
    `额外区块/页面：${sections}`,
    `估算区间：$${min.toLocaleString()} – $${max.toLocaleString()} USD`,
  ]
  if (timelineLine) zhLines.push(timelineLine)
  zhLines.push('', '请补充：期望上线时间、预算范围、参考链接等：')
  return zhLines.join('\n')
}

export function buildMailtoHref(email, subject, body) {
  const params = new URLSearchParams()
  params.set('subject', subject)
  params.set('body', body)
  return `mailto:${email}?${params.toString()}`
}
