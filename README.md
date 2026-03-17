# Project Quote Calculator — PixelLayer L.L.C

A small React app that gives clients an **estimated price range** for common project types (landing page, company website, dashboard). Options include add-ons (design from scratch, multilingual, rush) and extra sections. Final CTA links to email for a fixed quote.

- **EN / 中文** — Language toggle in the header.
- **Config-driven** — Edit `src/data/pricing.js` to change base prices and add-ons (no code logic changes needed).

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

## Customize prices

Open `src/data/pricing.js`:

- **projectTypes** — Base min/max (USD) per project type.
- **addOns** — Checkbox options with a `percent` applied to the base range.
- **extraSectionCost** — Min/max added per extra section/page.

## Contact

**PixelLayer L.L.C** — [pixellayer7@gmail.com](mailto:pixellayer7@gmail.com)

## License

MIT. See [LICENSE](./LICENSE).
