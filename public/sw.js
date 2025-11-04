// - JS/CSS/HTML 네비게이션은 캐시하지 않음 (항상 네트워크/HTTP 캐시 경로)
// - 이미지/폰트만 Stale-While-Revalidate
// - 구캐시 정리 + 즉시 컨트롤

const today = new Date();
// 캐시 이름: 정책 변동 시에만 올려도 충분 (구버전 정리 목적)
const CACHE_NAME = `pilltime-static-v-${today}`;

// 바로 업데이트/컨트롤
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.map((k) =>
          k !== CACHE_NAME ? caches.delete(k) : Promise.resolve()
        )
      );
      await self.clients.claim();
    })()
  );
});

// fetch: JS/CSS/HTML은 건드리지 않음. 이미지/폰트만 SWR.
// 로그인/콜백 등 민감 경로는 아예 패스.
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // 크로스 오리진은 건드리지 않음 (CDN 외부/3rd-party 안전)
  if (url.origin !== self.location.origin) return;

  // 앱 인증/콜백 경로는 절대 가로채지 않음
  if (url.pathname.startsWith("/callback")) return;
  if (url.pathname.startsWith("/login")) return;
  if (req.mode === "navigate" && url.searchParams.has("code")) return;

  // 네비게이션(HTML)은 절대 응답 대체하지 않음 (offline.html도 사용 안 함)
  if (req.mode === "navigate") return;

  // 정적 리소스 중 이미지/폰트만 캐시 (JS/CSS 제외!)
  const dest = req.destination; // "image" | "font" | "script" | "style" | ...
  if (!["image", "font"].includes(dest)) return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);

      // 1) 캐시 먼저 (stale)
      const cached = await cache.match(req);
      // 2) 백그라운드 갱신 (revalidate)
      const fetched = fetch(req)
        .then((res) => {
          // 성공시에만 저장
          if (res && res.ok) cache.put(req, res.clone());
          return res;
        })
        .catch(() => null);

      // stale 있으면 즉시 반환, 없으면 네트워크 결과 대기
      return cached || (await fetched) || Response.error();
    })()
  );
});

// ===== Push / Notification =====
// payload 예: { title, body, data:{url}, tag, ... }
self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data?.json() ?? {};
  } catch {}
  const title = payload.title ?? "PillTime";
  const body = payload.body ?? "알림이 도착했어요";
  const data = payload.data ?? {};
  const tag = payload.tag ?? `pilltime-${Date.now()}`;

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

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    (async () => {
      const list = await clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      const sameOrigin = list.find((c) =>
        c.url.startsWith(self.location.origin)
      );
      if (sameOrigin) {
        sameOrigin.focus();
        sameOrigin.postMessage({ type: "PT_NOTIFICATION_CLICKED" });
        return;
      }
      await clients.openWindow(url);
    })()
  );
});
