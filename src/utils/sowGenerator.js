import { projectTypes, addOns } from '../data/pricing'

/**
 * Build a draft Statement of Work (Markdown) from calculator state.
 * Client placeholders remain in ALL CAPS for manual completion.
 */
export function buildSowMarkdown({
  lang,
  projectTypeId,
  addOnIds,
  extraSections,
  min,
  max,
  quoteRef = null,
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
- **Client:** **CLIENT_LEGAL_NAME** — **CLIENT_CONTACT**

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
| Kickoff + deposit | **DATE** |
| First preview | **DATE** |
| Revision round(s) | **DATE** |
| Final delivery | **DATE** |

## 5. Investment

- **Indicative range (calculator):** ${range}
- **Fixed fee (to confirm):** **USD_AMOUNT**
- **Payment schedule:** 50% deposit, 50% on final delivery
- **Payment method:** **METHOD**

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
- **客户：** **CLIENT_LEGAL_NAME** — **CLIENT_CONTACT**

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
| 启动 + 定金 | **DATE** |
| 首次预览 | **DATE** |
| 修订轮次 | **DATE** |
| 最终交付 | **DATE** |

## 5. 费用

- **参考区间（计算器）：** ${range}
- **固定费用（待确认）：** **USD_AMOUNT**
- **付款方式：** 50% 定金，50% 验收后
- **支付渠道：** **METHOD**

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
