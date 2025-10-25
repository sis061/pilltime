"use client";
/**
 * usePush 훅
 * - 권한/구독 생성/해제 + 자동 복구(auto-heal)
 */

import { useCallback, useEffect, useState } from "react";

/** Base64(URL-safe) → Uint8Array (VAPID A.S.PublicKey) */
function b64ToU8(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const safe = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = typeof atob !== "undefined" ? atob(safe) : "";
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

/** SHA-256 → base64url (VAPID 공개키 변경 감지용) */
async function sha256b64url(input: string) {
  const enc = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  const bytes = new Uint8Array(buf);
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** 플랫폼 라벨링 (서버 디버깅용) */
function detectPlatform(endpoint: string) {
  if (endpoint.includes("fcm.googleapis.com")) return "chrome_like";
  if (endpoint.includes("web.push.apple.com")) return "apple_push";
  return "unknown";
}

function isBrowserOK() {
  return (
    typeof window !== "undefined" &&
    "Notification" in window &&
    "serviceWorker" in navigator &&
    "PushManager" in window
  );
}

/** 활성 ServiceWorkerRegistration 확보 */
async function getActiveRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!isBrowserOK()) return null;

  try {
    let reg = await navigator.serviceWorker.getRegistration();
    if (!reg) {
      reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
    }

    // ready 대기 (최대 5초)
    const timeout = new Promise<null>((resolve) =>
      setTimeout(() => resolve(null), 5000)
    );
    const ready = await Promise.race([navigator.serviceWorker.ready, timeout]);

    return (ready as ServiceWorkerRegistration | null) || reg;
  } catch (err) {
    console.error("[PillTime SW] registration failed:", err);
    return null;
  }
}

/** 안전한 toJSON (사파리/일부 브라우저 호환) */
function subToJSON(sub: PushSubscription) {
  const json = sub.toJSON();
  return {
    endpoint: json.endpoint,
    expirationTime: json.expirationTime ?? null,
    keys: {
      p256dh: json.keys?.p256dh ?? "",
      auth: json.keys?.auth ?? "",
    },
  };
}

/** 로컬 키 저장용 */
const FP_STORAGE_KEY = "vapid:keyhash";

