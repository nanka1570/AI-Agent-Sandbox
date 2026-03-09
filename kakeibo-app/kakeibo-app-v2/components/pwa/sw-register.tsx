"use client";

import { useEffect } from "react";

/** Service Workerをブラウザに登録するコンポーネント */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch((err) => {
        console.error("SW registration failed:", err);
      });
    }
  }, []);

  return null;
}
