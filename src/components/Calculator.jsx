import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { projectTypes, addOns, calculateQuote } from '../data/pricing'
import { buildMailtoHref, buildQuoteSummary } from '../utils/quoteSummary'
import {
  buildCalculatorLoadUrl,
  extractQuoteIdFromInput,
  getQuoteById,
  normalizeQuoteApiBase,
  postQuoteSnapshot,
  QUOTE_UUID_RE,
} from '../utils/quoteApi'
import {
  clampExtraSectionsString,
  mapQuoteRowToForm,
} from '../utils/quoteHydrate'
import {
  buildSowMarkdown,
  downloadSowMarkdown,
  openSowPrintWindow,
} from '../utils/sowGenerator'
import { openDepositInvoiceWindow } from '../utils/invoiceGenerator'
import {
  buildPortalQuoteUrl,
  buildProposalUrl,
  buildQuoteSchedule,
} from '../utils/portalFromQuote'
import { LANDING_URL, EMAIL, ESTIMATOR_URL } from '../config/site'
import {
  buildLandingContactUrl,
  isHandoffOriginCompatible,
  saveContactHandoff,
  saveLastQuoteId,
} from '../utils/contactHandoff'
import {
  parseCalculatorUrlParams,
  stripCalculatorMarketingParams,
} from '../utils/urlParams'
import {
  clearEstimatorForm,
  clearQuoteRef,
  ensureQuoteRef,
  loadEstimatorForm,
  saveEstimatorForm,
  saveQuoteRef,
} from '../utils/storage'

const isEn = (lang) => lang === 'en'

const STRINGS_EN = {
  title: 'Get an estimated quote',
  subtitle:
    'Select your project type and options. Final price depends on scope and timeline.',
  mainSite: '← PixelLayer marketing site',
  projectLabel: 'Project type',
  addOnsLabel: 'Add-ons',
  extraLabel: 'Extra sections or pages',
  extraPlaceholder: '0',
  clientLabel: 'Client name (optional)',
  clientPlaceholder: 'Acme Studio',
  clientHint:
    'Appears on the shareable proposal, deposit invoice, and client portal.',
  resultLabel: 'Estimated range',
  disclaimer:
    'Indicative only — not a binding offer. Final scope and price are agreed in writing.',
  cta: 'Email this estimate',
  ctaSub:
    'Your selections are pre-filled in the email body. Add details and send.',
  ctaSite: 'Continue on main site',
  ctaSiteSub:
    'Opens the contact form with this estimate pre-filled (same browser session).',
  ctaSiteCrossOrigin:
    'Main-site handoff requires the calculator and landing on the same domain — use email or copy summary instead.',
  reset: 'Reset',
  copySummary: 'Copy summary',
  copied: 'Copied!',
  copyFailed: 'Copy failed',
  previewTitle: 'Preview email body',
  copyAria: 'Copy estimate summary to clipboard',
  downloadTxt: 'Download .txt',
  downloadAria: 'Download estimate summary as a text file',
  downloadSow: 'Download SOW draft',
  downloadSowAria: 'Download statement of work draft as Markdown',
  printSow: 'Print proposal (SOW)',
  printSowAria: 'Open print-ready proposal HTML (Save as PDF from browser)',
  printInvoice: 'Deposit invoice',
  printInvoiceAria: 'Open deposit invoice draft for print / Save as PDF',
  printPdf: 'Print / Save as PDF',
  printAria:
    'Open print dialog to save or print the estimate (uses your browser)',
  portalPreview: 'Preview client portal',
  portalPreviewAria:
    'Open a client status page generated from this quote (no login required)',
  portalPreviewSub:
    'Same price, scope, and quote ID — shareable without API secrets.',
  proposalOpen: 'Open proposal',
  proposalOpenAria:
    'Open a shareable in-app proposal and deposit invoice for this quote',
  proposalOpenSub:
    'Same URL for SOW + invoice — client can review, print, and accept.',
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
  saveSiteIntro:
    'Calculator page (opens with this estimate) — set VITE_SITE_URL at build time:',
  saveOpenCalc: 'Open calculator',
  saveCopyCalcLink: 'Copy calculator link',
  saveCopyCalcLinkAria:
    'Copy calculator URL with ?load= to restore this estimate in the UI',
  saveCalcLinkCopied: 'Calculator link copied!',
  saveShareCalc: 'Share',
  saveShareCalcAria: 'Share calculator link using your device',
  loadLoading: 'Loading shared estimate…',
  loadOk: 'Loaded estimate from your link.',
  loadErr: 'Could not load link',
  loadManualTitle: 'Load a saved estimate',
  loadManualHint:
    'Paste a saved quote UUID, API link, or calculator share link.',
  loadManualLabel: 'Saved quote link or UUID',
  loadManualPlaceholder: 'Paste UUID or ?load= link',
  loadManualAction: 'Load estimate',
  loadManualInvalid: 'Enter a valid saved quote UUID or link.',
  ctaSiteApi: 'Save & contact on main site',
  ctaSiteApiSub:
    'Saves this estimate online, then opens the contact form with ?quote= (works across domains).',
  ctaSiteApiSaving: 'Saving…',
  saveContactLink: 'Open contact form with this estimate',
}

