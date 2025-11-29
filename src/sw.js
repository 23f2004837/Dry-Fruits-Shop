import { precacheAndRoute } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import { NetworkFirst, CacheFirst, StaleWhileRevalidate } from 'workbox-strategies'

// Precache manifest will be injected by vite-plugin-pwa (workbox)
precacheAndRoute(self.__WB_MANIFEST || [])

// Install/activate lifecycle - take control immediately
self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

// Navigation requests: network first (so kiosk can update content), fallback to cache
registerRoute(
  ({ request }) => request.mode === 'navigate',
  new NetworkFirst({
    cacheName: 'pages-cache',
    networkTimeoutSeconds: 3,
    plugins: []
  })
)

// Cache CSS/JS: StaleWhileRevalidate
registerRoute(
  ({ request }) => request.destination === 'script' || request.destination === 'style',
  new StaleWhileRevalidate({ cacheName: 'static-resources' })
)

// Cache images: CacheFirst with max entries
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images-cache',
    plugins: []
  })
)

// Optionally add runtime caching for API calls (example commented)
// registerRoute(
//   ({ url }) => url.pathname.startsWith('/api/'),
//   new NetworkFirst({ cacheName: 'api-cache' })
// )
