import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  // Base path for GitHub Pages project site: https://<user>.github.io/CalendarMaker/
  // This ensures built asset URLs are prefixed with /CalendarMaker/
  base: '/CalendarMaker/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
      manifest: {
        name: 'Calendar Customizer',
        short_name: 'Calendar',
        description: 'Design and export printable photo calendars offline.',
        // Ensure the PWA starts within the GitHub Pages base path
        start_url: '/CalendarMaker/',
        scope: '/CalendarMaker/',
        display: 'standalone',
        background_color: '#111827',
        theme_color: '#111827',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            // Cache built assets regardless of whether the site is served from root or a subpath (e.g., /CalendarMaker/)
            urlPattern: ({ url }) => url.origin === self.location.origin && url.pathname.includes('/assets/'),
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'assets' }
          },
          {
            urlPattern: ({ url }) => url.origin.includes('fonts.googleapis.com') || url.origin.includes('fonts.gstatic.com'),
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'google-fonts', expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 } }
          }
        ]
      }
    })
  ]
});
