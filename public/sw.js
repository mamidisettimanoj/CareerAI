const CACHE_NAME = 'careerai-cache-v1';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Pre-cache essential static assets
      return cache.addAll([
        '/',
        '/dashboard',
        '/manifest.json'
      ]);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Stale-while-revalidate strategy
self.addEventListener('fetch', (event) => {
  // Only handle GET requests for our own origin
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        const responseClone = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          // Don't cache dynamic next.js chunks or data calls excessively if not needed, 
          // but for a purely static site, caching everything is fine.
          if (networkResponse.ok) {
            cache.put(event.request, responseClone);
          }
        });
        return networkResponse;
      }).catch(() => {
        // Network failed (offline)
        return cachedResponse;
      });

      return cachedResponse || fetchPromise;
    })
  );
});
