import { ESTIMATOR_URL, GITHUB_PROFILE, LANDING_URL } from '../config/site'

export default function EcosystemStrip({ lang }) {
  const en = lang === 'en'
  const apiRepo = `${GITHUB_PROFILE}/estimator-api`
  const calcRepo = `${GITHUB_PROFILE}/project-estimator`

  return (
    <aside
      className="ecosystem-strip no-print"
      aria-label={en ? 'Product ecosystem' : '产品生态'}
    >
      <div className="container ecosystem-inner">
        <span className="ecosystem-label">
          {en ? 'PixelLayer stack' : 'PixelLayer 产品链'}
        </span>
        <a href={LANDING_URL} target="_blank" rel="noopener noreferrer">
          {en ? 'Marketing site' : '营销主站'}
        </a>
        <span className="ecosystem-sep" aria-hidden="true">
          ·
        </span>
        <a href={ESTIMATOR_URL} target="_blank" rel="noopener noreferrer">
          {en ? 'Live calculator' : '在线计算器'}
        </a>
        <span className="ecosystem-sep" aria-hidden="true">
          ·
        </span>
        <a href={calcRepo} target="_blank" rel="noopener noreferrer">
          {en ? 'Source' : '源码'}
        </a>
        <span className="ecosystem-sep" aria-hidden="true">
          ·
        </span>
        <a href={apiRepo} target="_blank" rel="noopener noreferrer">
          {en ? 'Quote API' : '报价 API'}
        </a>
        <span className="ecosystem-sep" aria-hidden="true">
          ·
        </span>
        <a href={`${ESTIMATOR_URL.replace(/\/?$/, '/')}?admin=1`}>
          {en ? 'CRM admin' : 'CRM 管理'}
        </a>
        <span className="ecosystem-sep" aria-hidden="true">
          ·
        </span>
        <a href={`${ESTIMATOR_URL.replace(/\/?$/, '/')}?portal=demo`}>
          {en ? 'Client portal' : '客户状态页'}
        </a>
        <span className="ecosystem-sep" aria-hidden="true">
          ·
        </span>
        <a href={`${ESTIMATOR_URL.replace(/\/?$/, '/')}?proposal=sow`}>
          {en ? 'Proposal' : '提案'}
        </a>
      </div>
    </aside>
  )
}
