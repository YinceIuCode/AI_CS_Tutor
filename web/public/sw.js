// OffByOne PWA Service Worker
const CACHE_NAME = 'offbyone-pwa-v1';

const STATIC_PRECACHE = [
  '/',
  '/manifest.json',
  '/brand-icon.png',
  '/icon.png',
  '/icon-192.png',
  '/icon-512.png',
  '/favicon.ico'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_PRECACHE).catch(() => {
        // Tolerant to offline development precache misses
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Bypass cache for API calls, chrome extensions, and Next.js hot reload during development
  if (
    url.pathname.startsWith('/api') ||
    url.pathname.includes('/_next/webpack-hmr') ||
    !url.protocol.startsWith('http')
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request)
        .then((networkResponse) => {
          // Cache successful static asset responses
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            (url.pathname.endsWith('.png') ||
              url.pathname.endsWith('.ico') ||
              url.pathname.endsWith('.json') ||
              url.pathname.endsWith('.svg'))
          ) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Fallback if offline
          return caches.match('/');
        });
    })
  );
});
