/// <reference lib="ESNext" />
/// <reference lib="WebWorker" />

export default null;
declare const self: ServiceWorkerGlobalScope;

const MXC_DOWNLOAD_CACHE = "download_mxc";

function getCache(request: Request, cacheName: string) {
  return caches.open(cacheName).then((cache) => cache.match(request));
}

function fetchAndCache(request: Request, cacheName: string) {
  return fetch(request.clone()).then((response) => {
    if (response.status === 200) {
      const clonedResponse = response.clone();
      caches.open(cacheName).then((cache) => cache.put(request, clonedResponse));
    }
    return response;
  });
}

self.addEventListener("fetch", async (event: FetchEvent) => {
  const { request } = event;
  if (request.method !== "GET") return;
  if (/^\S+\/_matrix\/media\/r0\/download\/\S+$/.test(request.url) === false) return;
  // Only handle mxc download request.

  event.respondWith(
    getCache(request, MXC_DOWNLOAD_CACHE)
      .then((response) => {
        if (response) return response;
        return fetchAndCache(request, MXC_DOWNLOAD_CACHE);
      })
      .catch((err) => {
        console.log(err);
        return fetchAndCache(request, MXC_DOWNLOAD_CACHE);
      })
  );
});

self.clients;
