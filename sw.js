// Define a cache name
const CACHE_NAME = 'urdu-text-editor-v1';

// List all the files and assets to be cached
const urlsToCache = [
  '/',
  'index.html',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Noto+Nastaliq+Urdu:wght@400;700&display=swap',
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/lucide@latest',
  'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js'
];

// Install event: fires when the service worker is first installed.
self.addEventListener('install', event => {
  // Perform install steps
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        // Add all specified URLs to the cache.
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('Failed to cache resources during install:', error);
      })
  );
});

// Fetch event: fires for every network request.
self.addEventListener('fetch', event => {
  event.respondWith(
    // Try to find a matching response in the cache first.
    caches.match(event.request)
      .then(response => {
        // If a cached response is found, return it.
        if (response) {
          return response;
        }

        // If not found in cache, fetch it from the network.
        return fetch(event.request).then(
          networkResponse => {
            // Check if we received a valid response
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
               // For third-party resources (like Google Fonts, CDN), we can't cache them directly if they don't have CORS headers.
               // We just return the response as is. A 'basic' type indicates a same-origin request.
               // We only cache same-origin requests to avoid issues.
               if(networkResponse.type !== 'opaque'){
                 return networkResponse;
               }
            }

            // IMPORTANT: Clone the response. A response is a stream
            // and because we want the browser to consume the response
            // as well as the cache consuming the response, we need
            // to clone it so we have two streams.
            const responseToCache = networkResponse.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return networkResponse;
          }
        ).catch(error => {
            console.error('Fetching failed:', error);
            // Optional: You could return a custom offline page here.
        });
      })
  );
});

// Activate event: fires when the service worker is activated.
// This is a good place to clean up old caches.
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            // If this cache name is not on the whitelist, delete it.
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
