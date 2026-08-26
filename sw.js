/* Belle Femme · service worker
   Cache-first para los archivos propios, red para lo demás.
   Suba la versión cada vez que publique cambios. */
const VERSION = 'bf-v3';
const ASSETS = [
  './',
  './index.html',
  './admin.html',
  './manifest.webmanifest',
  './manifest-admin.webmanifest',
  './icons/admin-192.png',
  './icons/admin-512.png',
  './icons/admin-apple-touch-icon.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res => {
      if (res.ok && new URL(req.url).origin === location.origin) {
        const copy = res.clone();
        caches.open(VERSION).then(c => c.put(req, copy));
      }
      return res;
    }).catch(() => caches.match('./index.html')))
  );
});