const STRINGS_ZH = {
  title: '获取项目报价估算',
  subtitle: '选择项目类型与选项，最终报价将根据具体需求与周期确定。',
  mainSite: '← PixelLayer 营销主站',
  projectLabel: '项目类型',
  addOnsLabel: '附加项',
  extraLabel: '额外区块或页面数量',
  extraPlaceholder: '0',
  clientLabel: '客户名称（可选）',
  clientPlaceholder: '示例工作室',
  clientHint: '会出现在可分享提案、定金发票与客户状态页上。',
  resultLabel: '估算区间',
  disclaimer: '仅供参考，不构成正式报价；最终范围与价格以书面约定为准。',
  cta: '用邮件发送此估算',
  ctaSub: '邮件正文已预填当前选项，可补充说明后发送。',
  ctaSite: '在主站继续联系',
  ctaSiteSub: '打开主站联系表单并预填本估算（需同一浏览器会话）。',
  ctaSiteCrossOrigin: '跳转主站预填需计算器与主站同域 — 请改用邮件或复制摘要。',
  reset: '重置',
  copySummary: '复制摘要',
  copied: '已复制',
  copyFailed: '复制失败',
  previewTitle: '预览邮件正文',
  copyAria: '将估算摘要复制到剪贴板',
  downloadTxt: '下载 .txt',
  downloadAria: '将估算摘要下载为文本文件',
  downloadSow: '下载 SOW 草案',
  downloadSowAria: '下载工作说明书草案（Markdown）',
  printSow: '打印提案（SOW）',
  printSowAria: '打开可打印的提案 HTML（浏览器另存为 PDF）',
  printInvoice: '定金发票',
  printInvoiceAria: '打开定金发票草案以便打印 / 另存为 PDF',
  printPdf: '打印 / 另存为 PDF',
  printAria: '打开打印对话框，可将估算另存为 PDF 或打印（由浏览器完成）',
  portalPreview: '预览客户状态页',
  portalPreviewAria: '打开由本报价生成的客户状态页（无需登录）',
  portalPreviewSub: '同一价格、范围与报价编号 — 无需 API 密钥即可分享。',
  proposalOpen: '打开提案',
  proposalOpenAria: '打开本报价的可分享站内提案与定金发票',
  proposalOpenSub: '同一链接包含 SOW 与发票 — 客户可审阅、打印并接受。',
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
  saveSiteIntro:
    '计算器页面（打开后自动载入此估算）— 构建时设置 VITE_SITE_URL：',
  saveOpenCalc: '打开计算器',
  saveCopyCalcLink: '复制计算器链接',
  saveCopyCalcLinkAria: '复制带 ?load= 的计算器地址，在界面中恢复此估算',
  saveCalcLinkCopied: '计算器链接已复制！',
  saveShareCalc: '分享',
  saveShareCalcAria: '通过系统分享菜单发送计算器链接',
  loadLoading: '正在加载分享的估算…',
  loadOk: '已从链接载入估算。',
  loadErr: '无法加载链接',
  loadManualTitle: '载入已保存估算',
  loadManualHint: '粘贴已保存报价 UUID、API 链接或计算器分享链接。',
  loadManualLabel: '已保存报价链接或 UUID',
  loadManualPlaceholder: '粘贴 UUID 或 ?load= 链接',
  loadManualAction: '载入估算',
  loadManualInvalid: '请输入有效的已保存报价 UUID 或链接。',
  ctaSiteApi: '保存并前往主站联系',
  ctaSiteApiSub: '先保存线上快照，再打开主站联系表单（带 ?quote=，跨域可用）。',
  ctaSiteApiSaving: '保存中…',
  saveContactLink: '用此估算打开联系表单',
}

