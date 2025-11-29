import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json}']
      },
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'icons/icon-192x192.png', 'icons/icon-512x512.png'],
      manifest: {
        name: 'Skydale DryFruits',
        short_name: 'DryFruits',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        display_override: ['fullscreen', 'standalone'],
        orientation: 'portrait',
        background_color: '#ffffff',
        theme_color: '#e73853ff',
        icons: [
          { src: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' }
        ]
      }
    })
  ],
  base: '/',
  server: {
    allowedHosts: true,   // allow any external host (ngrok)
    hmr: {
      clientPort: 443,     // required for HTTPS via ngrok
    }
  }
})

