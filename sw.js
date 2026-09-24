// 永久固定缓存空间名（采用 Network-First 策略，内容自动覆盖，无需手动递增版本号）
const CACHE_NAME = 'pwabox-cache';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './404.html',
  './manifest.json',
  './icon.svg'
];

// 安装阶段：预缓存核心骨架资源并立即接管
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// 激活阶段：立即生效并清理历史遗留的旧版命名缓存
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          // 清理历史遗留的 pwabox-hub-v1/v2/v3 缓存
          if (key !== CACHE_NAME && key.startsWith('pwabox-')) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 请求拦截策略：
// 1. 页面导航（HTML）：网络优先（Network-First），确保用户永远看到最新代码，断网时秒级降级使用缓存
// 2. 静态资源（图标、manifest 等）：Stale-While-Revalidate，秒开并后台静默更新
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const isNavigation = event.request.mode === 'navigate';

  if (isNavigation) {
    // ★ 导航请求：网络优先 (Network-First)
    event.respondWith(
      fetch(event.request).then((networkResponse) => {
        // 如果服务器返回 404，回退到自愈页
        if (networkResponse.status === 404) {
          return caches.match('./404.html').then((cached404) => cached404 || networkResponse);
        }
        // 成功获取最新页面，静默更新到缓存中（实现免版本号自动刷新）
        if (networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
        }
        return networkResponse;
      }).catch(async () => {
        // 断网/离线兜底：从缓存读取
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) return cachedResponse;
        
        // 兜底回退首页或 404
        return (await caches.match('./index.html')) || (await caches.match('./404.html'));
      })
    );
  } else {
    // ★ 静态资源：缓存优先 + 后台更新 (Stale-While-Revalidate)
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
          }
          return networkResponse;
        }).catch(() => {/* 离线静默忽略 */});

        return cachedResponse || fetchPromise;
      })
    );
  }
});
