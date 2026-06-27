import { useCallback, useEffect, useState } from 'react'
import {
  listQuotesRecent,
  normalizeQuoteApiBase,
  patchQuoteStatus,
} from '../utils/quoteApi'

const TOKEN_KEY = 'pixellayer-admin-token'
const STATUSES = ['draft', 'sent', 'accepted', 'declined']

export default function QuoteAdmin({ lang }) {
  const isEn = lang === 'en'
  const apiBase = normalizeQuoteApiBase(import.meta.env.VITE_QUOTE_API_URL)
  const [token, setToken] = useState(() => {
    try {
      return sessionStorage.getItem(TOKEN_KEY) || ''
    } catch {
      return ''
    }
  })
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [savedToken, setSavedToken] = useState(false)

  const t = isEn
    ? {
        title: 'Quote admin',
        hint: 'Requires estimator-api with LIST_QUOTES_TOKEN. Token stays in this browser session only.',
        tokenLabel: 'Bearer token',
        save: 'Save token',
        refresh: 'Refresh list',
        empty: 'No quotes yet.',
        noApi: 'Set VITE_QUOTE_API_URL at build time to enable admin.',
        status: 'Status',
        range: 'Range',
        type: 'Type',
        created: 'Created',
        unauthorized: 'Unauthorized — check your token.',
      }
    : {
        title: '报价管理',
        hint: '需部署 estimator-api 并设置 LIST_QUOTES_TOKEN。令牌仅保存在当前浏览器会话。',
        tokenLabel: 'Bearer 令牌',
        save: '保存令牌',
        refresh: '刷新列表',
        empty: '暂无报价记录。',
        noApi: '构建时需设置 VITE_QUOTE_API_URL 才能使用管理面板。',
        status: '状态',
        range: '区间',
        type: '类型',
        created: '创建时间',
        unauthorized: '未授权 — 请检查令牌。',
      }

  const loadQuotes = useCallback(async () => {
    if (!apiBase) return
    setLoading(true)
    setError('')
    try {
      const data = await listQuotesRecent(apiBase, token.trim(), 50)
      setItems(Array.isArray(data.items) ? data.items : [])
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [apiBase, token])

  useEffect(() => {
    if (apiBase && token) loadQuotes()
  }, [apiBase, token, loadQuotes])

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

  async function handleStatusChange(id, status) {
    if (!apiBase || !token) return
    setError('')
    try {
      await patchQuoteStatus(apiBase, token.trim(), id, status)
      await loadQuotes()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  if (!apiBase) {
    return (
      <section className="quote-admin no-print" aria-labelledby="admin-title">
        <div className="container">
          <h2 id="admin-title" className="section-title">
            {t.title}
          </h2>
          <p className="section-subtitle">{t.noApi}</p>
        </div>
      </section>
    )
  }

  return (
    <section className="quote-admin no-print" aria-labelledby="admin-title">
      <div className="container">
        <h2 id="admin-title" className="section-title">
          {t.title}
        </h2>
        <p className="section-subtitle">{t.hint}</p>
        <form className="quote-admin-token-form" onSubmit={handleSaveToken}>
          <label htmlFor="admin-token">{t.tokenLabel}</label>
          <div className="quote-admin-token-row">
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
              onClick={loadQuotes}
              disabled={loading || !token.trim()}
            >
              {loading ? '…' : t.refresh}
            </button>
          </div>
        </form>
        {error ? (
          <p className="quote-admin-error" role="alert">
            {error.includes('401') ||
            error.toLowerCase().includes('unauthorized')
              ? t.unauthorized
              : error}
          </p>
        ) : null}
        {items.length === 0 && !loading && token ? (
          <p>{t.empty}</p>
        ) : (
          <div className="quote-admin-table-wrap">
            <table className="quote-admin-table">
              <thead>
                <tr>
                  <th>{t.created}</th>
                  <th>{t.type}</th>
                  <th>{t.range}</th>
                  <th>{t.status}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <time dateTime={row.createdAt}>
                        {new Date(row.createdAt).toLocaleString()}
                      </time>
                      <code className="quote-admin-id">
                        {row.id.slice(0, 8)}…
                      </code>
                    </td>
                    <td>{row.projectType}</td>
                    <td>
                      ${row.min?.toLocaleString()} – $
                      {row.max?.toLocaleString()}
                    </td>
                    <td>
                      <select
                        value={row.status || 'draft'}
                        onChange={(e) =>
                          handleStatusChange(row.id, e.target.value)
                        }
                        aria-label={`${t.status} ${row.id}`}
                      >
                        {STATUSES.map((s) => (
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
      </div>
    </section>
  )
}
