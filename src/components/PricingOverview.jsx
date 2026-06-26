import { projectTypes } from '../data/pricing'
import { LANDING_URL } from '../config/site'

export default function PricingOverview({ lang }) {
  const isEn = lang === 'en'
  const title = isEn ? 'Starting ranges (USD)' : '起步价参考（美元）'
  const hint = isEn
    ? 'Tap a tier to pre-select below — or see full details on the marketing site.'
    : '点击档位可在下方预选项 — 或查看主站完整价格说明。'
  const landingPricing = `${LANDING_URL.replace(/\/?$/, '/')}#pricing`

  return (
    <section className="pricing-overview no-print" aria-label={title}>
      <div className="container">
        <h2 className="pricing-overview-title">{title}</h2>
        <p className="pricing-overview-hint">
          {hint}{' '}
          <a href={landingPricing} target="_blank" rel="noopener noreferrer">
            {isEn ? 'Pricing on main site →' : '主站价格说明 →'}
          </a>
        </p>
        <div className="pricing-overview-grid">
          {projectTypes.map((p) => (
            <a
              key={p.id}
              href={`?type=${p.id}&lang=${lang}`}
              className="pricing-overview-card"
            >
              <span className="pricing-overview-name">
                {isEn ? p.labelEn : p.labelZh}
              </span>
              <span className="pricing-overview-range">
                ${p.min.toLocaleString()} – ${p.max.toLocaleString()}
              </span>
              <span className="pricing-overview-time">
                {isEn ? p.timelineEn : p.timelineZh}
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
