// sw.js
const CACHE_NAME = 'bellefemme-v2'; // He incrementado la versión a v2 para forzar la actualización
const urlsToCache = [
  './',
  './index.html',
  './manifest.json'
  // Si tienes archivos CSS o JS separados, agrégalos aquí. 
  // Al estar todo en el HTML, con cachear el index es suficiente.
];

// 1. Instalación: Abre la caché y añade los recursos
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Caché abierta');
        return cache.addAll(urlsToCache);
      })
      .catch(err => console.error('Error al cachear:', err))
  );
  // Forzar la activación inmediata sin esperar a que se cierren las pestañas anteriores
  self.skipWaiting();
});

// 2. Activación: Limpia las cachés antiguas
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Eliminando caché antigua:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Toma el control de todas las pestañas inmediatamente
  self.clients.claim();
});

// 3. Fetch: Estrategia Cache First con fallback a red
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Si existe en caché, lo devuelve
        if (response) {
          return response;
        }
        // Si no, hace la petición a la red
        return fetch(event.request).then(
          response => {
            // Comprueba si es una respuesta válida
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            // Clona la respuesta para guardarla en caché y devolverla
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
            return response;
          }
        );
      })
  );
});
