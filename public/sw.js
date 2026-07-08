// VERSION is set by the main thread via postMessage (SET_VERSION).
// Until then, use 'dev' as fallback. The SW defers precaching until
// it receives the real version so the cache name is always correct.
let VERSION = 'dev';
let CACHE = 'pulso-' + VERSION;

const PRECACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.svg',
  './icon-512.svg',
];

self.addEventListener('install', (event) => {
  // Skip waiting immediately so the main thread can send SET_VERSION
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    self.clients.matchAll().then((clients) => {
      // Tell all clients we're active; they'll send SET_VERSION
      clients.forEach((client) => client.postMessage({ type: 'SW_READY' }));
    }).then(() => self.clients.claim()),
  );
});

self.addEventListener('message', (event) => {
  const data = event.data;
  if (!data) return;

  if (data.type === 'SET_VERSION') {
    const newVersion = data.version;
    const oldCache = CACHE;

    VERSION = newVersion;
    CACHE = 'pulso-' + VERSION;

    // Clean old caches and precache with the correct name
    event.waitUntil(
      caches.keys().then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      ).then(() => caches.open(CACHE)).then((cache) => cache.addAll(PRECACHE)).then(() => {
        // Notify clients only if a previous version existed (not first visit)
        self.clients.matchAll().then((clients) => {
          const prevKey = keys.find((k) => k.startsWith('pulso-') && k !== CACHE);
          if (prevKey) {
            clients.forEach((client) =>
              client.postMessage({ type: 'SW_UPDATED', version: VERSION }),
            );
          }
        });
      }),
    );
  } else if (data.type === 'GET_VERSION') {
    event.source.postMessage({ type: 'SW_VERSION', version: VERSION });
  }
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  // Navigation (HTML) — network-first: always try fresh, cache as fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          if (res && res.status === 200) {
            const clone = res.clone();
            caches.open(CACHE).then((cache) => cache.put(event.request, clone));
          }
          return res;
        })
        .catch(() => caches.match(event.request).then((cached) => cached || caches.match('./'))),
    );
    return;
  }

  // Static assets (JS, CSS, fonts, images) — cache-first
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((res) => {
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE).then((cache) => cache.put(event.request, clone));
        }
        return res;
      }).catch(() => new Response('Offline', { status: 503 }));
    }),
  );
});
