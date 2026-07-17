import { ESTIMATOR_URL, GITHUB_PROFILE, LANDING_URL } from '../config/site'

export const portalDemo = {
  projectId: 'PL-2026-071',
  projectName: {
    en: 'Bilingual product launch site',
    zh: '双语产品发布网站',
  },
  client: {
    en: 'Representative SaaS client (demo)',
    zh: '典型 SaaS 客户（演示）',
  },
  status: 'in-progress',
  dateRange: {
    start: '2026-07-06',
    target: '2026-07-24',
  },
  budget: '$1,150 USD',
  scope: {
    en: 'Responsive landing page, EN/中文 content structure, pricing handoff, analytics-ready delivery.',
    zh: '响应式落地页、中英双语内容结构、报价交接与分析工具就绪交付。',
  },
  milestones: [
    {
      id: 'discovery',
      status: 'complete',
      date: '2026-07-06',
      title: { en: 'Discovery & written scope', zh: '需求确认与书面范围' },
      detail: {
        en: 'Goals, audience, reference sites, fixed scope, and 50/50 payment schedule confirmed.',
        zh: '确认目标、受众、参考网站、固定范围与 50/50 付款节奏。',
      },
    },
    {
      id: 'design',
      status: 'complete',
      date: '2026-07-10',
      title: { en: 'Structure & visual direction', zh: '结构与视觉方向' },
      detail: {
        en: 'Bilingual information architecture and responsive component direction approved.',
        zh: '双语信息架构与响应式组件方向已确认。',
      },
    },
    {
      id: 'build',
      status: 'current',
      date: '2026-07-17',
      title: { en: 'Frontend implementation', zh: '前端开发' },
      detail: {
        en: 'Core sections, language switch, quote handoff, accessibility, and tests in progress.',
        zh: '核心区块、语言切换、报价交接、无障碍与测试正在开发。',
      },
    },
    {
      id: 'review',
      status: 'upcoming',
      date: '2026-07-21',
      title: { en: 'Client review & revisions', zh: '客户审核与修订' },
      detail: {
        en: 'One consolidated feedback round against the preview build.',
        zh: '针对预览版本进行一轮集中反馈。',
      },
    },
    {
      id: 'launch',
      status: 'upcoming',
      date: '2026-07-24',
      title: { en: 'Launch & handoff', zh: '上线与交接' },
      detail: {
        en: 'Production deploy, repository handoff, README, and final payment confirmation.',
        zh: '生产部署、仓库交接、README 与尾款确认。',
      },
    },
  ],
  deliverables: [
    {
      id: 'preview',
      type: 'preview',
      status: 'ready',
      label: { en: 'Current preview', zh: '当前预览' },
      detail: {
        en: 'Responsive bilingual marketing experience',
        zh: '响应式双语营销体验',
      },
      href: LANDING_URL,
    },
    {
      id: 'quote',
      type: 'artifact',
      status: 'ready',
      label: { en: 'Quote calculator', zh: '报价计算器' },
      detail: {
        en: 'Scope and pricing handoff demonstration',
        zh: '范围与价格交接演示',
      },
      href: ESTIMATOR_URL,
    },
    {
      id: 'source',
      type: 'source',
      status: 'ready',
      label: { en: 'Source & CI evidence', zh: '源码与 CI 证据' },
      detail: {
        en: 'Version history, tests, and deploy workflow',
        zh: '版本历史、测试与部署流程',
      },
      href: `${GITHUB_PROFILE}/1`,
    },
  ],
  updates: [
    {
      date: '2026-07-16',
      author: 'He · PixelLayer',
      body: {
        en: 'Completed responsive implementation and bilingual content structure. Accessibility and cross-device QA are next.',
        zh: '已完成响应式实现与双语内容结构。下一步进行无障碍与跨设备 QA。',
      },
    },
    {
      date: '2026-07-13',
      author: 'He · PixelLayer',
      body: {
        en: 'Shared first preview and confirmed the quote-to-contact user flow.',
        zh: '已分享首版预览，并确认报价到联系的用户流程。',
      },
    },
    {
      date: '2026-07-10',
      author: 'Client (demo)',
      body: {
        en: 'Approved information architecture and requested English/Chinese parity.',
        zh: '确认信息架构，并要求中英文内容保持一致。',
      },
    },
  ],
  nextAction: {
    owner: { en: 'PixelLayer', zh: 'PixelLayer' },
    due: '2026-07-18',
    text: {
      en: 'Finish accessibility checks and publish the revision-ready preview.',
      zh: '完成无障碍检查并发布可供修订的预览版本。',
    },
  },
}

export function calculatePortalProgress(milestones) {
  if (!Array.isArray(milestones) || milestones.length === 0) return 0
  const weights = { complete: 1, current: 0.5, upcoming: 0 }
  const earned = milestones.reduce(
    (total, milestone) => total + (weights[milestone.status] ?? 0),
    0
  )
  return Math.round((earned / milestones.length) * 100)
}
