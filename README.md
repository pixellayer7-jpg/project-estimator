# Project Quote Calculator — PixelLayer L.L.C

A small React app that gives clients an **estimated price range** for common project types (landing page, company website, dashboard). Options include add-ons (design from scratch, multilingual, rush) and extra sections. Final CTA links to email for a fixed quote.

![React](https://img.shields.io/badge/React-18-61dafb?logo=react)
![Vite](https://img.shields.io/badge/Vite-5-646cff?logo=vite)
[![CI](https://github.com/pixellayer7-jpg/project-estimator/actions/workflows/ci.yml/badge.svg)](https://github.com/pixellayer7-jpg/project-estimator/actions/workflows/ci.yml)

- **EN / 中文** — Language toggle in the header (choice is saved in `localStorage`).
- **Email pre-fill** — “Email this estimate” opens the mail client with subject + body listing project type, add-ons, extras, and USD range.
- **Copy summary** — One-click copy of the same text for WeChat / other channels.
- **Config-driven** — Edit `src/data/pricing.js` to change base prices and add-ons (no code logic changes needed).

## For clients / 给客户

- **English** — Estimates are indicative; email **pixellayer7@gmail.com** for a written proposal.
- **中文** — 页面数字仅为估算；正式报价请发邮件至 **pixellayer7@gmail.com**。

Related: [PixelLayer landing page repo](https://github.com/pixellayer7-jpg/1)

## Tech

- React 18 + Vite 5
- Plain CSS (same dark theme as PixelLayer landing)

## Commands

```bash
npm install
npm run dev    # http://localhost:5173
npm run build
npm run preview
```

## Deploy

- **Vercel / Netlify**: connect this repo, build `npm run build`, output `dist`.

## Customize prices

Open `src/data/pricing.js`:

- **projectTypes** — Base min/max (USD) per project type.
- **addOns** — Checkbox options with a `percent` applied to the base range.
- **extraSectionCost** — Min/max added per extra section/page.

## Contact

**PixelLayer L.L.C** — [pixellayer7@gmail.com](mailto:pixellayer7@gmail.com)

## License

MIT. See [LICENSE](./LICENSE).
