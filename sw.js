const CACHE_NAME = 'robogame-v1';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './js/app.js',
  './js/game.js',
  './js/robot.js',
  './js/builder.js',
  './js/obstacles.js',
  './js/environment.js',
  './js/audio.js',
  './assets/icon-192.png',
  './assets/icon-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(e.request).then((response) => {
        // Cache external assets dynamically
        if (e.request.url.includes('unpkg.com')) {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, response.clone());
            return response;
          });
        }
        return response;
      });
    })
  );
});
