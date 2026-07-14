/**
 * Deposit invoice draft from calculator quote state (print → PDF).
 * Midpoint of range used as suggested fee; 50% deposit.
 */

function suggestedFee(min, max) {
  const a = Number(min) || 0
  const b = Number(max) || 0
  return Math.round((a + b) / 2)
}

function invoiceNumber(quoteRef) {
  const raw = String(quoteRef || 'DRAFT')
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, 8)
    .toUpperCase()
  const d = new Date()
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
  return `INV-${ymd}-${raw || 'DRAFT'}`
}

const INVOICE_CSS = `
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
    max-width: 720px;
    margin: 1.5rem auto;
    padding: 2rem 2.25rem;
    background: #fff;
    border: 1px solid #e2e8f0;
  }
  .top { display: flex; justify-content: space-between; gap: 1rem; align-items: flex-start; }
  .brand { font-size: 1.35rem; font-weight: 700; }
  .inv-id { font-variant-numeric: tabular-nums; font-weight: 700; color: #0369a1; }
  .meta { color: #64748b; font-size: 0.9rem; margin: 0.25rem 0 0; }
  h1 { font-size: 1.4rem; margin: 1.5rem 0 0.5rem; }
  table { width: 100%; border-collapse: collapse; margin-top: 1rem; font-size: 0.95rem; }
  th, td { text-align: left; padding: 0.55rem 0.4rem; border-bottom: 1px solid #e2e8f0; }
  th { color: #475569; font-weight: 600; }
  .total { font-size: 1.15rem; font-weight: 700; }
  .due { margin-top: 1.25rem; padding: 0.85rem 1rem; background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; }
  .hint { font-size: 0.85rem; color: #64748b; margin-top: 1.25rem; }
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
 * @param {{ lang: string, projectTypeLabel: string, min: number, max: number, quoteRef?: string|null }} params
 */
export function buildDepositInvoiceHtml({
  lang,
  projectTypeLabel,
  min,
  max,
  quoteRef = null,
}) {
  const en = lang === 'en'
  const fee = suggestedFee(min, max)
  const deposit = Math.round(fee * 0.5)
  const inv = invoiceNumber(quoteRef)
  const range = `$${Number(min).toLocaleString()} – $${Number(max).toLocaleString()} USD`
  const title = en ? 'Deposit invoice (draft)' : '定金发票（草案）'
  const printLabel = en ? 'Print / Save as PDF' : '打印 / 另存为 PDF'
  const issued = new Date().toISOString().slice(0, 10)

  return `<!DOCTYPE html>
<html lang="${en ? 'en' : 'zh-CN'}">
<head>
<meta charset="utf-8" />
<title>${title} — ${inv}</title>
<style>${INVOICE_CSS}</style>
</head>
<body>
  <div class="actions"><button type="button" onclick="window.print()">${printLabel}</button></div>
  <article class="sheet">
    <div class="top">
      <div>
        <div class="brand">PixelLayer L.L.C</div>
        <p class="meta">pixellayer7@gmail.com</p>
      </div>
      <div class="inv-id">${inv}</div>
    </div>
    <h1>${title}</h1>
    <p class="meta">${en ? 'Issued' : '开具日期'}: ${issued}</p>

    <table>
      <tr><th>${en ? 'Bill to' : '收款对象'}</th><td><strong>CLIENT_LEGAL_NAME</strong><br/>CLIENT_CONTACT</td></tr>
      <tr><th>${en ? 'Project' : '项目'}</th><td>${projectTypeLabel}</td></tr>
      <tr><th>${en ? 'Quote range' : '报价区间'}</th><td>${range}</td></tr>
      <tr><th>${en ? 'Suggested fixed fee' : '建议固定价'}</th><td>$${fee.toLocaleString()} USD</td></tr>
      <tr><th>${en ? 'Payment terms' : '付款条款'}</th><td>${en ? '50% deposit to kickoff · 50% on delivery' : '开工 50% 定金 · 交付 50% 尾款'}</td></tr>
      <tr class="total"><th>${en ? 'Deposit due' : '应付定金'}</th><td>$${deposit.toLocaleString()} USD</td></tr>
      <tr><th>${en ? 'Due on' : '应付节点'}</th><td>${en ? 'Kickoff / written acceptance' : '启动 / 书面确认时'}</td></tr>
      <tr><th>${en ? 'Payment method' : '支付方式'}</th><td><strong>METHOD</strong></td></tr>
    </table>

    <div class="due">
      ${
        en
          ? 'This draft mirrors the standard PixelLayer engagement schedule. Replace placeholders and confirm the fixed fee before sending to a client.'
          : '本草案对应 PixelLayer 标准付款节奏。发送客户前请替换占位符并确认固定价格。'
      }
    </div>
    <p class="hint">${
      en
        ? 'Not a tax invoice / receipt. For OPT self-employment evidence: proposal + deposit invoice artifacts from the same quote state.'
        : '非正式税务发票。用于自雇工具链演示：同一报价状态可导出提案与定金发票。'
    }</p>
  </article>
</body>
</html>`
}

export function openDepositInvoiceWindow(params) {
  const html = buildDepositInvoiceHtml(params)
  const win = window.open('', '_blank', 'noopener,noreferrer')
  if (!win) return false
  win.document.open()
  win.document.write(html)
  win.document.close()
  return true
}

export { suggestedFee, invoiceNumber }
