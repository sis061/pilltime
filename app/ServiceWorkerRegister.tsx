"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      fetch("/api/sw-version")
        .then((r) => r.json())
        .then(({ buildId }) => {
          navigator.serviceWorker.register(`/sw.js?build=${buildId}`);
        })
        .catch(() => {});
    }
  }, []);

  return null;
}
