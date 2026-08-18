import { EMAIL } from '../config/site'
import { addOns, calculateQuote, projectTypes } from '../data/pricing'
import { downloadJson, downloadText } from './exportCrm'
import { suggestedFee } from './invoiceGenerator'
import { engagementStage, getQuoteAcceptance } from './portalAcceptStore'
import { buildQuoteSchedule } from './portalFromQuote'

export function buildEngagementRecord({
  quoteRef,
  projectType = 'landing',
  addOnIds = [],
  extraSections = '0',
  clientName = '',
  now = new Date(),
} = {}) {
  const type = projectTypes.find((t) => t.id === projectType) || projectTypes[0]
  const addons = Array.isArray(addOnIds) ? addOnIds : []
  const { min, max } = calculateQuote(type.id, addons, extraSections)
  const fee = suggestedFee(min, max)
  const deposit = Math.round(fee * 0.5)
  const acceptance = quoteRef ? getQuoteAcceptance(quoteRef) : null
  const schedule = buildQuoteSchedule({
    projectType: type.id,
    addOnIds: addons,
    now,
  })
  const addOnLabels = addons
    .map((id) => addOns.find((a) => a.id === id))
    .filter(Boolean)
    .map((a) => a.labelEn)
  return {
    schema: 'pixellayer.engagement.v1',
    generatedAt: now.toISOString(),
    provider: {
      name: 'PixelLayer L.L.C',
      email: EMAIL,
    },
    quote: {
      quoteRef: quoteRef || null,
      projectType: type.id,
      projectLabel: type.labelEn,
      addOnIds: addons,
      addOnLabels,
      extraSections: String(extraSections),
      min,
      max,
      fee,
      deposit,
      range: `$${min.toLocaleString()} – $${max.toLocaleString()} USD`,
    },
    client: {
      name: acceptance?.clientName || clientName || '',
      signerName: acceptance?.signerName || '',
    },
    timeline: schedule,
    status: {
      stage: engagementStage(acceptance),
      acceptedAt: acceptance?.acceptedAt || null,
      depositMarkedAt: acceptance?.depositMarkedAt || null,
      kickoffCompletedAt: acceptance?.kickoffCompletedAt || null,
      kickoff: acceptance?.kickoff || {
        assets: false,
        copy: false,
        access: false,
      },
    },
    notice: {
      en: 'Browser-local indicative record. Not a tax invoice or a legally binding e-sign product.',
      zh: '本机浏览器内的参考记录。非正式税务发票，也不是具有法律效力的电子签章产品。',
    },
  }
}

export function buildEngagementMarkdown(record, lang = 'en') {
  const en = lang === 'en'
  const q = record.quote || {}
  const c = record.client || {}
  const s = record.status || {}
  const kickoff = s.kickoff || {}
  const title = en ? 'PixelLayer engagement record' : 'PixelLayer 合作记录'
  return `# ${title}

- **${en ? 'Generated' : '生成时间'}:** ${record.generatedAt || ''}
- **${en ? 'Provider' : '服务方'}:** ${record.provider?.name || 'PixelLayer L.L.C'} (${record.provider?.email || EMAIL})
- **${en ? 'Quote ID' : '报价编号'}:** ${q.quoteRef || 'QUOTE_REF'}
- **${en ? 'Stage' : '阶段'}:** ${s.stage || 'draft'}

## ${en ? 'Scope' : '范围'}

- **${en ? 'Project' : '项目'}:** ${q.projectLabel || q.projectType || ''}
- **${en ? 'Add-ons' : '附加项'}:** ${
    (q.addOnLabels || []).join(en ? '; ' : '；') || (en ? 'None' : '无')
  }
- **${en ? 'Extra sections' : '额外区块'}:** ${q.extraSections || '0'}
- **${en ? 'Indicative range' : '参考区间'}:** ${q.range || ''}
- **${en ? 'Suggested fee / deposit' : '建议价格 / 定金'}:** $${Number(
    q.fee || 0
  ).toLocaleString()} / $${Number(q.deposit || 0).toLocaleString()} USD

## ${en ? 'Client' : '客户'}

- **${en ? 'Name' : '名称'}:** ${c.name || '—'}
- **${en ? 'Signed as' : '签署姓名'}:** ${c.signerName || '—'}
- **${en ? 'Accepted at' : '接受时间'}:** ${s.acceptedAt || '—'}
- **${en ? 'Deposit marked' : '定金标记'}:** ${s.depositMarkedAt || '—'}
- **${en ? 'Kickoff complete' : '开工完成'}:** ${s.kickoffCompletedAt || '—'}

## ${en ? 'Kickoff checklist' : '开工清单'}

- ${en ? 'Assets' : '素材'}: ${kickoff.assets ? 'yes' : 'no'}
- ${en ? 'Copy' : '文案'}: ${kickoff.copy ? 'yes' : 'no'}
- ${en ? 'Access' : '权限'}: ${kickoff.access ? 'yes' : 'no'}

---

_${en ? record.notice?.en : record.notice?.zh}_
`
}

export function downloadEngagementJson(record) {
  const id = String(record?.quote?.quoteRef || 'draft')
    .replace(/[^a-zA-Z0-9-]/g, '')
    .slice(0, 12)
  downloadJson(`pixellayer-engagement-${id || 'draft'}.json`, record)
}

export function downloadEngagementMarkdown(record, lang = 'en') {
  const id = String(record?.quote?.quoteRef || 'draft')
    .replace(/[^a-zA-Z0-9-]/g, '')
    .slice(0, 12)
  downloadText(
    `pixellayer-engagement-${id || 'draft'}.md`,
    buildEngagementMarkdown(record, lang)
  )
}
