import { projectTypes } from '../data/pricing'

export default function PricingOverview({ lang }) {
  const isEn = lang === 'en'
  const title = isEn ? 'Starting ranges (USD)' : '起步价参考（美元）'
  const hint = isEn
    ? 'Tap a tier to pre-select below — then add options.'
    : '点击档位可在下方预选项 — 再加附加项。'

  return (
    <section className="pricing-overview no-print" aria-label={title}>
      <div className="container">
        <h2 className="pricing-overview-title">{title}</h2>
        <p className="pricing-overview-hint">{hint}</p>
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
