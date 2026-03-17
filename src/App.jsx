import { useState } from 'react'
import Calculator from './components/Calculator'

export default function App() {
  const [lang, setLang] = useState('en')

  return (
    <>
      <header className="header">
        <div className="container header-inner">
          <a href="#" className="logo">PixelLayer L.L.C</a>
          <div className="lang-switch">
            <button
              type="button"
              className={`lang-btn ${lang === 'en' ? 'active' : ''}`}
              onClick={() => setLang('en')}
            >
              EN
            </button>
            <button
              type="button"
              className={`lang-btn ${lang === 'zh' ? 'active' : ''}`}
              onClick={() => setLang('zh')}
            >
              中文
            </button>
          </div>
        </div>
      </header>
      <main>
        <Calculator lang={lang} />
      </main>
      <footer className="footer">
        <div className="container">
          <p className="footer-text">
            © {new Date().getFullYear()} PixelLayer L.L.C —{' '}
            <a href="mailto:pixellayer7@gmail.com">pixellayer7@gmail.com</a>
          </p>
        </div>
      </footer>
    </>
  )
}
