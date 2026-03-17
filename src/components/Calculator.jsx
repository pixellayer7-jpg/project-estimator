import { useState } from 'react'
import { projectTypes, addOns, calculateQuote } from '../data/pricing'

const isEn = (lang) => lang === 'en'

export default function Calculator({ lang = 'en' }) {
  const [projectType, setProjectType] = useState('landing')
  const [addOnIds, setAddOnIds] = useState([])
  const [extraSections, setExtraSections] = useState('0')

  const { min, max } = calculateQuote(projectType, addOnIds, extraSections, lang)

  const toggleAddOn = (id) => {
    setAddOnIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
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
        cta: 'Get exact quote',
        ctaSub: 'Email us with your project details for a fixed proposal.',
      }
    : {
        title: '获取项目报价估算',
        subtitle: '选择项目类型与选项，最终报价将根据具体需求与周期确定。',
        projectLabel: '项目类型',
        addOnsLabel: '附加项',
        extraLabel: '额外区块或页面数量',
        extraPlaceholder: '0',
        resultLabel: '估算区间',
        cta: '获取正式报价',
        ctaSub: '发邮件说明项目需求，我们会给出固定报价与周期。',
      }

  return (
    <section className="calc">
      <div className="container">
        <h2 className="section-title">{t.title}</h2>
        <p className="section-subtitle">{t.subtitle}</p>

        <div className="calc-card">
          <div className="calc-row">
            <label className="calc-label">{t.projectLabel}</label>
            <div className="calc-options">
              {projectTypes.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={`calc-option ${projectType === p.id ? 'active' : ''}`}
                  onClick={() => setProjectType(p.id)}
                >
                  {isEn(lang) ? p.labelEn : p.labelZh}
                </button>
              ))}
            </div>
          </div>

          <div className="calc-row">
            <label className="calc-label">{t.addOnsLabel}</label>
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
            />
          </div>

          <div className="calc-result">
            <span className="calc-result-label">{t.resultLabel}</span>
            <span className="calc-result-value">
              ${min.toLocaleString()} – ${max.toLocaleString()} USD
            </span>
          </div>
        </div>

        <div className="calc-cta">
          <a
            href="mailto:pixellayer7@gmail.com?subject=Project%20quote%20request"
            className="btn btn-primary"
          >
            {t.cta}
          </a>
          <p className="calc-cta-sub">{t.ctaSub}</p>
        </div>
      </div>
    </section>
  )
}
