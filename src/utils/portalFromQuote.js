import { addOns, calculateQuote, projectTypes } from '../data/pricing'
import { ESTIMATOR_URL } from '../config/site'
import { suggestedFee } from './invoiceGenerator'
import { parseCalculatorUrlParams } from './urlParams'
import { loadEstimatorForm, loadQuoteRef } from './storage'
import { QUOTE_UUID_RE } from './quoteApi'

const VALID_TYPES = new Set(projectTypes.map((t) => t.id))
const VALID_ADDONS = new Set(addOns.map((a) => a.id))

const DURATION_DAYS = {
  landing: 10,
  website: 21,
  dashboard: 35,
}

const RUSH_DAYS = {
  landing: 7,
  website: 12,
  dashboard: 14,
}

function isoDate(date) {
  return new Date(date).toISOString().slice(0, 10)
}

function addUtcDays(date, days) {
  const next = new Date(date)
  next.setUTCDate(next.getUTCDate() + days)
  return next
}

function clampExtra(raw) {
  const n = parseInt(String(raw ?? '0'), 10)
  if (!Number.isFinite(n)) return '0'
  return String(Math.min(20, Math.max(0, n)))
}

function siteBase(base = ESTIMATOR_URL) {
  try {
    const url = new URL(base)
    if (!url.pathname.endsWith('/')) url.pathname += '/'
    return url
  } catch {
    const url = new URL('https://pixellayer7-jpg.github.io/project-estimator/')
    return url
  }
}

function projectIdFromRef(quoteRef) {
  const raw = String(quoteRef || 'DRAFT')
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, 8)
    .toUpperCase()
  return `PL-${raw || 'DRAFT'}`
}

function scopeCopy(type, addOnLabels, sections) {
  const extras =
    sections > 0
      ? {
          en: `${sections} extra section(s)/page(s)`,
          zh: `${sections} 个额外区块/页面`,
        }
      : { en: 'base scope', zh: '基础范围' }
  const addOnTextEn = addOnLabels.length
    ? addOnLabels.map((a) => a.en).join('; ')
    : 'no add-ons'
  const addOnTextZh = addOnLabels.length
    ? addOnLabels.map((a) => a.zh).join('；')
    : '无附加项'
  return {
    en: `${type.labelEn} — ${extras.en}; ${addOnTextEn}. 50% deposit to kickoff, 50% on delivery.`,
    zh: `${type.labelZh} — ${extras.zh}；${addOnTextZh}。开工 50% 定金，交付 50% 尾款。`,
  }
}

export function sanitizeClientName(raw) {
  return String(raw ?? '')
    .trim()
    .slice(0, 80)
}

function applyQuoteQueryParams(
  url,
  {
    projectType,
    addOnIds = [],
    extraSections = '0',
    quoteRef,
    lang,
    clientName,
  } = {}
) {
  if (VALID_TYPES.has(projectType)) url.searchParams.set('type', projectType)
  const addons = (addOnIds || []).filter((id) => VALID_ADDONS.has(id))
  if (addons.length) url.searchParams.set('addons', addons.join(','))
  const extra = clampExtra(extraSections)
  if (extra !== '0') url.searchParams.set('extra', extra)
  if (quoteRef) url.searchParams.set('ref', quoteRef)
  if (lang === 'en' || lang === 'zh') url.searchParams.set('lang', lang)
  const client = sanitizeClientName(clientName)
  if (client) url.searchParams.set('client', client)
}

/**
 * Read quote fields from the URL, falling back to the last calculator form.
 */
export function resolveQuoteInputFromLocation(search = window.location.search) {
  const params = new URLSearchParams(search)
  const parsed = parseCalculatorUrlParams(search)
  const stored = loadEstimatorForm()
  const refParam = params.get('ref')
  const quoteRef = QUOTE_UUID_RE.test(refParam || '')
    ? refParam
    : loadQuoteRef()
  const clientFromUrl = sanitizeClientName(params.get('client'))
  const clientName = clientFromUrl || stored?.clientName || ''
  return {
    projectType: parsed.projectType || stored?.projectType || 'landing',
    addOnIds: parsed.addOnIds || stored?.addOnIds || [],
    extraSections: parsed.extraSections || stored?.extraSections || '0',
    quoteRef,
    clientName,
  }
}

/**
 * Shareable zero-config portal URL for the current calculator quote.
 */
