/**
 * Service Worker - 電流計算工具
 * 提供離線功能與快取管理
 * @version 2.0.0
 */

const CACHE_NAME = 'power-tool-v2.1.1-force-update';
const CACHE_VERSION = '2025-01-01-icon-fix';

// 需要快取的資源列表
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './app.js',
  './manifest.webmanifest',
  './icon-72.png',
  './icon-96.png',
  './icon-128.png',
  './icon-144.png',
  './icon-152.png',
  './icon-192.png',
  './icon-384.png',
  './icon-512.png',
  'https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700&family=JetBrains+Mono:wght@400;500&display=swap'
];

// ========================================
// Service Worker 安裝事件
// ========================================

self.addEventListener('install', (event) => {
  console.log('[Service Worker] 開始安裝...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] 正在快取資源...');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => {
        console.log('[Service Worker] 安裝完成');
        // 強制立即啟用新的 Service Worker
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[Service Worker] 安裝失敗:', error);
      })
  );
});

// ========================================
// Service Worker 啟用事件
// ========================================

self.addEventListener('activate', (event) => {
  console.log('[Service Worker] 開始啟用...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        // 刪除舊版本的快取
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('[Service Worker] 刪除舊快取:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[Service Worker] 啟用完成');
        // 立即控制所有客戶端
        return self.clients.claim();
      })
  );
});

// ========================================
// Fetch 事件處理
// ========================================

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 只處理同源請求和字體請求
  if (url.origin !== location.origin && !url.origin.includes('fonts.googleapis.com') && !url.origin.includes('fonts.gstatic.com')) {
    return;
  }

  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        // 如果快取中有資源，直接返回
        if (cachedResponse) {
          console.log('[Service Worker] 從快取載入:', request.url);
          return cachedResponse;
        }

        // 否則從網路獲取
        console.log('[Service Worker] 從網路載入:', request.url);
        return fetch(request)
          .then((response) => {
            // 檢查回應是否有效
            if (!response || response.status !== 200 || response.type === 'error') {
              return response;
            }

            // 複製回應（因為回應是串流，只能讀取一次）
            const responseToCache = response.clone();

            // 將新資源加入快取
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(request, responseToCache);
              })
              .catch((error) => {
                console.error('[Service Worker] 快取失敗:', error);
              });

            return response;
          })
          .catch((error) => {
            console.error('[Service Worker] 網路請求失敗:', error);
            
            // 如果網路請求失敗，嘗試返回 index.html（用於離線回退）
            if (request.mode === 'navigate') {
              return caches.match('./index.html');
            }
            
            throw error;
          });
      })
  );
});

// ========================================
// 訊息事件處理
// ========================================

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({
      version: CACHE_VERSION,
      cacheName: CACHE_NAME
    });
  }
});

// ========================================
// 推播通知（預留功能）
// ========================================

self.addEventListener('push', (event) => {
  console.log('[Service Worker] 收到推播訊息:', event);
  
  const options = {
    body: event.data ? event.data.text() : '電流計算工具有新的更新！',
    icon: './icon-192.png',
    badge: './badge-72.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  };

  event.waitUntil(
    self.registration.showNotification('電流計算工具', options)
  );
});

// ========================================
// 通知點擊事件
// ========================================

self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] 通知被點擊:', event);
  event.notification.close();

  event.waitUntil(
    clients.openWindow('/')
  );
});

console.log('[Service Worker] 已載入 - 版本:', CACHE_VERSION);
