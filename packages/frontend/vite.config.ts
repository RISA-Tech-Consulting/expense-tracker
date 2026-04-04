import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

const base = process.env.GITHUB_ACTIONS ? '/expense-tracker/' : '/';

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon-512.svg', 'apple-touch-icon.svg'],
      manifest: {
        name: 'Expense Tracker',
        short_name: 'Expenses',
        description: 'Track personal expenses and generate tax insights',
        theme_color: '#2563EB',
        background_color: '#ffffff',
        display: 'standalone',
        scope: base,
        start_url: base,
        icons: [
          {
            src: 'icon-512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any',
          },
          {
            src: 'icon-512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallbackDenylist: [/^\/api/],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/cdn\.jsdelivr\.net\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'cdn-cache',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
          {
            urlPattern: /^https:\/\/(apis\.google\.com|accounts\.google\.com|www\.googleapis\.com|oauth2\.googleapis\.com)\/.*/i,
            handler: 'NetworkOnly',
          },
        ],
      },
    }),
  ],
  server: {
    port: 3000,
    proxy: {
      '/api': 'http://localhost:3001'
    }
  }
});
