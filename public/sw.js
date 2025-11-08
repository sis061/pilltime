/* PillTime Service Worker — minimal & safe cache
 * - JS/CSS 미캐싱 (Next.js 해시 파일 충돌 방지)
 * - 정적 아이콘/이미지/폰트/오프라인 페이지만 캐싱
 */

const IS_DEV =
  self.location.hostname === "localhost" ||
  self.location.hostname === "127.0.0.1";

const CACHE_NAME = "pilltime-cache-v5";
const APP_SHELL = [
  "/offline.html",
  "/pilltime_mark_duotone.svg",
  "/pilltime_logo.png",
  "/icon-192.png",
  "/icon-512.png",
];

// --- install ---
self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      if (!IS_DEV) {
        const cache = await caches.open(CACHE_NAME);
        const urls = APP_SHELL.map((u) => new URL(u, self.location).toString());
        const results = await Promise.allSettled(
          urls.map((u) => fetch(u, { cache: "reload" }))
        );
        await Promise.all(
          results.map(async (res, i) => {
            const url = urls[i];
            if (res.status === "fulfilled" && res.value?.ok) {
              await cache.put(url, res.value.clone());
            } else {
              console.warn("[SW] skip precache:", url, res);
            }
          })
        );
      }
      await self.skipWaiting();
    })()
  );
});

// --- activate: 오래된 캐시 정리 + 즉시 제어권 획득 ---
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => k.startsWith("pilltime-cache-") && k !== CACHE_NAME)
          .map((k) => caches.delete(k))
      );
      await self.clients.claim();
      // 네비게이션 프리로드
      if (!IS_DEV && "navigationPreload" in self.registration) {
        try {
          await self.registration.navigationPreload.enable();
        } catch {}
      }
    })()
  );
});

// --- fetch ---
self.addEventListener("fetch", (event) => {
  if (IS_DEV) return;

  const req = event.request;
  const url = new URL(req.url);

  // 인증 콜백/로그인 등은 절대 가로채지 않음
  if (url.pathname.startsWith("/callback")) return;
  if (url.pathname.startsWith("/login")) return;
  if (req.mode === "navigate" && url.searchParams.has("code")) return;

  // 1) 네비게이션은 어떤 경우에도 respondWith를 호출해 프리로드 취소 경고 방지
  if (req.mode === "navigate") {
    // 인증 콜백/로그인/코드 교환 같은 경로는 그대로 네트워크로 패스 스루
    if (
      url.pathname.startsWith("/callback") ||
      url.pathname.startsWith("/login") ||
      url.searchParams.has("code")
    ) {
      // 프리로드를 사용해도 되고(브라우저가 결합), 그냥 fetch(req) 해도 경고 없음
      event.respondWith(fetch(req));
      return;
    }

    // 일반 네비게이션: 프리로드 응답 있으면 사용 → 없으면 네트워크 → 실패 시 offline.html
    event.respondWith(
      (async () => {
        try {
          const preload = await event.preloadResponse; // respondWith 내부에서 대기
          if (preload) return preload;
          return await fetch(req);
        } catch {
          const cache = await caches.open(CACHE_NAME);
          return (await cache.match("/offline.html")) || Response.error();
        }
      })()
    );
    return;
  }

  // 2) 정적 자원만 캐시 (image/font 만!)
  const dest = req.destination;
  const isStatic = dest === "image" || dest === "font"; // 필요시 "document" 제외 권장

  // 동일 오리진 것만 캐시 (외부 CDN은 네트워크만)
  const sameOrigin = url.origin === self.location.origin;

  if (isStatic && sameOrigin) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME);
        const cached = await cache.match(req);
        const fetchPromise = fetch(req)
          .then((res) => {
            // 성공한 정적 리소스만 업데이트
            if (res && res.ok) cache.put(req, res.clone());
            return res;
          })
          .catch(() => null);
        return cached || (await fetchPromise) || Response.error();
      })()
    );
  }
});

/* ===== Push / Notification ===== */
self.addEventListener("push", (event) => {
  if (!event.data) return;
  let payload = {};
  try {
    payload = event.data.json();
  } catch {
    payload = {};
  }
  const title = payload.title || "아맞다약!";
  const body = payload.body || "알림이 도착했어요";
  const data = payload.data || {};
  const tag = payload.tag || `pilltime-${Date.now()}`;

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      tag,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      data,
      requireInteraction: false,
      renotify: false,
    })
  );
});

/* notificationclick */
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
