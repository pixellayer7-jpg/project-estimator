import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import Calculator from './components/Calculator'
import PricingOverview from './components/PricingOverview'
import EcosystemStrip from './components/EcosystemStrip'
import { GITHUB_PROFILE, LANDING_URL, EMAIL } from './config/site'

const ContactForm = lazy(() => import('./components/ContactForm'))
const QuoteAdmin = lazy(() => import('./components/QuoteAdmin'))

const LANG_KEY = 'pixellayer-estimator-lang'

function detectAdminMode() {
  try {
    const params = new URLSearchParams(window.location.search)
    return params.get('admin') === '1' || window.location.hash === '#admin'
  } catch {
    return false
  }
}

export default function App() {
  const [showAdmin] = useState(detectAdminMode)
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
    document.title =
      lang === 'zh'
        ? '项目报价计算器 — PixelLayer L.L.C'
        : 'Project Quote Calculator — PixelLayer L.L.C'
  }, [lang])

  const handleHydratedLang = useCallback((next) => {
    if (next === 'en' || next === 'zh') setLang(next)
  }, [])

  return (
    <>
      <a href="#main-content" className="skip-link">
        {lang === 'en' ? 'Skip to calculator' : '跳到计算器'}
      </a>
      <a href="#contact" className="skip-link skip-link--second">
        {lang === 'en' ? 'Skip to contact form' : '跳到留言表单'}
      </a>
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
        {showAdmin ? (
          <Suspense fallback={<p role="status">Loading admin…</p>}>
            <QuoteAdmin lang={lang} />
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
