import { useMemo, useState } from 'react'
import { calculatePortalProgress, portalDemo } from '../data/clientPortalDemo'
import { EMAIL, ESTIMATOR_URL } from '../config/site'
import { openSowPrintWindow } from '../utils/sowGenerator'
import { openDepositInvoiceWindow } from '../utils/invoiceGenerator'
import {
  buildPortalQuoteUrl,
  buildQuoteSchedule,
  withDepositMarked,
  withKickoffComplete,
  withQuoteAcceptance,
} from '../utils/portalFromQuote'
import {
  acceptQuote,
  getQuoteAcceptance,
  markDepositSent,
  setKickoffItem,
} from '../utils/portalAcceptStore'
import {
  buildEngagementRecord,
  downloadEngagementJson,
  downloadEngagementMarkdown,
} from '../utils/engagementRecord'
import { projectTypes } from '../data/pricing'

const STATUS_LABELS = {
  complete: { en: 'Complete', zh: '已完成' },
  current: { en: 'In progress', zh: '进行中' },
  upcoming: { en: 'Upcoming', zh: '待开始' },
  ready: { en: 'Ready', zh: '可查看' },
}

function localize(value, lang) {
  return value?.[lang] ?? value?.en ?? ''
}

function formatDate(value, lang) {
  return new Intl.DateTimeFormat(lang === 'zh' ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${value}T00:00:00Z`))
}

function shareUrlFor(project, lang) {
  if (project?.source !== 'quote' || !project.quotePayload) {
    return `${ESTIMATOR_URL.replace(/\/?$/, '/')}?portal=demo`
  }
  return buildPortalQuoteUrl({
    base: ESTIMATOR_URL,
    projectType: project.quotePayload.projectTypeId,
    addOnIds: project.quotePayload.addOnIds,
    extraSections: project.quotePayload.extraSections,
    quoteRef: project.quotePayload.quoteRef,
    lang,
    clientName: project.quotePayload.clientName,
  })
}

export default function ClientPortal({ lang, project = portalDemo }) {
  const en = lang === 'en'
  const quoteRef = project.quotePayload?.quoteRef
  const stored = quoteRef ? getQuoteAcceptance(quoteRef) : null
  const [accepted, setAccepted] = useState(() =>
    Boolean(project.accepted || stored?.acceptedAt)
  )
  const [depositSent, setDepositSent] = useState(() =>
    Boolean(stored?.depositMarkedAt)
  )
  const [kickoff, setKickoff] = useState(
    () => stored?.kickoff || { assets: false, copy: false, access: false }
  )
  const [copyState, setCopyState] = useState('idle')

  const kickoffDone =
    depositSent && kickoff.assets && kickoff.copy && kickoff.access

  const live = useMemo(() => {
    if (project.source !== 'quote') return project
    if (kickoffDone) return withKickoffComplete(project)
    if (depositSent) return withDepositMarked(project)
    return accepted ? withQuoteAcceptance(project) : project
  }, [project, accepted, depositSent, kickoffDone])

  const progress = calculatePortalProgress(live.milestones)
  const shareUrl = shareUrlFor(live, lang)

  const t = en
    ? {
        demo: live.source === 'quote' ? 'From your quote' : 'Demo portal',
        eyebrow: 'Client project status',
        progress: 'Overall progress',
        target: 'Target launch',
        budget: 'Indicative range',
        deposit: 'Deposit due',
        scope: 'Scope summary',
        timeline: 'Project milestones',
        artifacts: 'Deliverables & links',
        updates: 'Project updates',
        next: 'Next action',
        owner: 'Owner',
        due: 'Due',
        contact: 'Ask a question',
        back: 'Back to calculator',
        accept: 'Accept this scope',
        accepted: 'Scope accepted',
        depositSent: 'Deposit marked sent',
        markDeposit: 'Mark deposit sent',
        kickoff: 'Kickoff checklist',
        kickoffAssets: 'Brand assets / logos / fonts',
        kickoffCopy: 'Final copy (EN / 中文)',
        kickoffAccess: 'Domain, DNS, or hosting access',
        signed: 'Signed in this browser',
        downloadJson: 'Download engagement JSON',
        downloadMd: 'Download engagement Markdown',
        kickoffDone: 'Kickoff complete',
        print: 'Print status page',
        copy: 'Copy share link',
        copied: 'Link copied',
        copyFail: 'Copy failed',
        notice:
          live.source === 'quote'
            ? 'Generated from the public calculator — indicative until SOW is signed. No real client records are stored on a server.'
            : 'Representative demo data — no real client information is displayed.',
      }
    : {
        demo: live.source === 'quote' ? '来自你的报价' : '演示门户',
        eyebrow: '客户项目状态',
        progress: '整体进度',
        target: '目标上线',
        budget: '参考区间',
        deposit: '应付定金',
        scope: '范围摘要',
        timeline: '项目里程碑',
        artifacts: '交付物与链接',
        updates: '项目动态',
        next: '下一步',
        owner: '负责人',
        due: '截止',
        contact: '提出问题',
        back: '返回计算器',
        accept: '接受此范围',
        accepted: '范围已接受',
        depositSent: '已标记定金已汇出',
        markDeposit: '标记定金已汇出',
        kickoff: '开工清单',
        kickoffAssets: '品牌素材 / Logo / 字体',
        kickoffCopy: '定稿文案（中/英）',
        kickoffAccess: '域名、DNS 或托管权限',
        signed: '已在本浏览器签署',
        downloadJson: '下载合作记录 JSON',
        downloadMd: '下载合作记录 Markdown',
        kickoffDone: '开工清单已完成',
        print: '打印状态页',
        copy: '复制分享链接',
        copied: '链接已复制',
        copyFail: '复制失败',
        notice:
          live.source === 'quote'
            ? '由公开计算器生成 — 签署 SOW 前仅供参考。服务器不存储真实客户记录。'
            : '典型演示数据 — 不展示任何真实客户信息。',
      }

  function handleArtifact(item) {
    const payload = live.quotePayload
    if (item.action === 'sow' && payload) {
      openSowPrintWindow({
        lang,
        projectTypeId: payload.projectTypeId,
        addOnIds: payload.addOnIds,
        extraSections: payload.extraSections,
        min: payload.min,
        max: payload.max,
        quoteRef: payload.quoteRef,
        clientName: payload.clientName,
        dates: buildQuoteSchedule({
          projectType: payload.projectTypeId,
          addOnIds: payload.addOnIds,
        }),
      })
      return
    }
    if (item.action === 'invoice' && payload) {
      const type = projectTypes.find((p) => p.id === payload.projectTypeId)
      openDepositInvoiceWindow({
        lang,
        projectTypeLabel: type
          ? en
            ? type.labelEn
            : type.labelZh
          : payload.projectTypeId,
        min: payload.min,
        max: payload.max,
        quoteRef: payload.quoteRef,
        clientName: payload.clientName,
      })
    }
  }

  function handleAccept() {
    if (quoteRef) acceptQuote(quoteRef)
    setAccepted(true)
  }

  function handleMarkDeposit() {
    if (quoteRef) markDepositSent(quoteRef)
    setDepositSent(true)
  }

  function handleKickoffToggle(key) {
    const next = !kickoff[key]
    if (quoteRef) setKickoffItem(quoteRef, key, next)
    setKickoff((prev) => ({ ...prev, [key]: next }))
  }

  function handleDownloadJson() {
    const payload = live.quotePayload || {}
    downloadEngagementJson(
      buildEngagementRecord({
        quoteRef: payload.quoteRef,
        projectType: payload.projectTypeId,
        addOnIds: payload.addOnIds,
        extraSections: payload.extraSections,
        clientName: payload.clientName,
      })
    )
  }

  function handleDownloadMarkdown() {
    const payload = live.quotePayload || {}
    downloadEngagementMarkdown(
      buildEngagementRecord({
        quoteRef: payload.quoteRef,
        projectType: payload.projectTypeId,
        addOnIds: payload.addOnIds,
        extraSections: payload.extraSections,
        clientName: payload.clientName,
      }),
      lang
    )
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

  return (
    <section className="client-portal" aria-labelledby="portal-title">
      <div className="portal-container">
        <div className="portal-demo-notice" role="note">
          <span className="portal-demo-badge">{t.demo}</span>
          <span>{t.notice}</span>
        </div>

        <header className="portal-hero">
          <div>
            <p className="portal-eyebrow">{t.eyebrow}</p>
            <h1 id="portal-title">{localize(live.projectName, lang)}</h1>
            <p className="portal-client">{localize(live.client, lang)}</p>
          </div>
          <div className="portal-project-id">
            <span>Project ID</span>
            <code>{live.projectId}</code>
          </div>
        </header>

        <section
          className="portal-progress-card"
          aria-labelledby="portal-progress-title"
        >
          <div className="portal-progress-heading">
            <h2 id="portal-progress-title">{t.progress}</h2>
            <strong>{progress}%</strong>
          </div>
          <div
            className="portal-progress-track"
            role="progressbar"
            aria-valuemin="0"
            aria-valuemax="100"
            aria-valuenow={progress}
            aria-label={`${t.progress}: ${progress}%`}
          >
            <span style={{ width: `${progress}%` }} />
          </div>
          <dl className="portal-summary-grid">
            <div>
              <dt>{t.target}</dt>
              <dd>{formatDate(live.dateRange.target, lang)}</dd>
            </div>
            <div>
              <dt>{t.budget}</dt>
              <dd>{live.budget}</dd>
            </div>
            {live.deposit ? (
              <div>
                <dt>{t.deposit}</dt>
                <dd>${Number(live.deposit).toLocaleString()} USD</dd>
              </div>
            ) : (
              <div className="portal-summary-scope">
                <dt>{t.scope}</dt>
                <dd>{localize(live.scope, lang)}</dd>
              </div>
            )}
          </dl>
          {live.deposit ? (
            <p className="portal-scope-inline">{localize(live.scope, lang)}</p>
          ) : null}
        </section>

        <div className="portal-main-grid">
          <section
            className="portal-panel portal-milestones"
            aria-labelledby="portal-milestones-title"
          >
            <h2 id="portal-milestones-title">{t.timeline}</h2>
            <ol>
              {live.milestones.map((milestone) => (
                <li
                  key={milestone.id}
                  className={`portal-milestone portal-milestone--${milestone.status}`}
                >
                  <span className="portal-milestone-dot" aria-hidden="true" />
                  <div>
                    <div className="portal-milestone-heading">
                      <h3>{localize(milestone.title, lang)}</h3>
                      <span className="portal-status">
                        {localize(STATUS_LABELS[milestone.status], lang)}
                      </span>
                    </div>
                    <time dateTime={milestone.date}>
                      {formatDate(milestone.date, lang)}
                    </time>
                    <p>{localize(milestone.detail, lang)}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <aside className="portal-side">
            <section
              className="portal-panel portal-next"
              aria-labelledby="portal-next-title"
            >
              <h2 id="portal-next-title">{t.next}</h2>
              <p>{localize(live.nextAction.text, lang)}</p>
              <dl>
                <div>
                  <dt>{t.owner}</dt>
                  <dd>{localize(live.nextAction.owner, lang)}</dd>
                </div>
                <div>
                  <dt>{t.due}</dt>
                  <dd>{formatDate(live.nextAction.due, lang)}</dd>
                </div>
              </dl>
              {live.source === 'quote' ? (
                <>
                  <button
                    type="button"
                    className="btn btn-primary portal-accept"
                    onClick={handleAccept}
                    disabled={accepted}
                  >
                    {accepted ? t.accepted : t.accept}
                  </button>
                  {accepted ? (
                    <button
                      type="button"
                      className="btn btn-outline portal-accept"
                      onClick={handleMarkDeposit}
                      disabled={depositSent}
                    >
                      {depositSent ? t.depositSent : t.markDeposit}
                    </button>
                  ) : null}
                </>
              ) : null}
            </section>

            {live.source === 'quote' && accepted ? (
              <section
                className="portal-panel portal-kickoff"
                aria-labelledby="portal-kickoff-title"
              >
                <h2 id="portal-kickoff-title">{t.kickoff}</h2>
                {stored?.signerName ? (
                  <p className="portal-signed">
                    {t.signed}: {stored.signerName}
                  </p>
                ) : null}
                <ul className="portal-kickoff-list">
                  {[
                    ['assets', t.kickoffAssets],
                    ['copy', t.kickoffCopy],
                    ['access', t.kickoffAccess],
                  ].map(([key, label]) => (
                    <li key={key}>
                      <label className="calc-check" htmlFor={`kickoff-${key}`}>
                        <input
                          id={`kickoff-${key}`}
                          type="checkbox"
                          checked={Boolean(kickoff[key])}
                          onChange={() => handleKickoffToggle(key)}
                        />
                        <span>{label}</span>
                      </label>
                    </li>
                  ))}
                </ul>
                {kickoffDone ? (
                  <p className="portal-signed">{t.kickoffDone}</p>
                ) : null}
                <div className="portal-kickoff-downloads">
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={handleDownloadJson}
                  >
                    {t.downloadJson}
                  </button>
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={handleDownloadMarkdown}
                  >
                    {t.downloadMd}
                  </button>
                </div>
              </section>
            ) : null}

            <section
              className="portal-panel"
              aria-labelledby="portal-artifacts-title"
            >
              <h2 id="portal-artifacts-title">{t.artifacts}</h2>
              <ul className="portal-artifacts">
                {live.deliverables.map((item) => (
                  <li key={item.id}>
                    {item.href ? (
                      <a
                        href={item.href}
                        target={item.external ? '_blank' : undefined}
                        rel={item.external ? 'noopener noreferrer' : undefined}
                      >
                        <span>
                          <strong>{localize(item.label, lang)}</strong>
                          <small>{localize(item.detail, lang)}</small>
                        </span>
                        <span aria-hidden="true">↗</span>
                      </a>
                    ) : (
                      <button
                        type="button"
                        className="portal-artifact-btn"
                        onClick={() => handleArtifact(item)}
                      >
                        <span>
                          <strong>{localize(item.label, lang)}</strong>
                          <small>{localize(item.detail, lang)}</small>
                        </span>
                        <span aria-hidden="true">↗</span>
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          </aside>
        </div>

        <section
          className="portal-panel portal-updates"
          aria-labelledby="portal-updates-title"
        >
          <h2 id="portal-updates-title">{t.updates}</h2>
          <ol>
            {live.updates.map((update) => (
              <li key={`${update.date}-${update.author}-${update.body?.en}`}>
                <div className="portal-update-meta">
                  <strong>{update.author}</strong>
                  <time dateTime={update.date}>
                    {formatDate(update.date, lang)}
                  </time>
                </div>
                <p>{localize(update.body, lang)}</p>
              </li>
            ))}
          </ol>
        </section>

        <div className="portal-actions no-print">
          <a
            className="btn btn-primary"
            href={`mailto:${EMAIL}?subject=${encodeURIComponent(
              `Project ${live.projectId} question`
            )}`}
          >
            {t.contact}
          </a>
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
