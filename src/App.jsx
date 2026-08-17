import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import Calculator from './components/Calculator'
import PricingOverview from './components/PricingOverview'
import EcosystemStrip from './components/EcosystemStrip'
import { GITHUB_PROFILE, LANDING_URL, EMAIL } from './config/site'
import { portalDemo } from './data/clientPortalDemo'
import {
  buildPortalFromQuote,
  resolveQuoteInputFromLocation,
} from './utils/portalFromQuote'
import { isQuoteAccepted } from './utils/portalAcceptStore'

const ContactForm = lazy(() => import('./components/ContactForm'))
const CrmAdmin = lazy(() => import('./components/CrmAdmin'))
const ClientPortal = lazy(() => import('./components/ClientPortal'))
const Proposal = lazy(() => import('./components/Proposal'))

const LANG_KEY = 'pixellayer-estimator-lang'

function detectAdminMode() {
  try {
    const params = new URLSearchParams(window.location.search)
    return params.get('admin') === '1' || window.location.hash === '#admin'
  } catch {
    return false
  }
}

function detectPortalKind() {
  try {
    const v = new URLSearchParams(window.location.search).get('portal')
    if (v === 'demo' || v === 'quote') return v
  } catch {
    /* ignore */
  }
  return null
}

function detectProposalTab() {
  try {
    const v = new URLSearchParams(window.location.search).get('proposal')
    if (v === 'invoice') return 'invoice'
    if (v === 'sow' || v === '1' || v === 'true') return 'sow'
  } catch {
    /* ignore */
  }
  return null
}

function resolvePortalProject(kind) {
  if (kind !== 'quote') return portalDemo
  const input = resolveQuoteInputFromLocation()
  return buildPortalFromQuote({
    ...input,
    accepted: isQuoteAccepted(input.quoteRef),
  })
}

export default function App() {
  const [showAdmin] = useState(detectAdminMode)
  const [portalKind] = useState(detectPortalKind)
  const [proposalTab] = useState(detectProposalTab)
  const showProposal = Boolean(proposalTab)
  const showPortal = Boolean(portalKind) && !showProposal
  const quoteInput = useMemo(
    () =>
      showProposal || portalKind === 'quote'
        ? resolveQuoteInputFromLocation()
        : null,
    [showProposal, portalKind]
  )
  const portalProject = useMemo(
    () => resolvePortalProject(portalKind),
    [portalKind]
  )
  const [lang, setLang] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search)
      const q = params.get('lang')
      if (q === 'en' || q === 'zh') return q
      const s = localStorage.getItem(LANG_KEY)
      if (s === 'en' || s === 'zh') return s
    } catch {
      /* ignore */
    }
    return 'en'
  })

  useEffect(() => {
    try {
      localStorage.setItem(LANG_KEY, lang)
    } catch {
      /* ignore */
    }
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en'
    if (showProposal) {
      document.title =
        lang === 'zh'
          ? '客户提案 — PixelLayer L.L.C'
          : 'Client Proposal — PixelLayer L.L.C'
    } else if (showPortal) {
      document.title =
        lang === 'zh'
          ? '客户项目状态 — PixelLayer L.L.C'
          : 'Client Project Status — PixelLayer L.L.C'
    } else {
      document.title =
        lang === 'zh'
          ? '项目报价计算器 — PixelLayer L.L.C'
          : 'Project Quote Calculator — PixelLayer L.L.C'
    }
  }, [lang, showPortal, showProposal])

  const handleHydratedLang = useCallback((next) => {
    if (next === 'en' || next === 'zh') setLang(next)
  }, [])

  const skipLabel = showProposal
    ? lang === 'en'
      ? 'Skip to proposal'
      : '跳到提案'
    : showPortal
      ? lang === 'en'
        ? 'Skip to project status'
        : '跳到项目状态'
      : lang === 'en'
        ? 'Skip to calculator'
        : '跳到计算器'

  return (
    <>
      <a href="#main-content" className="skip-link">
        {skipLabel}
      </a>
      {!showAdmin && !showPortal && !showProposal ? (
        <a href="#contact" className="skip-link skip-link--second">
          {lang === 'en' ? 'Skip to contact form' : '跳到留言表单'}
        </a>
      ) : null}
      <header className="header" role="banner">
        <div className="container header-inner">
          <a
            href={LANDING_URL}
            className="logo"
            target="_blank"
            rel="noopener noreferrer"
          >
            PixelLayer L.L.C
          </a>
          <div className="header-actions no-print">
            <a
              href={LANDING_URL}
              className="header-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              {lang === 'en' ? 'Main site' : '主站'}
            </a>
            <a
              href={`${GITHUB_PROFILE}/project-estimator`}
              className="header-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              {lang === 'en' ? 'GitHub' : '本工具仓库'}
            </a>
            <div
              className="lang-switch"
              role="group"
              aria-label={lang === 'en' ? 'Language' : '语言'}
            >
              <button
                type="button"
                className={`lang-btn ${lang === 'en' ? 'active' : ''}`}
                onClick={() => setLang('en')}
                aria-pressed={lang === 'en'}
              >
                EN
              </button>
              <button
                type="button"
                className={`lang-btn ${lang === 'zh' ? 'active' : ''}`}
                onClick={() => setLang('zh')}
                aria-pressed={lang === 'zh'}
              >
                中文
              </button>
            </div>
          </div>
        </div>
      </header>
      <EcosystemStrip lang={lang} />
      <main id="main-content">
        {showProposal ? (
          <Suspense fallback={<p role="status">Loading proposal…</p>}>
            <Proposal
              lang={lang}
              quoteInput={quoteInput}
              initialTab={proposalTab}
            />
          </Suspense>
        ) : showPortal ? (
          <Suspense fallback={<p role="status">Loading client portal…</p>}>
            <ClientPortal lang={lang} project={portalProject} />
          </Suspense>
        ) : showAdmin ? (
          <Suspense fallback={<p role="status">Loading admin…</p>}>
            <CrmAdmin lang={lang} />
          </Suspense>
        ) : (
          <>
            <PricingOverview lang={lang} />
            <Calculator lang={lang} onHydratedLang={handleHydratedLang} />
            <Suspense
              fallback={
                <p
                  className="contact-suspense-fallback"
                  role="status"
                  aria-live="polite"
                >
                  {lang === 'en'
                    ? 'Loading contact form…'
                    : '正在加载留言表单…'}
                </p>
              }
            >
              <ContactForm lang={lang} />
            </Suspense>
          </>
        )}
      </main>
      <footer className="footer" role="contentinfo">
        <div className="container">
          <p className="footer-text">
            © {new Date().getFullYear()} PixelLayer L.L.C —{' '}
            <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
            {' · '}
            <a
              href={`${LANDING_URL}#legal`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {lang === 'en' ? 'Privacy' : '隐私'}
            </a>
            {' · '}
            <a href={LANDING_URL} target="_blank" rel="noopener noreferrer">
              {lang === 'en' ? 'Marketing site' : '营销主站'}
            </a>
            {' · '}
            <a
              href={`${GITHUB_PROFILE}/project-estimator`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {lang === 'en' ? 'Source' : '源码'}
            </a>
          </p>
        </div>
      </footer>
    </>
  )
}