const defaultForm = {
  projectType: 'landing',
  addOnIds: [],
  extraSections: '0',
  clientName: '',
}

export default function Calculator({ lang = 'en', onHydratedLang }) {
  const quoteApiBase = useMemo(
    () => normalizeQuoteApiBase(import.meta.env.VITE_QUOTE_API_URL),
    []
  )
  const siteUrlBase = useMemo(
    () => normalizeQuoteApiBase(import.meta.env.VITE_SITE_URL),
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
  const [saveSiteUrl, setSaveSiteUrl] = useState(null)
  const [saveContactUrl, setSaveContactUrl] = useState(null)
  const [saveContactState, setSaveContactState] = useState('idle')
  const [saveErr, setSaveErr] = useState('')
  const [saveLinkCopyState, setSaveLinkCopyState] = useState('idle')
  const [saveSiteLinkCopyState, setSaveSiteLinkCopyState] = useState('idle')
  const [loadRemote, setLoadRemote] = useState('idle')
  const [loadRemoteErr, setLoadRemoteErr] = useState('')
  const [manualLoadInput, setManualLoadInput] = useState('')
  const saveAbortRef = useRef(null)
  const hydrateAbortRef = useRef(null)
  const hydrateGen = useRef(0)
  const projectBtnRefs = useRef([])

  const { projectType, addOnIds, extraSections, clientName = '' } = form

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
    setSaveSiteUrl(null)
    setSaveContactUrl(null)
    setSaveErr('')
    setSaveLinkCopyState('idle')
    setSaveSiteLinkCopyState('idle')
  }, [lang, projectType, addOnIds, extraSections, quoteRef, min, max])

  const hydrateQuoteId = useCallback(
    async (loadId, { stripUrl = false } = {}) => {
      if (!quoteApiBase || !QUOTE_UUID_RE.test(loadId)) return

      hydrateAbortRef.current?.abort()
      const ac = new AbortController()
      hydrateAbortRef.current = ac
      const gen = ++hydrateGen.current
      setLoadRemote('loading')
      setLoadRemoteErr('')
      try {
        const row = await getQuoteById(quoteApiBase, loadId, {
          signal: ac.signal,
        })
        if (gen !== hydrateGen.current) return
        const {
          form: nextForm,
          quoteRef: rowRef,
          lang: rowLang,
        } = mapQuoteRowToForm(row)
        setForm(nextForm)
        if (rowRef) {
          setQuoteRef(rowRef)
          saveQuoteRef(rowRef)
        }
        saveEstimatorForm(nextForm)
        setLoadRemote('ok')
        if (rowLang) onHydratedLang?.(rowLang)
        if (stripUrl) {
          const path = window.location.pathname || '/'
          window.history.replaceState(
            {},
            '',
            path + (window.location.hash || '')
          )
        }
      } catch (e) {
        if (ac.signal.aborted) return
        if (gen !== hydrateGen.current) return
        setLoadRemote('err')
        setLoadRemoteErr(e instanceof Error ? e.message : String(e))
      }
    },
    [quoteApiBase, onHydratedLang]
  )

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('load')) return
    const parsed = parseCalculatorUrlParams()
    if (!parsed.projectType && !parsed.addOnIds && !parsed.extraSections) return
    setForm((f) => {
      const next = {
        ...f,
        ...(parsed.projectType ? { projectType: parsed.projectType } : {}),
        ...(parsed.addOnIds ? { addOnIds: parsed.addOnIds } : {}),
        ...(parsed.extraSections
          ? { extraSections: parsed.extraSections }
          : {}),
      }
      saveEstimatorForm(next)
      return next
    })
    stripCalculatorMarketingParams()
  }, [])

  useEffect(() => {
    if (!quoteApiBase) return

    const tryHydrate = (fromPopState) => {
      const params = new URLSearchParams(window.location.search)
      const loadId = params.get('load')
      if (!loadId || !QUOTE_UUID_RE.test(loadId)) {
        if (fromPopState) {
          setLoadRemote('idle')
          setLoadRemoteErr('')
        }
        return
      }
      void hydrateQuoteId(loadId, { stripUrl: true })
    }

    tryHydrate(false)
    const onPopState = () => tryHydrate(true)
    window.addEventListener('popstate', onPopState)
    return () => {
      hydrateAbortRef.current?.abort()
      hydrateAbortRef.current = null
      window.removeEventListener('popstate', onPopState)
    }
  }, [quoteApiBase, hydrateQuoteId])

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
    hydrateGen.current += 1
    hydrateAbortRef.current?.abort()
    hydrateAbortRef.current = null
    setLoadRemote('idle')
    setLoadRemoteErr('')
    saveAbortRef.current?.abort()
    setSaveState('idle')
    setSaveUrl(null)
    setSaveSiteUrl(null)
    setSaveErr('')
    setSaveLinkCopyState('idle')
    setSaveSiteLinkCopyState('idle')
    clearEstimatorForm()
    clearQuoteRef()
    const nextRef = crypto.randomUUID()
    saveQuoteRef(nextRef)
    setQuoteRef(nextRef)
    const next = { ...defaultForm }
    setForm(next)
    saveEstimatorForm(next)
  }

  function handleManualLoadSubmit(e) {
    e.preventDefault()
    const id = extractQuoteIdFromInput(manualLoadInput)
    if (!id) {
      setLoadRemote('err')
      setLoadRemoteErr(t.loadManualInvalid)
      return
    }
    void hydrateQuoteId(id)
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

  function handleDownloadSow() {
    const md = buildSowMarkdown({
      lang,
      projectTypeId: projectType,
      addOnIds,
      extraSections,
      min,
      max,
      quoteRef,
      clientName,
      dates: buildQuoteSchedule({ projectType, addOnIds }),
    })
    downloadSowMarkdown(md)
  }

  function handlePrintSow() {
    openSowPrintWindow({
      lang,
      projectTypeId: projectType,
      addOnIds,
      extraSections,
      min,
      max,
      quoteRef,
      clientName,
      dates: buildQuoteSchedule({ projectType, addOnIds }),
    })
  }

  function handlePrintInvoice() {
    const type = projectTypes.find((p) => p.id === projectType)
    const projectTypeLabel = type
      ? isEn(lang)
        ? type.labelEn
        : type.labelZh
      : projectType
    openDepositInvoiceWindow({
      lang,
      projectTypeLabel,
      min,
      max,
      quoteRef,
      clientName,
    })
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
    setSaveSiteUrl(null)
    setSaveLinkCopyState('idle')
    setSaveSiteLinkCopyState('idle')
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
      saveLastQuoteId(data.id)
      setSaveContactUrl(
        data.links?.contact ||
          buildLandingContactUrl(LANDING_URL, lang, data.id)
      )
      setSaveSiteUrl(
        siteUrlBase ? buildCalculatorLoadUrl(siteUrlBase, data.id) : null
      )
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

  async function handleCopySaveSiteLink() {
    if (!saveSiteUrl) return
    try {
      await navigator.clipboard.writeText(saveSiteUrl)
      setSaveSiteLinkCopyState('ok')
      setTimeout(() => setSaveSiteLinkCopyState('idle'), 2000)
    } catch {
      setSaveSiteLinkCopyState('idle')
    }
  }

  async function handleShareSaveSiteLink() {
    if (!saveSiteUrl || typeof navigator.share !== 'function') return
    try {
      await navigator.share({
        title: isEn(lang)
          ? 'PixelLayer quote estimate'
          : 'PixelLayer 项目报价估算',
        url: saveSiteUrl,
      })
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') return
    }
  }

  function handleContinueOnSite() {
    saveContactHandoff({
      summary,
      lang,
      quoteRef,
      min,
      max,
      projectType,
      addOnIds,
      extraSections,
    })
    window.location.href = buildLandingContactUrl(LANDING_URL, lang)
  }

  async function handleSaveAndContact() {
    if (!quoteApiBase) return
    setSaveContactState('loading')
    try {
      const data = await postQuoteSnapshot(
        quoteApiBase,
        {
          projectType,
          addOnIds: [...addOnIds],
          extraSections,
          min,
          max,
          lang,
          quoteRef,
          summary,
        },
        {}
      )
      saveLastQuoteId(data.id)
      window.location.href =
        data.links?.contact ||
        buildLandingContactUrl(LANDING_URL, lang, data.id)
    } catch {
      setSaveContactState('err')
      setTimeout(() => setSaveContactState('idle'), 3000)
    }
  }

  const handoffOk = isHandoffOriginCompatible(LANDING_URL)

  const canNativeShare =
    typeof navigator !== 'undefined' && typeof navigator.share === 'function'

  const t = isEn(lang) ? STRINGS_EN : STRINGS_ZH

  return (
    <section className="calc" aria-labelledby="calc-title">
      <div className="container">
        <h2 id="calc-title" className="section-title">
          {t.title}
        </h2>
        <p className="section-subtitle">{t.subtitle}</p>
        <p className="calc-site-link">
          <a href={LANDING_URL} target="_blank" rel="noopener noreferrer">
            {t.mainSite}
          </a>
        </p>
        <p className="calc-persist-hint">{t.persistedHint}</p>
        {quoteApiBase && loadRemote !== 'idle' ? (
          <p className="calc-load-hint" role="status" aria-live="polite">
            {loadRemote === 'loading' && t.loadLoading}
            {loadRemote === 'ok' && t.loadOk}
            {loadRemote === 'err' && (
              <>
                {t.loadErr}
                {loadRemoteErr ? `: ${loadRemoteErr}` : ''}
              </>
            )}
          </p>
        ) : null}

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

          <div className="calc-row">
            <label className="calc-label" htmlFor="client-name">
              {t.clientLabel}
            </label>
            <input
              id="client-name"
              name="clientName"
              type="text"
              maxLength={80}
              value={clientName}
              onChange={(e) =>
                setForm((f) => ({ ...f, clientName: e.target.value }))
              }
              className="calc-input"
              placeholder={t.clientPlaceholder}
              autoComplete="organization"
              aria-describedby="client-hint"
            />
            <p id="client-hint" className="calc-hint">
              {t.clientHint}
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
              onClick={handleDownloadSow}
              aria-label={t.downloadSowAria}
            >
              {t.downloadSow}
            </button>
            <button
              type="button"
              className="btn-ghost"
              onClick={handlePrintSow}
              aria-label={t.printSowAria}
            >
              {t.printSow}
            </button>
            <button
              type="button"
              className="btn-ghost"
              onClick={handlePrintInvoice}
              aria-label={t.printInvoiceAria}
            >
              {t.printInvoice}
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
          <div className="calc-cta-buttons">
            {handoffOk ? (
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleContinueOnSite}
              >
                {t.ctaSite}
              </button>
            ) : quoteApiBase ? null : (
              <p className="calc-handoff-warn" role="alert">
                {t.ctaSiteCrossOrigin}
              </p>
            )}
            {quoteApiBase ? (
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSaveAndContact}
                disabled={saveContactState === 'loading'}
              >
                {saveContactState === 'loading'
                  ? t.ctaSiteApiSaving
                  : t.ctaSiteApi}
              </button>
            ) : null}
            <a
              href={buildProposalUrl({
                base: ESTIMATOR_URL,
                tab: 'sow',
                projectType,
                addOnIds,
                extraSections,
                quoteRef,
                lang,
                clientName,
              })}
              className="btn btn-primary"
              aria-label={t.proposalOpenAria}
            >
              {t.proposalOpen}
            </a>
            <a
              href={buildPortalQuoteUrl({
                base: ESTIMATOR_URL,
                projectType,
                addOnIds,
                extraSections,
                quoteRef,
                lang,
                clientName,
              })}
              className="btn btn-primary"
              aria-label={t.portalPreviewAria}
            >
              {t.portalPreview}
            </a>
            <a href={mailtoHref} className="btn btn-outline">
              {t.cta}
            </a>
          </div>
          {handoffOk ? <p className="calc-cta-sub">{t.ctaSiteSub}</p> : null}
          {quoteApiBase ? (
            <p className="calc-cta-sub">{t.ctaSiteApiSub}</p>
          ) : null}
          <p className="calc-cta-sub">{t.proposalOpenSub}</p>
          <p className="calc-cta-sub">{t.portalPreviewSub}</p>
          <p className="calc-cta-sub calc-cta-sub--muted">{t.ctaSub}</p>

          {quoteApiBase ? (
            <div className="calc-api-save">
              <form
                className="calc-api-load-form"
                onSubmit={handleManualLoadSubmit}
              >
                <p className="calc-api-load-title">{t.loadManualTitle}</p>
                <p className="calc-api-save-hint">{t.loadManualHint}</p>
                <label className="sr-only" htmlFor="saved-quote-input">
                  {t.loadManualLabel}
                </label>
                <div className="calc-api-load-row">
                  <input
                    id="saved-quote-input"
                    className="calc-api-load-input"
                    type="text"
                    value={manualLoadInput}
                    onChange={(e) => setManualLoadInput(e.target.value)}
                    placeholder={t.loadManualPlaceholder}
                    autoComplete="off"
                  />
                  <button
                    type="submit"
                    className="calc-api-save-btn"
                    disabled={loadRemote === 'loading'}
                  >
                    {loadRemote === 'loading'
                      ? t.loadLoading
                      : t.loadManualAction}
                  </button>
                </div>
              </form>
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
                  {saveSiteUrl ? (
                    <div className="calc-api-save-site">
                      <p className="calc-api-save-label calc-api-save-label--sub">
                        {t.saveSiteIntro}
                      </p>
                      <code className="calc-api-url">{saveSiteUrl}</code>
                      <div className="calc-api-save-actions">
                        <a
                          href={saveSiteUrl}
                          className="btn-ghost calc-api-save-open"
                          rel="noopener noreferrer"
                        >
                          {t.saveOpenCalc}
                        </a>
                        <button
                          type="button"
                          className="btn-ghost"
                          onClick={handleCopySaveSiteLink}
                          aria-label={t.saveCopyCalcLinkAria}
                        >
                          {saveSiteLinkCopyState === 'ok'
                            ? t.saveCalcLinkCopied
                            : t.saveCopyCalcLink}
                        </button>
                        {canNativeShare ? (
                          <button
                            type="button"
                            className="btn-ghost"
                            onClick={handleShareSaveSiteLink}
                            aria-label={t.saveShareCalcAria}
                          >
                            {t.saveShareCalc}
                          </button>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                  {saveContactUrl ? (
                    <div className="calc-api-save-site">
                      <p className="calc-api-save-label calc-api-save-label--sub">
                        {t.saveContactLink}
                      </p>
                      <a
                        href={saveContactUrl}
                        className="btn-ghost calc-api-save-open"
                        rel="noopener noreferrer"
                      >
                        {t.saveContactLink}
                      </a>
                    </div>
                  ) : null}
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
