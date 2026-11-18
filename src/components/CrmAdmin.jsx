import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  getStats,
  listLeadsRecent,
  listQuotesRecent,
  normalizeQuoteApiBase,
  patchLeadStatus,
  patchQuoteStatus,
  buildCalculatorLoadUrl,
} from '../utils/quoteApi'
import { ESTIMATOR_URL } from '../config/site'
import { indexLeadsByQuoteRef, leadCountForQuote } from '../utils/crmJoin'
import { downloadCsv, downloadJson } from '../utils/exportCrm'
import { buildPortalQuoteUrl, buildProposalUrl } from '../utils/portalFromQuote'
import {
  engagementStage,
  getQuoteAcceptance,
  listLocalEngagements,
} from '../utils/portalAcceptStore'
import { loadEstimatorForm, loadQuoteRef } from '../utils/storage'
import {
  buildEngagementRecord,
  downloadEngagementJson,
  downloadEngagementMarkdown,
} from '../utils/engagementRecord'
import {
  demoStatsFromState,
  loadCrmDemoState,
  patchDemoLeadStatus,
  patchDemoQuoteStatus,
  resetCrmDemoState,
} from '../utils/crmDemoStore'

const TOKEN_KEY = 'pixellayer-admin-token'
const QUOTE_STATUSES = ['draft', 'sent', 'accepted', 'declined']
const LEAD_STATUSES = ['new', 'contacted', 'qualified', 'closed']
const TABS = ['stats', 'quotes', 'leads']
const PAGE_SIZE = 20

function errorMessage(e) {
  return e instanceof Error ? e.message : String(e)
}

function pageRows(rows, status, offset, limit, fallbackStatus) {
  let filtered = Array.isArray(rows) ? rows : []
  if (status) {
    filtered = filtered.filter((r) => (r.status || fallbackStatus) === status)
  }
  return {
    items: filtered.slice(offset, offset + limit),
    total: filtered.length,
  }
}

function detectForcedDemo() {
  try {
    return new URLSearchParams(window.location.search).get('demo') === '1'
  } catch {
    return false
  }
}

