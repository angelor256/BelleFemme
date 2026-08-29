const VERSION = 'bf-v6';
const SHELL = [
  './',
  './index.html',
  './admin.html',
  './manifest.webmanifest',
  './manifest-admin.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(VERSION).then(c => Promise.allSettled(SHELL.map(u => c.add(u))))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)));
    if (self.registration.navigationPreload) {
      try { await self.registration.navigationPreload.enable(); } catch (e) {}
    }
    await self.clients.claim();
  })());
});

/* La página pide instalar la versión nueva desde el aviso "Actualizar" */
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

const esHTML = req =>
  req.mode === 'navigate' ||
  (req.headers.get('accept') || '').includes('text/html');

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return; // tipografías de Google: al navegador

  /* HTML: red primero. Así la app instalada siempre abre la última versión. */
  if (esHTML(req)) {
    event.respondWith((async () => {
      try {
        const pre = await event.preloadResponse;
        const net = pre || await fetch(req, { cache: 'no-store' });
        const cache = await caches.open(VERSION);
        cache.put(req, net.clone());
        return net;
      } catch (e) {
        const cache = await caches.open(VERSION);
        return (await cache.match(req)) || (await cache.match('./index.html')) || Response.error();
      }
    })());
    return;
  }

  /* Resto: caché primero y se refresca por detrás. */
  event.respondWith((async () => {
    const cache = await caches.open(VERSION);
    const hit = await cache.match(req);
    const red = fetch(req).then(res => {
      if (res && res.status === 200 && res.type === 'basic') cache.put(req, res.clone());
      return res;
    }).catch(() => hit);
    return hit || red;
  })());
});
