import { changelogEntries } from '../data/changelog'
import { GITHUB_PROFILE, LANDING_URL } from '../config/site'

export default function Changelog({ lang }) {
  const en = lang === 'en'
  const title = en ? 'Changelog' : '更新日志'
  const subtitle = en
    ? 'How this quote calculator evolved — proposal, portal, CRM, and share links.'
    : '本报价计算器如何演进 — 提案、门户、CRM 与分享链接。'
  const tip = en
    ? 'Interviewing? Start on the marketing walkthrough, then open recent releases here.'
    : '面试走查？先去主站引导路径，再回来看这里的近期版本。'
  const tipCta = en ? 'Open 5-min walkthrough' : '打开 5 分钟走查'
  const apiTip = en ? 'API curl demo' : 'API curl 演示'
  const reposNote = en
    ? 'Full commit history lives on GitHub.'
    : '完整提交历史见 GitHub。'

  return (
    <section id="changelog" className="section changelog">
      <div className="container">
        <h2 className="section-title">{title}</h2>
        <p className="section-subtitle">{subtitle}</p>
        <p className="changelog-tip">
          {tip}{' '}
          <a
            href={`${LANDING_URL.replace(/\/?$/, '/')}#walkthrough`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {tipCta} →
          </a>
          {' · '}
          <a
            href={`${GITHUB_PROFILE}/estimator-api/blob/main/docs/CURL-WALKTHROUGH.md`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {apiTip} →
          </a>
        </p>
        <ol className="changelog-timeline">
          {changelogEntries.map((entry) => {
            const highlights = en ? entry.highlightsEn : entry.highlightsZh
            const heading = en ? entry.titleEn : entry.titleZh
            return (
              <li
                key={`${entry.version}-${entry.date}`}
                className="changelog-item"
              >
                <div className="changelog-meta">
                  <span className="changelog-version">v{entry.version}</span>
                  <time className="changelog-date" dateTime={entry.date}>
                    {entry.date}
                  </time>
                </div>
                <h3 className="changelog-heading">{heading}</h3>
                <ul className="changelog-highlights">
                  {highlights.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </li>
            )
          })}
        </ol>
        <p className="changelog-repos">
          {reposNote}{' '}
          <a
            href={`${GITHUB_PROFILE}/project-estimator`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {en ? 'This repo' : '本仓库'}
          </a>
          {' · '}
          <a
            href={`${GITHUB_PROFILE}/1`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {en ? 'Landing' : '主站'}
          </a>
          {' · '}
          <a
            href={`${GITHUB_PROFILE}/estimator-api`}
            target="_blank"
            rel="noopener noreferrer"
          >
            API
          </a>
        </p>
      </div>
    </section>
  )
}
