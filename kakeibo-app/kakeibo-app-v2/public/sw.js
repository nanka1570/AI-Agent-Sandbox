const CACHE_NAME = "tensura-kakeibo-v1";
const STATIC_ASSETS = ["/", "/manifest.json", "/icons/icon.svg"];

// Install: キャッシュにstaticアセットを登録
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate: 古いキャッシュを削除
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch: ネットワークファースト（staticはキャッシュファースト）
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // _next/static/ はキャッシュファースト
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            return response;
          })
      )
    );
    return;
  }

  // HTML ページはネットワークファースト
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match(request).then((r) => r || caches.match("/")))
    );
    return;
  }

  // その他はネットワーク優先
  event.respondWith(fetch(request).catch(() => caches.match(request)));
});
