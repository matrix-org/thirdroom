/// <reference lib="ESNext" />
/// <reference lib="WebWorker" />

export declare const self: ServiceWorkerGlobalScope;

const MXC_DOWNLOAD_CACHE = "download_mxc";

self.addEventListener("fetch", (event: FetchEvent) => {
  const { request } = event;

  // Only handle mxc download request.
  if (request.method !== "GET" || /^\S+\/_matrix\/media\/r0\/download\/\S+$/.test(request.url) === false) return;

  event.respondWith(
    caches.open(MXC_DOWNLOAD_CACHE).then((cache) => {
      return cache.match(request.url).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(request).then((fetchedResponse) => {
          event.waitUntil(cache.put(request, fetchedResponse.clone()));

          return fetchedResponse;
        });
      });
    })
  );
});
