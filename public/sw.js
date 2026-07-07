// ─── PULSO — Service Worker ──────────────────────────────
// Cache-first strategy for all static assets.
// On install, pre-caches the app shell. On fetch, serves from cache
// falling back to network, caching the response for next time.

const CACHE = 'pulso-v1';

// Resources to pre-cache on install
const PRECACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.svg',
  './icon-512.svg',
];

// ─── Install: pre-cache app shell ──────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => {
      return cache.addAll(PRECACHE);
    }).then(() => self.skipWaiting()),
  );
});

// ─── Activate: clean old caches ────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)),
      );
    }).then(() => self.clients.claim()),
  );
});

// ─── Fetch: cache-first, network fallback ──────────────────
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request).then((response) => {
        // Cache successful responses for future offline use
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE).then((cache) => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        // Offline and not in cache — return fallback for navigation
        if (event.request.mode === 'navigate') {
          return caches.match('./');
        }
        return new Response('Offline', { status: 503 });
      });
    }),
  );
});
