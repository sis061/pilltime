// lib/useHasTouch.ts
import { useEffect, useState } from "react";

export function useHasTouch() {
  const [hasTouch, setHasTouch] = useState(false);

  useEffect(() => {
    // 다양한 브라우저 커버
    const mqCoarse = () =>
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(pointer: coarse)").matches;

    const byNavigator =
      typeof navigator !== "undefined" &&
      (navigator.maxTouchPoints > 0 ||
        // 일부 오래된 iOS/사파리 대응
        // @ts-ignore
        navigator.msMaxTouchPoints > 0);

    const byOntouch = typeof window !== "undefined" && "ontouchstart" in window;

    setHasTouch(Boolean(mqCoarse() || byNavigator || byOntouch));

    // 포인터 기능이 바뀌는 환경(도킹/블루투스 마우스) 대응
    if (typeof window !== "undefined" && window.matchMedia) {
      const mql = window.matchMedia("(pointer: coarse)");
      const handler = () =>
        setHasTouch(Boolean(mql.matches || byNavigator || byOntouch));
      mql.addEventListener?.("change", handler);
      return () => mql.removeEventListener?.("change", handler);
    }
  }, []);

  return hasTouch;
}
