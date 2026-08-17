import { useCallback, useEffect, useMemo, useState } from 'react'
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
  const [useDemo, setUseDemo] = useState(() => !apiBase || forcedDemo)

  const [token, setToken] = useState(() => {
    try {
      return sessionStorage.getItem(TOKEN_KEY) || ''
    } catch {
      return ''
    }
  })
  const [tab, setTab] = useState('stats')
  const [quotes, setQuotes] = useState([])
  const [leads, setLeads] = useState([])
  const [stats, setStats] = useState(null)
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
      }

  const leadsByRef = useMemo(() => indexLeadsByQuoteRef(leads), [leads])

  const applyDemoState = useCallback((state) => {
    setQuotes(state.quotes)
    setLeads(state.leads)
    setStats(demoStatsFromState(state))
    setError('')
  }, [])

  const refreshDemo = useCallback(() => {
    applyDemoState(loadCrmDemoState())
  }, [applyDemoState])

  const refreshLive = useCallback(async () => {
    if (!apiBase) return
    setLoading(true)
    setError('')
    try {
      const tok = token.trim()
      const [statsData, quotesData, leadsData] = await Promise.all([
        getStats(apiBase),
        tok
          ? listQuotesRecent(apiBase, tok, 100)
          : Promise.resolve({ items: [] }),
        tok
          ? listLeadsRecent(apiBase, tok, 100)
          : Promise.resolve({ items: [] }),
      ])
      setStats(statsData)
      setQuotes(Array.isArray(quotesData.items) ? quotesData.items : [])
      setLeads(Array.isArray(leadsData.items) ? leadsData.items : [])
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [apiBase, token])

  useEffect(() => {
    if (useDemo) {
      refreshDemo()
      return
    }
    if (apiBase && token) refreshLive()
  }, [useDemo, apiBase, token, refreshDemo, refreshLive])

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
      applyDemoState(patchDemoQuoteStatus({ quotes, leads }, id, status))
      return
    }
    if (!apiBase || !token) return
    ;(async () => {
      try {
        await patchQuoteStatus(apiBase, token.trim(), id, status)
        await refreshLive()
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e))
      }
    })()
  }

  function handleLeadStatus(id, status) {
    if (useDemo) {
      applyDemoState(patchDemoLeadStatus({ quotes, leads }, id, status))
      return
    }
    if (!apiBase || !token) return
    ;(async () => {
      try {
        await patchLeadStatus(apiBase, token.trim(), id, status)
        await refreshLive()
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e))
      }
    })()
  }

  function handleResetDemo() {
    applyDemoState(resetCrmDemoState())
  }

  const errMsg =
    error.includes('401') || error.toLowerCase().includes('unauthorized')
      ? t.unauthorized
      : error

  const calcSiteBase = ESTIMATOR_URL

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
              onClick={() => setUseDemo((v) => !v)}
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
                disabled={loading || !token.trim()}
              >
                {loading ? '…' : t.refresh}
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
            <div className="crm-admin-export">
              <button
                type="button"
                className="btn btn-outline"
                disabled={!quotes.length}
                onClick={() => downloadJson('pixelayer-quotes.json', quotes)}
              >
                {t.exportJson}
              </button>
              <button
                type="button"
                className="btn btn-outline"
                disabled={!quotes.length}
                onClick={() => downloadCsv('pixelayer-quotes.csv', quotes)}
              >
                {t.exportCsv}
              </button>
            </div>
            {quotes.length === 0 && !loading ? (
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
            <div className="crm-admin-export">
              <button
                type="button"
                className="btn btn-outline"
                disabled={!leads.length}
                onClick={() => downloadJson('pixelayer-leads.json', leads)}
              >
                {t.exportJson}
              </button>
              <button
                type="button"
                className="btn btn-outline"
                disabled={!leads.length}
                onClick={() => downloadCsv('pixelayer-leads.csv', leads)}
              >
                {t.exportCsv}
              </button>
            </div>
            {leads.length === 0 && !loading ? (
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
