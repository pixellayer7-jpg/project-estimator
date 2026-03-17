/**
 * Edit these values to change quote ranges. All amounts in USD.
 */
export const projectTypes = [
  {
    id: 'landing',
    labelEn: 'Landing Page',
    labelZh: '落地页',
    min: 800,
    max: 1200,
  },
  {
    id: 'website',
    labelEn: 'Company / Agency Website',
    labelZh: '企业 / 工作室官网',
    min: 1500,
    max: 2800,
  },
  {
    id: 'dashboard',
    labelEn: 'Dashboard / Web App UI',
    labelZh: '数据看板 / Web 应用界面',
    min: 2200,
    max: 4500,
  },
]

export const addOns = [
  {
    id: 'design',
    labelEn: 'Design from scratch (no Figma)',
    labelZh: '从零设计（无设计稿）',
    percent: 25,
  },
  {
    id: 'i18n',
    labelEn: 'Multilingual (e.g. EN + 中文)',
    labelZh: '多语言（如 英文 + 中文）',
    percent: 15,
  },
  {
    id: 'rush',
    labelEn: 'Rush delivery (< 2 weeks)',
    labelZh: '加急交付（2 周内）',
    percent: 20,
  },
]

/** Extra cost per additional section/page beyond base scope */
export const extraSectionCost = { min: 80, max: 150 }

export function calculateQuote(projectTypeId, selectedAddOnIds, extraSections, lang) {
  const type = projectTypes.find((t) => t.id === projectTypeId)
  if (!type) return { min: 0, max: 0 }

  let min = type.min
  let max = type.max

  selectedAddOnIds.forEach((id) => {
    const addOn = addOns.find((a) => a.id === id)
    if (addOn) {
      min += Math.round(type.min * (addOn.percent / 100))
      max += Math.round(type.max * (addOn.percent / 100))
    }
  })

  const sections = Math.max(0, parseInt(extraSections, 10) || 0)
  min += sections * extraSectionCost.min
  max += sections * extraSectionCost.max

  return { min, max }
}
