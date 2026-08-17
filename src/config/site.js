/** Public URLs — override at build via VITE_* (see .env.example). */
export const LANDING_URL =
  import.meta.env.VITE_LANDING_URL || 'https://pixellayer7-jpg.github.io/1/'

export const ESTIMATOR_URL =
  import.meta.env.VITE_SITE_URL ||
  'https://pixellayer7-jpg.github.io/project-estimator/'

export const GITHUB_PROFILE = 'https://github.com/pixellayer7-jpg'
export const EMAIL = 'pixellayer7@gmail.com'

export const PAYMENT_METHOD = {
  en: 'Bank transfer / Zelle / agreed method (confirmed by email)',
  zh: '银行转账 / Zelle / 邮件确认的约定方式',
}

export const PROVIDER_SIGN = 'He Zhang · PixelLayer L.L.C'
