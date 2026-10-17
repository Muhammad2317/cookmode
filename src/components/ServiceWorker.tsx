"use client";

import { useEffect } from "react";

// Registers the app-shell service worker (generated into out/sw.js by
// scripts/generate-sw.mjs after `next build`). Production only: the file
// doesn't exist under `next dev`. Registration waits for the page to finish
// loading so it never competes with first paint. Fails silently.
export function ServiceWorker() {
  useEffect(() => {
    if (
      process.env.NODE_ENV !== "production" ||
      !("serviceWorker" in navigator)
    )
      return;
    const register = () =>
      void navigator.serviceWorker.register("/sw.js").catch(() => {});
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });
  }, []);
  return null;
}
