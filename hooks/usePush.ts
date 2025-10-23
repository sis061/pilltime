"use client";
/**
 * usePush 훅 (경로: /lib/usePush.ts)
 * - 역할: 클라이언트에서 알림 권한 요청, SW 등록, Push 구독 생성/해제
 * - 의존: 브라우저 환경(SSR에서 직접 호출 금지), /public/sw.js 존재
 * - 사용: const { permission, isSubscribed, subscribe, unsubscribe, loading } = usePush(PUBLIC_VAPID_KEY)
 */

import { useCallback, useEffect, useState } from "react";

/** Base64(URL-safe) → Uint8Array 변환 (VAPID public key를 위해 필요) */
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

/** 활성화된 ServiceWorkerRegistration을 확보 */
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
  // 일부 구현체 보호: 키가 없는 경우 방어
  return {
    endpoint: json.endpoint,
    expirationTime: json.expirationTime ?? null,
    keys: {
      p256dh: json.keys?.p256dh ?? "",
      auth: json.keys?.auth ?? "",
    },
  };
}

export function usePush(vapidPublicKey: string, userId?: string) {
  /** 로딩 상태 (subscribe/unsubscribe 중 버튼 비활성 등 UX에 사용) */
  const [loading, setLoading] = useState(false);
  /** 브라우저 Notifications 권한: 'default' | 'granted' | 'denied' */
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof window !== "undefined" && "Notification" in window
      ? Notification.permission
      : "default"
  );
  /** 현재 푸시 구독 여부(알 수 없을 땐 null) */
  const [isSubscribed, setIsSubscribed] = useState<boolean | null>(null);

  // (선택) 진입 시 사전 등록 시도 — dev에선 아무 일도 안 함
  // 프로덕션에서만 SW 사전 등록
  useEffect(() => {
    if (!isBrowserOK()) return;
    if (process.env.NODE_ENV === "production") {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .catch(() => {});
    }
  }, []);

  /** Service Worker 등록 보장 */
  //   const ensureReg = async () => {
  //     if (!("serviceWorker" in navigator))
  //       throw new Error("Service Worker not supported");
  //     // 동일 경로로 여러 번 호출돼도 브라우저가 알아서 중복 처리
  //     const reg = await navigator.serviceWorker.register("/sw.js", {
  //       scope: "/",
  //     });
  //     return reg;
  //   };

  /** 현재 구독 상태를 갱신(초기 마운트/권한 변화 시) */
  const refresh = useCallback(async () => {
    if (!isBrowserOK()) {
      setIsSubscribed(false);
      return;
    }
    const reg = await navigator.serviceWorker.getRegistration();
    if (!reg) {
      setIsSubscribed(false);
      return;
    }
    const sub = await reg.pushManager.getSubscription();
    setIsSubscribed(!!sub);
    setPermission(Notification.permission);
  }, []);

  useEffect(() => {
    refresh();
    // 탭 포커스 돌아올 때 상태 동기화 (권한/구독이 밖에서 바뀐 경우 대비)
    const onVis = () => document.visibilityState === "visible" && refresh();
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [refresh]);

  /** ✅ VAPID 키 변경 감지 → 기존 구독 강제 해지 후 재구독 */
  const ensureVAPIDMatch = useCallback(
    async (reg: ServiceWorkerRegistration) => {
      const sub = await reg.pushManager.getSubscription();
      const currentHash = await sha256b64url(vapidPublicKey);
      const stored = localStorage.getItem("vapid:keyhash");

      if (stored && stored !== currentHash && sub) {
        // 공개키가 바뀌었는데 구독이 남아있음 → 서버 401/403 방지 위해 정리
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

      localStorage.setItem("vapid:keyhash", currentHash);
    },
    [vapidPublicKey]
  );

  /** 구독 생성 */
  const subscribe = useCallback(async () => {
    setLoading(true);
    try {
      if (!isBrowserOK())
        throw new Error("이 브라우저는 Web Push를 지원하지 않습니다.");

      // 1) SW 확보 + VAPID 키 정합성 체크
      const reg = await getActiveRegistration();
      if (!reg) throw new Error("Service Worker가 활성화되지 않았습니다.");
      await ensureVAPIDMatch(reg);

      // 2) 권한
      let perm: NotificationPermission = Notification.permission;
      if (perm === "default") perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== "granted")
        throw new Error("알림 권한이 허용되지 않았습니다.");

      // 3) 재사용 가능한 기존 구독?
      let sub = await reg.pushManager.getSubscription();

      // 4) 없으면 신규 구독
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: b64ToU8(vapidPublicKey),
        });
      }

      // 5) 서버에 upsert(+메타)
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

  /** 강제 재구독(설정 화면에서 ‘연결 새로고침’ 같은 UX에 사용) */
  const resubscribe = useCallback(async () => {
    await unsubscribe();
    return subscribe();
  }, [unsubscribe, subscribe]);

  return {
    permission,
    isSubscribed,
    subscribe,
    unsubscribe,
    resubscribe,
    loading,
    refresh,
  };
}
