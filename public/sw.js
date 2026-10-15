/* Usman Gym service worker.
 *
 * Goals: installable app + fast repeat loads + a friendly offline screen.
 * Deliberately NOT cached: anything under /api and /uploads. Fee status, profile data and payment screenshots are
 * private and must always come fresh from the server (and never be readable from a shared device's cache).
 */
const VERSION = 'v3';
// Registered as /sw.js?mode=dev under `next dev`: still makes the app installable, but caches nothing (dev chunks are not hashed).
const DEV = new URL(self.location.href).searchParams.get('mode') === 'dev';
const STATIC_CACHE = `ug-static-${VERSION}`;
const OFFLINE_URL = '/offline.html'; // plain static file: needs no JS/CSS from the network

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(STATIC_CACHE);
      try {
        await cache.add(new Request(OFFLINE_URL, { cache: 'reload' }));
        await Promise.all(['/icons/icon-192.png', '/icons/icon-512.png'].map((u) => cache.add(u).catch(() => undefined)));
      } catch {
        // Offline fallback is best-effort; the app still works online without it.
      }
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k.startsWith('ug-') && k !== STATIC_CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

const isStaticAsset = (url) =>
  url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/icons/') || /\.(?:woff2?|ttf)$/.test(url.pathname);

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // third-party images etc. go straight to the network
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/uploads/') || url.pathname === '/sw.js') return;
  if (DEV) return; // pass-through: the browser handles the request normally

  // Page navigations: always try the network (fresh data); show the offline page if it is unreachable.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(async () => (await caches.match(OFFLINE_URL)) || new Response('You are offline.', { status: 503, headers: { 'Content-Type': 'text/plain' } })),
    );
    return;
  }

  // Hashed build assets and icons never change for a given URL: cache-first.
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(STATIC_CACHE).then((c) => c.put(req, copy));
            }
            return res;
          }),
      ),
    );
  }
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
