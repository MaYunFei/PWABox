const CACHE_NAME = 'pwabox-hub-v3';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './404.html',
  './manifest.json',
  './icon.svg'
];

// 安装阶段：预缓存核心骨架资源
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// 激活阶段：清理旧版本缓存
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 请求拦截：Stale-While-Revalidate 策略（优先返回缓存，同时异步从网络拉取并更新缓存）
self.addEventListener('fetch', (event) => {
  // 只拦截 GET 请求
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // 跨域 CDN（如 tailwind、lucide）尝试缓存或直通
  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cachedResponse = await cache.match(event.request);
      
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        // 如果是同源或者受信任 CDN，缓存副本
        if (networkResponse && networkResponse.status === 200) {
          cache.put(event.request, networkResponse.clone());
        }
        // 如果页面导航返回 404，回退到 404.html 或 index.html
        if (event.request.mode === 'navigate' && networkResponse.status === 404) {
          return cache.match('./404.html') || cache.match('./index.html');
        }
        return networkResponse;
      }).catch(async () => {
        // 离线且网络不可达时返回缓存
        if (cachedResponse) return cachedResponse;
        if (event.request.mode === 'navigate') {
          return cache.match('./404.html') || cache.match('./index.html');
        }
      });

      return cachedResponse || fetchPromise;
    })
  );
});
