import { useEffect, useRef, useState } from 'react'
import { CONTACT_HANDOFF_KEY } from '../utils/contactHandoff'

const STRINGS_EN = {
  title: 'Send a message',
  subtitle:
    'No mail app needed — we’ll get your note by email. Or use the address in the footer.',
  name: 'Name',
  email: 'Email',
  message: 'Message',
  submit: 'Send',
  sending: 'Sending…',
  success: 'Thanks — your message was sent.',
  error: 'Something went wrong. Try email or try again later.',
  privacy:
    'Submitted via Formspree; see their privacy policy for how data is handled.',
}

const STRINGS_ZH = {
  title: '在线留言',
  subtitle: '无需邮件客户端即可发送；也可使用页脚邮箱直接联系。',
  name: '姓名',
  email: '邮箱',
  message: '留言内容',
  submit: '发送',
  sending: '发送中…',
  success: '已收到，感谢留言。',
  error: '发送失败，请改用邮箱联系或稍后重试。',
  privacy: '通过 Formspree 提交，数据处理见其隐私说明。',
}

export default function ContactForm({ lang }) {
  const formId = import.meta.env.VITE_FORMSPREE_FORM_ID
  const t = lang === 'en' ? STRINGS_EN : STRINGS_ZH
  const en = lang === 'en'
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState('idle')
  const statusRef = useRef(null)

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(CONTACT_HANDOFF_KEY)
      if (!raw) return
      const data = JSON.parse(raw)
      if (typeof data?.summary === 'string' && data.summary.trim()) {
        setMessage(data.summary)
      }
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    if (status === 'ok' && statusRef.current) {
      statusRef.current.focus()
    }
  }, [status])

  function bindField(setter) {
    return (e) => {
      setter(e.target.value)
      setStatus((prev) => (prev === 'err' || prev === 'ok' ? 'idle' : prev))
    }
  }

  if (!formId) return null

  async function handleSubmit(e) {
    e.preventDefault()
    setStatus('sending')
    let quoteRef = ''
    try {
      const raw = sessionStorage.getItem(CONTACT_HANDOFF_KEY)
      if (raw) {
        const data = JSON.parse(raw)
        if (typeof data?.quoteRef === 'string') quoteRef = data.quoteRef
      }
    } catch {
      /* ignore */
    }
    const subjectBase = en
      ? 'Message from project quote calculator'
      : '来自项目报价计算器的留言'
    const subject = quoteRef
      ? `${subjectBase} [${quoteRef.slice(0, 8)}]`
      : subjectBase
    try {
      const res = await fetch(`https://formspree.io/f/${formId}`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          message,
          _subject: subject,
        }),
      })
      await res.json().catch(() => ({}))
      if (res.ok) {
        setStatus('ok')
        setName('')
        setEmail('')
        setMessage('')
      } else {
        setStatus('err')
      }
    } catch {
      setStatus('err')
    }
  }

  return (
    <section
      className="contact-section"
      id="contact"
      aria-labelledby="contact-title"
    >
      <div className="container">
        <h2 id="contact-title" className="section-title">
          {t.title}
        </h2>
        <p className="section-subtitle">{t.subtitle}</p>

        <form
          className="contact-form"
          onSubmit={handleSubmit}
          noValidate
          aria-busy={status === 'sending'}
        >
          <div className="contact-fields">
            <label className="contact-label" htmlFor="contact-name">
              {t.name}
            </label>
            <input
              id="contact-name"
              name="name"
              type="text"
              className="contact-input"
              value={name}
              onChange={bindField(setName)}
              required
              maxLength={120}
              autoComplete="name"
            />

            <label className="contact-label" htmlFor="contact-email">
              {t.email}
            </label>
            <input
              id="contact-email"
              name="email"
              type="email"
              className="contact-input"
              value={email}
              onChange={bindField(setEmail)}
              required
              maxLength={320}
              autoComplete="email"
            />

            <label className="contact-label" htmlFor="contact-message">
              {t.message}
            </label>
            <textarea
              id="contact-message"
              name="message"
              className="contact-textarea"
              rows={4}
              value={message}
              onChange={bindField(setMessage)}
              required
              maxLength={8000}
            />
          </div>

          <div className="contact-actions">
            <button
              type="submit"
              className="btn btn-primary contact-submit"
              disabled={status === 'sending'}
            >
              {status === 'sending' ? t.sending : t.submit}
            </button>
          </div>

          {status === 'ok' && (
            <p
              ref={statusRef}
              className="contact-feedback contact-feedback--ok"
              role="status"
              tabIndex={-1}
            >
              {t.success}
            </p>
          )}
          {status === 'err' && (
            <p className="contact-feedback contact-feedback--err" role="alert">
              {t.error}
            </p>
          )}

          <p className="contact-privacy">{t.privacy}</p>
        </form>
      </div>
    </section>
  )
}
