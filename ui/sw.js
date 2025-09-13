// YouArePlan TAX AI - 토스 스타일 Service Worker
// PWA 지원 및 오프라인 기능

const CACHE_NAME = 'youareplan-tax-ai-v1';
const STATIC_CACHE = 'static-v1';

// 캐시할 정적 파일들
const urlsToCache = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.8/dist/web/static/pretendard.css'
];

// 설치 이벤트
self.addEventListener('install', event => {
  console.log('[SW] 설치 중...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] 캐시 오픈됨');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('[SW] 파일들 캐시됨');
        return self.skipWaiting();
      })
  );
});

// 활성화 이벤트
self.addEventListener('activate', event => {
  console.log('[SW] 활성화 중...');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE) {
              console.log('[SW] 오래된 캐시 삭제:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] 활성화 완료');
        return self.clients.claim();
      })
  );
});

// Fetch 이벤트 (토스 스타일 네트워크 전략)
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // API 호출은 Network First 전략
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          // 성공적인 응답은 캐시에 저장
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => cache.put(request, responseClone));
          }
          return response;
        })
        .catch(() => {
          // 네트워크 실패 시 캐시에서 찾기
          return caches.match(request)
            .then(cachedResponse => {
              if (cachedResponse) {
                return cachedResponse;
              }
              // 캐시에도 없으면 오프라인 응답 반환
              return new Response(
                JSON.stringify({
                  error: 'Network unavailable',
                  offline: true,
                  message: '네트워크에 연결할 수 없습니다. 오프라인 모드로 전환합니다.'
                }),
                {
                  status: 503,
                  statusText: 'Service Unavailable',
                  headers: { 'Content-Type': 'application/json' }
                }
              );
            });
        })
    );
    return;
  }

  // 정적 파일은 Cache First 전략
  event.respondWith(
    caches.match(request)
      .then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(request)
          .then(response => {
            // 유효한 응답만 캐시
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            const responseToCache = response.clone();
            caches.open(STATIC_CACHE)
              .then(cache => {
                cache.put(request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // HTML 요청 실패 시 오프라인 페이지 반환
            if (request.destination === 'document') {
              return caches.match('/index.html');
            }
            // 기타 리소스는 빈 응답
            return new Response('', { status: 404 });
          });
      })
  );
});

// 메시지 이벤트 (토스 스타일 업데이트 처리)
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW] 즉시 업데이트 요청됨');
    self.skipWaiting();
  }
});

// 백그라운드 동기화 (향후 사용)
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    console.log('[SW] 백그라운드 동기화 시작');
    event.waitUntil(doBackgroundSync());
  }
});

// 푸시 알림 (향후 사용)
self.addEventListener('push', event => {
  if (event.data) {
    const data = event.data.json();
    const title = data.title || 'YouArePlan TAX AI';
    const options = {
      body: data.body || '새로운 알림이 있습니다.',
      icon: '/assets/icon-192x192.png',
      badge: '/assets/badge-72x72.png',
      tag: 'tax-ai-notification',
      requireInteraction: true,
      actions: [
        {
          action: 'open',
          title: '열기'
        },
        {
          action: 'close',
          title: '닫기'
        }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  }
});

// 알림 클릭 이벤트
self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action === 'open') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// 백그라운드 동기화 함수
async function doBackgroundSync() {
  try {
    // 오프라인 중에 저장된 데이터를 서버와 동기화
    console.log('[SW] 백그라운드 동기화 수행 중...');
    
    // 여기에 실제 동기화 로직 구현
    // 예: 로컬 스토리지의 데이터를 서버로 전송
    
    console.log('[SW] 백그라운드 동기화 완료');
  } catch (error) {
    console.error('[SW] 백그라운드 동기화 실패:', error);
  }
}

// 에러 핸들링
self.addEventListener('error', event => {
  console.error('[SW] 오류 발생:', event.error);
});

self.addEventListener('unhandledrejection', event => {
  console.error('[SW] 처리되지 않은 Promise 거부:', event.reason);
});

console.log('[SW] YouArePlan TAX AI Service Worker 로드됨');