export default function CrmAdmin({ lang }) {
  const isEn = lang === 'en'
  const apiBase = normalizeQuoteApiBase(import.meta.env.VITE_QUOTE_API_URL)
  const forcedDemo = detectForcedDemo()
  const [initialDemo] = useState(() =>
    !apiBase || forcedDemo ? loadCrmDemoState() : null
  )
  const [useDemo, setUseDemo] = useState(initialDemo !== null)

  const [token, setToken] = useState(() => {
    try {
      return sessionStorage.getItem(TOKEN_KEY) || ''
    } catch {
      return ''
    }
  })
  const [tab, setTab] = useState('stats')
  const [quoteStatus, setQuoteStatus] = useState('')
  const [leadStatus, setLeadStatus] = useState('')
  const [quoteOffset, setQuoteOffset] = useState(0)
  const [leadOffset, setLeadOffset] = useState(0)
  const [quoteTotal, setQuoteTotal] = useState(
    () => initialDemo?.quotes?.length ?? 0
  )
  const [leadTotal, setLeadTotal] = useState(
    () => initialDemo?.leads?.length ?? 0
  )
  const demoFullRef = useRef(initialDemo)

  const [quotes, setQuotes] = useState(() =>
    initialDemo
      ? pageRows(initialDemo.quotes, '', 0, PAGE_SIZE, 'draft').items
      : []
  )
  const [leads, setLeads] = useState(() =>
    initialDemo
      ? pageRows(initialDemo.leads, '', 0, PAGE_SIZE, 'new').items
      : []
  )
  const [joinLeads, setJoinLeads] = useState(initialDemo?.leads ?? [])
  const [stats, setStats] = useState(() =>
    initialDemo ? demoStatsFromState(initialDemo) : null
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [savedToken, setSavedToken] = useState(false)

  const t = isEn
    ? {
        title: 'CRM admin',
        hint: 'Requires estimator-api with LIST_QUOTES_TOKEN. Token stays in this browser session only.',
        demoHint:
          'Demo mode — sample pipeline data (no API). Status changes save in this browser. Interview-safe walkthrough.',
        demoBadge: 'Demo data',
        useDemo: 'Use demo data',
        useLive: 'Use live API',
        resetDemo: 'Reset demo',
        openPortal: 'Open client portal demo',
        tokenLabel: 'Bearer token',
        save: 'Save token',
        refresh: 'Refresh all',
        noApi:
          'No API URL at build time — running demo CRM so the public walkthrough still works.',
        unauthorized: 'Unauthorized — check your token.',
        tabStats: 'Stats',
        tabQuotes: 'Quotes',
        tabLeads: 'Leads',
        exportJson: 'Export JSON',
        exportCsv: 'Export CSV',
        emptyQuotes: 'No quotes yet.',
        emptyLeads: 'No leads yet.',
        status: 'Status',
        filterAll: 'All statuses',
        prevPage: 'Previous',
        nextPage: 'Next',
        pageOf: (from, to, total) =>
          total === 0 ? '0 of 0' : `${from}–${to} of ${total}`,
        range: 'Range',
        type: 'Type',
        created: 'Created',
        name: 'Name',
        email: 'Email',
        source: 'Source',
        linked: 'Leads',
        totalQuotes: 'Total quotes',
        totalLeads: 'Total leads',
        openCalc: 'Open',
        openPortalRow: 'Portal',
        openProposalRow: 'Proposal',
        localTitle: 'This browser',
        localHint:
          'Signed proposals from this device appear here — no API required. Download the engagement record for OPT / interview evidence.',
        localEmpty:
          'No signed quote in this browser yet. Open a proposal and type a name to accept.',
        localStage: 'Stage',
        localSigner: 'Signed as',
        downloadJson: 'JSON',
        downloadMd: 'Markdown',
      }
    : {
        title: 'CRM 管理',
        hint: '需部署 estimator-api 并设置 LIST_QUOTES_TOKEN。令牌仅保存在当前浏览器会话。',
        demoHint:
          '演示模式 — 示例商机数据（无需 API）。状态变更保存在本浏览器，适合面试走查。',
        demoBadge: '演示数据',
        useDemo: '使用演示数据',
        useLive: '使用线上 API',
        resetDemo: '重置演示',
        openPortal: '打开客户状态页演示',
        tokenLabel: 'Bearer 令牌',
        save: '保存令牌',
        refresh: '刷新全部',
        noApi: '构建时未配置 API 地址 — 已自动启用演示 CRM，公开走查仍可用。',
        unauthorized: '未授权 — 请检查令牌。',
        tabStats: '统计',
        tabQuotes: '报价',
        tabLeads: '线索',
        exportJson: '导出 JSON',
        exportCsv: '导出 CSV',
        emptyQuotes: '暂无报价。',
        emptyLeads: '暂无线索。',
        status: '状态',
        filterAll: '全部状态',
        prevPage: '上一页',
        nextPage: '下一页',
        pageOf: (from, to, total) =>
          total === 0 ? '0 / 0' : `${from}–${to} / ${total}`,
        range: '区间',
        type: '类型',
        created: '创建时间',
        name: '姓名',
        email: '邮箱',
        source: '来源',
        linked: '线索',
        totalQuotes: '报价总数',
        totalLeads: '线索总数',
        openCalc: '打开',
        openPortalRow: '状态页',
        openProposalRow: '提案',
        localTitle: '本浏览器',
        localHint:
          '本机已签署的提案会出现在这里 — 无需 API。可下载合作记录，用于 OPT / 面试证据。',
        localEmpty: '本浏览器还没有已签署报价。请打开提案并键入姓名接受。',
        localStage: '阶段',
        localSigner: '签署姓名',
        downloadJson: 'JSON',
        downloadMd: 'Markdown',
      }

  const leadsByRef = useMemo(() => indexLeadsByQuoteRef(joinLeads), [joinLeads])

  const applyDemoState = useCallback(
    (state, overrides = {}) => {
      const nextQuoteStatus = overrides.quoteStatus ?? quoteStatus
      const nextQuoteOffset = overrides.quoteOffset ?? quoteOffset
      const nextLeadStatus = overrides.leadStatus ?? leadStatus
      const nextLeadOffset = overrides.leadOffset ?? leadOffset
      demoFullRef.current = state
      setStats(demoStatsFromState(state))
      setJoinLeads(state.leads)
      const q = pageRows(
        state.quotes,
        nextQuoteStatus,
        nextQuoteOffset,
        PAGE_SIZE,
        'draft'
      )
      const l = pageRows(
        state.leads,
        nextLeadStatus,
        nextLeadOffset,
        PAGE_SIZE,
        'new'
      )
      setQuotes(q.items)
      setLeads(l.items)
      setQuoteTotal(q.total)
      setLeadTotal(l.total)
      setError('')
    },
    [quoteStatus, quoteOffset, leadStatus, leadOffset]
  )

  const refreshDemo = useCallback(() => {
    applyDemoState(loadCrmDemoState())
  }, [applyDemoState])

  const fetchLive = useCallback(async () => {
    const tok = token.trim()
    const empty = { items: [], total: 0 }
    const [statsData, quotesData, leadsData, joinData] = await Promise.all([
      getStats(apiBase),
      tok
        ? listQuotesRecent(apiBase, tok, PAGE_SIZE, {
            offset: quoteOffset,
            status: quoteStatus || undefined,
          })
        : Promise.resolve(empty),
      tok
        ? listLeadsRecent(apiBase, tok, PAGE_SIZE, {
            offset: leadOffset,
            status: leadStatus || undefined,
          })
        : Promise.resolve(empty),
      tok ? listLeadsRecent(apiBase, tok, 100) : Promise.resolve(empty),
    ])
    return {
      stats: statsData,
      quotes: Array.isArray(quotesData.items) ? quotesData.items : [],
      leads: Array.isArray(leadsData.items) ? leadsData.items : [],
      joinLeads: Array.isArray(joinData.items) ? joinData.items : [],
      quoteTotal: Number(quotesData.total) || 0,
      leadTotal: Number(leadsData.total) || 0,
    }
  }, [apiBase, token, quoteOffset, quoteStatus, leadOffset, leadStatus])

  const applyLive = useCallback((data) => {
    setStats(data.stats)
    setQuotes(data.quotes)
    setLeads(data.leads)
    setJoinLeads(data.joinLeads)
    setQuoteTotal(data.quoteTotal)
    setLeadTotal(data.leadTotal)
    setError('')
  }, [])

  const refreshLive = useCallback(async () => {
    if (!apiBase) return
    setLoading(true)
    setError('')
    try {
      applyLive(await fetchLive())
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setLoading(false)
    }
  }, [apiBase, fetchLive, applyLive])

  const liveKey =
    !useDemo && apiBase && token
      ? `${apiBase}\n${token}\n${quoteStatus}\n${quoteOffset}\n${leadStatus}\n${leadOffset}`
      : null
  const [liveLoadedKey, setLiveLoadedKey] = useState(null)
  const busy = loading || (liveKey !== null && liveLoadedKey !== liveKey)

  useEffect(() => {
    if (!liveKey) return
    let active = true
    fetchLive()
      .then(
        (data) => active && applyLive(data),
        (e) => active && setError(errorMessage(e))
      )
      .finally(() => active && setLiveLoadedKey(liveKey))
    return () => {
      active = false
    }
  }, [liveKey, fetchLive, applyLive])

  function handleToggleDemo() {
    if (!useDemo) refreshDemo()
    setUseDemo(!useDemo)
  }

  function handleSaveToken(e) {
    e.preventDefault()
    try {
      sessionStorage.setItem(TOKEN_KEY, token.trim())
      setSavedToken(true)
      setTimeout(() => setSavedToken(false), 1500)
    } catch {
      /* ignore */
    }
  }

  function handleQuoteStatus(id, status) {
    if (useDemo) {
      const full = demoFullRef.current || loadCrmDemoState()
      applyDemoState(patchDemoQuoteStatus(full, id, status))
      return
    }
    if (!apiBase || !token) return
    ;(async () => {
      try {
        await patchQuoteStatus(apiBase, token.trim(), id, status)
        await refreshLive()
      } catch (e) {
        setError(errorMessage(e))
      }
    })()
  }

  function handleLeadStatus(id, status) {
    if (useDemo) {
      const full = demoFullRef.current || loadCrmDemoState()
      applyDemoState(patchDemoLeadStatus(full, id, status))
      return
    }
    if (!apiBase || !token) return
    ;(async () => {
      try {
        await patchLeadStatus(apiBase, token.trim(), id, status)
        await refreshLive()
      } catch (e) {
        setError(errorMessage(e))
      }
    })()
  }

  function handleQuoteFilterChange(next) {
    setQuoteStatus(next)
    setQuoteOffset(0)
    if (useDemo) {
      applyDemoState(loadCrmDemoState(), {
        quoteStatus: next,
        quoteOffset: 0,
      })
    }
  }

  function handleLeadFilterChange(next) {
    setLeadStatus(next)
    setLeadOffset(0)
    if (useDemo) {
      applyDemoState(loadCrmDemoState(), {
        leadStatus: next,
        leadOffset: 0,
      })
    }
  }

  function handleQuotePage(delta) {
    const next = Math.max(0, quoteOffset + delta)
    setQuoteOffset(next)
    if (useDemo) {
      applyDemoState(loadCrmDemoState(), { quoteOffset: next })
    }
  }

  function handleLeadPage(delta) {
    const next = Math.max(0, leadOffset + delta)
    setLeadOffset(next)
    if (useDemo) {
      applyDemoState(loadCrmDemoState(), { leadOffset: next })
    }
  }

  function handleResetDemo() {
    applyDemoState(resetCrmDemoState())
  }

  const errMsg =
    error.includes('401') || error.toLowerCase().includes('unauthorized')
      ? t.unauthorized
      : error

  const calcSiteBase = ESTIMATOR_URL
  const localQuoteRef = loadQuoteRef()
  const localForm = loadEstimatorForm()
  const localAccept = localQuoteRef ? getQuoteAcceptance(localQuoteRef) : null
  const localList = listLocalEngagements()
  const localStage = engagementStage(localAccept)
  const STAGE_LABEL = isEn
    ? {
        draft: 'Draft',
        signed: 'Signed',
        deposit: 'Deposit marked',
        kickoff: 'Kickoff complete',
      }
    : {
        draft: '草案',
        signed: '已签署',
        deposit: '已标记定金',
        kickoff: '开工完成',
      }

  function currentEngagementRecord() {
    return buildEngagementRecord({
      quoteRef: localQuoteRef,
      projectType: localForm?.projectType || 'landing',
      addOnIds: localForm?.addOnIds || [],
      extraSections: localForm?.extraSections || '0',
      clientName: localForm?.clientName || localAccept?.clientName || '',
    })
  }

  return (
    <section className="crm-admin no-print" aria-labelledby="crm-title">
      <div className="container">
        <h2 id="crm-title" className="section-title">
          {t.title}
          {useDemo ? (
            <span className="crm-demo-badge">{t.demoBadge}</span>
          ) : null}
        </h2>
        <p className="section-subtitle">
          {useDemo ? t.demoHint : apiBase ? t.hint : t.noApi}
        </p>

        <div className="crm-admin-mode-row">
          {apiBase ? (
            <button
              type="button"
              className="btn btn-outline"
              onClick={handleToggleDemo}
            >
              {useDemo ? t.useLive : t.useDemo}
            </button>
          ) : null}
          {useDemo ? (
            <button
              type="button"
              className="btn btn-outline"
              onClick={handleResetDemo}
            >
              {t.resetDemo}
            </button>
          ) : null}
          <a
            className="btn btn-outline"
            href={`${ESTIMATOR_URL.replace(/\/?$/, '/')}?portal=demo`}
          >
            {t.openPortal}
          </a>
        </div>

        <section
          className="crm-local-engagement"
          aria-labelledby="crm-local-title"
        >
          <h3 id="crm-local-title">{t.localTitle}</h3>
          <p>{t.localHint}</p>
          {localQuoteRef ? (
            <>
              <dl className="crm-local-meta">
                <div>
                  <dt>Quote</dt>
                  <dd>
                    <code>{localQuoteRef}</code>
                  </dd>
                </div>
                <div>
                  <dt>{t.localStage}</dt>
                  <dd>{STAGE_LABEL[localStage] || localStage}</dd>
                </div>
                {localAccept?.signerName ? (
                  <div>
                    <dt>{t.localSigner}</dt>
                    <dd>{localAccept.signerName}</dd>
                  </div>
                ) : null}
              </dl>
              <div className="crm-local-actions">
                <a
                  className="btn btn-outline"
                  href={buildProposalUrl({
                    base: ESTIMATOR_URL,
                    tab: 'sow',
                    projectType: localForm?.projectType || 'landing',
                    addOnIds: localForm?.addOnIds || [],
                    extraSections: localForm?.extraSections || '0',
                    quoteRef: localQuoteRef,
                    clientName: localForm?.clientName,
                  })}
                >
                  {t.openProposalRow}
                </a>
                <a
                  className="btn btn-outline"
                  href={buildPortalQuoteUrl({
                    base: ESTIMATOR_URL,
                    projectType: localForm?.projectType || 'landing',
                    addOnIds: localForm?.addOnIds || [],
                    extraSections: localForm?.extraSections || '0',
                    quoteRef: localQuoteRef,
                    clientName: localForm?.clientName,
                  })}
                >
                  {t.openPortalRow}
                </a>
                {localAccept?.acceptedAt ? (
                  <>
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={() =>
                        downloadEngagementJson(currentEngagementRecord())
                      }
                    >
                      {t.downloadJson}
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={() =>
                        downloadEngagementMarkdown(
                          currentEngagementRecord(),
                          isEn ? 'en' : 'zh'
                        )
                      }
                    >
                      {t.downloadMd}
                    </button>
                  </>
                ) : null}
              </div>
              {localList.length > 1 ? (
                <p className="crm-local-count">
                  {isEn
                    ? `${localList.length} signed quotes in this browser`
                    : `本浏览器共 ${localList.length} 条已签署报价`}
                </p>
              ) : null}
            </>
          ) : (
            <p>{t.localEmpty}</p>
          )}
        </section>

        {!useDemo && apiBase ? (
          <form className="crm-admin-token-form" onSubmit={handleSaveToken}>
            <label htmlFor="admin-token">{t.tokenLabel}</label>
            <div className="crm-admin-token-row">
              <input
                id="admin-token"
                type="password"
                autoComplete="off"
                value={token}
                onChange={(e) => setToken(e.target.value)}
              />
              <button type="submit" className="btn btn-outline">
                {savedToken ? '✓' : t.save}
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={refreshLive}
                disabled={busy || !token.trim()}
              >
                {busy ? '…' : t.refresh}
              </button>
            </div>
          </form>
        ) : null}

        <div className="crm-admin-tabs" role="tablist">
          {TABS.map((id) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              className={`crm-admin-tab${tab === id ? ' crm-admin-tab--active' : ''}`}
              onClick={() => setTab(id)}
            >
              {id === 'stats'
                ? t.tabStats
                : id === 'quotes'
                  ? t.tabQuotes
                  : t.tabLeads}
            </button>
          ))}
        </div>

        {error && !useDemo ? (
          <p className="crm-admin-error" role="alert">
            {errMsg}
          </p>
        ) : null}

        {tab === 'stats' && stats ? (
          <div className="crm-stats-grid">
            <div className="crm-stat-card">
              <span className="crm-stat-label">{t.totalQuotes}</span>
              <span className="crm-stat-value">{stats.totalQuotes}</span>
              <ul className="crm-stat-breakdown">
                {Object.entries(stats.quotesByStatus || {}).map(([k, v]) => (
                  <li key={k}>
                    {k}: {v}
                  </li>
                ))}
              </ul>
            </div>
            <div className="crm-stat-card">
              <span className="crm-stat-label">{t.totalLeads}</span>
              <span className="crm-stat-value">{stats.totalLeads}</span>
              <ul className="crm-stat-breakdown">
                {Object.entries(stats.leadsByStatus || {}).map(([k, v]) => (
                  <li key={k}>
                    {k}: {v}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}

        {tab === 'quotes' ? (
          <>
            <div className="crm-admin-toolbar">
              <label className="crm-admin-filter">
                <span>{t.status}</span>
                <select
                  value={quoteStatus}
                  onChange={(e) => handleQuoteFilterChange(e.target.value)}
                  aria-label={t.status}
                >
                  <option value="">{t.filterAll}</option>
                  {QUOTE_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
              <div className="crm-admin-pager">
                <span>
                  {t.pageOf(
                    quoteTotal === 0 ? 0 : quoteOffset + 1,
                    Math.min(quoteOffset + quotes.length, quoteTotal),
                    quoteTotal
                  )}
                </span>
                <button
                  type="button"
                  className="btn btn-outline"
                  disabled={quoteOffset <= 0 || busy}
                  onClick={() => handleQuotePage(-PAGE_SIZE)}
                >
                  {t.prevPage}
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  disabled={quoteOffset + PAGE_SIZE >= quoteTotal || busy}
                  onClick={() => handleQuotePage(PAGE_SIZE)}
                >
                  {t.nextPage}
                </button>
              </div>
              <div className="crm-admin-export">
                <button
                  type="button"
                  className="btn btn-outline"
                  disabled={!quotes.length}
                  onClick={() =>
                    downloadJson(
                      'pixelayer-quotes.json',
                      useDemo ? demoFullRef.current?.quotes || quotes : quotes
                    )
                  }
                >
                  {t.exportJson}
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  disabled={!quotes.length}
                  onClick={() =>
                    downloadCsv(
                      'pixelayer-quotes.csv',
                      useDemo ? demoFullRef.current?.quotes || quotes : quotes
                    )
                  }
                >
                  {t.exportCsv}
                </button>
              </div>
            </div>
            {quotes.length === 0 && !busy ? (
              <p>{t.emptyQuotes}</p>
            ) : (
              <div className="crm-admin-table-wrap">
                <table className="crm-admin-table">
                  <thead>
                    <tr>
                      <th>{t.created}</th>
                      <th>{t.type}</th>
                      <th>{t.range}</th>
                      <th>{t.linked}</th>
                      <th>{t.status}</th>
                      <th>{t.openCalc}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quotes.map((row) => (
                      <tr key={row.id}>
                        <td>
                          <time dateTime={row.createdAt}>
                            {new Date(row.createdAt).toLocaleString()}
                          </time>
                          <code className="crm-admin-id">
                            {row.id.slice(0, 8)}…
                          </code>
                        </td>
                        <td>{row.projectType}</td>
                        <td>
                          ${row.min?.toLocaleString()} – $
                          {row.max?.toLocaleString()}
                        </td>
                        <td>{leadCountForQuote(row, leadsByRef)}</td>
                        <td>
                          <select
                            value={row.status || 'draft'}
                            onChange={(e) =>
                              handleQuoteStatus(row.id, e.target.value)
                            }
                            aria-label={`${t.status} ${row.id}`}
                          >
                            {QUOTE_STATUSES.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <a
                            href={buildCalculatorLoadUrl(calcSiteBase, row.id)}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {t.openCalc}
                          </a>
                          {' · '}
                          <a
                            href={buildPortalQuoteUrl({
                              base: ESTIMATOR_URL,
                              projectType: row.projectType,
                              addOnIds: row.addOnIds || [],
                              extraSections: row.extraSections ?? '0',
                              quoteRef: row.id || row.quoteRef,
                            })}
                          >
                            {t.openPortalRow}
                          </a>
                          {' · '}
                          <a
                            href={buildProposalUrl({
                              base: ESTIMATOR_URL,
                              tab: 'sow',
                              projectType: row.projectType,
                              addOnIds: row.addOnIds || [],
                              extraSections: row.extraSections ?? '0',
                              quoteRef: row.id || row.quoteRef,
                            })}
                          >
                            {t.openProposalRow}
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : null}

        {tab === 'leads' ? (
          <>
            <div className="crm-admin-toolbar">
              <label className="crm-admin-filter">
                <span>{t.status}</span>
                <select
                  value={leadStatus}
                  onChange={(e) => handleLeadFilterChange(e.target.value)}
                  aria-label={t.status}
                >
                  <option value="">{t.filterAll}</option>
                  {LEAD_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
              <div className="crm-admin-pager">
                <span>
                  {t.pageOf(
                    leadTotal === 0 ? 0 : leadOffset + 1,
                    Math.min(leadOffset + leads.length, leadTotal),
                    leadTotal
                  )}
                </span>
                <button
                  type="button"
                  className="btn btn-outline"
                  disabled={leadOffset <= 0 || busy}
                  onClick={() => handleLeadPage(-PAGE_SIZE)}
                >
                  {t.prevPage}
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  disabled={leadOffset + PAGE_SIZE >= leadTotal || busy}
                  onClick={() => handleLeadPage(PAGE_SIZE)}
                >
                  {t.nextPage}
                </button>
              </div>
              <div className="crm-admin-export">
                <button
                  type="button"
                  className="btn btn-outline"
                  disabled={!leads.length}
                  onClick={() =>
                    downloadJson(
                      'pixelayer-leads.json',
                      useDemo ? demoFullRef.current?.leads || leads : leads
                    )
                  }
                >
                  {t.exportJson}
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  disabled={!leads.length}
                  onClick={() =>
                    downloadCsv(
                      'pixelayer-leads.csv',
                      useDemo ? demoFullRef.current?.leads || leads : leads
                    )
                  }
                >
                  {t.exportCsv}
                </button>
              </div>
            </div>
            {leads.length === 0 && !busy ? (
              <p>{t.emptyLeads}</p>
            ) : (
              <div className="crm-admin-table-wrap">
                <table className="crm-admin-table">
                  <thead>
                    <tr>
                      <th>{t.created}</th>
                      <th>{t.name}</th>
                      <th>{t.email}</th>
                      <th>{t.source}</th>
                      <th>{t.status}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map((row) => (
                      <tr key={row.id}>
                        <td>
                          <time dateTime={row.createdAt}>
                            {new Date(row.createdAt).toLocaleString()}
                          </time>
                          {row.quoteRef ? (
                            <code className="crm-admin-id">
                              ref {row.quoteRef.slice(0, 8)}…
                            </code>
                          ) : null}
                        </td>
                        <td>{row.name}</td>
                        <td>{row.email}</td>
                        <td>{row.source}</td>
                        <td>
                          <select
                            value={row.status || 'new'}
                            onChange={(e) =>
                              handleLeadStatus(row.id, e.target.value)
                            }
                            aria-label={`${t.status} ${row.id}`}
                          >
                            {LEAD_STATUSES.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : null}
      </div>
    </section>
  )
}
