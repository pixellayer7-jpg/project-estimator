import { useState } from 'react'
import { projectTypes, addOns, calculateQuote } from '../data/pricing'
import { buildMailtoHref, buildQuoteSummary } from '../utils/quoteSummary'

const isEn = (lang) => lang === 'en'

const EMAIL = 'pixellayer7@gmail.com'

export default function Calculator({ lang = 'en' }) {
  const [projectType, setProjectType] = useState('landing')
  const [addOnIds, setAddOnIds] = useState([])
  const [extraSections, setExtraSections] = useState('0')
  const [copyState, setCopyState] = useState('idle')

  const { min, max } = calculateQuote(projectType, addOnIds, extraSections, lang)

  const summary = buildQuoteSummary(
    lang,
    projectType,
    addOnIds,
    extraSections,
    min,
    max
  )

  const subject =
    lang === 'en'
      ? 'Project quote request — PixelLayer L.L.C'
      : '项目报价咨询 — PixelLayer L.L.C'

  const mailtoHref = buildMailtoHref(EMAIL, subject, summary)

  const toggleAddOn = (id) => {
    setAddOnIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  function handleReset() {
    setProjectType('landing')
    setAddOnIds([])
    setExtraSections('0')
  }

  async function handleCopySummary() {
    try {
      await navigator.clipboard.writeText(summary)
      setCopyState('ok')
      setTimeout(() => setCopyState('idle'), 2000)
    } catch {
      setCopyState('fail')
      setTimeout(() => setCopyState('idle'), 2000)
    }
  }

  const t = isEn(lang)
    ? {
        title: 'Get an estimated quote',
        subtitle: 'Select your project type and options. Final price depends on scope and timeline.',
        projectLabel: 'Project type',
        addOnsLabel: 'Add-ons',
        extraLabel: 'Extra sections or pages',
        extraPlaceholder: '0',
        resultLabel: 'Estimated range',
        disclaimer:
          'Indicative only — not a binding offer. Final scope and price are agreed in writing.',
        cta: 'Email this estimate',
        ctaSub: 'Your selections are pre-filled in the email body. Add details and send.',
        reset: 'Reset',
        copySummary: 'Copy summary',
        copied: 'Copied!',
        copyFailed: 'Copy failed',
      }
    : {
        title: '获取项目报价估算',
        subtitle: '选择项目类型与选项，最终报价将根据具体需求与周期确定。',
        projectLabel: '项目类型',
        addOnsLabel: '附加项',
        extraLabel: '额外区块或页面数量',
        extraPlaceholder: '0',
        resultLabel: '估算区间',
        disclaimer:
          '仅供参考，不构成正式报价；最终范围与价格以书面约定为准。',
        cta: '用邮件发送此估算',
        ctaSub: '邮件正文已预填当前选项，可补充说明后发送。',
        reset: '重置',
        copySummary: '复制摘要',
        copied: '已复制',
        copyFailed: '复制失败',
      }

  return (
    <section className="calc" aria-labelledby="calc-title">
      <div className="container">
        <h2 id="calc-title" className="section-title">
          {t.title}
        </h2>
        <p className="section-subtitle">{t.subtitle}</p>

        <div className="calc-card">
          <fieldset className="calc-fieldset">
            <legend className="calc-label">{t.projectLabel}</legend>
            <div
              className="calc-options"
              role="radiogroup"
              aria-label={t.projectLabel}
            >
              {projectTypes.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  role="radio"
                  aria-checked={projectType === p.id}
                  className={`calc-option ${projectType === p.id ? 'active' : ''}`}
                  onClick={() => setProjectType(p.id)}
                >
                  {isEn(lang) ? p.labelEn : p.labelZh}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="calc-row">
            <fieldset className="calc-fieldset">
              <legend className="calc-label">{t.addOnsLabel}</legend>
              <div className="calc-checkboxes">
                {addOns.map((a) => (
                  <label key={a.id} className="calc-check">
                    <input
                      type="checkbox"
                      checked={addOnIds.includes(a.id)}
                      onChange={() => toggleAddOn(a.id)}
                    />
                    <span>{isEn(lang) ? a.labelEn : a.labelZh}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          </div>

          <div className="calc-row">
            <label className="calc-label" htmlFor="extra-sections">
              {t.extraLabel}
            </label>
            <input
              id="extra-sections"
              type="number"
              min="0"
              max="20"
              value={extraSections}
              onChange={(e) => setExtraSections(e.target.value)}
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

          <div className="calc-actions">
            <button type="button" className="btn-ghost" onClick={handleReset}>
              {t.reset}
            </button>
            <button type="button" className="btn-ghost" onClick={handleCopySummary}>
              {copyState === 'ok'
                ? t.copied
                : copyState === 'fail'
                  ? t.copyFailed
                  : t.copySummary}
            </button>
          </div>

          <div className="calc-result">
            <span className="calc-result-label">{t.resultLabel}</span>
            <span className="calc-result-value" aria-live="polite">
              ${min.toLocaleString()} – ${max.toLocaleString()} USD
            </span>
          </div>
          <p className="calc-disclaimer">{t.disclaimer}</p>
        </div>

        <div className="calc-cta">
          <a href={mailtoHref} className="btn btn-primary">
            {t.cta}
          </a>
          <p className="calc-cta-sub">{t.ctaSub}</p>
        </div>
      </div>
    </section>
  )
}
