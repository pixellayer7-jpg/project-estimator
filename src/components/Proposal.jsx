import { useEffect, useMemo, useState } from 'react'
import { addOns, calculateQuote, projectTypes } from '../data/pricing'
import {
  EMAIL,
  ESTIMATOR_URL,
  PAYMENT_METHOD,
  PROVIDER_SIGN,
} from '../config/site'
import { invoiceNumber, suggestedFee } from '../utils/invoiceGenerator'
import {
  acceptQuote,
  getQuoteAcceptance,
  isQuoteAccepted,
  sanitizeSignerName,
} from '../utils/portalAcceptStore'
import {
  buildPortalQuoteUrl,
  buildProposalUrl,
  buildQuoteSchedule,
} from '../utils/portalFromQuote'

function clientLabel(clientName, en) {
  const name = String(clientName ?? '')
    .trim()
    .slice(0, 80)
  return name || (en ? 'CLIENT_LEGAL_NAME' : '客户法定名称')
}

function formatDate(value, lang) {
  if (!value || value === 'DATE') return value
  return new Intl.DateTimeFormat(lang === 'zh' ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${value}T00:00:00Z`))
}

export default function Proposal({
  lang = 'en',
  quoteInput,
  initialTab = 'sow',
}) {
  const en = lang === 'en'
  const [tab, setTab] = useState(initialTab === 'invoice' ? 'invoice' : 'sow')
  const [copyState, setCopyState] = useState('idle')
  const storedAccept = quoteInput?.quoteRef
    ? getQuoteAcceptance(quoteInput.quoteRef)
    : null
  const [accepted, setAccepted] = useState(() =>
    Boolean(quoteInput?.quoteRef && isQuoteAccepted(quoteInput.quoteRef))
  )
  const [signerName, setSignerName] = useState(
    () => storedAccept?.signerName || quoteInput?.clientName || ''
  )

  const model = useMemo(() => {
    const projectType = quoteInput?.projectType || 'landing'
    const addOnIds = quoteInput?.addOnIds || []
    const extraSections = quoteInput?.extraSections || '0'
    const quoteRef = quoteInput?.quoteRef || null
    const clientName = quoteInput?.clientName || ''
    const type =
      projectTypes.find((t) => t.id === projectType) || projectTypes[0]
    const { min, max } = calculateQuote(type.id, addOnIds, extraSections)
    const fee = suggestedFee(min, max)
    const deposit = Math.round(fee * 0.5)
    const addOnLabels = addOnIds
      .map((id) => addOns.find((a) => a.id === id))
      .filter(Boolean)
      .map((a) => (en ? a.labelEn : a.labelZh))
    const sections = Number.parseInt(String(extraSections), 10) || 0
    return {
      projectType: type.id,
      addOnIds,
      extraSections: String(sections),
      quoteRef,
      clientName,
      typeLabel: en ? type.labelEn : type.labelZh,
      addOnLabels,
      sections,
      min,
      max,
      range: `$${min.toLocaleString()} – $${max.toLocaleString()} USD`,
      fee,
      deposit,
      invoiceId: invoiceNumber(quoteRef),
      client: clientLabel(clientName, en),
      schedule: buildQuoteSchedule({
        projectType: type.id,
        addOnIds,
      }),
      payment: PAYMENT_METHOD[en ? 'en' : 'zh'],
    }
  }, [quoteInput, en])

  const shareUrl = buildProposalUrl({
    base: ESTIMATOR_URL,
    tab,
    projectType: model.projectType,
    addOnIds: model.addOnIds,
    extraSections: model.extraSections,
    quoteRef: model.quoteRef,
    lang,
    clientName: model.clientName,
  })
  const portalUrl = buildPortalQuoteUrl({
    base: ESTIMATOR_URL,
    projectType: model.projectType,
    addOnIds: model.addOnIds,
    extraSections: model.extraSections,
    quoteRef: model.quoteRef,
    lang,
    clientName: model.clientName,
  })

  useEffect(() => {
    try {
      const url = new URL(window.location.href)
      url.searchParams.set('proposal', tab)
      window.history.replaceState(
        {},
        '',
        `${url.pathname}${url.search}${url.hash}`
      )
    } catch {
      /* ignore */
    }
  }, [tab])

  const t = en
    ? {
        badge: 'Shareable proposal',
        eyebrow: 'PixelLayer L.L.C',
        sow: 'Statement of Work',
        invoice: 'Deposit invoice',
        notice:
          'Generated from the public calculator — indicative until signed. Same URL works without API secrets.',
        accept: 'Accept this scope',
        accepted: 'Scope accepted',
        print: 'Print / Save as PDF',
        copy: 'Copy share link',
        copied: 'Link copied',
        copyFail: 'Copy failed',
        portal: 'Open client portal',
        back: 'Back to calculator',
        contact: 'Ask a question',
        parties: 'Parties',
        provider: 'Provider',
        client: 'Client',
        summary: 'Project summary',
        deliverables: 'Deliverables',
        timeline: 'Timeline',
        investment: 'Investment',
        revisions: 'Revisions',
        acceptance: 'Acceptance',
        core: 'Core UI',
        addons: 'Add-ons',
        extra: 'Extra scope',
        deploy: 'Deployment',
        out: 'Out of scope',
        kickoff: 'Kickoff + deposit',
        preview: 'First preview',
        revise: 'Revisions',
        final: 'Final delivery',
        range: 'Indicative range',
        fee: 'Suggested fixed fee',
        schedule: 'Payment schedule',
        method: 'Payment method',
        billTo: 'Bill to',
        project: 'Project',
        due: 'Deposit due',
        dueOn: 'Due on',
        issued: 'Issued',
        hint: 'Draft only — not legal advice. Confirm the fixed fee before sending.',
        acceptHint:
          'Type your name to record acceptance in this browser, then open the matching client portal.',
        signTitle: 'Typed acceptance',
        signLabel: 'Type your name',
        signHelp:
          'Records indicative-scope acceptance on this device only — not a third-party e-sign product or a court-ready wet signature.',
        signedBy: 'Signed by',
        providerSign: 'Provider',
        clientSign: 'Client',
      }
    : {
        badge: '可分享提案',
        eyebrow: 'PixelLayer L.L.C',
        sow: '工作说明书',
        invoice: '定金发票',
        notice:
          '由公开计算器生成 — 签署前仅供参考。同一链接无需 API 密钥即可打开。',
        accept: '接受此范围',
        accepted: '范围已接受',
        print: '打印 / 另存为 PDF',
        copy: '复制分享链接',
        copied: '链接已复制',
        copyFail: '复制失败',
        portal: '打开客户状态页',
        back: '返回计算器',
        contact: '提出问题',
        parties: '双方',
        provider: '服务方',
        client: '客户',
        summary: '项目概述',
        deliverables: '交付物',
        timeline: '里程碑',
        investment: '费用',
        revisions: '修订',
        acceptance: '验收',
        core: '核心界面',
        addons: '附加项',
        extra: '额外范围',
        deploy: '部署',
        out: '不含',
        kickoff: '启动 + 定金',
        preview: '首次预览',
        revise: '修订轮次',
        final: '最终交付',
        range: '参考区间',
        fee: '建议固定价',
        schedule: '付款节奏',
        method: '支付渠道',
        billTo: '收款对象',
        project: '项目',
        due: '应付定金',
        dueOn: '应付节点',
        issued: '开具日期',
        hint: '草案仅供协商，不构成法律意见。发送前请确认固定价格。',
        acceptHint: '请键入姓名以在本浏览器记录接受，随后打开对应客户状态页。',
        signTitle: '键入接受',
        signLabel: '键入你的姓名',
        signHelp:
          '仅在本设备记录参考范围的接受 — 不是第三方电子签章产品，也不构成正式湿签。',
        signedBy: '签署人',
        providerSign: '服务方',
        clientSign: '客户',
      }

  const canAccept = sanitizeSignerName(signerName).length >= 2

  function handleAccept() {
    const name = sanitizeSignerName(signerName)
    if (!name) return
    if (model.quoteRef) {
      acceptQuote(model.quoteRef, {
        signerName: name,
        clientName: model.clientName,
        fee: model.fee,
        deposit: model.deposit,
      })
    }
    setAccepted(true)
    try {
      window.location.assign(portalUrl)
    } catch {
      /* jsdom / file protocol */
    }
  }

  async function handleCopyShare() {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopyState('ok')
    } catch {
      setCopyState('fail')
    }
    window.setTimeout(() => setCopyState('idle'), 2000)
  }

  const addOnsText = model.addOnLabels.length
    ? model.addOnLabels.join(en ? '; ' : '；')
    : en
      ? 'None selected'
      : '无'
  const issued = new Date().toISOString().slice(0, 10)

  return (
    <section className="proposal" aria-labelledby="proposal-title">
      <div className="proposal-container">
        <div className="portal-demo-notice" role="note">
          <span className="portal-demo-badge">{t.badge}</span>
          <span>{t.notice}</span>
        </div>

        <header className="proposal-hero">
          <div>
            <p className="portal-eyebrow">{t.eyebrow}</p>
            <h1 id="proposal-title">{tab === 'invoice' ? t.invoice : t.sow}</h1>
            <p className="portal-client">{model.client}</p>
          </div>
          <div className="portal-project-id">
            <span>{tab === 'invoice' ? 'Invoice' : 'Quote'}</span>
            <code>
              {tab === 'invoice'
                ? model.invoiceId
                : model.quoteRef || 'QUOTE_REF'}
            </code>
          </div>
        </header>

        <div className="proposal-tabs no-print" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'sow'}
            className={`proposal-tab ${tab === 'sow' ? 'is-active' : ''}`}
            onClick={() => setTab('sow')}
          >
            {t.sow}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'invoice'}
            className={`proposal-tab ${tab === 'invoice' ? 'is-active' : ''}`}
            onClick={() => setTab('invoice')}
          >
            {t.invoice}
          </button>
        </div>

        <article className="proposal-sheet">
          {tab === 'sow' ? (
            <>
              <h2>{t.parties}</h2>
              <table>
                <tbody>
                  <tr>
                    <th>{t.provider}</th>
                    <td>PixelLayer L.L.C (He Zhang) — {EMAIL}</td>
                  </tr>
                  <tr>
                    <th>{t.client}</th>
                    <td>
                      <strong>{model.client}</strong>
                    </td>
                  </tr>
                </tbody>
              </table>

              <h2>{t.summary}</h2>
              <p>
                <strong>{model.typeLabel}</strong>
                {en
                  ? ' — Responsive React frontend scoped per the indicative estimate below.'
                  : ' — 根据下方参考估算范围的 React 前端交付。'}
              </p>

              <h2>{t.deliverables}</h2>
              <table>
                <tbody>
                  <tr>
                    <th>{t.core}</th>
                    <td>{model.typeLabel}</td>
                  </tr>
                  <tr>
                    <th>{t.addons}</th>
                    <td>{addOnsText}</td>
                  </tr>
                  <tr>
                    <th>{t.extra}</th>
                    <td>
                      {model.sections}{' '}
                      {en ? 'section(s)/page(s)' : '个区块/页面'}
                    </td>
                  </tr>
                  <tr>
                    <th>{t.deploy}</th>
                    <td>
                      {en
                        ? 'GitHub Pages or agreed host + handoff README'
                        : 'GitHub Pages 或约定主机 + 交接文档'}
                    </td>
                  </tr>
                  <tr>
                    <th>{t.out}</th>
                    <td>
                      {en
                        ? 'CMS, custom backend, copywriting unless change-ordered'
                        : 'CMS、定制后端、文案撰写（除非变更单追加）'}
                    </td>
                  </tr>
                </tbody>
              </table>

              <h2>{t.timeline}</h2>
              <table>
                <tbody>
                  <tr>
                    <th>{t.kickoff}</th>
                    <td>
                      <strong>
                        {formatDate(model.schedule.kickoff, lang)}
                      </strong>
                    </td>
                  </tr>
                  <tr>
                    <th>{t.preview}</th>
                    <td>
                      <strong>
                        {formatDate(model.schedule.preview, lang)}
                      </strong>
                    </td>
                  </tr>
                  <tr>
                    <th>{t.revise}</th>
                    <td>
                      <strong>
                        {formatDate(model.schedule.revisions, lang)}
                      </strong>
                    </td>
                  </tr>
                  <tr>
                    <th>{t.final}</th>
                    <td>
                      <strong>
                        {formatDate(model.schedule.delivery, lang)}
                      </strong>
                    </td>
                  </tr>
                </tbody>
              </table>

              <h2>{t.investment}</h2>
              <table>
                <tbody>
                  <tr>
                    <th>{t.range}</th>
                    <td>{model.range}</td>
                  </tr>
                  <tr>
                    <th>{t.fee}</th>
                    <td>${model.fee.toLocaleString()} USD</td>
                  </tr>
                  <tr>
                    <th>{t.schedule}</th>
                    <td>
                      {en
                        ? '50% deposit, 50% on final delivery'
                        : '50% 定金，50% 验收后'}
                    </td>
                  </tr>
                  <tr>
                    <th>{t.method}</th>
                    <td>{model.payment}</td>
                  </tr>
                </tbody>
              </table>

              <h2>{t.revisions}</h2>
              <ul>
                <li>{en ? 'Included revision rounds: 2' : '含修订轮次：2'}</li>
                <li>
                  {en
                    ? 'Out-of-scope changes require a written change order.'
                    : '超出范围变更需书面变更单。'}
                </li>
              </ul>

              <h2>{t.acceptance}</h2>
              <p>
                {en
                  ? 'Accepted at the agreed preview URL on email confirmation, or 7 days without a material defect report.'
                  : '交付至约定预览地址且邮件确认，或 7 日内无重大缺陷反馈即视为验收。'}
              </p>

              <div className="proposal-sign">
                <div>
                  <strong>{t.providerSign}</strong>
                  <span>{PROVIDER_SIGN}</span>
                  <span>{formatDate(model.schedule.kickoff, lang)}</span>
                </div>
                <div>
                  <strong>{t.clientSign}</strong>
                  <span>
                    {accepted
                      ? sanitizeSignerName(signerName) || model.client
                      : en
                        ? 'Type name below to accept'
                        : '在下方键入姓名以接受'}
                  </span>
                  <span>
                    {accepted ? formatDate(model.schedule.kickoff, lang) : '—'}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <>
              <p className="proposal-issued">
                {t.issued}: {issued}
              </p>
              <table>
                <tbody>
                  <tr>
                    <th>{t.billTo}</th>
                    <td>
                      <strong>{model.client}</strong>
                    </td>
                  </tr>
                  <tr>
                    <th>{t.project}</th>
                    <td>{model.typeLabel}</td>
                  </tr>
                  <tr>
                    <th>{t.range}</th>
                    <td>{model.range}</td>
                  </tr>
                  <tr>
                    <th>{t.fee}</th>
                    <td>${model.fee.toLocaleString()} USD</td>
                  </tr>
                  <tr>
                    <th>{t.schedule}</th>
                    <td>
                      {en
                        ? '50% deposit to kickoff · 50% on delivery'
                        : '开工 50% 定金 · 交付 50% 尾款'}
                    </td>
                  </tr>
                  <tr className="proposal-total">
                    <th>{t.due}</th>
                    <td>${model.deposit.toLocaleString()} USD</td>
                  </tr>
                  <tr>
                    <th>{t.dueOn}</th>
                    <td>
                      {en
                        ? 'Kickoff / written acceptance'
                        : '启动 / 书面确认时'}
                    </td>
                  </tr>
                  <tr>
                    <th>{t.method}</th>
                    <td>{model.payment}</td>
                  </tr>
                </tbody>
              </table>
              <p className="proposal-due-note">
                {en
                  ? `Deposit of $${model.deposit.toLocaleString()} USD unlocks kickoff after this scope is accepted.`
                  : `接受此范围后，支付 $${model.deposit.toLocaleString()} USD 定金即可开工。`}
              </p>
            </>
          )}
          <p className="proposal-hint">{t.hint}</p>
        </article>

        <section
          className="proposal-esign no-print"
          aria-labelledby="proposal-esign-title"
        >
          <h2 id="proposal-esign-title">{t.signTitle}</h2>
          <label className="proposal-esign-label" htmlFor="proposal-signer">
            {t.signLabel}
          </label>
          <input
            id="proposal-signer"
            className="calc-input"
            type="text"
            maxLength={80}
            autoComplete="name"
            value={signerName}
            disabled={accepted}
            onChange={(e) => setSignerName(e.target.value)}
          />
          <p className="proposal-accept-hint">{t.signHelp}</p>
          {accepted ? (
            <p className="proposal-signed">
              {t.signedBy} <strong>{sanitizeSignerName(signerName)}</strong>
            </p>
          ) : null}
        </section>

        <p className="proposal-accept-hint no-print">{t.acceptHint}</p>
        <div className="portal-actions no-print">
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleAccept}
            disabled={accepted || !canAccept}
          >
            {accepted ? t.accepted : t.accept}
          </button>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => window.print()}
          >
            {t.print}
          </button>
          <button
            type="button"
            className="btn btn-outline"
            onClick={handleCopyShare}
          >
            {copyState === 'ok'
              ? t.copied
              : copyState === 'fail'
                ? t.copyFail
                : t.copy}
          </button>
          <a className="btn btn-outline" href={portalUrl}>
            {t.portal}
          </a>
          <a
            className="btn btn-outline"
            href={`mailto:${EMAIL}?subject=${encodeURIComponent(
              `Proposal ${model.quoteRef || ''} question`
            )}`}
          >
            {t.contact}
          </a>
          <a className="btn btn-outline" href={ESTIMATOR_URL}>
            {t.back}
          </a>
          <a className="portal-copy-link" href={shareUrl}>
            {en ? 'Shareable link' : '可分享链接'}
          </a>
        </div>
      </div>
    </section>
  )
}
