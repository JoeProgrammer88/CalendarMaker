const CACHE_VERSION = 'v1';
const STATIC_CACHE = `static-${CACHE_VERSION}`;

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => {
      if (!k.startsWith('static-') || k !== STATIC_CACHE) return caches.delete(k);
    }));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Navigation: network-first, fallback to cached index.html
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const res = await fetch(req);
        const cache = await caches.open(STATIC_CACHE);
        cache.put('/index.html', res.clone());
        return res;
      } catch (_) {
        const cache = await caches.open(STATIC_CACHE);
        const cached = await cache.match('/index.html');
        return cached || new Response('<!doctype html><title>Offline</title><h1>Offline</h1>', { headers: { 'Content-Type': 'text/html' } });
      }
    })());
    return;
  }

  // Assets: stale-while-revalidate for JS/CSS/fonts/images
  const assetMatch = /\.(?:js|css|woff2?|png|jpg|jpeg|svg)$/.test(url.pathname);
  if (assetMatch) {
    event.respondWith((async () => {
      const cache = await caches.open(STATIC_CACHE);
      const cached = await cache.match(req);
      const fetchPromise = fetch(req).then((res) => {
        if (res.status === 200) cache.put(req, res.clone());
        return res;
      }).catch(() => undefined);
      return cached || fetchPromise || fetch(req);
    })());
  }
});
