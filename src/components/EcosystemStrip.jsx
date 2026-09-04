import {
  ESTIMATOR_URL,
  GITHUB_PROFILE,
  LANDING_URL,
  RONGEN_PREVIEW_URL,
} from '../config/site'

export default function EcosystemStrip({ lang }) {
  const en = lang === 'en'
  const apiRepo = `${GITHUB_PROFILE}/estimator-api`
  const calcRepo = `${GITHUB_PROFILE}/project-estimator`
  const calcBase = ESTIMATOR_URL.replace(/\/?$/, '/')
  const rongenEn = `${RONGEN_PREVIEW_URL.replace(/\/?$/, '/')}en/`
  const walkthrough = `${LANDING_URL.replace(/\/?$/, '/')}#walkthrough`

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
        <a href={`${calcBase}?admin=1`}>
          {en ? 'CRM admin' : 'CRM 管理'}
        </a>
        <span className="ecosystem-sep" aria-hidden="true">
          ·
        </span>
        <a href={`${calcBase}?portal=demo`}>
          {en ? 'Client portal' : '客户状态页'}
        </a>
        <span className="ecosystem-sep" aria-hidden="true">
          ·
        </span>
        <a href={`${calcBase}?proposal=sow`}>
          {en ? 'Proposal' : '提案'}
        </a>
        <span className="ecosystem-sep" aria-hidden="true">
          ·
        </span>
        <a href={RONGEN_PREVIEW_URL} target="_blank" rel="noopener noreferrer">
          {en ? 'Rongen (client)' : '荣恩堂（客户）'}
        </a>
        <span className="ecosystem-sep" aria-hidden="true">
          ·
        </span>
        <a href={rongenEn} target="_blank" rel="noopener noreferrer">
          {en ? 'Rongen EN' : '荣恩堂 EN'}
        </a>
        <span className="ecosystem-sep" aria-hidden="true">
          ·
        </span>
        <a href={walkthrough} target="_blank" rel="noopener noreferrer">
          {en ? '5-min walkthrough' : '5 分钟走查'}
        </a>
      </div>
    </aside>
  )
}
