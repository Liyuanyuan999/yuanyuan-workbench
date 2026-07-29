const CACHE_NAME = 'yuanyuan-workbench-v4';
const FILES_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(FILES_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // Firebase CDN 请求不缓存，始终走网络
  if (url.hostname.includes('gstatic.com') || url.hostname.includes('firebaseio.com')) {
    e.respondWith(fetch(e.request));
    return;
  }
  // 其他请求：网络优先，失败时用缓存（确保离线可用 + 自动更新）
  e.respondWith(
    fetch(e.request)
      .then(res => {
        // 成功响应时更新缓存
        if (res && res.status === 200 && e.request.method === 'GET') {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request).then(r => r || caches.match('./index.html')))
  );
});
