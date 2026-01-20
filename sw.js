const CACHE_NAME = 'aurora-v28';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// Install: cache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate: clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: network first for API calls, cache first for assets
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Network first for API calls
  if (url.hostname.includes('swpc.noaa.gov') ||
      url.hostname.includes('open-meteo.com')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Cache successful API responses
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, clone);
          });
          return response;
        })
        .catch(() => {
          // Fall back to cached API response
          return caches.match(event.request);
        })
    );
    return;
  }

  // Cache first for static assets
  event.respondWith(
    caches.match(event.request)
      .then(cached => cached || fetch(event.request))
  );
});
