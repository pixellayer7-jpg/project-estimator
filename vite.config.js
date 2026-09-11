/// <reference types="vitest/config" />
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const siteUrl = (
    env.VITE_SITE_URL ||
    'https://pixellayer7-jpg.github.io/project-estimator'
  ).replace(/\/+$/, '')

  return {
    plugins: [
      react(),
      {
        name: 'inject-site-url-meta',
        transformIndexHtml() {
          const canonical = `${siteUrl}/`
          const ogImage = `${siteUrl}/og-image.svg`
          return [
            {
              tag: 'link',
              attrs: { rel: 'canonical', href: canonical },
              injectTo: 'head',
            },
            {
              tag: 'meta',
              attrs: { property: 'og:url', content: canonical },
              injectTo: 'head',
            },
            {
              tag: 'meta',
              attrs: { property: 'og:image', content: ogImage },
              injectTo: 'head',
            },
            {
              tag: 'meta',
              attrs: { property: 'og:image:width', content: '1200' },
              injectTo: 'head',
            },
            {
              tag: 'meta',
              attrs: { property: 'og:image:height', content: '630' },
              injectTo: 'head',
            },
            {
              tag: 'meta',
              attrs: { property: 'og:image:alt', content: 'PixelLayer project quote calculator' },
              injectTo: 'head',
            },
            {
              tag: 'meta',
              attrs: { name: 'twitter:card', content: 'summary_large_image' },
              injectTo: 'head',
            },
            {
              tag: 'meta',
              attrs: { name: 'twitter:url', content: canonical },
              injectTo: 'head',
            },
            {
              tag: 'meta',
              attrs: { name: 'twitter:image', content: ogImage },
              injectTo: 'head',
            },
            {
              tag: 'meta',
              attrs: {
                name: 'twitter:image:alt',
                content: 'PixelLayer project quote calculator',
              },
              injectTo: 'head',
            },
          ]
        },
      },
    ],
    base: './',
    test: {
      environment: 'jsdom',
      setupFiles: './src/test/setup.js',
      globals: false,
      css: true,
    },
  }
})
