# Project Quote Calculator — PixelLayer L.L.C

A small React app that gives clients an **estimated price range** for common project types (landing page, company website, dashboard). Options include add-ons (design from scratch, multilingual, rush) and extra sections. Final CTA links to email for a fixed quote.

![React](https://img.shields.io/badge/React-18-61dafb?logo=react)
![Vite](https://img.shields.io/badge/Vite-5-646cff?logo=vite)
[![CI](https://github.com/pixellayer7-jpg/project-estimator/actions/workflows/ci.yml/badge.svg)](https://github.com/pixellayer7-jpg/project-estimator/actions/workflows/ci.yml)
[![Pages](https://github.com/pixellayer7-jpg/project-estimator/actions/workflows/pages.yml/badge.svg)](https://github.com/pixellayer7-jpg/project-estimator/actions/workflows/pages.yml)

**Live demo:** [https://pixellayer7-jpg.github.io/project-estimator/](https://pixellayer7-jpg.github.io/project-estimator/) — works after **Settings → Pages → GitHub Actions** is enabled and a deploy succeeds.

Static **`<head>`** tweaks: `referrer` policy for outbound privacy, and **preconnect** to Google Fonts (used in `index.css`).

**`public/robots.txt`** — copied to site root on build so crawlers can index the deployed calculator (when hosted at a public URL).

- **EN / 中文** — Language toggle in the header (choice is saved in `localStorage`).
- **Email pre-fill** — “Email this estimate” opens the mail client with subject + body listing project type, add-ons, extras, and USD range.
- **Copy summary** — One-click copy of the same text for WeChat / other channels.
- **Preview** — Expandable block shows the exact text that will appear in the email body.
- **Keyboard** — Arrow keys / Home / End move between project types when focused.
- **i18n** — `document` `lang` and page title update when switching EN / 中文.
- **Persistence** — Project type, add-ons, and extra sections are saved in `localStorage` (debounced while typing) until reset.
- **Timeline hints** — Typical delivery window per project type (editable in `pricing.js`).
- **Download** — Export the same summary as `pixellayer-quote-summary.txt`.
- **Print** — Print-friendly styles for the estimate card; interactive chrome hidden when printing.
- **Validation** — Extra sections are clamped to 0–20 in logic, on blur in the UI, and in quote/summary math.
- **Header** — Link to this repository on GitHub.
- **Landmarks** — `banner` / `contentinfo` roles for assistive tech; Twitter Card meta for sharing.
- **Config-driven** — Edit `src/data/pricing.js` to change base prices and add-ons (no code logic changes needed).
- **SEO (deploy)** — Set `VITE_SITE_URL` at build time to inject `rel=canonical`, `og:url`, `og:image` (site `favicon.svg`), and matching Twitter tags (see [Deploy](#deploy)).
- **Contact form (optional)** — Set `VITE_FORMSPREE_FORM_ID` to show a Formspree-powered message form below the calculator (no mail client required). Fields have sensible **max lengths**; the lazy-loaded chunk shows a short **loading** status for assistive tech.
- **Dark UI hints** — `color-scheme: dark` in HTML/CSS so browsers use dark scrollbars and native controls where supported.
- **Quote reference** — Each device gets a persisted **UUID** for correspondence (email subject prefix + summary body). **Reset** issues a new id. No server; fine for lightweight commercial use until you add a backend.
- **Print / PDF** — “Print / Save as PDF” opens the system print dialog so clients can save the styled estimate (same print rules as before).

## Commercial readiness / 商单准备（无需新账号即可完成的部分）

已在应用内提供：**报价编号**、**邮件主题短码**、**打印/PDF**、**robots.txt**、SEO 元数据、表单与测试。你仍需自行完成（涉及账号或法律）的事项示例：

| You still handle / 需你自行处理   | Why                          |
| --------------------------------- | ---------------------------- |
| **Stripe / Lemon Squeezy** 等收款 | 需商户身份与平台注册         |
| **域名与 DNS**                    | 需购买与解析                 |
| **Terms of Service / 隐私政策**   | 需律师或模板按司法辖区定稿   |
| **企业邮箱与 SPF/DKIM**           | 提高邮件送达率               |
| **服务端存报价、登录、分享链接**  | 需数据库与 API（可后续迭代） |

## For clients / 给客户

- **English** — Estimates are indicative; email **pixellayer7@gmail.com** for a written proposal.
- **中文** — 页面数字仅为估算；正式报价请发邮件至 **pixellayer7@gmail.com**。

Related: [PixelLayer landing page repo](https://github.com/pixellayer7-jpg/1) · [estimator-api](https://github.com/pixellayer7-jpg/estimator-api) **v0.3.8+** — optional backend: `POST` / `GET` quote by **UUID** id (malformed id → 400), **`GET /api/v1/quotes?limit=`** list (no `summary` in list items; protect in production); responses set **`X-Content-Type-Options: nosniff`**; **`POST`** JSON body max **256 KiB**.

## Tech

- React 18 + Vite 5
- Plain CSS (same dark theme as PixelLayer landing)

## Commands

```bash
npm install
npm run dev    # http://localhost:5173
npm run build
npm run preview
npm run lint   # ESLint
npm run format # Prettier write
npm run format:check
npm test       # Vitest: pricing, quoteSummary, storage, Calculator, ContactForm
npm run test:watch
```

Tests live next to sources (`*.test.js` / `*.test.jsx`). CI runs `npm run lint`, then `npm test`, then `npm run build`.

- **Error boundary** — Uncaught render errors show a bilingual fallback with a reload button instead of a blank screen.
- **ESLint** — `npm run lint` (React, hooks, refresh plugin; config in `eslint.config.js`).

## Deploy

Copy `.env.example` to `.env.production.local` (or configure vars in the host UI). Do **not** commit real secrets.

| Variable                 | Purpose                                                                                                                                                                                                                                                                                                                                     |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `VITE_SITE_URL`          | Public origin **without** trailing slash, e.g. `https://pixellayer7-jpg.github.io/project-estimator` or `https://your-app.vercel.app`. Injected at build as canonical, Open Graph / Twitter URL, and **image** (`…/favicon.svg`). Some networks prefer PNG for previews; replace `public/favicon.svg` or extend `vite.config.js` if needed. |
| `VITE_FORMSPREE_FORM_ID` | Formspree form id (from `https://formspree.io/f/<id>`). If empty, the contact section is hidden.                                                                                                                                                                                                                                            |

### GitHub Pages

1. Repo **Settings → Pages → Build and deployment**: source **GitHub Actions**.
2. Optional: **Settings → Secrets and variables → Actions** → add `FORMSPREE_FORM_ID` so the deployed site shows the form.
3. Push to `main`: workflow [`.github/workflows/pages.yml`](./.github/workflows/pages.yml) runs tests, builds with `VITE_SITE_URL` set to this repo’s Pages URL, and publishes `dist`.  
   If you fork or rename the repo, update `VITE_SITE_URL` in that workflow file.

### Vercel / Netlify

Connect the repo, set **build** `npm run build`, output **`dist`**. Add environment variables `VITE_SITE_URL` and `VITE_FORMSPREE_FORM_ID` for **Production** (and Preview if you want the form there).

## Customize prices

Open `src/data/pricing.js`:

- **projectTypes** — Base min/max (USD) per project type.
- **addOns** — Checkbox options with a `percent` applied to the base range.
- **extraSectionCost** — Min/max added per extra section/page.

## Contact

**PixelLayer L.L.C** — [pixellayer7@gmail.com](mailto:pixellayer7@gmail.com)

## Security

Report vulnerabilities privately: [SECURITY.md](./SECURITY.md).

## License

MIT. See [LICENSE](./LICENSE).
