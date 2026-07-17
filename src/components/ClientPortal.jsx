import { calculatePortalProgress, portalDemo } from '../data/clientPortalDemo'
import { EMAIL, ESTIMATOR_URL } from '../config/site'

const STATUS_LABELS = {
  complete: { en: 'Complete', zh: '已完成' },
  current: { en: 'In progress', zh: '进行中' },
  upcoming: { en: 'Upcoming', zh: '待开始' },
  ready: { en: 'Ready', zh: '可查看' },
}

function localize(value, lang) {
  return value?.[lang] ?? value?.en ?? ''
}

function formatDate(value, lang) {
  return new Intl.DateTimeFormat(lang === 'zh' ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${value}T00:00:00Z`))
}

export default function ClientPortal({ lang }) {
  const en = lang === 'en'
  const project = portalDemo
  const progress = calculatePortalProgress(project.milestones)
  const portalHome = `${ESTIMATOR_URL.replace(/\/?$/, '/')}?portal=demo`

  const t = en
    ? {
        demo: 'Demo portal',
        eyebrow: 'Client project status',
        progress: 'Overall progress',
        target: 'Target launch',
        budget: 'Agreed project fee',
        scope: 'Scope summary',
        timeline: 'Project milestones',
        artifacts: 'Deliverables & links',
        updates: 'Project updates',
        next: 'Next action',
        owner: 'Owner',
        due: 'Due',
        contact: 'Ask a question',
        back: 'Back to calculator',
        notice:
          'Representative demo data — no real client information is displayed.',
      }
    : {
        demo: '演示门户',
        eyebrow: '客户项目状态',
        progress: '整体进度',
        target: '目标上线',
        budget: '约定项目费用',
        scope: '范围摘要',
        timeline: '项目里程碑',
        artifacts: '交付物与链接',
        updates: '项目动态',
        next: '下一步',
        owner: '负责人',
        due: '截止',
        contact: '提出问题',
        back: '返回计算器',
        notice: '典型演示数据 — 不展示任何真实客户信息。',
      }

  return (
    <section className="client-portal" aria-labelledby="portal-title">
      <div className="portal-container">
        <div className="portal-demo-notice" role="note">
          <span className="portal-demo-badge">{t.demo}</span>
          <span>{t.notice}</span>
        </div>

        <header className="portal-hero">
          <div>
            <p className="portal-eyebrow">{t.eyebrow}</p>
            <h1 id="portal-title">{localize(project.projectName, lang)}</h1>
            <p className="portal-client">{localize(project.client, lang)}</p>
          </div>
          <div className="portal-project-id">
            <span>Project ID</span>
            <code>{project.projectId}</code>
          </div>
        </header>

        <section
          className="portal-progress-card"
          aria-labelledby="portal-progress-title"
        >
          <div className="portal-progress-heading">
            <h2 id="portal-progress-title">{t.progress}</h2>
            <strong>{progress}%</strong>
          </div>
          <div
            className="portal-progress-track"
            role="progressbar"
            aria-valuemin="0"
            aria-valuemax="100"
            aria-valuenow={progress}
            aria-label={`${t.progress}: ${progress}%`}
          >
            <span style={{ width: `${progress}%` }} />
          </div>
          <dl className="portal-summary-grid">
            <div>
              <dt>{t.target}</dt>
              <dd>{formatDate(project.dateRange.target, lang)}</dd>
            </div>
            <div>
              <dt>{t.budget}</dt>
              <dd>{project.budget}</dd>
            </div>
            <div className="portal-summary-scope">
              <dt>{t.scope}</dt>
              <dd>{localize(project.scope, lang)}</dd>
            </div>
          </dl>
        </section>

        <div className="portal-main-grid">
          <section
            className="portal-panel portal-milestones"
            aria-labelledby="portal-milestones-title"
          >
            <h2 id="portal-milestones-title">{t.timeline}</h2>
            <ol>
              {project.milestones.map((milestone) => (
                <li
                  key={milestone.id}
                  className={`portal-milestone portal-milestone--${milestone.status}`}
                >
                  <span className="portal-milestone-dot" aria-hidden="true" />
                  <div>
                    <div className="portal-milestone-heading">
                      <h3>{localize(milestone.title, lang)}</h3>
                      <span className="portal-status">
                        {localize(STATUS_LABELS[milestone.status], lang)}
                      </span>
                    </div>
                    <time dateTime={milestone.date}>
                      {formatDate(milestone.date, lang)}
                    </time>
                    <p>{localize(milestone.detail, lang)}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <aside className="portal-side">
            <section
              className="portal-panel portal-next"
              aria-labelledby="portal-next-title"
            >
              <h2 id="portal-next-title">{t.next}</h2>
              <p>{localize(project.nextAction.text, lang)}</p>
              <dl>
                <div>
                  <dt>{t.owner}</dt>
                  <dd>{localize(project.nextAction.owner, lang)}</dd>
                </div>
                <div>
                  <dt>{t.due}</dt>
                  <dd>{formatDate(project.nextAction.due, lang)}</dd>
                </div>
              </dl>
            </section>

            <section
              className="portal-panel"
              aria-labelledby="portal-artifacts-title"
            >
              <h2 id="portal-artifacts-title">{t.artifacts}</h2>
              <ul className="portal-artifacts">
                {project.deliverables.map((item) => (
                  <li key={item.id}>
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <span>
                        <strong>{localize(item.label, lang)}</strong>
                        <small>{localize(item.detail, lang)}</small>
                      </span>
                      <span aria-hidden="true">↗</span>
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          </aside>
        </div>

        <section
          className="portal-panel portal-updates"
          aria-labelledby="portal-updates-title"
        >
          <h2 id="portal-updates-title">{t.updates}</h2>
          <ol>
            {project.updates.map((update) => (
              <li key={`${update.date}-${update.author}`}>
                <div className="portal-update-meta">
                  <strong>{update.author}</strong>
                  <time dateTime={update.date}>
                    {formatDate(update.date, lang)}
                  </time>
                </div>
                <p>{localize(update.body, lang)}</p>
              </li>
            ))}
          </ol>
        </section>

        <div className="portal-actions no-print">
          <a
            className="btn btn-primary"
            href={`mailto:${EMAIL}?subject=${encodeURIComponent(
              `Project ${project.projectId} question`
            )}`}
          >
            {t.contact}
          </a>
          <a className="btn btn-outline" href={ESTIMATOR_URL}>
            {t.back}
          </a>
          <a className="portal-copy-link" href={portalHome}>
            {en ? 'Permanent demo link' : '固定演示链接'}
          </a>
        </div>
      </div>
    </section>
  )
}
