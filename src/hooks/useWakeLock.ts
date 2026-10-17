"use client";

import { useEffect, useState } from "react";

/**
 * Keep the screen awake while `enabled`. The browser drops the lock whenever
 * the tab is hidden, so it's re-requested when the page becomes visible again,
 * and released on cleanup. Fails silently where unsupported; the return value
 * says whether a lock is currently held (for the "Screen on" indicator).
 */
export function useWakeLock(enabled: boolean): boolean {
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (
      !enabled ||
      typeof navigator === "undefined" ||
      !("wakeLock" in navigator)
    )
      return;

    let sentinel: WakeLockSentinel | null = null;
    let cancelled = false;

    const request = async () => {
      if (
        document.visibilityState !== "visible" ||
        (sentinel && !sentinel.released)
      )
        return;
      try {
        const lock = await navigator.wakeLock.request("screen");
        if (cancelled) {
          void lock.release();
          return;
        }
        sentinel = lock;
        setActive(true);
        lock.addEventListener("release", () => setActive(false));
      } catch {
        // Denied (e.g. battery saver) or needs a gesture (some Safari versions).
        setActive(false);
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") void request();
    };

    void request();
    document.addEventListener("visibilitychange", onVisibility);
    // Some browsers only grant the lock after a gesture: retry on the next tap.
    document.addEventListener("pointerdown", onVisibility, { passive: true });

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibility);
      document.removeEventListener("pointerdown", onVisibility);
      void sentinel?.release().catch(() => {});
      setActive(false);
    };
  }, [enabled]);

  return active;
}