export function buildPortalQuoteUrl({
  base = ESTIMATOR_URL,
  projectType,
  addOnIds = [],
  extraSections = '0',
  quoteRef,
  lang,
  clientName,
} = {}) {
  const url = siteBase(base)
  url.searchParams.set('portal', 'quote')
  applyQuoteQueryParams(url, {
    projectType,
    addOnIds,
    extraSections,
    quoteRef,
    lang,
    clientName,
  })
  return url.toString()
}

/**
 * Shareable in-app proposal URL (SOW or deposit invoice tab).
 */
export function buildProposalUrl({
  base = ESTIMATOR_URL,
  tab = 'sow',
  projectType,
  addOnIds = [],
  extraSections = '0',
  quoteRef,
  lang,
  clientName,
} = {}) {
  const url = siteBase(base)
  url.searchParams.set('proposal', tab === 'invoice' ? 'invoice' : 'sow')
  applyQuoteQueryParams(url, {
    projectType,
    addOnIds,
    extraSections,
    quoteRef,
    lang,
    clientName,
  })
  return url.toString()
}

/**
 * Build a ClientPortal project model from calculator quote state.
 * @param {object} input
 * @param {Date} [input.now]
 */
export function buildPortalFromQuote({
  projectType = 'landing',
  addOnIds = [],
  extraSections = '0',
  quoteRef = null,
  clientName = '',
  accepted = false,
  now = new Date(),
} = {}) {
  const type = projectTypes.find((t) => t.id === projectType) || projectTypes[0]
  const addons = (addOnIds || []).filter((id) => VALID_ADDONS.has(id))
  const sections = Number(clampExtra(extraSections))
  const { min, max } = calculateQuote(type.id, addons, sections)
  const fee = suggestedFee(min, max)
  const deposit = Math.round(fee * 0.5)
  const rush = addons.includes('rush')
  const duration = rush ? RUSH_DAYS[type.id] : DURATION_DAYS[type.id]
  const start = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  )
  const target = addUtcDays(start, duration)
  const designAt = addUtcDays(start, rush ? 1 : 2)
  const buildAt = addUtcDays(start, Math.max(3, Math.round(duration * 0.35)))
  const reviewAt = addUtcDays(start, Math.max(5, Math.round(duration * 0.75)))
  const addOnLabels = addons
    .map((id) => addOns.find((a) => a.id === id))
    .filter(Boolean)
    .map((a) => ({ en: a.labelEn, zh: a.labelZh }))

  const clientLabel = sanitizeClientName(clientName)
  const today = isoDate(start)
  const project = {
    source: 'quote',
    accepted: false,
    quotePayload: {
      projectTypeId: type.id,
      addOnIds: addons,
      extraSections: String(sections),
      min,
      max,
      quoteRef,
      clientName: clientLabel,
    },
    projectId: projectIdFromRef(quoteRef),
    projectName: {
      en: type.labelEn,
      zh: type.labelZh,
    },
    client: clientLabel
      ? { en: clientLabel, zh: clientLabel }
      : {
          en: 'Prospective client (from quote)',
          zh: '潜在客户（来自报价）',
        },
    status: 'draft',
    dateRange: {
      start: today,
      target: isoDate(target),
    },
    budget: `$${min.toLocaleString()} – $${max.toLocaleString()} USD`,
    suggestedFee: fee,
    deposit,
    scope: scopeCopy(type, addOnLabels, sections),
    milestones: [
      {
        id: 'discovery',
        status: 'complete',
        date: today,
        title: { en: 'Discovery & written scope', zh: '需求确认与书面范围' },
        detail: {
          en: 'Indicative range generated from the public calculator. Confirm goals, deadline, and references next.',
          zh: '公开计算器已生成参考区间。下一步确认目标、截止日期与参考资料。',
        },
      },
      {
        id: 'design',
        status: 'upcoming',
        date: isoDate(designAt),
        title: { en: 'Structure & visual direction', zh: '结构与视觉方向' },
        detail: {
          en: 'Information architecture and component direction after deposit / written acceptance.',
          zh: '书面确认或定金到账后确定信息架构与组件方向。',
        },
      },
      {
        id: 'build',
        status: 'upcoming',
        date: isoDate(buildAt),
        title: { en: 'Frontend implementation', zh: '前端开发' },
        detail: {
          en: `${type.labelEn} build with selected add-ons and ${sections} extra section(s).`,
          zh: `${type.labelZh} 开发，含所选附加项与 ${sections} 个额外区块。`,
        },
      },
      {
        id: 'review',
        status: 'upcoming',
        date: isoDate(reviewAt),
        title: { en: 'Client review & revisions', zh: '客户审核与修订' },
        detail: {
          en: 'One consolidated feedback round against the preview build.',
          zh: '针对预览版本进行一轮集中反馈。',
        },
      },
      {
        id: 'launch',
        status: 'upcoming',
        date: isoDate(target),
        title: { en: 'Launch & handoff', zh: '上线与交接' },
        detail: {
          en: 'Production deploy, repository handoff, and final payment.',
          zh: '生产部署、仓库交接与尾款。',
        },
      },
    ],
    deliverables: [
      {
        id: 'sow',
        href: buildProposalUrl({
          tab: 'sow',
          projectType: type.id,
          addOnIds: addons,
          extraSections: String(sections),
          quoteRef,
          clientName: clientLabel,
        }),
        label: { en: 'Open proposal (SOW)', zh: '打开提案（SOW）' },
        detail: {
          en: 'Shareable in-app statement of work',
          zh: '可分享的站内工作说明书',
        },
      },
      {
        id: 'invoice',
        href: buildProposalUrl({
          tab: 'invoice',
          projectType: type.id,
          addOnIds: addons,
          extraSections: String(sections),
          quoteRef,
          clientName: clientLabel,
        }),
        label: { en: 'Deposit invoice', zh: '定金发票' },
        detail: {
          en: `50% of suggested fee · $${deposit.toLocaleString()} USD`,
          zh: `建议固定价的 50% · $${deposit.toLocaleString()} USD`,
        },
      },
      {
        id: 'calc',
        href: (() => {
          const url = siteBase()
          url.searchParams.set('type', type.id)
          if (addons.length) url.searchParams.set('addons', addons.join(','))
          if (sections) url.searchParams.set('extra', String(sections))
          return url.toString()
        })(),
        label: {
          en: 'Open this quote in calculator',
          zh: '在计算器中打开此报价',
        },
        detail: {
          en: 'Same type, add-ons, and extras',
          zh: '同一类型、附加项与额外范围',
        },
      },
    ],
    updates: [
      {
        date: today,
        author: 'PixelLayer calculator',
        body: {
          en: `Quote ${projectIdFromRef(quoteRef)} created: ${type.labelEn}, $${min.toLocaleString()}–$${max.toLocaleString()} USD.`,
          zh: `已生成报价 ${projectIdFromRef(quoteRef)}：${type.labelZh}，$${min.toLocaleString()}–$${max.toLocaleString()} USD。`,
        },
      },
    ],
    nextAction: {
      owner: { en: 'Client', zh: '客户' },
      due: isoDate(addUtcDays(start, 3)),
      text: {
        en: `Review the SOW and accept this scope, then pay the $${deposit.toLocaleString()} USD deposit to kickoff.`,
        zh: `审阅 SOW 并接受此范围，随后支付 $${deposit.toLocaleString()} USD 定金即可开工。`,
      },
    },
  }

  return accepted ? withQuoteAcceptance(project, now) : project
}

export function withQuoteAcceptance(project, now = new Date()) {
  if (!project || project.source !== 'quote') return project
  const today = isoDate(now)
  const milestones = project.milestones.map((m) => {
    if (m.id === 'discovery' || m.id === 'design') {
      return { ...m, status: 'complete' }
    }
    if (m.id === 'build') return { ...m, status: 'current' }
    return { ...m, status: 'upcoming' }
  })
  const deposit = project.deposit
  return {
    ...project,
    accepted: true,
    status: 'in-progress',
    milestones,
    nextAction: {
      owner: { en: 'Client', zh: '客户' },
      due: isoDate(addUtcDays(now, 2)),
      text: {
        en: `Scope accepted. Send the $${Number(deposit).toLocaleString()} USD deposit so build can start.`,
        zh: `范围已接受。请支付 $${Number(deposit).toLocaleString()} USD 定金以便开始开发。`,
      },
    },
    updates: [
      {
        date: today,
        author: 'Client',
        body: {
          en: 'Accepted the indicative scope from the calculator. Awaiting deposit to start build.',
          zh: '已接受计算器生成的参考范围。等待定金到账后开始开发。',
        },
      },
      ...(project.updates || []),
    ],
  }
}
