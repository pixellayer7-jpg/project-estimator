import { useEffect, useMemo, useRef, useState } from 'react'
import { projectTypes, addOns, calculateQuote } from '../data/pricing'
import { buildMailtoHref, buildQuoteSummary } from '../utils/quoteSummary'
import { normalizeQuoteApiBase, postQuoteSnapshot } from '../utils/quoteApi'
import {
  clearEstimatorForm,
  clearQuoteRef,
  ensureQuoteRef,
  loadEstimatorForm,
  saveEstimatorForm,
  saveQuoteRef,
} from '../utils/storage'

const isEn = (lang) => lang === 'en'

const EMAIL = 'pixellayer7@gmail.com'

const STRINGS_EN = {
  title: 'Get an estimated quote',
  subtitle:
    'Select your project type and options. Final price depends on scope and timeline.',
  projectLabel: 'Project type',
  addOnsLabel: 'Add-ons',
  extraLabel: 'Extra sections or pages',
  extraPlaceholder: '0',
  resultLabel: 'Estimated range',
  disclaimer:
    'Indicative only — not a binding offer. Final scope and price are agreed in writing.',
  cta: 'Email this estimate',
  ctaSub:
    'Your selections are pre-filled in the email body. Add details and send.',
  reset: 'Reset',
  copySummary: 'Copy summary',
  copied: 'Copied!',
  copyFailed: 'Copy failed',
  previewTitle: 'Preview email body',
  copyAria: 'Copy estimate summary to clipboard',
  downloadTxt: 'Download .txt',
  downloadAria: 'Download estimate summary as a text file',
  printPdf: 'Print / Save as PDF',
  printAria:
    'Open print dialog to save or print the estimate (uses your browser)',
  refLabel: 'Quote reference',
  persistedHint: 'Your choices are saved on this device until you reset.',
  saveToServer: 'Save online copy',
  saveSaving: 'Saving…',
  saveSaved: 'Saved. Share this link:',
  saveOpen: 'Open',
  saveCopyLink: 'Copy link',
  saveCopyLinkAria: 'Copy share link to clipboard',
  saveLinkCopied: 'Link copied!',
  saveFail: 'Save failed',
  saveHint:
    'Optional: stores a snapshot on your estimator-api. Set VITE_QUOTE_API_URL at build time and allow CORS for this site.',
}

const STRINGS_ZH = {
  title: '获取项目报价估算',
  subtitle: '选择项目类型与选项，最终报价将根据具体需求与周期确定。',
  projectLabel: '项目类型',
  addOnsLabel: '附加项',
  extraLabel: '额外区块或页面数量',
  extraPlaceholder: '0',
  resultLabel: '估算区间',
  disclaimer: '仅供参考，不构成正式报价；最终范围与价格以书面约定为准。',
  cta: '用邮件发送此估算',
  ctaSub: '邮件正文已预填当前选项，可补充说明后发送。',
  reset: '重置',
  copySummary: '复制摘要',
  copied: '已复制',
  copyFailed: '复制失败',
  previewTitle: '预览邮件正文',
  copyAria: '将估算摘要复制到剪贴板',
  downloadTxt: '下载 .txt',
  downloadAria: '将估算摘要下载为文本文件',
  printPdf: '打印 / 另存为 PDF',
  printAria: '打开打印对话框，可将估算另存为 PDF 或打印（由浏览器完成）',
  refLabel: '报价编号',
  persistedHint: '选项会保存在本机浏览器中，直到你点击重置。',
  saveToServer: '保存线上副本',
  saveSaving: '保存中…',
  saveSaved: '已保存，可分享此链接：',
  saveOpen: '打开',
  saveCopyLink: '复制链接',
  saveCopyLinkAria: '将分享链接复制到剪贴板',
  saveLinkCopied: '链接已复制！',
  saveFail: '保存失败',
  saveHint:
    '可选：把当前估算快照存到你的 estimator-api。构建时设置 VITE_QUOTE_API_URL，并在 API 上为本站配置 CORS。',
}

