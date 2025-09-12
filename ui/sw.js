// 서비스워커 v5 - 강화된 캐시 정책 (스타일 강제 반영)
const CACHE_NAME = 'youaplan-easytax-v5';
const STATIC_CACHE = 'static-v2';
const API_CACHE = 'api-v2';

const urlsToCache = [
  '/app/',
  '/app/index.html',
  '/app/styles.css',
  '/app/styles.min.css',
  '/app/assets/logo.png',
  '/app/assets/logo.webp',
  'https://cdn.jsdelivr.net/npm/suit-font@1.0.0/variable.css'
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', function(event) {
  const { request } = event;
  const url = new URL(request.url);

  // 정적 파일 (/app/)은 Cache First 전략
  if (url.pathname.startsWith('/app/')) {
    event.respondWith(
      caches.match(request).then(function(response) {
        return response || fetch(request).then(function(fetchResponse) {
          if (fetchResponse.ok) {
            const responseClone = fetchResponse.clone();
            caches.open(STATIC_CACHE).then(function(cache) {
              cache.put(request, responseClone);
            });
          }
          return fetchResponse;
        });
      })
    );
    return;
  }

  // API 호출 (/api/)은 Stale-While-Revalidate 전략
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      caches.match(request).then(function(cachedResponse) {
        const fetchPromise = fetch(request).then(function(networkResponse) {
          if (networkResponse.ok) {
            const responseClone = networkResponse.clone();
            caches.open(API_CACHE).then(function(cache) {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        });

        // 캐시된 응답이 있으면 즉시 반환, 동시에 백그라운드 업데이트
        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // 기타 요청은 기본 전략
  event.respondWith(fetch(request));
});

// Clean up old caches
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE && cacheName !== API_CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
