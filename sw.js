// 🔥 změň při každém vydání
const CACHE_VERSION = 'v3';

const CACHE_NAME = 'gdx-lab-' + CACHE_VERSION;

const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg'
];

// INSTALL
self.addEventListener('install', event => {
  console.log('SW install', CACHE_VERSION);

  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS);
    })
  );
});

// ACTIVATE
self.addEventListener('activate', event => {
  console.log('SW activate', CACHE_VERSION);

  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            console.log('Deleting old cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// FETCH
self.addEventListener('fetch', event => {
  // HTML vždy zkus nejdřív ze sítě
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const copy = response.clone();

          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, copy);
          });

          return response;
        })
        .catch(() => caches.match('./index.html'))
    );

    return;
  }

  // ostatní soubory cache-first
  event.respondWith(
    caches.match(event.request).then(cached => {
      return (
        cached ||
        fetch(event.request).then(response => {
          const copy = response.clone();

          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, copy);
          });

          return response;
        })
      );
    })
  );
});
