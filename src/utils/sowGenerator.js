import { projectTypes, addOns } from '../data/pricing'
import { PAYMENT_METHOD } from '../config/site'
import { suggestedFee } from './invoiceGenerator'

/**
 * Build a draft Statement of Work (Markdown) from calculator state.
 * Client placeholders remain in ALL CAPS for manual completion.
 */
function clientDisplayName(clientName, en) {
  const name = String(clientName ?? '')
    .trim()
    .slice(0, 80)
  if (name) return name
  return en ? 'CLIENT_LEGAL_NAME' : 'CLIENT_LEGAL_NAME'
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function buildSowMarkdown({
  lang,
  projectTypeId,
  addOnIds,
  extraSections,
  min,
  max,
  quoteRef = null,
  clientName = '',
  dates = {},
}) {
  const en = lang === 'en'
  const fee = suggestedFee(min, max)
  const payment = PAYMENT_METHOD[en ? 'en' : 'zh']
  const kickoff = dates.kickoff || 'DATE'
  const preview = dates.preview || 'DATE'
  const revisions = dates.revisions || 'DATE'
  const delivery = dates.delivery || 'DATE'
  const type = projectTypes.find((p) => p.id === projectTypeId)
  const typeLabel = type ? (en ? type.labelEn : type.labelZh) : projectTypeId

  const addOnLabels = addOnIds
    .map((id) => addOns.find((a) => a.id === id))
    .filter(Boolean)
    .map((a) => (en ? a.labelEn : a.labelZh))

  const raw = parseInt(extraSections, 10)
  const sections = Number.isFinite(raw) ? Math.min(20, Math.max(0, raw)) : 0
  const range = `$${min.toLocaleString()} – $${max.toLocaleString()} USD`
  const refLine = quoteRef
    ? en
      ? `Reference quote ID: ${quoteRef}`
      : `参考报价编号：${quoteRef}`
    : en
      ? 'Reference quote ID: **QUOTE_REF**'
      : '参考报价编号：**QUOTE_REF**'

  if (en) {
    return `# Statement of Work (Draft)

## 1. Parties

- **Provider:** PixelLayer L.L.C (He Zhang) — pixellayer7@gmail.com
- **Client:** **${clientDisplayName(clientName, true)}** — **CLIENT_CONTACT**

## 2. Project summary

**${typeLabel}** — Responsive React frontend scoped per indicative estimate below.

${refLine}

## 3. Deliverables

| Item | Description |
| ---- | ----------- |
| Core UI | ${typeLabel} — React components, responsive layout, EN/中文-ready structure |
| Add-ons | ${addOnLabels.length ? addOnLabels.join('; ') : 'None selected'} |
| Extra scope | ${sections} additional section(s)/page(s) beyond base tier |
| Deployment | GitHub Pages or agreed host + handoff README |
| Out of scope | CMS, custom backend, copywriting unless added via change order |

## 4. Timeline

| Milestone | Target date |
| --------- | ----------- |
| Kickoff + deposit | **${kickoff}** |
| First preview | **${preview}** |
| Revision round(s) | **${revisions}** |
| Final delivery | **${delivery}** |

## 5. Investment

- **Indicative range (calculator):** ${range}
- **Suggested fixed fee:** $${fee.toLocaleString()} USD
- **Payment schedule:** 50% deposit, 50% on final delivery
- **Payment method:** ${payment}

Estimates from the public calculator are **indicative only** until this SOW is signed.

## 6. Revisions & change orders

- **Included revision rounds:** **2**
- Changes outside Section 3 require a written change order.

## 7. Client responsibilities

- Timely feedback (within **5** business days)
- Brand assets, copy, DNS/hosting access as applicable
- Single point of contact: **CLIENT_CONTACT**

## 8. Acceptance

Work is accepted when delivered to the agreed preview URL and Client confirms in email, or **7** days pass without material defect report.

## 9. Signatures

**Provider:** Name / signature · Date

**Client:** Name / signature · Date

---

_This draft is generated from the PixelLayer quote calculator. Not legal advice — adapt for your jurisdiction._
`
  }

  return `# 工作说明书（草案）

## 1. 双方

- **服务方：** PixelLayer L.L.C（He Zhang）— pixellayer7@gmail.com
- **客户：** **${clientDisplayName(clientName, false)}** — **CLIENT_CONTACT**

## 2. 项目概述

**${typeLabel}** — 根据下方参考估算范围的 React 前端交付。

${refLine}

## 3. 交付物

| 项目 | 说明 |
| ---- | ---- |
| 核心界面 | ${typeLabel} — React 组件、响应式布局、可扩展中英结构 |
| 附加项 | ${addOnLabels.length ? addOnLabels.join('；') : '无'} |
| 额外范围 | 基础档位外 **${sections}** 个区块/页面 |
| 部署 | GitHub Pages 或约定主机 + 交接文档 |
| 不含 | CMS、定制后端、文案撰写（除非变更单追加） |

## 4. 里程碑

| 节点 | 目标日期 |
| ---- | -------- |
| 启动 + 定金 | **${kickoff}** |
| 首次预览 | **${preview}** |
| 修订轮次 | **${revisions}** |
| 最终交付 | **${delivery}** |

## 5. 费用

- **参考区间（计算器）：** ${range}
- **建议固定价：** $${fee.toLocaleString()} USD
- **付款方式：** 50% 定金，50% 验收后
- **支付渠道：** ${payment}

公开计算器结果**仅供参考**，以双方签署本 SOW 为准。

## 6. 修订与变更

- **含修订轮次：** **2**
- 超出第 3 节范围需书面变更单。

## 7. 客户配合

- **5** 个工作日内反馈
- 品牌素材、文案、域名/托管权限
- 单一对接人：**CLIENT_CONTACT**

## 8. 验收

交付至约定预览地址且客户邮件确认，或 **7** 日内无重大缺陷反馈即视为验收。

## 9. 签章

**服务方：** 姓名 / 签章 · 日期

**客户：** 姓名 / 签章 · 日期

---

_本草案由 PixelLayer 报价计算器生成，不构成法律意见，请按当地法规调整。_
`
}

export function downloadSowMarkdown(
  content,
  filename = 'pixelayer-sow-draft.md'
) {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function resolveSowLabels({
  lang,
  projectTypeId,
  addOnIds,
  extraSections,
  min,
  max,
  quoteRef = null,
  clientName = '',
  dates = {},
}) {
  const en = lang === 'en'
  const type = projectTypes.find((p) => p.id === projectTypeId)
  const typeLabel = type ? (en ? type.labelEn : type.labelZh) : projectTypeId
  const addOnLabels = addOnIds
    .map((id) => addOns.find((a) => a.id === id))
    .filter(Boolean)
    .map((a) => (en ? a.labelEn : a.labelZh))
  const raw = parseInt(extraSections, 10)
  const sections = Number.isFinite(raw) ? Math.min(20, Math.max(0, raw)) : 0
  const range = `$${min.toLocaleString()} – $${max.toLocaleString()} USD`
  const ref =
    quoteRef ||
    (en ? 'QUOTE_REF (fill before send)' : 'QUOTE_REF（发送前填写）')
  const client = clientDisplayName(clientName, en)
  const fee = suggestedFee(min, max)
  const payment = PAYMENT_METHOD[en ? 'en' : 'zh']
  return {
    en,
    typeLabel,
    addOnLabels,
    sections,
    range,
    ref,
    client,
    fee,
    payment,
    kickoff: dates.kickoff || 'DATE',
    preview: dates.preview || 'DATE',
    revisions: dates.revisions || 'DATE',
    delivery: dates.delivery || 'DATE',
  }
}

const PRINT_DOC_CSS = `
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: "Segoe UI", "PingFang SC", "Hiragino Sans GB", sans-serif;
    color: #0f172a;
    background: #f8fafc;
    line-height: 1.5;
  }
  .sheet {
    max-width: 800px;
    margin: 1.5rem auto;
    padding: 2rem 2.25rem;
    background: #fff;
    border: 1px solid #e2e8f0;
  }
  .brand { font-size: 1.35rem; font-weight: 700; letter-spacing: -0.02em; }
  .meta { color: #64748b; font-size: 0.9rem; margin: 0.25rem 0 1.5rem; }
  h1 { font-size: 1.5rem; margin: 0 0 0.35rem; }
  h2 {
    font-size: 0.95rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: #0369a1;
    border-bottom: 1px solid #e2e8f0;
    padding-bottom: 0.35rem;
    margin: 1.5rem 0 0.75rem;
  }
  table { width: 100%; border-collapse: collapse; font-size: 0.95rem; }
  th, td { text-align: left; padding: 0.45rem 0.5rem; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
  th { width: 32%; color: #475569; font-weight: 600; }
  ul { margin: 0.35rem 0 0; padding-left: 1.2rem; }
  .hint { font-size: 0.85rem; color: #64748b; margin-top: 1.25rem; }
  .sign { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-top: 2rem; }
  .sign-box { border-top: 1px solid #94a3b8; padding-top: 0.5rem; min-height: 4rem; font-size: 0.9rem; }
  .actions { text-align: center; margin: 1rem 0 2rem; }
  .actions button {
    font: inherit; padding: 0.55rem 1.1rem; border-radius: 6px;
    border: 1px solid #0369a1; background: #0369a1; color: #fff; cursor: pointer;
  }
  @media print {
    body { background: #fff; }
    .sheet { border: none; margin: 0; max-width: none; padding: 0; }
    .actions { display: none !important; }
  }
`

/**
 * Client-facing HTML proposal (print → Save as PDF).
 */
export function buildSowHtml(params) {
  const {
    en,
    typeLabel,
    addOnLabels,
    sections,
    range,
    ref,
    client,
    fee,
    payment,
    kickoff,
    preview,
    revisions,
    delivery,
  } = resolveSowLabels(params)
  const addOnsText = addOnLabels.length
    ? addOnLabels.join(en ? '; ' : '；')
    : en
      ? 'None selected'
      : '无'
  const title = en ? 'Statement of Work (Draft)' : '工作说明书（草案）'
  const printLabel = en ? 'Print / Save as PDF' : '打印 / 另存为 PDF'

  return `<!DOCTYPE html>
<html lang="${en ? 'en' : 'zh-CN'}">
<head>
<meta charset="utf-8" />
<title>${title} — PixelLayer L.L.C</title>
<style>${PRINT_DOC_CSS}</style>
</head>
<body>
  <div class="actions"><button type="button" onclick="window.print()">${printLabel}</button></div>
  <article class="sheet">
    <div class="brand">PixelLayer L.L.C</div>
    <p class="meta">pixellayer7@gmail.com · Frontend &amp; Web Development</p>
    <h1>${title}</h1>
    <p class="meta">${en ? 'Generated from quote calculator' : '由报价计算器生成'} · ${ref}</p>

    <h2>${en ? '1. Parties' : '1. 双方'}</h2>
    <table>
      <tr><th>${en ? 'Provider' : '服务方'}</th><td>PixelLayer L.L.C (He Zhang) — pixellayer7@gmail.com</td></tr>
      <tr><th>${en ? 'Client' : '客户'}</th><td><strong>${escapeHtml(client)}</strong> — <strong>CLIENT_CONTACT</strong></td></tr>
    </table>

    <h2>${en ? '2. Project summary' : '2. 项目概述'}</h2>
    <p><strong>${typeLabel}</strong> — ${
      en
        ? 'Responsive React frontend scoped per indicative estimate below.'
        : '根据下方参考估算范围的 React 前端交付。'
    }</p>

    <h2>${en ? '3. Deliverables' : '3. 交付物'}</h2>
    <table>
      <tr><th>${en ? 'Core UI' : '核心界面'}</th><td>${typeLabel}</td></tr>
      <tr><th>${en ? 'Add-ons' : '附加项'}</th><td>${addOnsText}</td></tr>
      <tr><th>${en ? 'Extra scope' : '额外范围'}</th><td>${sections} ${en ? 'section(s)/page(s)' : '个区块/页面'}</td></tr>
      <tr><th>${en ? 'Deployment' : '部署'}</th><td>${en ? 'GitHub Pages or agreed host + handoff README' : 'GitHub Pages 或约定主机 + 交接文档'}</td></tr>
      <tr><th>${en ? 'Out of scope' : '不含'}</th><td>${en ? 'CMS, custom backend, copywriting unless change-ordered' : 'CMS、定制后端、文案撰写（除非变更单追加）'}</td></tr>
    </table>

    <h2>${en ? '4. Timeline' : '4. 里程碑'}</h2>
    <table>
      <tr><th>${en ? 'Kickoff + deposit' : '启动 + 定金'}</th><td><strong>${kickoff}</strong></td></tr>
      <tr><th>${en ? 'First preview' : '首次预览'}</th><td><strong>${preview}</strong></td></tr>
      <tr><th>${en ? 'Revisions' : '修订轮次'}</th><td><strong>${revisions}</strong></td></tr>
      <tr><th>${en ? 'Final delivery' : '最终交付'}</th><td><strong>${delivery}</strong></td></tr>
    </table>

    <h2>${en ? '5. Investment' : '5. 费用'}</h2>
    <table>
      <tr><th>${en ? 'Indicative range' : '参考区间'}</th><td>${range}</td></tr>
      <tr><th>${en ? 'Suggested fixed fee' : '建议固定价'}</th><td>$${fee.toLocaleString()} USD</td></tr>
      <tr><th>${en ? 'Schedule' : '付款节奏'}</th><td>${en ? '50% deposit, 50% on final delivery' : '50% 定金，50% 验收后'}</td></tr>
      <tr><th>${en ? 'Method' : '支付渠道'}</th><td>${payment}</td></tr>
    </table>

    <h2>${en ? '6. Revisions' : '6. 修订'}</h2>
    <ul>
      <li>${en ? 'Included revision rounds: 2' : '含修订轮次：2'}</li>
      <li>${en ? 'Out-of-scope changes require a written change order.' : '超出范围变更需书面变更单。'}</li>
    </ul>

    <h2>${en ? '7. Acceptance' : '7. 验收'}</h2>
    <p>${
      en
        ? 'Accepted at agreed preview URL on email confirmation, or 7 days without material defect report.'
        : '交付至约定预览地址且邮件确认，或 7 日内无重大缺陷反馈即视为验收。'
    }</p>

    <div class="sign">
      <div class="sign-box">${en ? 'Provider — name / signature / date' : '服务方 — 姓名 / 签章 / 日期'}</div>
      <div class="sign-box">${en ? 'Client — name / signature / date' : '客户 — 姓名 / 签章 / 日期'}</div>
    </div>
    <p class="hint">${
      en
        ? 'Draft only — not legal advice. Replace ALL-CAPS placeholders before sending.'
        : '草案仅供协商，不构成法律意见。发送前请替换大写占位符。'
    }</p>
  </article>
</body>
</html>`
}

/** Open a print-ready SOW in a new window (user Print → Save as PDF). */
export function openSowPrintWindow(params) {
  const html = buildSowHtml(params)
  const win = window.open('', '_blank', 'noopener,noreferrer')
  if (!win) return false
  win.document.open()
  win.document.write(html)
  win.document.close()
  return true
}
