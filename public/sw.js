/**
 * PillTime Service Worker (Vercel)
 * - HTML/JS/CSS 캐시 금지
 * - 이미지/폰트만 SWR 캐시
 * - 모든 document 네비 respondWith (preload 경고 제거)
 */
const IS_DEV =
  self.location.hostname === "localhost" ||
  self.location.hostname === "127.0.0.1";

const CACHE_NAME = "pilltime-cache-v13";
const APP_SHELL = [
  "/offline.html",
  "/pilltime_mark_duotone.svg",
  "/pilltime_logo.png",
  "/icon-192.png",
  "/icon-512.png",
];

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
              console.warn("[SW] skip precache:", url, res);
            }
          })
        );
      })()
    );
  }
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // 구 캐시 제거
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME && k.startsWith("pilltime-cache-"))
          .map((k) => caches.delete(k))
      );
      // navigationPreload 비활성화 (경고 제거)
      if ("navigationPreload" in self.registration) {
        try {
          await self.registration.navigationPreload.disable();
        } catch {}
      }
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  if (IS_DEV) return;

  const req = event.request;
  const url = new URL(req.url);

  // Next 빌드/데이터/내부 API/자체 SW/매니페스트는 건드리지 않음
  if (
    url.pathname.startsWith("/_next/") ||
    url.pathname.startsWith("/api/") ||
    url.pathname === "/sw.js" ||
    url.pathname === "/manifest.json"
  ) {
    return;
  }
  if (
    url.pathname.startsWith("/auth/v1/") ||
    url.pathname.startsWith("/api/auth") ||
    url.hostname.endsWith("supabase.co")
  ) {
    return; // 캐싱/응답 가로채지 않음
  }

  // *** 모든 document 네비게이션은 respondWith로 처리 (preload 경고 제거) ***
  if (req.mode === "navigate" || req.destination === "document") {
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

  // JS/CSS는 캐시 금지 (하이드레이션 보호)
  if (req.destination === "script" || req.destination === "style") {
    event.respondWith(fetch(req));
    return;
  }

  // 이미지/폰트만 SWR 캐싱
  if (req.destination === "image" || req.destination === "font") {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME);
        const cached = await cache.match(req);
        const fetched = await fetch(req).catch(() => null);
        if (fetched && fetched.ok) {
          const sameOrigin = url.origin === self.location.origin;
          if (sameOrigin || fetched.type === "basic") {
            cache.put(req, fetched.clone()).catch(() => {});
          }
        }
        return cached || fetched || Response.error();
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
      data,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      renotify: true,
      requireInteraction: true,
    })
  );
});

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
