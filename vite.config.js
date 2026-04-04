/// <reference types="vitest/config" />
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const siteUrl = (env.VITE_SITE_URL || '').replace(/\/+$/, '')

  return {
    plugins: [
      react(),
      {
        name: 'inject-site-url-meta',
        transformIndexHtml() {
          if (!siteUrl) return []
          const canonical = `${siteUrl}/`
          const ogImage = `${siteUrl}/favicon.svg`
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
              attrs: { name: 'twitter:url', content: canonical },
              injectTo: 'head',
            },
            {
              tag: 'meta',
              attrs: { name: 'twitter:image', content: ogImage },
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