export function usePush(vapidPublicKey: string, userId?: string) {
  const [loading, setLoading] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof window !== "undefined" && "Notification" in window
      ? Notification.permission
      : "default"
  );
  const [isSubscribed, setIsSubscribed] = useState<boolean | null>(null);

  // 프로덕션에서만 SW 사전 등록
  useEffect(() => {
    if (!isBrowserOK()) return;
    if (process.env.NODE_ENV === "production") {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .catch(() => {});
    }
  }, []);

  // ✅ 권한 변경 자동 반영(가능 브라우저)
  useEffect(() => {
    if (typeof navigator === "undefined" || !("permissions" in navigator))
      return;
    // iOS Safari 등 일부 환경에선 동작 안 할 수 있음 → 무시
    (navigator as any).permissions
      .query({ name: "notifications" as PermissionName })
      .then((status: PermissionStatus) => {
        const onChange = () => {
          const now =
            typeof Notification !== "undefined"
              ? Notification.permission
              : "default";
          setPermission(now);
        };
        status.onchange = onChange;
      })
      .catch(() => {});
  }, []);

  /** 현재 구독 상태 동기화 */
  const refresh = useCallback(async () => {
    if (!isBrowserOK()) {
      setIsSubscribed(false);
      return;
    }
    const reg = await navigator.serviceWorker.getRegistration();
    if (!reg) {
      setIsSubscribed(false);
      setPermission(Notification.permission);
      return;
    }
    const sub = await reg.pushManager.getSubscription();
    setIsSubscribed(!!sub);
    setPermission(Notification.permission);
  }, []);

  useEffect(() => {
    refresh();
    // 탭 포커스 복귀 시 상태 동기화
    const onVis = () => document.visibilityState === "visible" && refresh();
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [refresh]);

  /** ✅ VAPID 변경 시 기존 구독 정리 (401/403 예방) */
  const ensureVAPIDMatch = useCallback(
    async (reg: ServiceWorkerRegistration) => {
      const sub = await reg.pushManager.getSubscription();
      const currentHash = await sha256b64url(vapidPublicKey);
      const stored = localStorage.getItem(FP_STORAGE_KEY);

      if (stored && stored !== currentHash && sub) {
        try {
          await fetch("/api/push/unsubscribe", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ endpoint: sub.endpoint }),
          });
        } catch {}
        try {
          await sub.unsubscribe();
        } catch {}
      }

      localStorage.setItem(FP_STORAGE_KEY, currentHash);
    },
    [vapidPublicKey]
  );

  /** 구독 생성 */
  const subscribe = useCallback(async () => {
    setLoading(true);
    try {
      if (!isBrowserOK())
        throw new Error("이 브라우저는 Web Push를 지원하지 않습니다.");

      // 1) SW 확보 + VAPID 정합
      const reg = await getActiveRegistration();
      if (!reg) throw new Error("Service Worker가 활성화되지 않았습니다.");
      await ensureVAPIDMatch(reg);

      // 2) 권한
      let perm: NotificationPermission = Notification.permission;
      if (perm === "default") perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== "granted")
        throw new Error("알림 권한이 허용되지 않았습니다.");

      // 3) 기존 구독 재사용 또는 신규
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: b64ToU8(vapidPublicKey),
        });
      }

      // 4) 서버 저장(+메타)
      const json = subToJSON(sub);
      const platform = detectPlatform(json.endpoint!);
      const ua = typeof navigator !== "undefined" ? navigator.userAgent : null;

      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...json, ua, platform }),
      });

      setIsSubscribed(true);
      return true;
    } finally {
      setLoading(false);
      refresh();
    }
  }, [vapidPublicKey, ensureVAPIDMatch, refresh]);

  /** 구독 해제 */
  const unsubscribe = useCallback(async () => {
    setLoading(true);
    try {
      if (!isBrowserOK()) {
        setIsSubscribed(false);
        return true;
      }
      const reg = await getActiveRegistration();
      if (!reg) {
        setIsSubscribed(false);
        return true;
      }
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        try {
          await fetch("/api/push/unsubscribe", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ endpoint: sub.endpoint }),
          });
        } catch {}
        try {
          await sub.unsubscribe();
        } catch {}
      }
      setIsSubscribed(false);
      return true;
    } finally {
      setLoading(false);
    }
  }, []);

  /** 강제 재구독 */
  const resubscribe = useCallback(async () => {
    await unsubscribe();
    return subscribe();
  }, [unsubscribe, subscribe]);

  /* ---------------------------------------------------------
   * 🔁 자동 복구(auto-heal)
   * - 조건:
   *   1) 권한이 granted인데 구독이 없음 → 즉시 재구독
   *   2) 저장된 VAPID 지문과 현재 지문이 다름 → 재구독
   * - 트리거:
   *   - 컴포넌트 마운트/권한 변경 시
   *   - 탭이 다시 활성화될 때
   *   - SW 컨트롤러가 바뀔 때
   * --------------------------------------------------------- */
  const autoHeal = useCallback(async () => {
    if (!isBrowserOK()) return;
    if (Notification.permission !== "granted") return;

    const reg = await getActiveRegistration();
    if (!reg) return;

    const sub = await reg.pushManager.getSubscription();
    const current = await sha256b64url(vapidPublicKey);
    const stored = localStorage.getItem(FP_STORAGE_KEY);

    const needResub = !sub || (stored && stored !== current);

    if (needResub) {
      const ok = await resubscribe();
      if (ok) localStorage.setItem(FP_STORAGE_KEY, current);
      return;
    }

    // 정상: 지문 동기화만
    if (!stored) localStorage.setItem(FP_STORAGE_KEY, current);
  }, [vapidPublicKey, resubscribe]);

  // 마운트/권한 변경 시 시도
  useEffect(() => {
    autoHeal().catch(() => {});
  }, [autoHeal, permission]);

  // 탭 활성화 때도 시도 (외부에서 권한/구독 바뀐 경우 대비)
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "visible") autoHeal().catch(() => {});
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [autoHeal]);

  // SW 컨트롤러 교체 시도(업데이트/하드 리로드 후)
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const onCtrl = () => autoHeal().catch(() => {});
    navigator.serviceWorker.addEventListener("controllerchange", onCtrl);
    return () =>
      navigator.serviceWorker.removeEventListener("controllerchange", onCtrl);
  }, [autoHeal]);

  // ✅ 파생 값: 권한 + 구독이 모두 true
  const notifyReady = permission === "granted" && isSubscribed === true;

  return {
    permission,
    isSubscribed,
    subscribe,
    unsubscribe,
    resubscribe,
    loading,
    refresh,
    notifyReady,
  };
}
