"use client";

import { useEffect, useState } from "react";

/**
 * SSR-safe 플랫폼 감지 훅
 * - iOS 여부
 * - Safari 여부
 * - PWA standalone 여부
 */
export function usePlatformInfo() {
  const [isIOS, setIsIOS] = useState(false);
  const [isSafari, setIsSafari] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const ua = navigator.userAgent;

    // iOS 감지
    setIsIOS(/iPad|iPhone|iPod/.test(ua));

    // Safari 감지 (크롬/안드 제외한 Safari)
    setIsSafari(/^((?!chrome|android).)*safari/i.test(ua));

    // standalone 감지 (iOS PWA & 일반 PWA)
    const standalone =
      (window.matchMedia &&
        window.matchMedia("(display-mode: standalone)").matches) ||
      (navigator as any).standalone === true;

    setIsStandalone(Boolean(standalone));
  }, []);

  return { isIOS, isSafari, isStandalone };
}
