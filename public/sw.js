/**
 * PillTime Service Worker (최소 구현 + 안전 가드)
 * - 역할: 서버에서 보낸 Web Push를 수신해 Notification을 표시
 * - 배포 팁: 버전 상수만 바꿔도 브라우저가 새 SW로 교체하기 쉬움
 */
/* PillTime SW: Dev(로컬)에서는 캐싱 OFF, Prod에서만 캐싱 ON */
const IS_DEV =
  self.location.hostname === "localhost" ||
  self.location.hostname === "127.0.0.1";

const CACHE_NAME = "pilltime-cache-v9";
const APP_SHELL = [
  "/offline.html",
  "/pilltime_mark_duotone.svg",
  "/pilltime_logo.png",
  "/icon-192.png",
  "/icon-512.png",
];

/* --- 공통: install/activate(캐시 준비는 prod에서만) --- */
self.addEventListener("install", (event) => {
  if (!IS_DEV) {
    event.waitUntil(
      (async () => {
        const cache = await caches.open(CACHE_NAME);
        const urls = APP_SHELL.map((u) => new URL(u, self.location).toString());

        const results = await Promise.allSettled(
          urls.map((u) => fetch(u, { cache: "reload" }))
        );

        await Promise.all(
          results.map(async (res, i) => {
            const url = urls[i];
            if (res.status === "fulfilled" && res.value && res.value.ok) {
              await cache.put(url, res.value.clone());
            } else {
              // 조용히 건너뜀 (로그만 남김)
              console.warn("[SW] skip precache:", url, res);
            }
          })
        );
      })()
    );
  }
  self.skipWaiting();
});

/* --- fetch: 개발에선 네트워크만, 프로덕션에서만 캐싱 전략 --- */
self.addEventListener("fetch", (event) => {
  if (IS_DEV) return; // ← 개발모드: 아무 것도 가로채지 않음

  const req = event.request;
  const url = new URL(req.url);

  if (url.pathname.startsWith("/callback")) return;
  if (url.pathname.startsWith("/login")) return;
  if (req.mode === "navigate" && url.searchParams.has("code")) {
    return;
  }

  // 네비게이션 요청: 네트워크 우선 → 실패 시 캐시 → offline.html
  if (req.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          return await fetch(req);
        } catch {
          const cache = await caches.open(CACHE_NAME);
          return (await cache.match("/offline.html")) || Response.error();
        }
      })()
    );
    return;
  }

  // 정적 자원만 Stale-While-Revalidate
  if (["image", "font", "style", "script"].includes(req.destination)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME);
        const cached = await cache.match(req);
        const fetchPromise = fetch(req)
          .then((res) => {
            cache.put(req, res.clone());
            return res;
          })
          .catch(() => null);
        return cached || (await fetchPromise) || Response.error();
      })()
    );
  }
});

/**
 * ===== Push / Notification =====
 * - 서버(우리 /api/push/dispatch)에서 JSON.stringify(payload)로 보낸 데이터를 받는다.
 * - payload 예: { title, body, tag, data:{url,log_id}, icon, badge, image, renotify, requireInteraction, ... }
 */
self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload = {};
  try {
    // 정상 케이스: JSON
    payload = event.data ? event.data.json() : {};
  } catch {
    // 예외: 텍스트로 온 경우
    payload = {};
  }
  const title = payload.title || "PillTime";
  const body = payload.body || "알림이 도착했어요";
  const data = payload.data || {};
  const tag = payload.tag || `pilltime-${Date.now()}`;

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      tag,
      icon: "/icon-192.png",
      badge: "/icon-192.png", // 안드로이드 위주
      data,
      requireInteraction: false,
      renotify: false,
    })
  );
});

/**
 * notificationclick:
 * - 클릭 시 기존 탭 포커스, 없으면 새 창 오픈
 * - 서버에서 payload.data.url을 넣어주면 특정 페이지로 이동 가능(예: 캘린더)
 */
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    (async () => {
      const allClients = await clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      const ORIGIN = self.location.origin;
      const existing = allClients.find(
        (c) => c.url.startsWith(ORIGIN) && "focus" in c
      );
      if (existing) {
        existing.focus();
        existing.postMessage({ type: "PT_NOTIFICATION_CLICKED" });
        return;
      }
      await clients.openWindow(url);
    })()
  );
});
