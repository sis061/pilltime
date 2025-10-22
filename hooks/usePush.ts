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

/** 활성화된 ServiceWorkerRegistration을 확보 */
async function getActiveRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator))
    return null;

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

    return ready || reg;
  } catch (err) {
    console.error("[PillTime SW] registration failed:", err);
    return null;
  }
}

export function usePush(vapidPublicKey: string) {
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
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator))
      return;
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
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
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
  }, []);

  useEffect(() => {
    setPermission(
      typeof Notification !== "undefined" ? Notification.permission : "default"
    );
    refresh();
  }, [refresh]);

  /** 구독 생성 */
  const subscribe = useCallback(async () => {
    setLoading(true);
    try {
      if (
        !("Notification" in window) ||
        !("serviceWorker" in navigator) ||
        !("PushManager" in window)
      ) {
        throw new Error("이 브라우저는 Web Push를 지원하지 않습니다.");
      }

      // 1) SW 등록/활성 확보
      const reg = await getActiveRegistration();
      if (!reg) {
        // dev 환경이거나 등록 실패
        throw new Error("Service Worker가 활성화되지 않았습니다.");
      }

      // 2) 권한 요청
      let perm: NotificationPermission = Notification.permission;
      if (perm === "default") perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== "granted")
        throw new Error("알림 권한이 허용되지 않았습니다.");

      // 3) 기존 구독 재사용
      const existing = await reg.pushManager.getSubscription();
      if (existing) {
        await fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(existing),
        });
        setIsSubscribed(true);
        return true;
      }

      // 4) 신규 구독
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: b64ToU8(vapidPublicKey),
      });

      // 5) 서버 저장
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(sub),
      });

      setIsSubscribed(true);
      return true;
    } finally {
      setLoading(false);
    }
  }, [vapidPublicKey]);

  /** 구독 해제 */
  const unsubscribe = useCallback(async () => {
    setLoading(true);
    try {
      if (!("serviceWorker" in navigator)) {
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
        await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        }).catch(() => {});
        await sub.unsubscribe().catch(() => {});
      }
      setIsSubscribed(false);
      return true;
    } finally {
      setLoading(false);
    }
  }, []);

  return { permission, isSubscribed, subscribe, unsubscribe, loading, refresh };
}
