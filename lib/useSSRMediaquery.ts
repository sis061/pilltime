"use client";

import { useEffect, useState } from "react";

/**
 * SSR-safe version of useMediaQuery
 * - Returns `null` until the client determines actual viewport width
 * - Prevents hydration mismatch between SSR(false) and CSR(true)
 */
export function useSSRMediaquery(minWidth = 640) {
  const [isMediaQuery, setIsMediaQuery] = useState<boolean | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia(`(min-width: ${minWidth}px)`);
    const update = () => setIsMediaQuery(mq.matches);
    update(); // initial check
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [minWidth]);

  return isMediaQuery;
}
