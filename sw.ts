/// <reference lib="ESNext" />
/// <reference lib="WebWorker" />

export declare const self: ServiceWorkerGlobalScope;

const CACHE_VERSION = 1;
const MXC_DOWNLOAD_CACHE = `mxc_download_v${CACHE_VERSION}`;
const MXC_DOWNLOAD_REGEX = /^\S+\/_matrix\/media\/r0\/download\/\S+$/;

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== MXC_DOWNLOAD_CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener("fetch", (event: FetchEvent) => {
  const { request } = event;

  // Only handle mxc download request.
  if (request.method !== "GET" || MXC_DOWNLOAD_REGEX.test(request.url) === false) return;

  event.respondWith(
    caches.open(MXC_DOWNLOAD_CACHE).then((cache) => {
      return cache
        .match(request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }

          return fetch(request.clone()).then((fetchedResponse) => {
            if (fetchedResponse.ok) {
              event.waitUntil(cache.put(request, fetchedResponse.clone()));
            }

            return fetchedResponse;
          });
        })
        .catch((error) => {
          console.error(`Service Worker Error fetching ${request.url}:`, error);
          throw error;
        });
    })
  );
});
