// サービスワーカー: オフラインフォールバック
const CACHE_NAME = 'kakeibo-offline-v1';
const OFFLINE_URL = '/offline';

// インストール時にオフラインページをキャッシュ
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.add(new Request(OFFLINE_URL, { cache: 'reload' }));
    })
  );
  // 待機中のSWをすぐにアクティブにする
  self.skipWaiting();
});

// アクティベート時に古いキャッシュを削除
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  // 全クライアントを即座に制御下に置く
  self.clients.claim();
});

// ネットワークエラー時にオフラインページを返す
self.addEventListener('fetch', (event) => {
  // ナビゲーションリクエスト（ページ遷移）のみ対象
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(OFFLINE_URL);
      })
    );
  }
});
