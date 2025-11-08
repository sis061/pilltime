/**
 * PillTime Service Worker (prod 캐시 안정화 버전)
 */
const IS_DEV =
  self.location.hostname === "localhost" ||
  self.location.hostname === "127.0.0.1";

const CACHE_PREFIX = "pilltime-cache";
const CACHE_VERSION = "v7"; // ← 배포 때마다 버전만 올리면 됨
const CACHE_NAME = `${CACHE_PREFIX}-${CACHE_VERSION}`;

// 오프라인에 필요한 최소 셸(HTML/아이콘 등 "변하지 않는" 것만)
const APP_SHELL = [
  "/offline.html",
  "/pilltime_mark_duotone.svg",
  "/pilltime_logo.png",
  "/icon-192.png",
  "/icon-512.png",
];

/* ---------------- install ---------------- */
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
            if (
              res.status === "fulfilled" &&
              res.value &&
              res.value.ok &&
              res.value.type !== "opaqueredirect"
            ) {
              await cache.put(url, res.value.clone());
            } else {
              console.warn("[SW] skip precache:", url, res);
            }
          })
        );
      })()
    );
  }
  self.skipWaiting();
});

/* ---------------- activate ----------------
 * - 예전 캐시 전량 삭제
 * - 즉시 제어권 획득
 */
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names
          .filter((n) => n.startsWith(CACHE_PREFIX) && n !== CACHE_NAME)
          .map((n) => caches.delete(n))
      );
      await self.clients.claim();
    })()
  );
});

/* ---------------- fetch ---------------- */
self.addEventListener("fetch", (event) => {
  if (IS_DEV) return;

  const req = event.request;
  const url = new URL(req.url);

  // 인증/콜백 관련은 SW 개입 않음
  if (url.pathname.startsWith("/callback")) return;
  if (url.pathname.startsWith("/login")) return;
  if (req.mode === "navigate" && url.searchParams.has("code")) return;

  // 네비게이션 요청: 네트워크 우선 → 실패 시 캐시 → offline.html
  if (req.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const res = await fetch(req, { cache: "no-store" }); // HTML은 항상 최신
          return res;
        } catch {
          const cache = await caches.open(CACHE_NAME);
          return (await cache.match("/offline.html")) || Response.error();
        }
      })()
    );
    return;
  }

  // -------- 정적 자원 캐시 전략 --------
  // 1) Next 해시된 불변 정적(청크/에셋): SWR
  const isNextStatic =
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/assets/");

  // 2) 폰트/이미지/스타일은 SWR
  const isAsset = ["image", "font", "style"].includes(req.destination);

  // 3) 스크립트는 "불변 경로"만 캐시. 그 외 스크립트는 항상 네트워크로 우회.
  const isScript = req.destination === "script";

  if (isNextStatic || isAsset) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME);
        const cached = await cache.match(req);
        const fetchPromise = fetch(req)
          .then((res) => {
            if (res && res.ok && res.type !== "opaqueredirect") {
              cache.put(req, res.clone()).catch(() => {});
            }
            return res;
          })
          .catch(() => null);
        return cached || (await fetchPromise) || Response.error();
      })()
    );
    return;
  }

  if (isScript) {
    // 해시 없는 스크립트는 항상 최신만
    event.respondWith(fetch(req, { cache: "no-store" }));
    return;
  }

  // 나머지 요청은 SW 개입 X → 브라우저 기본 동작
});
/* ---------------- Push ---------------- */
self.addEventListener("push", (event) => {
  if (!event.data) return;
  let payload = {};
  try {
    payload = event.data.json();
  } catch {
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
      badge: "/icon-192.png",
      data,
      requireInteraction: false,
      renotify: false,
    })
  );
});

/* ---------------- notificationclick ---------------- */
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