const defaultForm = {
  projectType: 'landing',
  addOnIds: [],
  extraSections: '0',
}

function clampExtraSectionsString(raw) {
  const n = parseInt(String(raw), 10)
  if (!Number.isFinite(n)) return '0'
  return String(Math.min(20, Math.max(0, n)))
}

export default function Calculator({ lang = 'en' }) {
  const quoteApiBase = useMemo(
    () => normalizeQuoteApiBase(import.meta.env.VITE_QUOTE_API_URL),
    []
  )
  const [form, setForm] = useState(() => ({
    ...defaultForm,
    ...(loadEstimatorForm() ?? {}),
  }))
  const [quoteRef, setQuoteRef] = useState(() => ensureQuoteRef())
  const [copyState, setCopyState] = useState('idle')
  const [copyAnnounce, setCopyAnnounce] = useState('')
  const [saveState, setSaveState] = useState('idle')
  const [saveUrl, setSaveUrl] = useState(null)
  const [saveErr, setSaveErr] = useState('')
  const [saveLinkCopyState, setSaveLinkCopyState] = useState('idle')
  const saveAbortRef = useRef(null)
  const projectBtnRefs = useRef([])

  const { projectType, addOnIds, extraSections } = form

  useEffect(() => {
    const id = window.setTimeout(() => saveEstimatorForm(form), 400)
    return () => window.clearTimeout(id)
  }, [form])

  const { min, max, summary, mailtoHref, timelineText } = useMemo(() => {
    const { min, max } = calculateQuote(projectType, addOnIds, extraSections)
    const summary = buildQuoteSummary(
      lang,
      projectType,
      addOnIds,
      extraSections,
      min,
      max,
      quoteRef
    )
    const subjectShort = quoteRef.replace(/-/g, '').slice(0, 8)
    const subject =
      lang === 'en'
        ? `Project quote request [${subjectShort}] — PixelLayer L.L.C`
        : `项目报价咨询 [${subjectShort}] — PixelLayer L.L.C`
    const mailtoHref = buildMailtoHref(EMAIL, subject, summary)
    const currentType = projectTypes.find((p) => p.id === projectType)
    const timelineText =
      currentType &&
      (isEn(lang) ? currentType.timelineEn : currentType.timelineZh)
    return { min, max, summary, mailtoHref, timelineText }
  }, [lang, projectType, addOnIds, extraSections, quoteRef])

  useEffect(() => {
    saveAbortRef.current?.abort()
    setSaveState('idle')
    setSaveUrl(null)
    setSaveErr('')
    setSaveLinkCopyState('idle')
  }, [lang, projectType, addOnIds, extraSections, quoteRef, min, max])

  const setProjectType = (id) => setForm((f) => ({ ...f, projectType: id }))

  const toggleAddOn = (id) => {
    setForm((f) => ({
      ...f,
      addOnIds: f.addOnIds.includes(id)
        ? f.addOnIds.filter((x) => x !== id)
        : [...f.addOnIds, id],
    }))
  }

  function handleReset() {
    saveAbortRef.current?.abort()
    setSaveState('idle')
    setSaveUrl(null)
    setSaveErr('')
    setSaveLinkCopyState('idle')
    clearEstimatorForm()
    clearQuoteRef()
    const nextRef = crypto.randomUUID()
    saveQuoteRef(nextRef)
    setQuoteRef(nextRef)
    const next = { ...defaultForm }
    setForm(next)
    saveEstimatorForm(next)
  }

  function handlePrintEstimate() {
    window.print()
  }

  function handleProjectKeyDown(e, index) {
    let next = index
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      next = (index + 1) % projectTypes.length
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      next = (index - 1 + projectTypes.length) % projectTypes.length
    } else if (e.key === 'Home') {
      next = 0
    } else if (e.key === 'End') {
      next = projectTypes.length - 1
    } else {
      return
    }
    e.preventDefault()
    setProjectType(projectTypes[next].id)
    projectBtnRefs.current[next]?.focus()
  }

  function handleDownloadTxt() {
    const blob = new Blob([summary], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'pixellayer-quote-summary.txt'
    a.rel = 'noopener'
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleCopySummary() {
    try {
      await navigator.clipboard.writeText(summary)
      setCopyState('ok')
      setCopyAnnounce(
        isEn(lang) ? 'Summary copied to clipboard' : '摘要已复制到剪贴板'
      )
      setTimeout(() => {
        setCopyState('idle')
        setCopyAnnounce('')
      }, 2000)
    } catch {
      setCopyState('fail')
      setCopyAnnounce(isEn(lang) ? 'Copy failed' : '复制失败')
      setTimeout(() => {
        setCopyState('idle')
        setCopyAnnounce('')
      }, 2000)
    }
  }

  async function handleSaveToServer() {
    if (!quoteApiBase) return
    saveAbortRef.current?.abort()
    const ac = new AbortController()
    saveAbortRef.current = ac
    setSaveState('loading')
    setSaveErr('')
    setSaveUrl(null)
    setSaveLinkCopyState('idle')
    try {
      const body = {
        projectType,
        addOnIds: [...addOnIds],
        extraSections,
        min,
        max,
        lang,
        quoteRef,
        summary,
      }
      const data = await postQuoteSnapshot(quoteApiBase, body, {
        signal: ac.signal,
      })
      if (saveAbortRef.current !== ac) return
      const viewUrl = `${quoteApiBase}/api/v1/quotes/${data.id}`
      setSaveState('ok')
      setSaveUrl(viewUrl)
    } catch (e) {
      if (ac.signal.aborted) return
      setSaveState('err')
      setSaveErr(e instanceof Error ? e.message : String(e))
    }
  }

  async function handleCopySaveLink() {
    if (!saveUrl) return
    try {
      await navigator.clipboard.writeText(saveUrl)
      setSaveLinkCopyState('ok')
      setTimeout(() => setSaveLinkCopyState('idle'), 2000)
    } catch {
      setSaveLinkCopyState('idle')
    }
  }

  const t = isEn(lang) ? STRINGS_EN : STRINGS_ZH

  return (
    <section className="calc" aria-labelledby="calc-title">
      <div className="container">
        <h2 id="calc-title" className="section-title">
          {t.title}
        </h2>
        <p className="section-subtitle">{t.subtitle}</p>
        <p className="calc-persist-hint">{t.persistedHint}</p>

        <span className="sr-only" aria-live="assertive" aria-atomic="true">
          {copyAnnounce}
        </span>

        <div className="calc-card print-area">
          <p className="calc-ref">
            <span className="calc-ref-label">{t.refLabel}:</span>{' '}
            <code className="calc-ref-code">{quoteRef}</code>
          </p>
          <fieldset className="calc-fieldset">
            <legend className="calc-label">{t.projectLabel}</legend>
            <div
              className="calc-options"
              role="radiogroup"
              aria-label={t.projectLabel}
            >
              {projectTypes.map((p, index) => (
                <button
                  key={p.id}
                  ref={(el) => {
                    projectBtnRefs.current[index] = el
                  }}
                  type="button"
                  role="radio"
                  aria-checked={projectType === p.id}
                  tabIndex={projectType === p.id ? 0 : -1}
                  className={`calc-option ${projectType === p.id ? 'active' : ''}`}
                  onClick={() => setProjectType(p.id)}
                  onKeyDown={(e) => handleProjectKeyDown(e, index)}
                >
                  {isEn(lang) ? p.labelEn : p.labelZh}
                </button>
              ))}
            </div>
            {timelineText && (
              <p className="calc-timeline" aria-live="polite">
                {timelineText}
              </p>
            )}
          </fieldset>

          <div className="calc-row">
            <fieldset className="calc-fieldset">
              <legend className="calc-label">{t.addOnsLabel}</legend>
              <div className="calc-checkboxes">
                {addOns.map((a) => {
                  const cid = `addon-${a.id}`
                  return (
                    <label key={a.id} className="calc-check" htmlFor={cid}>
                      <input
                        id={cid}
                        type="checkbox"
                        checked={addOnIds.includes(a.id)}
                        onChange={() => toggleAddOn(a.id)}
                      />
                      <span>{isEn(lang) ? a.labelEn : a.labelZh}</span>
                    </label>
                  )
                })}
              </div>
            </fieldset>
          </div>

          <div className="calc-row">
            <label className="calc-label" htmlFor="extra-sections">
              {t.extraLabel}
            </label>
            <input
              id="extra-sections"
              name="extraSections"
              type="number"
              min="0"
              max="20"
              value={extraSections}
              onChange={(e) =>
                setForm((f) => ({ ...f, extraSections: e.target.value }))
              }
              onBlur={() =>
                setForm((f) => ({
                  ...f,
                  extraSections: clampExtraSectionsString(f.extraSections),
                }))
              }
              className="calc-input"
              placeholder={t.extraPlaceholder}
              inputMode="numeric"
              aria-describedby="extra-hint"
            />
            <p id="extra-hint" className="calc-hint">
              {isEn(lang)
                ? 'Count extra sections or pages beyond the base scope (0–20).'
                : '在基础范围之外的额外区块或页面数量（0–20）。'}
            </p>
          </div>

          <div className="calc-actions no-print">
            <button type="button" className="btn-ghost" onClick={handleReset}>
              {t.reset}
            </button>
            <button
              type="button"
              className="btn-ghost"
              onClick={handleCopySummary}
              aria-label={t.copyAria}
            >
              {copyState === 'ok'
                ? t.copied
                : copyState === 'fail'
                  ? t.copyFailed
                  : t.copySummary}
            </button>
            <button
              type="button"
              className="btn-ghost"
              onClick={handleDownloadTxt}
              aria-label={t.downloadAria}
            >
              {t.downloadTxt}
            </button>
            <button
              type="button"
              className="btn-ghost"
              onClick={handlePrintEstimate}
              aria-label={t.printAria}
            >
              {t.printPdf}
            </button>
          </div>

          <div className="calc-result">
            <span className="calc-result-label">{t.resultLabel}</span>
            <span
              key={`${min}-${max}`}
              className="calc-result-value"
              aria-live="polite"
            >
              ${min.toLocaleString()} – ${max.toLocaleString()} USD
            </span>
          </div>
          <p className="calc-disclaimer">{t.disclaimer}</p>

          <details className="calc-preview no-print">
            <summary className="calc-preview-summary">{t.previewTitle}</summary>
            <pre className="calc-preview-body" tabIndex={0}>
              {summary}
            </pre>
          </details>
        </div>

        <div className="calc-cta no-print">
          <a href={mailtoHref} className="btn btn-primary">
            {t.cta}
          </a>
          <p className="calc-cta-sub">{t.ctaSub}</p>

          {quoteApiBase ? (
            <div className="calc-api-save">
              <p className="calc-api-save-hint">{t.saveHint}</p>
              <div className="calc-api-save-row">
                <button
                  type="button"
                  className="calc-api-save-btn"
                  disabled={saveState === 'loading'}
                  onClick={handleSaveToServer}
                >
                  {saveState === 'loading' ? t.saveSaving : t.saveToServer}
                </button>
              </div>
              {saveState === 'ok' && saveUrl && (
                <div className="calc-api-save-result" role="status">
                  <p className="calc-api-save-label">{t.saveSaved}</p>
                  <code className="calc-api-url">{saveUrl}</code>
                  <div className="calc-api-save-actions">
                    <a
                      href={saveUrl}
                      className="btn-ghost calc-api-save-open"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {t.saveOpen}
                    </a>
                    <button
                      type="button"
                      className="btn-ghost"
                      onClick={handleCopySaveLink}
                      aria-label={t.saveCopyLinkAria}
                    >
                      {saveLinkCopyState === 'ok'
                        ? t.saveLinkCopied
                        : t.saveCopyLink}
                    </button>
                  </div>
                </div>
              )}
              {saveState === 'err' && saveErr && (
                <p className="calc-api-save-err" role="alert">
                  {t.saveFail}: {saveErr}
                </p>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}
