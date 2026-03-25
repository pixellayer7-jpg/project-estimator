import { useEffect, useState } from 'react'
import Calculator from './components/Calculator'

const LANG_KEY = 'pixellayer-estimator-lang'

export default function App() {
  const [lang, setLang] = useState(() => {
    try {
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
  }, [lang])

  return (
    <>
      <a href="#main-content" className="skip-link">
        {lang === 'en' ? 'Skip to calculator' : '跳到计算器'}
      </a>
      <header className="header">
        <div className="container header-inner">
          <a href="#" className="logo">PixelLayer L.L.C</a>
          <div className="lang-switch" role="group" aria-label={lang === 'en' ? 'Language' : '语言'}>
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
      </header>
      <main id="main-content">
        <Calculator lang={lang} />
      </main>
      <footer className="footer">
        <div className="container">
          <p className="footer-text">
            © {new Date().getFullYear()} PixelLayer L.L.C —{' '}
            <a href="mailto:pixellayer7@gmail.com">pixellayer7@gmail.com</a>
            {' · '}
            <a
              href="https://github.com/pixellayer7-jpg/1"
              target="_blank"
              rel="noopener noreferrer"
            >
              {lang === 'en' ? 'Main site repo' : '主站仓库'}
            </a>
          </p>
        </div>
      </footer>
    </>
  )
}
